import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Figtree, JetBrains_Mono } from "next/font/google";
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
import { ConsentProvider } from "@/components/cookie-consent/consent-provider";
import { CookieBanner } from "@/components/cookie-consent/cookie-banner";
import { CookieConsentAnalytics } from "@/components/cookie-consent/analytics";

const fontSans = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  ...DEFAULT_SITE_METADATA,
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
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeInitScript />
        <ThemeProvider defaultTheme={defaultTheme}>
          <ConsentProvider>
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
                  <CookieBanner />
                  <CookieConsentAnalytics />
                  <SpeedInsights />
                  <Analytics />
                </div>
                <Toaster />
              </ErrorBoundary>
            </ReactQueryProvider>
          </ConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
