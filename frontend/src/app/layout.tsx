import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "微型动力电池 MES 云平台",
  description: "用于学习的微型动力电池 MES 云平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
