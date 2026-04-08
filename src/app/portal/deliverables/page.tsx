"use client";

import { ArrowUpRight } from "@phosphor-icons/react";
import { usePortalLanguage, type PortalLanguage } from "@/components/portal/portal-language";
import { usePortal } from "@/components/portal/portal-provider";

const categoryStyles: Record<string, string> = {
  design: "from-fuchsia-400/20 via-purple-400/10 to-transparent",
  website: "from-blue-400/20 via-cyan-400/10 to-transparent",
  branding: "from-amber-300/20 via-orange-300/10 to-transparent",
  software: "from-emerald-300/20 via-teal-300/10 to-transparent",
  default: "from-white/15 via-white/5 to-transparent",
};

function getCategoryGradient(category: string) {
  return categoryStyles[category.toLowerCase()] ?? categoryStyles.default;
}

function getAssetType(url: string) {
  const lower = url.toLowerCase();
  if (/\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/.test(lower)) return "image";
  if (/\.(mp4|webm|mov)(\?|$)/.test(lower)) return "video";
  if (/\.(pdf)(\?|$)/.test(lower)) return "pdf";
  return "file";
}

const deliverablesCopy: Record<PortalLanguage, Record<string, string>> = {
  en: {
    title: "Deliverables",
    subtitle: "Curated project assets with visual previews for a cleaner handoff experience.",
    totalItems: "Total items",
    empty1: "No deliverables uploaded yet for this project.",
    empty2: "Uploaded files will appear here with thumbnail cards.",
    uploaded: "Uploaded",
    openAsset: "Open asset",
  },
  ru: {
    title: "Материалы",
    subtitle: "Собранные материалы проекта с визуальными превью для удобной передачи.",
    totalItems: "Всего файлов",
    empty1: "Для этого проекта пока нет загруженных материалов.",
    empty2: "Загруженные файлы появятся здесь в виде карточек с превью.",
    uploaded: "Загружено",
    openAsset: "Открыть файл",
  },
  az: {
    title: "Təhvil verilənlər",
    subtitle: "Təhvil prosesi üçün vizual önbaxışlarla toplanmış layihə materialları.",
    totalItems: "Ümumi fayl sayı",
    empty1: "Bu layihə üçün hələ material yüklənməyib.",
    empty2: "Yüklənən fayllar burada önbaxış kartları ilə görünəcək.",
    uploaded: "Yüklənib",
    openAsset: "Faylı aç",
  },
};

export default function DeliverablesPage() {
  const { selectedProject } = usePortal();
  const { language } = usePortalLanguage();
  const copy = deliverablesCopy[language];

  if (!selectedProject) return null;

  return (
    <div className="w-full max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.title}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{selectedProject.name}</h1>
          <p className="mt-3 max-w-2xl text-white/60">
            {copy.subtitle}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{copy.totalItems}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{selectedProject.deliverables.length}</p>
        </div>
      </div>

      <div className="mt-8">
        {selectedProject.deliverables.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
            <p className="text-base text-white/45">{copy.empty1}</p>
            <p className="mt-2 text-sm text-white/35">{copy.empty2}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedProject.deliverables.map((item) => (
              (() => {
                const assetType = getAssetType(item.url);
                return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-stretch gap-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className={`relative hidden w-52 shrink-0 border-r border-white/10 bg-gradient-to-br sm:block ${getCategoryGradient(item.category)}`}>
                  {assetType === "image" && (
                    <img src={item.url} alt={item.title} className="absolute inset-0 h-full w-full object-cover opacity-75" loading="lazy" />
                  )}
                  {assetType !== "image" && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/80">
                      <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[11px] uppercase tracking-[0.14em]">{assetType}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.22),transparent_48%)]" />
                  <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">
                    {item.category}
                  </div>
                </div>

                <div className="min-w-0 flex-1 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-semibold tracking-tight text-white">{item.title}</p>
                      <div className="mt-2 sm:hidden">
                        <span className="inline-flex rounded-full border border-white/18 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-white/55 transition group-hover:text-white/85" weight="bold" />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.12em] text-white/38">
                    <span>{copy.uploaded} {item.createdAt}</span>
                    <span className="text-white/55">{copy.openAsset}</span>
                  </div>
                </div>
              </a>
                );
              })()
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
