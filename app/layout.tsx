import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Deepwrk — AI Focus OS",
  description:
    "Stop losing hours. Start owning them. Deepwrk is the AI focus OS that plans your day, tracks your patterns, and coaches you weekly.",
  keywords: ["focus", "productivity", "deep work", "AI", "time tracking"],
  openGraph: {
    title: "Deepwrk — AI Focus OS",
    description: "Stop losing hours. Start owning them.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
