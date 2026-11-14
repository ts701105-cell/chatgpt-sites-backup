import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"股票年度報酬資料 API",description:"提供股票年度歷史報酬試算資料。",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-Hant"><body>{children}</body></html>}
