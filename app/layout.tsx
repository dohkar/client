import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
// import { AuthModal } from "@/components/features/auth-modal"; // временно: редирект на /auth/login
import { SupportButton } from "@/components/features/chats/SupportButton";
import { APP_CONFIG } from "@/constants";
import { THEME_COOKIE_NAME } from "@/constants/theme";
import { DEFAULT_SITE_METADATA } from "@/lib/seo";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeInitScript } from "@/components/theme-init-script";
import { ErrorBoundary } from "@/components/error-boundary";
import { ReactQueryProvider } from "@/lib/react-query/provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

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
  ...DEFAULT_SITE_METADATA,
  description: APP_CONFIG.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME)?.value;
  const defaultTheme = themeCookie === "dark" ? "dark" : "light";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dohkar.ru";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Дохкар",
        description: APP_CONFIG.description,
        inLanguage: "ru-RU",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            url: `${siteUrl}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Дохкар",
        url: siteUrl,
      },
    ],
  };

  return (
    <html lang='ru' className={defaultTheme} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeInitScript />
        <ThemeProvider defaultTheme={defaultTheme}>
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
                <main className='flex-1 pb-20 md:pb-0 bg-muted/20'>{children}</main>
                <ConditionalFooter />
                <MobileBottomNav />
                {/* <AuthModal /> */}
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
