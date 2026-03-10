import type { Metadata } from "next";
import "./globals.css";
import { rootBodyClass, rootHtmlClass } from "./consts";

export const metadata: Metadata = {
  title: "Baller",
  description: "Baller is a pricing intelligence and insights tool for Facebook Marketplace, helping sellers price items competitively using real market data and trends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={rootHtmlClass}>
      <body className={rootBodyClass}>
        {children}
      </body>
    </html>
  );
}
