import publicConfig from '../backend-config.json';
import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL??publicConfig.url;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY??publicConfig.publishableKey;
export const cloudEnabled=Boolean(url&&key);
export const supabase=cloudEnabled?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
function checked<T extends {error:{message:string}|null}>(result:T): T extends {data:infer D} ? NonNullable<D> : undefined {if(result.error)throw Error(result.error.message);return ('data' in result?result.data:undefined) as T extends {data:infer D}?NonNullable<D>:undefined;}
const format=(d:Record<string,unknown>)=>({...d,fieldCount:(d.fields as unknown[]||[]).length,approved:(d.fields as {status:string}[]||[]).filter(f=>f.status==='approved').length});
export async function cloudApi(path:string,options:RequestInit):Promise<unknown> {
 if(!supabase)throw Error('Cloud backend is not configured.');
 const body=typeof options.body==='string'?JSON.parse(options.body):{};
 if(path==='/health'){const {error}=await supabase.from('il_documents').select('id').limit(0);if(error&&error.code!=='42501')throw Error('Cloud backend is unavailable or not configured.');return{status:'ok',registration:true};}
 if(path==='/auth/me'){const user=checked(await supabase.auth.getUser());if(!user.user)throw Error('Please sign in.');return{user:{id:user.user.id,username:user.user.email}};}
 if(path==='/auth/register'){const result=checked(await supabase.auth.signUp({email:body.username,password:body.password,options:{emailRedirectTo:window.location.origin}}));if(!result.session)throw Error('Account created. Check your email to confirm, then sign in.');return{user:{id:result.user?.id,username:result.user?.email}};}
 if(path==='/auth/login'){const result=checked(await supabase.auth.signInWithPassword({email:body.username,password:body.password}));return{user:{id:result.user!.id,username:result.user!.email}};}
 if(path==='/auth/reset'){checked(await supabase.auth.resetPasswordForEmail(body.email,{redirectTo:window.location.origin}));return{ok:true};}
 if(path==='/auth/password'){checked(await supabase.auth.updateUser({password:body.password}));return{ok:true};}
 if(path==='/auth/logout'){checked(await supabase.auth.signOut());return{ok:true};}
 const user=checked(await supabase.auth.getUser()).user;if(!user)throw Error('Please sign in.');
 if(path==='/documents'&&(!options.method||options.method==='GET')){const data=checked(await supabase.from('il_documents').select('*').order('updated',{ascending:false}));return{documents:data.map(format)};}
 if(path==='/documents'&&options.method==='POST'){
  const file=(options.body as FormData).get('file') as File;
  const id=crypto.randomUUID(),storagePath=`${user.id}/${id}`;
  const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
  const signature=String.fromCharCode(...bytes);
  const valid=(file.type==='application/pdf'&&signature.startsWith('%PDF-'))||(file.type==='image/png'&&bytes[0]===137&&signature.slice(1,4)==='PNG')||(file.type==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)||(file.type==='image/webp'&&signature.startsWith('RIFF')&&signature.slice(8,12)==='WEBP');
  if(!valid)throw Error('Unsupported or invalid file. Use PDF, PNG, JPEG or WEBP.');
  checked(await supabase.storage.from('invoicelens').upload(storagePath,file,{contentType:file.type,upsert:false}));
  const result=await supabase.from('il_documents').insert({id,user_id:user.id,name:file.name.slice(0,180),mime:file.type,storage_path:storagePath}).select().single();
  if(result.error){await supabase.storage.from('invoicelens').remove([storagePath]);throw Error(result.error.message);}
  return{document:format(result.data)};
 }
 const match=path.match(/^\/documents\/([a-f0-9-]+)(\/review)?$/);if(!match)throw Error('Unknown request.');
 if(match[2]){const data=checked(await supabase.rpc('il_save_review',{doc_id:match[1],expected_revision:body.revision,new_fields:body.fields}));return{document:format(data)};}
 const d=checked(await supabase.from('il_documents').select('*').eq('id',match[1]).single());
 if(options.method==='DELETE'){
  // Storage first: a failed remove must not silently leave an inaccessible private file.
  checked(await supabase.storage.from('invoicelens').remove([d.storage_path]));
  checked(await supabase.from('il_documents').delete().eq('id',d.id));return{ok:true};
 }
 return{document:format(d)};
}
export async function documentUrl(id:string):Promise<string>{
 if(!supabase)return `/api/documents/${id}/file`;
 const d=checked(await supabase.from('il_documents').select('storage_path').eq('id',id).single());
 // Download with the authenticated JWT; use an object URL instead of a shareable signed URL.
 const blob=checked(await supabase.storage.from('invoicelens').download(d.storage_path));return URL.createObjectURL(blob);
}
