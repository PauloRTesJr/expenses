"use client";
import { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { useLocale } from "./locale-provider";
import { QueryClientWrapper } from "./query-client-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface Props {
  children: ReactNode;
}

export function LayoutWithLocale({ children }: Props) {
  const { locale } = useLocale();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryClientWrapper>{children}</QueryClientWrapper>
      </body>
    </html>
  );
}
