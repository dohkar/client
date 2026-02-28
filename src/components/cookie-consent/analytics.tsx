"use client";

import { useEffect } from "react";
import { useConsent } from "./consent-provider";

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const METRIKA_ID = process.env.NEXT_PUBLIC_METRIKA_ID;

function initYandexMetrika(id: string) {
  const script = document.createElement("script");
  script.innerHTML = `
    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      var z=m[i];z.l=1*new Date();
      k=e.createElement(t),a=e.getElementsByTagName(t)[0];
      k.async=1;k.src=r;a.parentNode.insertBefore(k,a)
    })(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
    ym(${id},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});
  `;
  document.head.appendChild(script);
}

export function CookieConsentAnalytics() {
  const { consent } = useConsent();

  useEffect(() => {
    if (consent !== "accepted") return;
    if (METRIKA_ID) initYandexMetrika(METRIKA_ID);
  }, [consent]);

  return null;
}
