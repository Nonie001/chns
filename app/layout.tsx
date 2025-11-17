import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const prompt = Prompt({
  weight: ['400', '600'],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ระบบออกใบเสร็จการบริจาค",
  description: "Donation Receipt System - ระบบจัดการการบริจาคและออกใบเสร็จอัตโนมัติ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
