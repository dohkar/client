import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SupportButton } from "@/components/features/chats/SupportButton";
import { APP_CONFIG } from "@/constants";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { ReactQueryProvider } from "@/lib/react-query/provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ru' suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <ErrorBoundary>
              <div className='flex min-h-screen flex-col'>
                <Suspense
                  fallback={
                    <header className='sticky top-0 z-50 w-full border-b bg-background/95 h-16' />
                  }
                >
                  <Header />
                </Suspense>
                <main className='flex-1 pb-20 md:pb-0'>{children}</main>
                <ConditionalFooter />
                <MobileBottomNav />
                <SupportButton />
                <SpeedInsights />
                <Analytics />
              </div>
              <Toaster />
            </ErrorBoundary>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
