export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function hours(start:string,end:string){if(!/^\d{2}:00$/.test(start)||!/^\d{2}:00$/.test(end))throw Error('請以整點選擇起訖時間');const a=Number(start.slice(0,2)),b=Number(end.slice(0,2));if(a<9||b>18||a>=b)throw Error('請選擇 09:00–18:00 內有效時段');const h=b-a-Math.max(0,Math.min(b,13)-Math.max(a,12));if(h<=0)throw Error('午休不計請假，請選擇工作時段');return h;}
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
export function anniversary(hire:string,months:number){const [y,m,d]=hire.split('-').map(Number);const a=new Date(Date.UTC(y,m-1+months,1));const max=new Date(Date.UTC(a.getUTCFullYear(),a.getUTCMonth()+1,0)).getUTCDate();a.setUTCDate(Math.min(d,max));return a.toISOString().slice(0,10);}
export function period(hire:string,asOf:string){
 if(!validDate(hire)||!validDate(asOf))throw Error('日期格式錯誤');
 let years=Number(asOf.slice(0,4))-Number(hire.slice(0,4));if(anniversary(hire,years*12)>asOf)years--;
 if(asOf<anniversary(hire,6))return {start:hire,end:anniversary(hire,6),days:0};
 if(years<1)return {start:anniversary(hire,6),end:anniversary(hire,12),days:3};
 const days=years===1?7:years===2?10:years<5?14:years<10?15:Math.min(30,years+6);
 return {start:anniversary(hire,years*12),end:anniversary(hire,(years+1)*12),days};
}
export function balance(hire:string,asOf:string,requests:any[]){const p=period(hire,asOf);const current=requests.filter(r=>r.type==='特休'&&r.date>=p.start&&r.date<p.end);const used=current.filter(r=>r.status==='approved').reduce((s,r)=>s+r.units,0);const pending=current.filter(r=>r.status==='pending').reduce((s,r)=>s+r.units,0);return {...p,used,pending,remaining:p.days-used-pending};}
