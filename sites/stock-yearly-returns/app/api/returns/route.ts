import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
type Point = { date:string; price:number };
const pagesOrigin = "https://ts701105-cell.github.io";
const cors = (response:NextResponse, origin:string|null) => {
  if(origin===pagesOrigin) response.headers.set("Access-Control-Allow-Origin",pagesOrigin);
  response.headers.set("Vary","Origin");
  return response;
};
const fail = (error:string,status=400,origin:string|null=null) => cors(NextResponse.json({error},{status}),origin);

export async function OPTIONS(request:NextRequest){
  const origin=request.headers.get("Origin");
  const response=new NextResponse(null,{status:204});
  if(origin===pagesOrigin){response.headers.set("Access-Control-Allow-Origin",pagesOrigin);response.headers.set("Access-Control-Allow-Methods","GET, OPTIONS");response.headers.set("Access-Control-Allow-Headers","Content-Type")}
  return cors(response,origin);
}

async function load(symbol:string,start:number,end:number){
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${start}&period2=${end}&interval=1d&events=div%2Csplits&includeAdjustedClose=true`;
  const response=await fetch(url,{headers:{"Accept":"application/json","User-Agent":"Mozilla/5.0 (compatible; StockReturns/1.0)"},next:{revalidate:3600}});
  if(response.status===404)return null;
  if(!response.ok)throw new Error(response.status===429?"資料來源目前查詢過於頻繁，請稍後再試。":"暫時無法取得歷史股價，請稍後再試。");
  const data:any=await response.json();
  return data?.chart?.result?.[0]??null;
}

export async function GET(request:NextRequest){
  const origin=request.headers.get("Origin");
  const symbolInput=(request.nextUrl.searchParams.get("symbol")??"").trim().toUpperCase();
  const investedOn=request.nextUrl.searchParams.get("date")??"";
  if(!/^[A-Z0-9.^=-]{1,18}$/.test(symbolInput))return fail("請輸入有效的股票代號，例如 2330、2330.TW 或 AAPL。",400,origin);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(investedOn))return fail("請選擇有效的投入日期。",400,origin);
  const startDate=new Date(`${investedOn}T00:00:00Z`);
  if(Number.isNaN(startDate.getTime())||startDate.toISOString().slice(0,10)!==investedOn)return fail("請選擇有效的投入日期。",400,origin);
  const now=new Date();
  if(startDate>now)return fail("投入日期不能晚於今天。",400,origin);
  if(startDate.getUTCFullYear()<1970)return fail("請選擇 1970 年之後的日期。",400,origin);
  const candidates=/^\d{4,6}$/.test(symbolInput)?[`${symbolInput}.TW`,`${symbolInput}.TWO`]:[symbolInput];
  const period1=Math.floor(startDate.getTime()/1000);
  const period2=Math.floor(now.getTime()/1000)+86400;
  try{
    let chart:any=null;let symbol="";
    for(const candidate of candidates){chart=await load(candidate,period1,period2);if(chart){symbol=candidate;break}}
    if(!chart)return fail("找不到這個股票代號。台股請試試 2330，或輸入完整代號如 6488.TWO。",404,origin);
    const stamps:number[]=chart.timestamp??[];
    const adjusted:(number|null)[]=chart.indicators?.adjclose?.[0]?.adjclose??[];
    const closes:(number|null)[]=chart.indicators?.quote?.[0]?.close??[];
    const zone=chart.meta?.exchangeTimezoneName||"UTC";
    const formatter=new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"});
    const points:Point[]=stamps.map((stamp,i)=>({date:formatter.format(new Date(stamp*1000)),price:adjusted[i]??closes[i]??NaN})).filter(p=>p.date>=investedOn&&Number.isFinite(p.price)&&p.price>0);
    if(!points.length)return fail("投入日期之後沒有可用的交易資料，請選擇較早的日期。",404,origin);
    const lastByYear=new Map<number,Point>();
    for(const point of points)lastByYear.set(Number(point.date.slice(0,4)),point);
    const years=[...lastByYear.keys()].sort((a,b)=>a-b);
    let baseline=points[0];
    const rows=years.map((year,index)=>{
      const end=lastByYear.get(year)!;
      const row={year,from:baseline.date,to:end.date,startPrice:baseline.price,endPrice:end.price,returnPct:(end.price/baseline.price-1)*100,partial:index===0||year===Number(points.at(-1)!.date.slice(0,4))};
      baseline=end;return row;
    });
    const latest=points.at(-1)!;
    return cors(NextResponse.json({symbol,name:chart.meta?.longName||chart.meta?.shortName||symbol,currency:chart.meta?.currency||"",investedOn,firstTradingDay:points[0].date,latestDate:latest.date,rows,totalReturnPct:(latest.price/points[0].price-1)*100,source:"Yahoo Finance"},{headers:{"Cache-Control":"public, max-age=300, s-maxage=3600"}}),origin);
  }catch(error){return fail(error instanceof Error?error.message:"查詢失敗，請稍後再試。",502,origin)}
}
