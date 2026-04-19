import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNavWrapper from "@/presentation/components/layout/BottomNavWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'PartySpot — Cologne Nightlife',
    template: '%s | PartySpot Cologne',
  },
  description: 'Discover the best clubs, underground raves, techno events and parties in Cologne. Your smart nightlife companion.',
  keywords: ['Cologne nightlife', 'clubs Cologne', 'techno Köln', 'parties Cologne', 'PartySpot'],
  authors: [{ name: 'PartySpot' }],
  creator: 'PartySpot',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_DE',
    url: 'https://partyspot.app',
    siteName: 'PartySpot',
    title: 'PartySpot — Cologne Nightlife',
    description: 'Discover the best clubs, underground raves and parties in Cologne.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'PartySpot — Cologne Nightlife',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PartySpot — Cologne Nightlife',
    description: 'Discover the best clubs, underground raves and parties in Cologne.',
    images: ['https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=1200&h=630&fit=crop'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PartySpot',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
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
import PWAInstallPrompt from "@/presentation/components/ui/PWAInstallPrompt";
import { NotificationProvider } from "@/application/contexts/NotificationContext";

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
        <link rel="apple-touch-startup-image" href="https://images.unsplash.com/photo-1514525253344-f81f3f74412f?q=80&w=430" />
        <meta name="apple-mobile-web-app-title" content="PartySpot" />
      </head>
      <body className={inter.className}>
        <AppHeightFix />
        <NotificationProvider>
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
              <PWAInstallPrompt />
            </div>
          </div>
        </NotificationProvider>
      </body>
    </html>
  );
}
