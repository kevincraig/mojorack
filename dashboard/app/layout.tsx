import type { Metadata } from "next";
import { Orbitron, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const displayFont = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

const monoFont = Share_Tech_Mono({
  variable: "--font-hud-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "MOJORACK // NETCTRL",
  description: "Rack network operations dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${displayFont.variable} ${monoFont.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
