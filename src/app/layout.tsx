import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
