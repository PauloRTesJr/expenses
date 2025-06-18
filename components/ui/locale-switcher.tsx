"use client";
import { useLocale } from "@/components/providers/locale-provider";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const toggle = () => setLocale(locale === "pt-BR" ? "en-US" : "pt-BR");
  return (
    <button
      onClick={toggle}
      className="text-gray-400 hover:text-white text-sm"
      data-testid="locale-switcher"
    >
      {locale === "pt-BR" ? "PT" : "EN"}
    </button>
  );
}
