'use client';
import {useState} from 'react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Table,TableHeader,TableRow,TableHead,TableBody,TableCell} from '@/components/ui/table';
import {leaveTimes,type QueryRecord} from '@/lib/leave-query';

export function DailyLeave({today,requests,onRefresh}:{today:string;requests:QueryRecord[];onRefresh:()=>Promise<void>}){
 const [selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const date=selected||today;
 const rows=requests.filter(r=>r.date===date&&['approved','pending'].includes(r.status)).sort((a,b)=>a.slot.localeCompare(b.slot)||a.number.localeCompare(b.number));
 const approved=rows.filter(r=>r.status==='approved'),pending=rows.filter(r=>r.status==='pending');
 async function refresh(){setBusy(true);setError('');try{await onRefresh();}catch{setError('更新失敗，請再試一次。');}finally{setBusy(false);}}
 return <section className="panel"><h2>{date===today?'今日請假人員':'指定日期請假人員'}</h2><div className="leave-filters"><label>查詢日期<Input type="date" value={date} onChange={e=>setSelected(e.target.value)}/></label><Button variant="outline" onClick={()=>setSelected('')}>回到今日</Button><Button disabled={busy} onClick={refresh}>{busy?'更新中…':'更新資料'}</Button></div>{error&&<p role="alert" className="notice">{error}</p>}<p className="query-total" role="status">{date} · 已核准 <strong>{new Set(approved.map(r=>r.number)).size}</strong> 人／{approved.reduce((sum,r)=>sum+r.units*8,0)} 小時 · 待處理 {pending.length} 筆</p><p className="help">顯示已核准及待處理的請假，已退回、已撤回不列入。今日依台灣日期計算。歷史資料未記載起訖時間時，顯示「未記載」。</p><Table><TableHeader><TableRow>{['員工姓名／編號','請假日期','開始時間','結束時間','假別','時數','狀態'].map(label=><TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map(r=>{const times=leaveTimes(r.slot);return <TableRow key={r.id}><TableCell>{r.name}<small>{r.number}</small></TableCell><TableCell>{r.date}</TableCell><TableCell>{times.start}</TableCell><TableCell>{times.end}</TableCell><TableCell>{r.type}</TableCell><TableCell>{r.units*8} 小時</TableCell><TableCell><span className={'badge '+r.status}>{r.status==='approved'?'已核准':'待處理'}</span></TableCell></TableRow>;})}</TableBody></Table>{rows.length===0&&<p className="empty">此日期沒有已核准或待處理的請假紀錄。</p>}</section>;
}
