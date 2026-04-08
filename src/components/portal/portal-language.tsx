"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PortalLanguage = "en" | "ru" | "az";

type PortalLanguageContextValue = {
  language: PortalLanguage;
  setLanguage: (language: PortalLanguage) => void;
};

const PortalLanguageContext = createContext<PortalLanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "portal_language";

export function PortalLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<PortalLanguage>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as PortalLanguage | null;
    if (stored === "en" || stored === "ru" || stored === "az") {
      setLanguageState(stored);
    }
  }, []);

  function setLanguage(nextLanguage: PortalLanguage) {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  }

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <PortalLanguageContext.Provider value={value}>{children}</PortalLanguageContext.Provider>;
}

export function usePortalLanguage() {
  const context = useContext(PortalLanguageContext);
  if (!context) throw new Error("usePortalLanguage must be used within PortalLanguageProvider");
  return context;
}
