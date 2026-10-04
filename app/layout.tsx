import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { FloatingHearts } from "@/components/FloatingHearts";
import { APP_TITLE } from "@/lib/app";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const body = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_TITLE,
  description: "A little list of things worth wishing for.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#fdf6f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh antialiased">
        <FloatingHearts />
        {children}
      </body>
    </html>
  );
}
