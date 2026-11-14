import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "員工國定假日補休系統",
  description: "依部門及員工姓名登記每月國定假日補休日期。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body className="antialiased">{children}</body></html>;
}
