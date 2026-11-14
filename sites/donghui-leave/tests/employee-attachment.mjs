import assert from 'node:assert/strict';
const base='http://localhost:3000',jar={};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
async function call(who,action,data={},file){let body,headers={Origin:base,Cookie:jar[who]||''};if(file!==undefined){body=new FormData();for(const [k,v] of Object.entries({action,...data}))body.set(k,v);if(file)body.set('file',file,'slip.png');}else{headers['Content-Type']='application/json';body=JSON.stringify({action,...data});}const r=await fetch(base+'/api/leave',{method:'POST',headers,body});const c=r.headers.getSetCookie().find(v=>v.startsWith('leave_session='));if(c)jar[who]=c.split(';')[0];const text=await r.text();let parsed;try{parsed=JSON.parse(text);}catch{parsed={error:text};}return {status:r.status,body:parsed};}
async function get(who){return (await fetch(base+'/api/leave',{headers:{Cookie:jar[who]||''}})).json();}
const ok=r=>assert.equal(r.status,200,JSON.stringify(r.body));
ok(await call('admin','login',{number:'ADMIN',password:'AdminChanged-54321'}));
const number='UPLOAD'+Date.now();
ok(await call('admin','import',{rows:[{number,name:'附件測試',hire:'2020-01-01',password:'A123456789'}]}));
ok(await call('employee','login',{number,password:'A123456789'}));
const date=(await get('employee')).today,req={date,type:'事假',start:'11:00',end:'14:00',reason:'附件測試'};
assert.equal((await call('employee','request',req)).status,400);
assert.equal((await call('employee','request',req,null)).status,400);
assert.equal((await call('employee','request',req,new Blob(['invalid']))).status,400);
assert([400,413].includes((await call('employee','request',req,new Blob([new Uint8Array(8000001)]))).status));
assert.equal((await get('employee')).requests.length,0);
ok(await call('employee','request',req,new Blob([png,new Uint8Array(2000000)],{type:'image/png'})));
const d=await get('employee');assert.equal(d.requests.length,1);assert.equal(d.requests[0].status,'pending');assert.equal(d.requests[0].units*8,2);assert.equal(d.documents.length,1);
for(const who of ['employee','admin']){const r=await fetch(base+'/api/documents?id='+d.documents[0].id,{headers:{Cookie:jar[who]}});assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),Buffer.concat([png,Buffer.alloc(2000000)]));}
assert.equal((await fetch(base+'/api/documents?id='+d.documents[0].id)).status,401);
ok(await call('other','login',{number:'TEST001',password:'TemporaryReset-54321'}));
assert.equal((await fetch(base+'/api/documents?id='+d.documents[0].id,{headers:{Cookie:jar.other}})).status,404);
assert.equal((await call('employee','request',req,new Blob([png]))).status,400);
assert.equal((await get('employee')).documents.length,1);
ok(await call('admin','review',{id:d.requests[0].id,status:'approved'}));
console.log('PASS required attachment, invalid/oversized rejection, no partial requests, stored bytes, owner/admin access, other employee denied, duplicate rejection, approval');
