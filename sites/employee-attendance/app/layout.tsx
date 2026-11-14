import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "員工每月排休系統",
  description: "讓員工按月份選擇休息日與例假日，確認後送出排休。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}
