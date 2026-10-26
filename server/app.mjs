import express from 'express';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const id = () => randomBytes(24).toString('hex');
const digest = value => createHash('sha256').update(value).digest('hex');
const hash = (password, salt) => scryptSync(password, salt, 64);
const safeUser = row => ({ id: row.id, username: row.username });
export function createApp({ database = process.env.DATABASE_PATH || './data/invoicelens.sqlite', allowRegistration = process.env.ALLOW_REGISTRATION === '1', secure = process.env.NODE_ENV === 'production' } = {}) {
  if (database !== ':memory:') mkdirSync(path.dirname(database), { recursive: true });
  const db = new DatabaseSync(database);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,password BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),name TEXT NOT NULL,mime TEXT NOT NULL,bytes BLOB NOT NULL,fields TEXT NOT NULL DEFAULT '[]',log TEXT NOT NULL DEFAULT '[]',revision INTEGER NOT NULL DEFAULT 0,created TEXT NOT NULL,updated TEXT NOT NULL);`);
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc:["'self'"], scriptSrc:["'self'","'wasm-unsafe-eval'"], workerSrc:["'self'",'blob:'], imgSrc:["'self'",'blob:','data:'], styleSrc:["'self'","'unsafe-inline'",'https://fonts.googleapis.com'], fontSrc:["'self'",'https://fonts.gstatic.com'], connectSrc:["'self'",'blob:','https://cdn.jsdelivr.net','https://tessdata.projectnaptha.com','https://*.supabase.co','wss://*.supabase.co'], objectSrc:["'none'"], upgradeInsecureRequests: secure ? [] : null } } }));
  app.use('/api', rateLimit({ windowMs:60_000, limit:180, standardHeaders:'draft-8', legacyHeaders:false }));
  app.use((req,res,next) => {
    if (req.path.startsWith('/api') && !['GET','HEAD','OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      const expected = process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`;
      if (origin && origin !== expected) return res.status(403).json({ error:'Request origin not allowed.' });
      if (req.get('sec-fetch-site') === 'cross-site') return res.status(403).json({error:'Cross-site request not allowed.'});
    }
    next();
  });
  app.use(express.json({ limit:'1mb' }));
  const authLimiter = rateLimit({ windowMs:15*60_000, limit:30, skipSuccessfulRequests:true });
  const cookie = (res, token, maxAge) => res.cookie('invoicelens_session',token,{httpOnly:true,secure,sameSite:'strict',path:'/',maxAge});
  function session(req,res,user) {
    db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
    const token=id();
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token),user.id,Date.now()+7*86400000);
    cookie(res,token,7*86400000); res.json({user:safeUser(user)});
  }
  function requireUser(req,res,next) {
    const raw=(req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('invoicelens_session='))?.slice(20);
    const user=raw && db.prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?').get(digest(raw),Date.now());
    if (!user) return res.status(401).json({error:'Please sign in.'});
    req.user=user; next();
  }
  app.get('/api/health',(_req,res)=>res.json({status:'ok',storage:'sqlite',registration:allowRegistration}));
  app.post('/api/auth/register',authLimiter,(req,res)=>{
    if (!allowRegistration) return res.status(403).json({error:'Registration is closed. Ask the owner for an account.'});
    const {username,password}=req.body;
    if (typeof username !== 'string' || !/^[a-zA-Z0-9_.-]{3,40}$/.test(username) || typeof password !== 'string' || password.length<12 || password.length>128) return res.status(400).json({error:'Use a 3-40 character username and a password of 12-128 characters.'});
    if (db.prepare('SELECT count(*) n FROM users').get().n >= 20) return res.status(409).json({error:'Account limit reached. Contact the owner.'});
    const salt=id(), user={id:id(),username};
    try { db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(user.id,username,salt,hash(password,salt)); }
    catch { return res.status(409).json({error:'Username unavailable.'}); }
    session(req,res,user);
  });
  app.post('/api/auth/login',authLimiter,(req,res)=>{
    const {username,password}=req.body;
    if (typeof username!=='string' || typeof password!=='string' || password.length>128) return res.status(400).json({error:'Invalid login.'});
    const user=db.prepare('SELECT * FROM users WHERE username=?').get(username);
    const computed=hash(password,user?.salt || 'constant-time-fallback-salt');
    if (!user || !timingSafeEqual(Buffer.from(user.password),computed)) return res.status(401).json({error:'Incorrect username or password.'});
    session(req,res,user);
  });
  app.get('/api/auth/me',requireUser,(req,res)=>res.json({user:safeUser(req.user)}));
  app.post('/api/auth/logout',requireUser,(req,res)=>{
    const raw=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('invoicelens_session='))?.slice(20);
    if(raw) db.prepare('DELETE FROM sessions WHERE token=?').run(digest(raw)); cookie(res,'',0); res.json({ok:true});
  });
  app.use('/api/documents', requireUser);
  const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1,fields:0}});
  const meta=row=>({id:row.id,name:row.name,mime:row.mime,revision:row.revision,created:row.created,updated:row.updated,fieldCount:JSON.parse(row.fields).length,approved:JSON.parse(row.fields).filter(f=>f.status==='approved').length});
  const owned=(req,res,next)=>{const doc=db.prepare('SELECT * FROM documents WHERE id=? AND user_id=?').get(req.params.id,req.user.id);if(!doc)return res.status(404).json({error:'Document not found.'});req.doc=doc;next();};
  app.get('/api/documents',(req,res)=>res.json({documents:db.prepare('SELECT id,name,mime,revision,created,updated,fields FROM documents WHERE user_id=? ORDER BY updated DESC').all(req.user.id).map(meta)}));
  app.post('/api/documents',upload.single('file'),(req,res)=>{
    const f=req.file;
    if(!f || !f.size) return res.status(400).json({error:'Choose a non-empty invoice file.'});
    const b=f.buffer;
    let mime=null;
    if(b.subarray(0,5).toString()==='%PDF-') mime='application/pdf';
    else if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) mime='image/png';
    else if(b[0]===255&&b[1]===216&&b[2]===255) mime='image/jpeg';
    else if(b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP') mime='image/webp';
    if(!mime) return res.status(400).json({error:'Unsupported or invalid file. Use PDF, PNG, JPEG or WEBP.'});
    const usage=db.prepare('SELECT count(*) n,coalesce(sum(length(bytes)),0) bytes FROM documents WHERE user_id=?').get(req.user.id);
    const total=db.prepare('SELECT coalesce(sum(length(bytes)),0) bytes FROM documents').get().bytes;
    if(usage.n>=50 || usage.bytes+f.size>100*1024*1024 || total+f.size>1024*1024*1024) return res.status(413).json({error:'Storage limit reached. Delete an old document first.'});
    const docId=id(), now=new Date().toISOString();
    const name=[...path.basename(f.originalname)].filter(c=>c.charCodeAt(0)>31).join('').slice(0,180)||'invoice';
    db.prepare('INSERT INTO documents(id,user_id,name,mime,bytes,created,updated) VALUES(?,?,?,?,?,?,?)').run(docId,req.user.id,name,mime,b,now,now);
    res.status(201).json({document:{...meta(db.prepare('SELECT * FROM documents WHERE id=?').get(docId)),fields:[],log:[]}});
  });
  app.get('/api/documents/:id',owned,(req,res)=>res.json({document:{...meta(req.doc),fields:JSON.parse(req.doc.fields),log:JSON.parse(req.doc.log)}}));
  app.get('/api/documents/:id/file',owned,(req,res)=>{res.set('Cache-Control','private, no-store');res.set('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(req.doc.name)}`);res.type(req.doc.mime).send(Buffer.from(req.doc.bytes));});
  app.put('/api/documents/:id/review',owned,(req,res)=>{
    const {fields,revision}=req.body;
    if(revision!==req.doc.revision) return res.status(409).json({error:'This review changed in another tab. Reload it before saving.'});
    if(!Array.isArray(fields) || fields.length>200 || !fields.every(validField) || new Set(fields.map(f=>f.key)).size!==fields.length) return res.status(400).json({error:'Invalid fields. Maximum 200 fields per document.'});
    const clean=fields.map(({key,label,value,status,box,page,source,confidence,isCustom})=>({key,label,value,status,box,page:page||1,source:source||'manual',...(typeof confidence==='number'?{confidence}:{}),isCustom:Boolean(isCustom)}));
    const old=JSON.parse(req.doc.fields), log=JSON.parse(req.doc.log), events=[];
    for(const f of clean) {
      const previous=old.find(x=>x.key===f.key);
      const changes=!previous?'create':JSON.stringify(previous)!==JSON.stringify(f)?f.status==='approved'&&previous.status!=='approved'?'approve':JSON.stringify(previous.box)!==JSON.stringify(f.box)?'box-move':'edit':null;
      if(changes) events.push({id:id(),fieldKey:f.key,fieldLabel:f.label,type:changes,oldValue:previous?.value??null,newValue:f.value,page:f.page,timestamp:Date.now(),actor:req.user.username});
    }
    for(const f of old) if(!clean.some(x=>x.key===f.key)) events.push({id:id(),fieldKey:f.key,fieldLabel:f.label,type:'delete',oldValue:f.value,timestamp:Date.now(),actor:req.user.username});
    const updated=new Date().toISOString();
    db.prepare('UPDATE documents SET fields=?,log=?,revision=revision+1,updated=? WHERE id=?').run(JSON.stringify(clean),JSON.stringify([...events,...log].slice(0,5000)),updated,req.doc.id);
    res.json({document:{...meta({...req.doc,fields:JSON.stringify(clean),revision:revision+1,updated}),fields:clean,log:[...events,...log].slice(0,5000)}});
  });
  app.delete('/api/documents/:id',owned,(req,res)=>{db.prepare('DELETE FROM documents WHERE id=? AND user_id=?').run(req.doc.id,req.user.id);res.json({ok:true});});
  app.use('/api',(_req,res)=>res.status(404).json({error:'Not found.'}));
  app.use(express.static(path.resolve('dist'),{index:false}));
  app.get('/{*path}',(_req,res)=>res.sendFile(path.resolve('dist/index.html')));
  app.use((error,_req,res,_next)=>{if(error instanceof multer.MulterError)return res.status(413).json({error:'File too large. Maximum 10 MB.'});if(error?.type==='entity.too.large')return res.status(413).json({error:'Review too large.'});if(error instanceof SyntaxError)return res.status(400).json({error:'Invalid JSON.'});console.error(error);res.status(500).json({error:'Could not complete this request. Try again.'});});
  return {app,db};
}
function validField(f) {
  if(f?.status==='approved' && (!f.value?.trim() || !f.label?.trim()))return false;
  return f && typeof f.key==='string'&&f.key.length>0&&f.key.length<=100&&typeof f.label==='string'&&f.label.trim().length>0&&f.label.length<=100&&typeof f.value==='string'&&f.value.length<=2000&&['pending','edited','approved'].includes(f.status)&&(!f.page||(Number.isInteger(f.page)&&f.page>=1&&f.page<=100))&&(!f.source||['pdf-text','ocr','manual','sample'].includes(f.source))&&(f.confidence===undefined||(Number.isFinite(f.confidence)&&f.confidence>=0&&f.confidence<=100))&&f.box&&['x','y','w','h'].every(k=>Number.isFinite(f.box[k])&&f.box[k]>=0&&f.box[k]<=1)&&f.box.w>0&&f.box.h>0&&f.box.x+f.box.w<=1.001&&f.box.y+f.box.h<=1.001;
}
