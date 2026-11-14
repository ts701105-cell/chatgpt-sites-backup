import assert from 'node:assert/strict';
let cookie='';const base='http://localhost:3000';
async function post(action,data={}){const r=await fetch(base+'/api/leave',{method:'POST',headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({action,...data})});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,data:await r.json()};}
const row={number:'HISTORYTEST',name:'歷史匯入測試',hire:'2026-07-01',date:'2026-08-01',type:'生理假',hours:10.5,source:'fixture.xlsx test!B2:V2'};
assert.equal((await post('history-import',{rows:[row]})).status,401);
assert.equal((await post('login',{number:'ADMIN',password:'AdminChanged-54321'})).status,200);
assert.equal((await post('history-import',{rows:[row,{...row,number:'BAD',hours:-1}]})).status,400);
let r=await post('history-import',{rows:[row]});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.inserted,1);
r=await post('history-import',{rows:[row]});assert.equal(r.data.inserted,0);assert.equal(r.data.skipped,1);
assert.equal((await post('history-import',{rows:[{...row,hours:11}]})).status,400);
assert.equal((await post('history-import',{rows:[{...row,name:'不同姓名',date:'2026-08-02'}]})).status,400);
r=await post('history-import',{rows:[{...row,date:'2026-08-02',type:'特休',hours:10}]});assert.equal(r.status,200,JSON.stringify(r));
const d=await (await fetch(base+'/api/leave',{headers:{Cookie:cookie}})).json();const e=d.employees.find(x=>x.number===row.number);assert.equal(e.needsSetup,1);assert.equal(e.balance.used,1.25);assert.equal(e.balance.remaining,-1.25);assert.equal(d.requests.find(x=>x.number===row.number&&x.type==='生理假').units*8,10.5);
console.log('PASS: auth, whole-batch validation, source hours, menstrual leave, replay deduplication, conflicts, roster identity, preserved historical overdraw.');
