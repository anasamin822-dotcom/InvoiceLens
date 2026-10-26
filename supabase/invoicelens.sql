-- InvoiceLens only. RevenueLens objects must use a separate namespace.
create table if not exists public.il_documents (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 name text not null check(length(name) between 1 and 180),
 mime text not null check(mime in ('application/pdf','image/png','image/jpeg','image/webp')),
 storage_path text not null,
 fields jsonb not null default '[]' check(jsonb_typeof(fields)='array' and jsonb_array_length(fields)<=200),
 log jsonb not null default '[]',
 revision integer not null default 0,
 created timestamptz not null default now(), updated timestamptz not null default now()
);
alter table public.il_documents enable row level security;
create policy il_read on public.il_documents for select to authenticated using(user_id=auth.uid());
create policy il_insert on public.il_documents for insert to authenticated with check(user_id=auth.uid() and storage_path like auth.uid()::text||'/%' and jsonb_array_length(fields)=0 and jsonb_array_length(log)=0 and revision=0);
create policy il_delete on public.il_documents for delete to authenticated using(user_id=auth.uid());
-- No direct UPDATE policy: reviews go through a checked RPC with server audit.
create or replace function public.il_save_review(doc_id uuid, expected_revision integer, new_fields jsonb)
returns public.il_documents language plpgsql security definer set search_path=public as $$
declare d public.il_documents; f jsonb; old_f jsonb; events jsonb:='[]'; event_type text;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 select * into d from public.il_documents where id=doc_id and user_id=auth.uid() for update;
 if d.id is null then raise exception 'Document not found'; end if;
 if d.revision<>expected_revision then raise exception 'This review changed in another tab. Reload before saving.'; end if;
 if coalesce(jsonb_typeof(new_fields),'')<>'array' or jsonb_array_length(new_fields)>200 then raise exception 'Invalid fields'; end if;
 if (select count(distinct value->>'key') from jsonb_array_elements(new_fields))<>jsonb_array_length(new_fields) then raise exception 'Duplicate field keys'; end if;
 for f in select value from jsonb_array_elements(new_fields) loop
  if coalesce(length(f->>'key'),0) not between 1 and 100 or coalesce(length(trim(f->>'label')),0) not between 1 and 100 or coalesce(jsonb_typeof(f->'value'),'')<>'string' or length(f->>'value')>2000 or coalesce(f->>'status','') not in ('pending','edited','approved') or coalesce((f->>'page')::integer,1) not between 1 and 100 then raise exception 'Invalid field'; end if;
  if coalesce(jsonb_typeof(f->'box'),'')<>'object' or coalesce((f->'box'->>'x')::numeric,-1) not between 0 and 1 or coalesce((f->'box'->>'y')::numeric,-1) not between 0 and 1 or coalesce((f->'box'->>'w')::numeric,-1)<=0 or coalesce((f->'box'->>'h')::numeric,-1)<=0 or (f->'box'->>'x')::numeric+(f->'box'->>'w')::numeric>1.001 or (f->'box'->>'y')::numeric+(f->'box'->>'h')::numeric>1.001 then raise exception 'Invalid bounding box'; end if;
  if f->>'status'='approved' and coalesce(length(trim(f->>'value')),0)=0 then raise exception 'Approved values cannot be empty'; end if;
  if coalesce(jsonb_typeof(f->'key'),'')<>'string' or coalesce(jsonb_typeof(f->'label'),'')<>'string' then raise exception 'Field names and keys must be text'; end if;
  select value into old_f from jsonb_array_elements(d.fields) where value->>'key'=f->>'key';
  event_type:=case when old_f is null then 'create' when old_f=f then null when f->>'status'='approved' and old_f->>'status'<>'approved' then 'approve' when old_f->'box'<>f->'box' then 'box-move' else 'edit' end;
  if event_type is not null then events:=events||jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'fieldKey',f->>'key','fieldLabel',f->>'label','type',event_type,'oldValue',old_f->>'value','newValue',f->>'value','page',f->'page','timestamp',floor(extract(epoch from now())*1000),'actor','Workspace owner')); end if;
 end loop;
 for old_f in select value from jsonb_array_elements(d.fields) loop
  if not exists(select 1 from jsonb_array_elements(new_fields) where value->>'key'=old_f->>'key') then events:=events||jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'fieldKey',old_f->>'key','fieldLabel',old_f->>'label','type','delete','oldValue',old_f->>'value','timestamp',floor(extract(epoch from now())*1000),'actor','Workspace owner')); end if;
 end loop;
 update public.il_documents set fields=new_fields,log=(select coalesce(jsonb_agg(value),'[]') from (select value from jsonb_array_elements(events||d.log) limit 5000) e),revision=revision+1,updated=now() where id=doc_id returning * into d;
 return d;
end $$;
revoke all on function public.il_save_review(uuid,integer,jsonb) from public,anon;
grant execute on function public.il_save_review(uuid,integer,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('invoicelens','invoicelens',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create policy il_storage_read on storage.objects for select to authenticated using(bucket_id='invoicelens' and (storage.foldername(name))[1]=auth.uid()::text);
create policy il_storage_write on storage.objects for insert to authenticated with check(bucket_id='invoicelens' and (storage.foldername(name))[1]=auth.uid()::text);
create policy il_storage_delete on storage.objects for delete to authenticated using(bucket_id='invoicelens' and (storage.foldername(name))[1]=auth.uid()::text);

grant select,insert,delete on public.il_documents to authenticated;
grant all on public.il_documents to service_role;
create index if not exists il_documents_owner on public.il_documents(user_id,updated desc);
-- Serialize inserts per account and protect the shared free storage pool.
create or replace function public.il_upload_quota() returns trigger language plpgsql security definer set search_path=public,storage as $$
declare used numeric; account_used numeric; account_count integer;
begin
 if new.bucket_id<>'invoicelens' then return new; end if;
 if nullif(new.owner_id,'') is null or (storage.foldername(new.name))[1]<>new.owner_id or (auth.uid() is not null and auth.uid()::text<>new.owner_id) then raise exception 'Invalid upload owner'; end if;
 perform pg_advisory_xact_lock(hashtext('invoicelens-storage-quota'));
 select count(*),coalesce(sum((metadata->>'size')::numeric),0) into account_count,account_used from storage.objects where bucket_id='invoicelens' and (storage.foldername(name))[1]=new.owner_id;
 select coalesce(sum((metadata->>'size')::numeric),0) into used from storage.objects where bucket_id='invoicelens';
 if account_count>=50 or account_used+coalesce((new.metadata->>'size')::numeric,10485760)>104857600 or used+coalesce((new.metadata->>'size')::numeric,10485760)>419430400 then raise exception 'Invoice storage limit reached. Delete an old document first.'; end if;
 return new;
end $$;

create trigger il_upload_quota before insert on storage.objects for each row execute function public.il_upload_quota();
-- Metadata count cap as a second guard.
create or replace function public.il_document_quota() returns trigger language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtext(new.user_id::text));
 if (select count(*) from public.il_documents where user_id=new.user_id)>=50 then raise exception 'Maximum 50 documents per account'; end if;
 return new;
end $$;
create trigger il_document_quota before insert on public.il_documents for each row execute function public.il_document_quota();
