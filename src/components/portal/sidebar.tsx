"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLineLeft, ArrowLineRight, CaretDown, FolderOpen, GearSix, House, Lifebuoy, List, Receipt, SpeakerHigh, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { usePortalLanguage, type PortalLanguage } from "./portal-language";
import { usePortal } from "./portal-provider";
import { ProjectSwitcher } from "./project-switcher";

const navItems = [
  { key: "home", href: "/portal", icon: House },
  { key: "smm", href: "/portal/smm", icon: SpeakerHigh },
  { key: "files", href: "/portal/deliverables", icon: FolderOpen },
  { key: "billing", href: "/portal/invoices", icon: Receipt },
  { key: "support", href: "/portal/contact", icon: Lifebuoy },
  { key: "settings", href: "/portal/settings", icon: GearSix },
];

const sidebarCopy: Record<PortalLanguage, Record<string, string>> = {
  en: {
    home: "Home",
    overview: "Overview",
    smm: "SMM",
    files: "Files",
    billing: "Billing",
    support: "Support",
    settings: "Settings",
    managementPortal: "Management Portal",
    language: "Language",
    minimizeSidebar: "Minimize sidebar",
    expandSidebar: "Expand sidebar",
  },
  ru: {
    home: "Главная",
    overview: "Обзор",
    smm: "SMM",
    files: "Файлы",
    billing: "Счеты",
    support: "Поддержка",
    settings: "Настройки",
    managementPortal: "Панель управления",
    language: "Язык",
    minimizeSidebar: "Свернуть панель",
    expandSidebar: "Развернуть панель",
  },
  az: {
    home: "Əsas Səhifə",
    overview: "Ümumi",
    smm: "SMM",
    files: "Fayllar",
    billing: "Hesablar",
    support: "Dəstək",
    settings: "Tənzimləmələr",
    managementPortal: "İdarəetmə Paneli",
    language: "Dil",
    minimizeSidebar: "Paneli yığ",
    expandSidebar: "Paneli aç",
  },
};

const languageOptions: Array<{ value: PortalLanguage; label: string; short: string; flag: string }> = [
  { value: "en", label: "English", short: "EN", flag: "/flags/en.svg" },
  { value: "ru", label: "Русский", short: "RU", flag: "/flags/ru.svg" },
  { value: "az", label: "Azərbaycan", short: "AZ", flag: "/flags/az.svg" },
];

