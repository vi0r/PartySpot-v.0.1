import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNavWrapper from "@/components/layout/BottomNavWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PartySpot Cologne",
  description: "Official Cologne Party Feed & Map",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PartySpot",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* CSP for Mapbox Workers in tunnels like ngrok */}
        <meta 
          http-equiv="Content-Security-Policy" 
          content="default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval' blob:; worker-src 'self' blob:; child-src 'self' blob:; img-src * data: blob:;" 
        />
      </head>
      <body className={inter.className}>
        <div className="flex justify-center min-h-[100dvh] bg-zinc-950 overflow-hidden">
          {/* Global Mobile Container (9:16 Aspect) */}
          <div className="w-full max-w-[430px] h-[100dvh] bg-black text-white relative shadow-2xl overflow-hidden flex flex-col">
            {children}
            <BottomNavWrapper />
          </div>
        </div>
      </body>
    </html>
  );
}
