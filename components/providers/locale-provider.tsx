"use client";
import React, { createContext, useContext, useState } from "react";
import enUS from "@/locales/en-US.json";
import ptBR from "@/locales/pt-BR.json";

export type Locale = "en-US" | "pt-BR";

interface LocaleContextValue {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
}

const messages: Record<Locale, Record<string, string>> = {
  "en-US": enUS,
  "pt-BR": ptBR,
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    return (window.localStorage.getItem("locale") as Locale) || "pt-BR";
  });
  const changeLocale = (l: Locale) => {
    setLocale(l);
    window.localStorage.setItem("locale", l);
  };

  const t = (key: string) => messages[locale][key] || key;

  return (
    <LocaleContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
