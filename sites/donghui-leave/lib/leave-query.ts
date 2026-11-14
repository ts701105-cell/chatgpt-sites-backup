export type QueryRecord={id:string;number:string;name:string;date:string;slot:string;units:number;type:string;status:string};
export function queryLeave<T extends QueryRecord>(records:T[],filters:{number:string;from:string;to:string;type:string}){
 if(filters.from&&filters.to&&filters.from>filters.to)return [];
 return records.filter(r=>(!filters.number||r.number===filters.number)&&(!filters.from||r.date>=filters.from)&&(!filters.to||r.date<=filters.to)&&(!filters.type||r.type===filters.type)).sort((a,b)=>b.date.localeCompare(a.date)||a.number.localeCompare(b.number)||a.slot.localeCompare(b.slot));
}
export function summarizeLeave(records:QueryRecord[]){
 const sums=new Map<string,{number:string;name:string;approved:number;pending:number;types:Record<string,number>}>();
 for(const r of records){let s=sums.get(r.number);if(!s){s={number:r.number,name:r.name,approved:0,pending:0,types:{}};sums.set(r.number,s);}const h=r.units*8;if(r.status==='approved'){s.approved+=h;s.types[r.type]=(s.types[r.type]||0)+h;}else if(r.status==='pending')s.pending+=h;}
 return [...sums.values()].sort((a,b)=>a.number.localeCompare(b.number));
}
export function leaveTimes(slot:string){const m=/^h(\d{2})-(\d{2})$/.exec(slot);return m?{start:m[1]+':00',end:m[2]+':00'}:{start:'未記載',end:'未記載'};}
export function monthlyLeave(records:QueryRecord[]){
 const groups=new Map<string,{number:string;name:string;month:string;type:string;approved:number;pending:number}>();
 for(const r of records){if(!['approved','pending'].includes(r.status))continue;const month=r.date.slice(0,7),key=JSON.stringify([r.number,month,r.type]);let group=groups.get(key);if(!group){group={number:r.number,name:r.name,month,type:r.type,approved:0,pending:0};groups.set(key,group);}if(r.status==='approved')group.approved+=r.units*8;else group.pending+=r.units*8;}
 return [...groups.values()].sort((a,b)=>a.month.localeCompare(b.month)||a.number.localeCompare(b.number)||a.type.localeCompare(b.type));
}
export function monthlyCSV(records:QueryRecord[]){const quote=(v:unknown)=>{let s=String(v);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};return '\uFEFF'+[['員工代號','姓名','月份','假別','已核准時數','待處理時數'],...monthlyLeave(records).map(r=>[r.number,r.name,r.month,r.type,Number(r.approved.toFixed(4)),Number(r.pending.toFixed(4))])].map(row=>row.map(quote).join(',')).join('\r\n');}
export function detailCSV(records:QueryRecord[]){
 const labels:Record<string,string>={approved:'已核准',pending:'待處理',rejected:'已退回',cancelled:'已撤回'};
 const quote=(v:unknown)=>{let s=String(v);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return '\uFEFF'+[['員工代號','姓名','請假日期','開始時間','結束時間','假別','請假時數（小時）','狀態'],...records.map(r=>{const time=leaveTimes(r.slot);return [r.number,r.name,r.date,time.start,time.end,r.type,Number((r.units*8).toFixed(4)),labels[r.status]||r.status];})].map(row=>row.map(quote).join(',')).join('\r\n');
}
