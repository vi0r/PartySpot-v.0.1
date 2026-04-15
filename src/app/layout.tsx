import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNavWrapper from "@/presentation/components/layout/BottomNavWrapper";

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
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

import { ErrorBoundary } from "@/presentation/components/layout/ErrorBoundary";
import OnboardingOverlay from "@/presentation/components/ui/OnboardingOverlay";
import ServiceWorkerRegistry from "@/presentation/components/layout/ServiceWorkerRegistry";
import NotificationHandler from "@/presentation/components/layout/NotificationHandler";
import AppHeightFix from "@/presentation/components/layout/AppHeightFix";

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
          httpEquiv="Content-Security-Policy" 
          content="default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval' blob:; connect-src 'self' https: wss:; worker-src 'self' blob:; child-src 'self' blob:; img-src * data: blob:;" 
        />
      </head>
      <body className={inter.className}>
        <AppHeightFix />
        <div className="flex justify-center min-h-screen min-h-[calc(var(--vh,1vh)*100)] bg-black overflow-hidden relative">
          {/* Global Mobile Container (9:16 Aspect) */}
          <div className="w-full max-w-[430px] h-screen h-[calc(var(--vh,1vh)*100)] bg-background text-white relative shadow-2xl overflow-hidden flex flex-col">
            <ErrorBoundary>
              {children}
              <NotificationHandler />
            </ErrorBoundary>
            <BottomNavWrapper />
            <OnboardingOverlay />
            <ServiceWorkerRegistry />
          </div>
        </div>
      </body>
    </html>
  );
}
