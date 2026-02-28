"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  getConsent,
  setConsent,
  clearConsent,
  type ConsentValue,
} from "@/lib/cookie-consent";

type ConsentCtx = {
  /** null = пользователь ещё не выбрал */
  consent: ConsentValue | null;
  isReady: boolean;
  accept: () => void;
  decline: () => void;
  /** для страницы настроек */
  reset: () => void;
};

const ConsentContext = createContext<ConsentCtx | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<ConsentValue | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setConsentState(getConsent());
    setIsReady(true);
  }, []);

  const accept = useCallback(() => {
    setConsent("accepted");
    setConsentState("accepted");
  }, []);

  const decline = useCallback(() => {
    setConsent("declined");
    setConsentState("declined");
  }, []);

  const reset = useCallback(() => {
    clearConsent();
    setConsentState(null);
  }, []);

  return (
    <ConsentContext.Provider
      value={{ consent, isReady, accept, decline, reset }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx)
    throw new Error("useConsent: wrap your app in <ConsentProvider>");
  return ctx;
}
