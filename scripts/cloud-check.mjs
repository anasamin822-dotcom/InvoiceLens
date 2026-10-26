import {createClient} from '@supabase/supabase-js';
import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const c=createClient(config.url,config.publishableKey,{auth:{persistSession:false}});
for(const [name,request] of [
 ['anonymous invoice metadata',()=>c.from('il_documents').select('*')],
 ['anonymous invoice write',()=>c.from('il_documents').insert({name:'forbidden',mime:'application/pdf',storage_path:'none'})],
 ['anonymous storage list',()=>c.storage.from('invoicelens').list()],
 ['anonymous review RPC',()=>c.rpc('il_save_review',{doc_id:'00000000-0000-0000-0000-000000000000',expected_revision:0,new_fields:[]})]
]){const r=await request();console.log(JSON.stringify({name,error:r.error?{code:r.error.code,message:r.error.message}:null,count:Array.isArray(r.data)?r.data.length:null}));}
