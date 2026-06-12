"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dictionaries, type Lang, type TKey } from "./dictionaries";

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const Ctx = createContext<I18nCtx>({
  lang: "sv",
  setLang: () => {},
  t: (k) => dictionaries.sv[k],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("sv");

  useEffect(() => {
    const stored = localStorage.getItem("aetos-lang") as Lang | null;
    if (stored === "sv" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("aetos-lang", l);
    document.documentElement.lang = l;
  };

  const t = (key: TKey) => dictionaries[lang][key] ?? dictionaries.sv[key] ?? key;

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
