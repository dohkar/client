"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { OAuthPopupButton } from "@/components/features";
import { ROUTES } from "@/constants";
import { useConsent } from "@/components/cookie-consent/consent-provider";

const oauthBtnClass =
  "w-full sm:w-auto h-10 rounded-xl flex items-center justify-center gap-2 border border-input bg-background hover:bg-muted/60 transition-colors";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { consent, reset } = useConsent();
  const isGoogle = user?.provider === "GOOGLE";
  const isYandex = user?.provider === "YANDEX";
  const isTelegram = user?.provider === "TELEGRAM";

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Настройки</h1>
          <p className="text-muted-foreground">
            Управляйте настройками аккаунта
          </p>
        </div>

        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle>Способы входа</CardTitle>
            <CardDescription>
              Привяжите Google или Яндекс для входа одним кликом. Telegram отображается, если вы вошли через него.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3">
            {isGoogle ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GoogleIcon />
                <span>Google привязан</span>
              </div>
            ) : (
              <Button variant="outline" className={oauthBtnClass} asChild>
                <OAuthPopupButton
                  provider="google"
                  label="Привязать Google"
                  icon={<GoogleIcon />}
                  oauthState="link"
                  onSuccessRedirect={ROUTES.dashboardSettings}
                />
              </Button>
            )}
            {isYandex ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Image src="/yandex.png" alt="" width={20} height={20} className="shrink-0" />
                <span>Яндекс привязан</span>
              </div>
            ) : (
              <Button variant="outline" className={oauthBtnClass} asChild>
                <OAuthPopupButton
                  provider="yandex"
                  label="Привязать Яндекс"
                  icon={<Image src="/yandex.png" alt="" width={20} height={20} className="shrink-0" />}
                  oauthState="link"
                  onSuccessRedirect={ROUTES.dashboardSettings}
                />
              </Button>
            )}
            {isTelegram ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.326.015.094.034.308.019.475z" />
                </svg>
                <span>Telegram привязан</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-primary/20 mb-6">
          <CardHeader>
            <CardTitle>Уведомления</CardTitle>
            <CardDescription>Настройте уведомления</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Настройки уведомлений будут доступны в будущих обновлениях
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Согласие на cookie</CardTitle>
            <CardDescription>
              Текущий статус: {consent === "accepted" ? "Принято" : consent === "declined" ? "Отклонено" : "Не выбрано"}. Сброс покажет баннер снова.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={reset}>
              Сбросить согласие на cookie
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
