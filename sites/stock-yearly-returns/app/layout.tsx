import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"股票年度報酬率｜歷史價格試算", description:"輸入股票代號和投入日期，查看投入後每個曆年的歷史報酬率。", icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"} };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-Hant"><body>{children}</body></html>}