export function Sidebar() {
  const { language, setLanguage } = usePortalLanguage();
  const { selectedProject } = usePortal();
  const pathname = usePathname();
  const [isLanguageExpanded, setIsLanguageExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const copy = sidebarCopy[language];
  const activeLanguageOption = languageOptions.find((option) => option.value === language) ?? languageOptions[0];
  const showSmmTab = selectedProject?.service === "smm";

  useEffect(() => {
    const storedSidebarState = window.localStorage.getItem("portal-sidebar-collapsed");

    if (storedSidebarState !== null) {
      setIsCollapsed(storedSidebarState === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("portal-sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isMobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileNavOpen]);

  const visibleNavItems = navItems.filter((item) => {
    if (showSmmTab) return item.key !== "dashboard";
    return item.key !== "smm";
  });

  const isActive = (href: string) => {
    if (href === "/portal") return pathname === "/portal";
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/80 px-3 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <Image
              src="/BAKHISHOV.png"
              alt="Bakhishov"
              width={96}
              height={20}
              className="h-4 w-auto object-contain"
              unoptimized
              priority
            />
          </div>

          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/55 text-white/90"
            aria-label="Open navigation"
          >
            <List className="h-5 w-5" weight="bold" />
          </button>
        </div>

        <div className="mt-3">
          <ProjectSwitcher />
        </div>
      </div>

      <AnimatePresence>
        {isMobileNavOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/70 lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <motion.div
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full w-[min(92vw,360px)] overflow-y-auto border-r border-white/10 bg-[#070707] p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                  <Image
                    src="/BAKHISHOV.png"
                    alt="Bakhishov"
                    width={104}
                    height={22}
                    className="h-4 w-auto object-contain"
                    unoptimized
                    priority
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/55 text-white/90"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" weight="bold" />
                </button>
              </div>

              <nav className="space-y-2">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const itemLabelKey = showSmmTab && item.key === "smm" ? "overview" : item.key;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileNavOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
                        active
                          ? "border-white/24 bg-white/[0.08] text-white"
                          : "border-white/10 bg-black/30 text-white/78 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
                      <span>{copy[itemLabelKey]}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-5 rounded-2xl border border-white/12 bg-black/60 p-3">
                <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-white/48">{copy.language}</p>
                <div className="grid grid-cols-3 gap-2">
                  {languageOptions.map((option) => {
                    const active = language === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setLanguage(option.value)}
                        className={`rounded-xl border px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                          active
                            ? "border-white/30 bg-white/[0.08] text-white"
                            : "border-white/10 bg-black/50 text-white/75"
                        }`}
                      >
                        {option.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    <motion.aside
      animate={{ width: isCollapsed ? 92 : 280 }}
      transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
      className="sticky top-0 hidden h-screen shrink-0 self-start overflow-visible border-r border-white/10 bg-white/[0.025] lg:block relative"
    >
      <div className={`relative flex h-full flex-col py-8 transition-[padding] duration-300 ${isCollapsed ? "px-3" : "px-6"}`}>
        <div className="relative mb-10 flex w-full flex-col gap-3">
          <div className="flex w-full items-start gap-3">
            <div className={`flex w-full flex-col rounded-2xl border border-white/10 bg-black/30 ${isCollapsed ? "items-center px-3 py-3" : "items-start px-4 py-3"}`}>
              <Image
                src={isCollapsed ? "/inv.png" : "/BAKHISHOV.png"}
                alt="Bakhishov"
                width={isCollapsed ? 42 : 120}
                height={isCollapsed ? 42 : 26}
                className={isCollapsed ? "h-11 w-11 object-contain" : "h-5 w-auto object-contain"}
                unoptimized
                priority
              />
              {!isCollapsed && (
                <h1 className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/78">
                  {copy.managementPortal}
                </h1>
              )}
            </div>
          </div>

          {isCollapsed ? (
            <CollapsedLanguageSwitcher language={language} setLanguage={setLanguage} activeLanguageOption={activeLanguageOption} isExpanded={isLanguageExpanded} setIsExpanded={setIsLanguageExpanded} />
          ) : (
            <div className="relative w-full rounded-2xl border border-white/12 bg-black/70 p-2">
              <button
                type="button"
                onClick={() => setIsLanguageExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/80 px-4 py-2.5 text-left transition hover:border-white/20"
              >
                <span className="inline-flex h-7 items-center justify-center rounded-lg border border-white/12 bg-black px-2 text-[11px] font-semibold tracking-[0.12em] text-white/88">
                  {activeLanguageOption.short}
                </span>
                <motion.span
                  animate={{ rotate: isLanguageExpanded ? 180 : 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="text-white/70"
                >
                  <CaretDown className="h-4 w-4" />
                </motion.span>
              </button>

              <motion.div
                initial={false}
                animate={isLanguageExpanded ? { height: "auto", opacity: 1, marginTop: 8 } : { height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-2">
                  {languageOptions.map((option) => {
                    const active = language === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setLanguage(option.value);
                          setIsLanguageExpanded(false);
                        }}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 380, damping: 24 }}
                        className={`rounded-xl border px-2 py-2 text-center transition-all duration-200 ${
                          active
                            ? "border-white/28 bg-white/[0.06] text-white"
                            : "border-white/10 bg-black/75 text-white/75 hover:border-white/20 hover:bg-black/95 hover:text-white"
                        }`}
                      >
                        <span className="flex flex-col items-center gap-1.5">
                          <img
                            src={option.flag}
                            alt={option.label}
                            width={28}
                            height={20}
                            className="h-4.5 w-7 rounded-sm border border-white/20"
                            style={{ imageRendering: "crisp-edges" }}
                            draggable={false}
                          />
                          <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${active ? "text-white" : "text-white/72"}`}>
                            {option.short}
                          </span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </div>

        <nav className="space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const itemLabelKey = showSmmTab && item.key === "smm" ? "overview" : item.key;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={copy[itemLabelKey]}
                title={copy[itemLabelKey]}
                className={`group relative block overflow-hidden rounded-2xl border border-transparent text-[15px] transition ${
                  isCollapsed ? "px-0 py-3" : "px-4 py-3"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="absolute inset-0 rounded-2xl border border-white/25 bg-[#1a1a1a]"
                  />
                )}

                <span
                  className={`relative z-10 flex items-center font-medium tracking-tight transition-colors duration-300 ${
                    isCollapsed ? "justify-center" : "gap-2.5"
                  } ${
                    active
                      ? "text-white"
                      : "text-white/70 group-hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
                  {!isCollapsed && copy[itemLabelKey]}
                </span>

                {!active && (
                  <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:ring-1 group-hover:ring-white/20" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative z-50 mt-auto overflow-visible space-y-3">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? copy.expandSidebar : copy.minimizeSidebar}
            className={`group flex items-center border border-white/10 bg-[#070707] text-left text-white shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition-all duration-300 hover:border-white/20 hover:bg-[#0d0d0d] hover:shadow-[0_16px_34px_rgba(0,0,0,0.38)] ${
              isCollapsed ? "mx-auto h-11 w-11 justify-center rounded-2xl px-0" : "h-12 w-full justify-between rounded-2xl px-4"
            }`}
          >
            <span className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3 text-sm font-medium text-white/88"}`}>
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/88 transition-colors duration-300 group-hover:bg-white/[0.08] ${isCollapsed ? "h-8 w-8" : ""}`}>
                {isCollapsed ? <ArrowLineRight className="h-4 w-4" /> : <ArrowLineLeft className="h-4 w-4" />}
              </span>
              {!isCollapsed && <span>{copy.minimizeSidebar}</span>}
            </span>
          </button>

          <ProjectSwitcher collapsed={isCollapsed} />
        </div>

      </div>
    </motion.aside>
    </>
  );
}

function CollapsedLanguageSwitcher({
  language,
  setLanguage,
  activeLanguageOption,
  isExpanded,
  setIsExpanded,
}: {
  language: PortalLanguage;
  setLanguage: (language: PortalLanguage) => void;
  activeLanguageOption: (typeof languageOptions)[number];
  isExpanded: boolean;
  setIsExpanded: (value: boolean | ((previousValue: boolean) => boolean)) => void;
}) {
  return (
    <div className="relative mt-1">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-label="Change language"
        className="flex h-12 w-full items-center justify-between rounded-2xl border border-white/12 bg-black/70 px-3 text-white/80 transition hover:border-white/20 hover:bg-black/90 hover:text-white"
      >
        <span className="inline-flex items-center gap-2">
          <img
            src={activeLanguageOption.flag}
            alt={activeLanguageOption.label}
            width={28}
            height={20}
            className="h-4.5 w-7 rounded-sm border border-white/20"
            style={{ imageRendering: "crisp-edges" }}
            draggable={false}
          />
        </span>
        <CaretDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed left-[104px] top-[108px] z-[180] w-[226px] rounded-2xl border border-white/14 bg-black p-2 shadow-[0_28px_60px_rgba(0,0,0,0.65)]"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/58">Language</p>
              <span className="rounded-full border border-white/14 bg-[#0a0a0a] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/55">
                {activeLanguageOption.short}
              </span>
            </div>

            <div className="grid gap-1">
              {languageOptions.map((option) => {
                const active = option.value === language;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setLanguage(option.value);
                      setIsExpanded(false);
                    }}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-white/24 bg-[#111111] text-white"
                        : "border-transparent bg-transparent text-white/82 hover:border-white/12 hover:bg-[#0c0c0c] hover:text-white"
                    }`}
                  >
                    <img
                      src={option.flag}
                      alt={option.label}
                      width={28}
                      height={20}
                      className="h-4.5 w-7 rounded-sm border border-white/20"
                      style={{ imageRendering: "crisp-edges" }}
                      draggable={false}
                    />
                    <span className="text-sm font-semibold tracking-tight">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}