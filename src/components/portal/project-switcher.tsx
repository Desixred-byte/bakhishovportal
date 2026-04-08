"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Check, CaretDown, FolderOpen, ArrowsClockwise } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { usePortal } from "./portal-provider";
import { usePortalLanguage, type PortalLanguage } from "./portal-language";

const servicePillStyles: Record<string, string> = {
  website: "border-blue-300/30 bg-blue-400/15 text-blue-100",
  smm: "border-pink-300/30 bg-pink-400/15 text-pink-100",
  app: "border-violet-300/30 bg-violet-400/15 text-violet-100",
  software: "border-cyan-300/30 bg-cyan-400/15 text-cyan-100",
  branding: "border-amber-300/30 bg-amber-400/15 text-amber-100",
};

const servicePillLabels: Record<string, string> = {
  website: "WEB",
  smm: "SMM",
  app: "APP",
  software: "SOFT",
  branding: "BRAND",
};

const projectSwitcherCopy: Record<PortalLanguage, { activeWorkspace: string; chooseProject: string }> = {
  en: { activeWorkspace: "Active workspace", chooseProject: "Choose project" },
  ru: { activeWorkspace: "Активный проект", chooseProject: "Выберите проект" },
  az: { activeWorkspace: "Aktiv iş sahəsi", chooseProject: "Layihəni seçin" },
};

export function ProjectSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { client, selectedProjectId, setSelectedProjectId } = usePortal();
  const { language } = usePortalLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [flyoutPosition, setFlyoutPosition] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open || !rootRef.current) return;

    const menuEstimatedHeight = 322;
    const gap = 12;
    const anchorElement = buttonRef.current ?? rootRef.current;
    const rect = anchorElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    setOpenUpward(spaceBelow < menuEstimatedHeight + gap && spaceAbove > spaceBelow);
    if (collapsed) {
      const top = spaceBelow < menuEstimatedHeight + gap && spaceAbove > spaceBelow
        ? Math.max(12, rect.bottom - menuEstimatedHeight)
        : Math.max(12, rect.top);
      setFlyoutPosition({ top, left: rect.right + 12 });
    } else {
      setFlyoutPosition(null);
    }
  }, [collapsed, open]);

  if (!client) return null;

  const selectedProject =
    client.projects.find((project) => project.id === selectedProjectId) ??
    client.projects[0];
  const copy = projectSwitcherCopy[language];

  return (
    <motion.div
      ref={rootRef}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="group relative z-[70]"
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex w-full items-center rounded-2xl border border-white/14 bg-black text-left shadow-[0_12px_28px_rgba(0,0,0,0.48)] transition-all duration-250 hover:border-white/26 hover:bg-[#080808] hover:shadow-[0_16px_34px_rgba(0,0,0,0.56)] focus-visible:border-white/30 focus-visible:outline-none ${
          collapsed ? "h-12 justify-center px-2" : "h-14 gap-2 px-3.5"
        }`}
      >
        {collapsed ? (
          <>
            <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] text-white/85">
              <FolderOpen className="h-4 w-4" weight="bold" />
            </span>

            <span className="sr-only">{copy.chooseProject}</span>

            <CaretDown
              className={`ml-2 h-4 w-4 flex-none text-white/70 transition-all duration-300 ${
                open ? "rotate-180" : "group-hover:translate-y-[1px]"
              }`}
              weight="bold"
            />
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/42">{copy.activeWorkspace}</p>

              <div className="mt-0.5 flex max-w-full items-center gap-1.5">
                <span title={selectedProject?.name} className="block min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-white">
                  {selectedProject?.name}
                </span>
                <span
                  className={`inline-flex shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                    servicePillStyles[selectedProject?.service ?? ""] ?? "border-white/20 bg-white/10 text-white/80"
                  }`}
                >
                  {servicePillLabels[selectedProject?.service ?? ""] ?? selectedProject?.service}
                </span>
              </div>
            </div>

            <CaretDown
              className={`h-4 w-4 flex-none text-white/70 transition-all duration-300 ${
                open ? "rotate-180" : "group-hover:translate-y-[1px]"
              }`}
              weight="bold"
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? 8 : -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 8 : -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={`rounded-2xl border border-white/14 bg-black p-2 shadow-[0_28px_60px_rgba(0,0,0,0.65)] ${
              collapsed
                ? "fixed z-[200] w-[268px] overflow-visible"
                : `absolute z-[80] overflow-hidden ${openUpward ? "bottom-[calc(100%+10px)]" : "top-[calc(100%+10px)]"}`
            }`}
            style={collapsed && flyoutPosition ? { top: flyoutPosition.top, left: flyoutPosition.left } : undefined}
          >
            {collapsed && (
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/58">{copy.chooseProject}</p>
                  <p title={selectedProject?.name} className="truncate text-[12px] font-semibold tracking-tight text-white/88">{selectedProject?.name}</p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] text-white/70">
                  <ArrowsClockwise className="h-4 w-4" weight="bold" />
                </span>
              </div>
            )}

            {!collapsed && (
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/58">{copy.chooseProject}</p>
                <span className="rounded-full border border-white/14 bg-[#0a0a0a] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/55">
                  {client.projects.length}
                </span>
              </div>
            )}

            <div className={`max-h-64 space-y-1 overflow-auto pr-1 ${collapsed ? "mt-2" : ""}`}>
              {client.projects.map((project) => {
                const active = project.id === selectedProjectId;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setOpen(false);

                      const targetRoute = project.service === "smm" ? "/portal/smm" : "/portal";
                      if (pathname !== targetRoute) {
                        router.push(targetRoute);
                      }
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 ${
                      active
                        ? "border-white/24 bg-[#111111] text-white"
                        : "border-transparent bg-transparent text-white/82 hover:border-white/12 hover:bg-[#0c0c0c] hover:text-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <p title={project.name} className="truncate text-sm font-semibold tracking-tight">
                        {project.name}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          servicePillStyles[project.service] ?? "border-white/20 bg-white/10 text-white/80"
                        }`}
                      >
                        {project.service}
                      </span>
                    </div>

                    {active && <Check className="ml-3 h-4 w-4 text-white/90" weight="bold" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}