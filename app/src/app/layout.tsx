import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Cloud Performance Service Manager",
  description:
    "Connect spreadsheets, HCM, and ERP systems. Build ETL pipelines, connectors, and webhooks in one platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{
  var isDark = localStorage.getItem("theme") !== "light";
  document.documentElement.classList.toggle("dark", isDark);
  var brand = JSON.parse(localStorage.getItem("brandColor"));
  if (brand) {
    var brandHsl = isDark ? brand.dark : brand.light;
    document.documentElement.style.setProperty("--brand", brandHsl);
    document.documentElement.style.setProperty("--accent", brandHsl);
  }
  var bg = JSON.parse(localStorage.getItem("background"));
  if (bg) {
    var bgTokens = isDark ? bg.dark : bg.light;
    document.documentElement.style.setProperty("--canvas", bgTokens.canvas);
    document.documentElement.style.setProperty("--surface", bgTokens.surface);
    document.documentElement.style.setProperty("--surface-2", bgTokens.surface2);
    document.documentElement.style.setProperty("--border", bgTokens.border);
    document.documentElement.style.setProperty("--border-strong", bgTokens.borderStrong);
  }
}catch(e){document.documentElement.classList.add("dark")}`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
