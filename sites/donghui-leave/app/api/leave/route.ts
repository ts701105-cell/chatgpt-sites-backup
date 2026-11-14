import {env} from 'cloudflare:workers';
import {balance,period,today,validDate,hours} from '@/lib/leave';
import {leaveTypes,validateHistoryRows} from '@/lib/history-import';
const db=()=>env.DB;
const enc=new TextEncoder();
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
async function hash(p:string,s:string){const key=await crypto.subtle.importKey('raw',enc.encode(p),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(s),iterations:100000,hash:'SHA-256'},key,256));}
async function digest(s:string){return hex(await crypto.subtle.digest('SHA-256',enc.encode(s)));}
function eq(a:string,b:string){if(a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0;}
function json(v:any,status=200,cookie?:string){const h:Record<string,string>={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};if(cookie)h['Set-Cookie']=cookie;return Response.json(v,{status,headers:h});}
function cookie(req:Request,token:string,age=28800){return `leave_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${new URL(req.url).protocol==='https:'?'; Secure':''}`;}
function fail(m:string):never{throw new Error(m);}
async function session(req:Request){const token=req.headers.get('cookie')?.match(/(?:^|; )leave_session=([a-f0-9-]+)/)?.[1];if(!token)return null;return db().prepare('SELECT e.* FROM sessions s JOIN employees e ON e.number=s.number WHERE s.token=? AND s.expires>?').bind(await digest(token),Date.now()).first<any>();}
async function allRequests(){return (await db().prepare('SELECT r.*,e.name FROM requests r JOIN employees e ON r.number=e.number ORDER BY r.created DESC').all<any>()).results;}
export async function GET(req:Request){try{const user=await session(req);if(!user)return json({user:null});const safe={number:user.number,name:user.name,hire:user.hire,role:user.role,mustChange:false};const all=user.role==='admin'?await allRequests():(await db().prepare('SELECT r.*,e.name FROM requests r JOIN employees e ON r.number=e.number WHERE r.number=? ORDER BY r.created DESC').bind(user.number).all<any>()).results;const employees=user.role==='admin'?(await db().prepare("SELECT number,name,hire,(hash='') AS needsSetup FROM employees WHERE role='employee' ORDER BY number").all<any>()).results.map(e=>({...e,balance:balance(e.hire,today(),all.filter(r=>r.number===e.number))})):undefined;const documents=user.role==='admin'?(await db().prepare('SELECT id,requestId,originalType,newType,created FROM documents ORDER BY created DESC').all<any>()).results:(await db().prepare('SELECT d.id,d.requestId,d.originalType,d.newType,d.created FROM documents d JOIN requests r ON r.id=d.requestId WHERE r.number=? ORDER BY d.created DESC').bind(user.number).all<any>()).results;return json({user:safe,today:today(),requests:all,employees,documents,balance:user.role==='employee'?balance(user.hire,today(),all):null});}catch{return json({error:'系統尚未就緒，請稍後重新整理。'},503);}}
export async function POST(req:Request){let uploadKey:string|undefined;let committed=false;try{
 const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)return json({error:'請從系統頁面操作。'},403);

 let b:any,file:File|undefined;
 if(req.headers.get('content-type')?.includes('multipart/form-data')){
  if(Number(req.headers.get('content-length')||0)>8500000)return json({error:'假單不可超過 8 MB'},413);
  const form=await req.formData();b=Object.fromEntries(form);const candidate=form.get('file');if(candidate instanceof File)file=candidate;
  if(b.action!=='request')return json({error:'資料格式錯誤'},400);
 }else{
  if(!req.headers.get('content-type')?.includes('application/json'))return json({error:'資料格式錯誤'},400);
  const raw=await req.text();if(raw.length>100000)return json({error:'資料過大'},413);b=JSON.parse(raw);
 }
 const action=b.action;
 if(action==='login'){
 const number=String(b.number||'').trim(),password=String(b.password||'');if(number.length>30||password.length>256)fail('帳號或密碼不正確');
 const now=Date.now(),key=await digest(number),ipKey=await digest('ip:'+ (req.headers.get('cf-connecting-ip')||'local'));
 for(const k of [key,ipKey]){await db().prepare('INSERT INTO attempts(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<? THEN ? ELSE expires END').bind(k,now+900000,now,now,now+900000).run();const attempt=await db().prepare('SELECT count FROM attempts WHERE key=?').bind(k).first<any>();if(attempt.count>(k===key?8:60))return json({error:'嘗試次數過多，請於 15 分鐘後再試。'},429);}
 let user=await db().prepare('SELECT * FROM employees WHERE number=?').bind(number).first<any>();
 const initial=(env as any).ADMIN_INITIAL_PASSWORD; const adminNumber=(env as any).ADMIN_INITIAL_NUMBER||'ADMIN';
 if(!user&&number===adminNumber&&initial&&eq(password,initial)){const salt=crypto.randomUUID();await db().prepare("INSERT OR IGNORE INTO employees(number,name,hire,hash,salt,role,mustChange) VALUES(?,'管理員','2000-01-01',?,?,'admin',?)").bind(adminNumber,await hash(password,salt),salt,0).run();user=await db().prepare('SELECT * FROM employees WHERE number=?').bind(adminNumber).first<any>();}
 const candidate=await hash(password,user?.salt||'dummy-salt');if(!user||!eq(candidate,user.hash))fail('帳號或密碼不正確');
 await db().prepare('DELETE FROM attempts WHERE key=?').bind(key).run();const token=crypto.randomUUID()+crypto.randomUUID();await db().prepare('INSERT INTO sessions(token,number,expires) VALUES(?,?,?)').bind(await digest(token),number,now+28800000).run();return json({ok:true},200,cookie(req,token));
 }
 const user=await session(req);if(!user)return json({error:'請先登入'},401);
 if(action==='logout'){const t=req.headers.get('cookie')?.match(/(?:^|; )leave_session=([a-f0-9-]+)/)?.[1]||'';await db().prepare('DELETE FROM sessions WHERE token=?').bind(await digest(t)).run();return json({ok:true},200,cookie(req,'',0));}
 if(action==='password'){if(typeof b.password!=='string'||b.password.length<12||b.password.length>128||b.password!==b.confirm)fail('密碼至少 12 個字元，且兩次輸入須相同');if(eq(await hash(b.password,user.salt),user.hash))fail('新密碼不可與初始密碼相同');const salt=crypto.randomUUID();await db().batch([db().prepare('UPDATE employees SET hash=?,salt=?,mustChange=0 WHERE number=?').bind(await hash(b.password,salt),salt,user.number),db().prepare('DELETE FROM sessions WHERE number=?').bind(user.number)]);return json({ok:true},200,cookie(req,'',0));}
 
 if(['import','review','reset','history','history-import'].includes(action)&&user.role!=='admin')return json({error:'僅管理員可操作'},403);
 if(action==='history-import'){
 const rows=validateHistoryRows(b.rows),statements=[];let skipped=0;
 for(const r of rows){
  const employee=await db().prepare('SELECT name,hire,role FROM employees WHERE number=?').bind(r.number).first<any>();
  if(employee&&(employee.name!==r.name||employee.hire!==r.hire||employee.role!=='employee'))fail(r.number+' 的姓名或到職日與既有資料不一致');
  const id='import:'+await digest(r.number+'|'+r.date+'|'+r.type);
  const existing=await db().prepare('SELECT id,units,status FROM requests WHERE number=? AND date=? AND type=? AND status IN (\'pending\',\'approved\')').bind(r.number,r.date,r.type).all<any>();
  if(existing.results.length){if(existing.results.length===1&&existing.results[0].id===id&&existing.results[0].units===r.hours/8&&existing.results[0].status==='approved'){skipped++;continue;}fail(r.number+' '+r.date+' '+r.type+' 已有紀錄，請先核對，未覆蓋原資料');}
  statements.push(db().prepare("INSERT OR IGNORE INTO employees(number,name,hire,hash,salt) VALUES(?,?,?,'','')").bind(r.number,r.name,r.hire));
  statements.push(db().prepare("INSERT OR IGNORE INTO requests(id,number,date,slot,units,type,reason,status,note,created,reviewed) VALUES(?,?,?,'imported',?,?,?,'approved',?,?,?)").bind(id,r.number,r.date,r.hours/8,r.type,'歷史請假匯入',r.source+'；原表未記載請假起訖時間',new Date().toISOString(),new Date().toISOString()));
 }
 const results=statements.length?await db().batch(statements):[];const inserted=results.filter((_,i)=>i%2===1).reduce((s,r)=>s+(r.meta.changes||0),0);
 return json({ok:true,inserted,skipped:rows.length-inserted});
 }
 if(action==='import'){
 if(!Array.isArray(b.rows)||!b.rows.length||b.rows.length>100)fail('每次請匯入 1 至 100 位員工');const seen=new Set(),errors:string[]=[];
 for(const [i,r] of b.rows.entries()){const line=`第 ${i+2} 列：`;if(typeof r.number!=='string'||! /^[A-Za-z0-9_-]{1,30}$/.test(r.number)||r.number.toUpperCase()==='ADMIN')errors.push(line+'員工編號須為英數字、底線或連字號，且不可使用 ADMIN');if(seen.has(r.number))errors.push(line+'員工編號重複');seen.add(r.number);if(typeof r.name!=='string'||!r.name.trim()||r.name.length>60)errors.push(line+'姓名不正確');if(typeof r.hire!=='string'||!validDate(r.hire)||r.hire<'1900-01-01'||r.hire>today())errors.push(line+'到職日須為有效日期，且不可晚於今天');if(typeof r.password!=='string'||! /^[A-Z][12]\d{8}$/.test(r.password))errors.push(line+'身分證字號格式不正確');if(await db().prepare('SELECT number FROM employees WHERE number=?').bind(String(r.number)).first())errors.push(line+'員工編號已存在');}
 if(errors.length)fail(errors.join('；'));const statements=[];for(const r of b.rows){const salt=crypto.randomUUID();statements.push(db().prepare('INSERT INTO employees(number,name,hire,hash,salt,mustChange) VALUES(?,?,?,?,?,0)').bind(r.number,r.name.trim(),r.hire,await hash(r.password,salt),salt));}await db().batch(statements);return json({ok:true});
 }
 if(action==='reset'){if(typeof b.password!=='string'||b.password.length<12||b.password.length>128)fail('密碼須為 12～128 個字元');const target=await db().prepare("SELECT number FROM employees WHERE number=? AND role='employee'").bind(String(b.number)).first();if(!target)fail('找不到員工');const salt=crypto.randomUUID();await db().batch([db().prepare('UPDATE employees SET hash=?,salt=?,mustChange=0 WHERE number=?').bind(await hash(b.password,salt),salt,b.number),db().prepare('DELETE FROM sessions WHERE number=?').bind(b.number)]);return json({ok:true});}
 if(action==='request'||action==='history'){
 let employee=user;if(action==='history'){employee=await db().prepare("SELECT * FROM employees WHERE number=? AND role='employee'").bind(String(b.number)).first<any>();if(!employee)fail('找不到員工');}
 if(employee.role!=='employee')fail('請使用員工帳號請假');if(!validDate(String(b.date))||b.date<employee.hire||(action==='request'&&b.date<today())||(action==='history'&&b.date>today()))fail('請假日期不正確');if(!leaveTypes.includes(b.type))fail('請假內容不正確');if(typeof b.reason!=='string'||!b.reason.trim()||b.reason.length>200)fail('請填寫 1～200 字事由');

 let bytes:Uint8Array|undefined,mime='';
 if(action==='request'){
  if(!file||!file.size)fail('請上傳紙本假單後再送出申請');
  if(file.size>8000000)fail('假單不可超過 8 MB');
  bytes=new Uint8Array(await file.arrayBuffer());
  mime=bytes[0]===0x25&&bytes[1]===0x50&&bytes[2]===0x44&&bytes[3]===0x46?'application/pdf':bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff?'image/jpeg':bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47?'image/png':'';
  if(!mime)fail('僅支援 PDF、JPG、PNG 假單');
 }
 const p=period(employee.hire,b.date),units=hours(String(b.start),String(b.end))/8; b.slot='h'+b.start.slice(0,2)+'-'+b.end.slice(0,2); const id=crypto.randomUUID();
 // Single conditional INSERT makes overlap and balance checks atomic, including concurrent submissions.
 const statement=db().prepare(`INSERT INTO requests(id,number,date,slot,units,type,reason,status,created) SELECT ?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM requests WHERE number=? AND date=? AND status IN ('pending','approved') AND (slot='imported' OR (CAST(substr(slot,2,2) AS INTEGER) < ? AND CAST(substr(slot,5,2) AS INTEGER) > ?))) AND (?!='特休' OR ? <= ? - COALESCE((SELECT SUM(units) FROM requests WHERE number=? AND type='特休' AND date>=? AND date<? AND status IN ('pending','approved')),0))`).bind(id,employee.number,b.date,b.slot,units,b.type,b.reason.trim(),action==='history'?'approved':'pending',new Date().toISOString(),employee.number,b.date,Number(b.end.slice(0,2)),Number(b.start.slice(0,2)),b.type,units,p.days,employee.number,p.start,p.end);
 let changed=0;
 if(action==='request'){
  const docId=crypto.randomUUID();uploadKey='leave-slips/'+docId;
  await env.FILES.put(uploadKey,bytes!,{httpMetadata:{contentType:mime}});
  const results=await db().batch([statement,db().prepare("INSERT INTO documents(id,requestId,objectKey,mime,size,originalType,newType,uploadedBy,created) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM requests WHERE id=?)").bind(docId,id,uploadKey,mime,file!.size,'員工申請',b.type,user.number,new Date().toISOString(),id)]);
  changed=results[0].meta.changes||0;
 }else{changed=(await statement.run()).meta.changes||0;}
 if(!changed)fail('此時段已有申請，或該期間特休餘額不足');
 committed=true;return json({ok:true});
 }
 if(action==='cancel'){const r=await db().prepare("UPDATE requests SET status='cancelled' WHERE id=? AND number=? AND status='pending'").bind(String(b.id),user.number).run();if(!r.meta.changes)fail('僅可撤回自己的待處理申請');return json({ok:true});}
 if(action==='review'){if(!['approved','rejected'].includes(b.status))fail('狀態錯誤');if(b.status==='rejected'&&(typeof b.note!=='string'||!b.note.trim()||b.note.length>200))fail('請填寫退回原因');const r=await db().prepare("UPDATE requests SET status=?,note=?,reviewed=? WHERE id=? AND status='pending'").bind(b.status,b.status==='rejected'?b.note.trim():'',new Date().toISOString(),String(b.id)).run();if(!r.meta.changes)fail('申請已處理，請重新整理');return json({ok:true});}
 fail('不支援的操作');
 }catch(e:any){if(uploadKey&&!committed)await env.FILES.delete(uploadKey).catch(()=>{});const message=e instanceof SyntaxError?'資料格式不正確':e.message;return json({error:/SQLITE|D1_|database|constraint/i.test(message)?'資料寫入失敗，可能有重複資料，請重新整理後再試。':message||'操作失敗'},400);}}





