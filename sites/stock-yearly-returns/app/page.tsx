"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = { year:number; from:string; to:string; startPrice:number; endPrice:number; returnPct:number; partial:boolean };
type Result = { symbol:string; name:string; investedOn:string; firstTradingDay:string; latestDate:string; rows:Row[]; totalReturnPct:number; source:string };
const today = new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Taipei"});
const dateText=(s:string)=>s.replaceAll("-","/");
const pct=(n:number)=>`${n>=0?"+":""}${n.toFixed(2)}%`;
const price=(n:number)=>new Intl.NumberFormat("zh-TW",{maximumFractionDigits:2}).format(n);

export default function Home(){
  const [symbol,setSymbol]=useState("2330");
  const [date,setDate]=useState("2020-01-02");
  const [result,setResult]=useState<Result|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  async function runQuery(nextSymbol:string,nextDate:string){
    setSymbol(nextSymbol);setDate(nextDate);setError("");setResult(null);setLoading(true);
    try{const res=await fetch(`/api/returns?symbol=${encodeURIComponent(nextSymbol.trim())}&date=${encodeURIComponent(nextDate)}`);const body=await res.json() as Result & {error?:string};if(!res.ok)throw new Error(body.error||"查詢失敗，請稍後再試。");setResult(body);return body}
    catch(e){const message=e instanceof Error?e.message:"查詢失敗，請稍後再試。";setError(message);throw new Error(message)}finally{setLoading(false)}
  }
  async function calculate(e:React.FormEvent<HTMLFormElement>){e.preventDefault();try{await runQuery(symbol,date)}catch{}}
  useEffect(()=>{
    type Tool={registerTool:(tool:unknown,options:{signal:AbortSignal})=>void|Promise<void>};
    const context=(document as Document & {modelContext?:Tool}).modelContext;
    if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    void Promise.resolve(context.registerTool({name:"calculate_stock_yearly_returns",title:"計算股票年度報酬率",description:"輸入股票代號和投入日期，計算並顯示投入後各曆年的報酬率。",inputSchema:{type:"object",properties:{symbol:{type:"string"},date:{type:"string",format:"date"}},required:["symbol","date"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async(input:unknown)=>{const value=input as {symbol?:unknown;date?:unknown};if(typeof value?.symbol!=="string"||typeof value?.date!=="string"||!value.symbol.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(value.date))throw new Error("請提供有效股票代號和 YYYY-MM-DD 日期。");const result=await runQuery(value.symbol,value.date);return {symbol:result.symbol,latestDate:result.latestDate,rows:result.rows.map(r=>({year:r.year,returnPct:r.returnPct}))}}},{signal:lifecycle.signal})).catch(()=>{});
    return()=>lifecycle.abort();
  },[]);
  return <main className="shell"><header className="top"><span className="mark">↗</span><b>股票年度報酬率</b><span className="top-note">歷史價格試算</span></header>
    <div className="workspace"><div className="intro"><p className="eyebrow">STOCK RETURN CALCULATOR</p><h1>看看每一年，投資走了多遠。</h1><p>輸入股票代號及投入日期，查看投入後每個曆年的報酬率。</p></div>
    <form className="form" onSubmit={calculate}><div className="field"><label htmlFor="symbol">股票代號</label><Input id="symbol" value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="例如 2330 或 AAPL" required autoComplete="off"/><small>台股可直接輸入；上櫃股票可加 .TWO</small></div><div className="field"><label htmlFor="date">投入日期</label><Input id="date" type="date" max={today} value={date} onChange={e=>setDate(e.target.value)} required/><small>非交易日會從下一個交易日開始計算</small></div><Button type="submit" disabled={loading} className="submit">{loading?"查詢中…":"計算報酬率"}<span aria-hidden="true">↗</span></Button></form>
    {error&&<div role="alert" className="error">{error}</div>}
    {result?<section className="results" aria-live="polite"><div className="result-head"><div><p className="eyebrow">ANNUAL PERFORMANCE</p><h2>{result.name||result.symbol}<span className="tag">{result.symbol}</span></h2><p className="period">投入日 {dateText(result.investedOn)} · 首個交易日 {dateText(result.firstTradingDay)} · 最新資料 {dateText(result.latestDate)}</p></div><div className="total"><span>投入至今累計報酬</span><strong className={result.totalReturnPct<0?"neg":"pos"}>{pct(result.totalReturnPct)}</strong></div></div><div className="table-wrap"><table><thead><tr><th>年度</th><th>計算期間</th><th>期初調整價</th><th>期末調整價</th><th>年度報酬率</th></tr></thead><tbody>{result.rows.map(r=><tr key={r.year}><td className="year">{r.year}<span>{r.partial?(r.year===Number(result.latestDate.slice(0,4))?"年初至今":"投入當年"):"完整年度"}</span></td><td>{dateText(r.from)} — {dateText(r.to)}</td><td>{price(r.startPrice)}</td><td>{price(r.endPrice)}</td><td><strong className={r.returnPct<0?"neg":"pos"}>{pct(r.returnPct)}</strong></td></tr>)}</tbody></table></div><p className="method">計算方式：以調整後收盤價計算，年度報酬率＝該年期末價 ÷ 前一年度期末價 − 1。投入當年使用投入日後首個交易日作為期初；今年計至最新交易日。調整後價格通常反映拆股與現金股利，但不含交易費、稅、匯率及股利再投入差異。資料來源：{result.source}，僅供歷史試算。</p></section>:<div className="empty">輸入上方資料後，這裡會顯示逐年報酬。</div>}
    </div></main>
}
