import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quality Hub | 测试质量看板",
  description: "iPartner UI 自动化回归与兼容性测试管理看板",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
