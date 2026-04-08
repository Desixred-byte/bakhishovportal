"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarBlank,
  CaretDown,
  DownloadSimple,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePortalLanguage, type PortalLanguage } from "@/components/portal/portal-language";
import { usePortal } from "@/components/portal/portal-provider";
import { formatAzn } from "@/lib/currency";

const statusStyles: Record<string, string> = {
  paid: "text-green-400 bg-green-400/10 border-green-400/20",
  unpaid: "text-red-400 bg-red-400/10 border-red-400/20",
  partial: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};

const invoicesCopy: Record<PortalLanguage, Record<string, string>> = {
  en: {
    billing: "Billing",
    title: "Invoices",
    subtitle: "Quick filters on top, clean invoice list below.",
    visibleInvoices: "Visible invoices",
    openBalance: "Open balance",
    paidTotal: "Paid total",
    overdueInvoices: "Overdue invoices",
    searchPlaceholder: "Search invoice, project or service",
    service: "Service",
    project: "Project",
    status: "Status",
    date: "Date",
    issueDateRange: "Issue date range",
    from: "From",
    to: "To",
    clearDates: "Clear dates",
    done: "Done",
    filters: "Filters",
    show: "Show",
    hide: "Hide",
    exportPdf: "Export PDF",
    reset: "Reset",
    invoiceResults: "Invoice results",
    matchingInvoices: "matching invoices",
    noMatch: "No invoices match those filters.",
    amount: "Amount",
    issued: "Issued",
    due: "Due",
    modalTitle: "Modern Invoice Details",
    downloadPdf: "Download PDF",
    invoiceSummary: "Invoice Summary",
    paidAmount: "Paid amount",
    invoiceTotal: "Invoice total",
    balanceDue: "Balance due",
    timeline: "Timeline",
    deliveryDate: "Delivery date",
    allProjects: "All projects",
    allStatuses: "All statuses",
    paid: "Paid",
    partial: "Partially paid",
    unpaid: "Unpaid",
    minimize: "Minimize",
    preparing: "Preparing...",
    back: "Back",
    client: "Client",
    description: "Description",
    qty: "Qty",
    rate: "Rate",
    paymentProgress: "Payment progress",
    any: "Any",
    anyDate: "Any date",
  },
  ru: {
    billing: "Платежи",
    title: "Счета",
    subtitle: "Сверху — быстрые фильтры, ниже — аккуратный список счетов.",
    visibleInvoices: "Видимые счета",
    openBalance: "Открытый баланс",
    paidTotal: "Оплачено всего",
    overdueInvoices: "Просроченные счета",
    searchPlaceholder: "Поиск по счету, проекту или услуге",
    service: "Услуга",
    project: "Проект",
    status: "Статус",
    date: "Дата",
    issueDateRange: "Период выставления",
    from: "С",
    to: "По",
    clearDates: "Очистить даты",
    done: "Готово",
    filters: "Фильтры",
    show: "Показать",
    hide: "Скрыть",
    exportPdf: "Экспорт PDF",
    reset: "Сброс",
    invoiceResults: "Результаты по счетам",
    matchingInvoices: "совпадающих счетов",
    noMatch: "По этим фильтрам счета не найдены.",
    amount: "Сумма",
    issued: "Выставлен",
    due: "Срок",
    modalTitle: "Детали счета",
    downloadPdf: "Скачать PDF",
    invoiceSummary: "Сводка счета",
    paidAmount: "Оплачено",
    invoiceTotal: "Итого по счету",
    balanceDue: "К оплате",
    timeline: "Хронология",
    deliveryDate: "Дата сдачи",
    allProjects: "Все проекты",
    allStatuses: "Все статусы",
    paid: "Оплачен",
    partial: "Частично оплачен",
    unpaid: "Не оплачен",
    minimize: "Свернуть",
    preparing: "Подготовка...",
    back: "Назад",
    client: "Клиент",
    description: "Описание",
    qty: "Кол-во",
    rate: "Тариф",
    paymentProgress: "Прогресс оплаты",
    any: "Любая",
    anyDate: "Любая дата",
  },
  az: {
    billing: "Ödənişlər",
    title: "Fakturalar",
    subtitle: "Yuxarıda sürətli filtrlər, aşağıda səliqəli faktura siyahısı.",
    visibleInvoices: "Görünən fakturalar",
    openBalance: "Açıq balans",
    paidTotal: "Ümumi ödənilib",
    overdueInvoices: "Gecikmiş fakturalar",
    searchPlaceholder: "Faktura, layihə və ya xidmət üzrə axtarış",
    service: "Xidmət",
    project: "Layihə",
    status: "Status",
    date: "Tarix",
    issueDateRange: "Tərtib tarix aralığı",
    from: "Başlanğıc",
    to: "Son",
    clearDates: "Tarixləri sil",
    done: "Hazırdır",
    filters: "Filtrlər",
    show: "Göstər",
    hide: "Gizlət",
    exportPdf: "PDF ixrac et",
    reset: "Sıfırla",
    invoiceResults: "Faktura nəticələri",
    matchingInvoices: "uyğun faktura",
    noMatch: "Bu filtrlərə uyğun faktura tapılmadı.",
    amount: "Məbləğ",
    issued: "Tərtib edilib",
    due: "Son tarix",
    modalTitle: "Faktura detalları",
    downloadPdf: "PDF yüklə",
    invoiceSummary: "Faktura xülasəsi",
    paidAmount: "Ödənilən məbləğ",
    invoiceTotal: "Faktura cəmi",
    balanceDue: "Qalan borc",
    timeline: "Zaman xətti",
    deliveryDate: "Təhvil tarixi",
    allProjects: "Bütün layihələr",
    allStatuses: "Bütün statuslar",
    paid: "Ödənilib",
    partial: "Qismən ödənilib",
    unpaid: "Ödənilməyib",
    minimize: "Kiçilt",
    preparing: "Hazırlanır...",
    back: "Geri",
    client: "Müştəri",
    description: "Təsvir",
    qty: "Say",
    rate: "Qiymət",
    paymentProgress: "Ödəniş irəliləyişi",
    any: "İstənilən",
    anyDate: "İstənilən tarix",
  },
};

type InvoiceRecord = {
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    paidAmount?: number;
    issueDate: string;
    dueDate: string;
    metadata?: {
      customerName?: string;
      customerEmail?: string;
      customerAddress?: string;
      discountType?: "percent" | "fixed";
      discountValue?: number;
      projectLabel?: string;
      companyName?: string;
      serviceCategory?: string;
      items?: Array<{ id: string; description: string; quantity: number; rate: number }>;
    } | null;
  };
  project: {
    id: string;
    name: string;
    service: string;
    progress: number;
    deliveryDate: string;
  };
};

const serviceLabelsByLanguage: Record<PortalLanguage, Record<string, string>> = {
  en: {
    all: "All services",
    website: "Website",
    smm: "Social media",
    software: "Software",
    app: "App",
    branding: "Branding",
  },
  ru: {
    all: "Все услуги",
    website: "Сайт",
    smm: "Соцсети",
    software: "ПО",
    app: "Приложение",
    branding: "Брендинг",
  },
  az: {
    all: "Bütün xidmətlər",
    website: "Vebsayt",
    smm: "Sosial media",
    software: "Proqram təminatı",
    app: "Tətbiq",
    branding: "Brendinq",
  },
};

type InvoiceLineItem = {
  description: string;
  quantity: number;
  rate: number;
  total: number;
};

type InvoiceMeta = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  discountType?: "percent" | "fixed";
  discountValue?: number;
  projectLabel?: string;
  companyName?: string;
  serviceCategory?: string;
  items?: Array<{ id: string; description: string; quantity: number; rate: number }>;
};

type FilterOption = {
  value: string;
  label: string;
};

function buildLineItems(projectName: string, service: string, amount: number): InvoiceLineItem[] {
  const baseItemsByService: Record<string, Array<{ description: string; percent: number; quantity: number }>> = {
    website: [
      { description: `${projectName} — Strategy & UX structure`, percent: 0.32, quantity: 1 },
      { description: `${projectName} — UI design & development`, percent: 0.48, quantity: 1 },
      { description: `${projectName} — QA, revisions & launch prep`, percent: 0.2, quantity: 1 },
    ],
    smm: [
      { description: `${projectName} — Campaign planning`, percent: 0.3, quantity: 1 },
      { description: `${projectName} — Posting, reporting & optimization`, percent: 0.25, quantity: 1 },
      { description: `${projectName} — Community management`, percent: 0.23, quantity: 1 },
      { description: `${projectName} — Creative production & coordination`, percent: 0.22, quantity: 1 },
    ],
    app: [
      { description: `${projectName} — Design & implementation`, percent: 0.5, quantity: 1 },
      { description: `${projectName} — Testing, polish & release support`, percent: 0.22, quantity: 1 },
      { description: `${projectName} — Technical planning`, percent: 0.3, quantity: 1 },
      { description: `${projectName} — QA, deployment & handoff`, percent: 0.2, quantity: 1 },
    ],
    branding: [
      { description: `${projectName} — Brand direction`, percent: 0.32, quantity: 1 },
      { description: `${projectName} — Visual identity development`, percent: 0.46, quantity: 1 },
      { description: `${projectName} — Final refinements & guideline pack`, percent: 0.22, quantity: 1 },
    ],
  };

  const sourceItems = baseItemsByService[service] ?? baseItemsByService.website;
  const roundedRates = sourceItems.map((item) => ({
    ...item,
    total: Math.round(amount * item.percent),
  }));

  const adjustedFirstTotals = roundedRates.slice(0, -1).reduce((sum, item) => sum + item.total, 0);
  const finalTotal = amount - adjustedFirstTotals;

  return roundedRates.map((item, index) => ({
    description: item.description,
    quantity: item.quantity,
    rate: index === roundedRates.length - 1 ? finalTotal : item.total,
    total: index === roundedRates.length - 1 ? finalTotal : item.total,
  }));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const pdfSafeServiceLabels: Record<string, string> = {
  website: "Vəbsayt",
  smm: "Sosial media",
  software: "Proqram təminatı",
  app: "Tətbiq",
  branding: "Brendinq",
};

const pdfSafeStatusLabels: Record<string, string> = {
  paid: "Ödənilib",
  partial: "Qismən ödənilib",
  unpaid: "Ödənilməyib",
};

const pdfImageCache = new Map<string, Promise<string | null>>();
let pdfFontFilesPromise: Promise<{ regular: string; semibold: string } | null> | null = null;

function formatAznPdf(amount: number) {
  return `${new Intl.NumberFormat("en-US").format(amount)} AZN`;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function loadPublicBinary(path: string): Promise<ArrayBuffer | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  return fetch(path)
    .then((response) => {
      if (!response.ok) return null;
      return response.arrayBuffer();
    })
    .catch(() => null);
}

async function ensureMontserratFont(doc: jsPDF) {
  if (!pdfFontFilesPromise) {
    pdfFontFilesPromise = Promise.all([
      loadPublicBinary("/fonts/Montserrat-Regular.ttf"),
      loadPublicBinary("/fonts/Montserrat-SemiBold.ttf"),
    ])
      .then(([regular, semibold]) => {
        if (!regular || !semibold) return null;
        return {
          regular: arrayBufferToBase64(regular),
          semibold: arrayBufferToBase64(semibold),
        };
      })
      .catch(() => null);
  }

  const fontFiles = await pdfFontFilesPromise;
  if (!fontFiles) return false;

  const pdfDoc = doc as jsPDF & {
    addFileToVFS: (filename: string, filecontent: string) => void;
    addFont: (postScriptName: string, id: string, fontStyle: string) => void;
    getFontList: () => Record<string, unknown>;
  };

  const fontList = pdfDoc.getFontList?.();
  const hasMontserrat = Boolean(fontList && (fontList as Record<string, unknown>).Montserrat);

  if (!hasMontserrat) {
    pdfDoc.addFileToVFS("Montserrat-Regular.ttf", fontFiles.regular);
    pdfDoc.addFileToVFS("Montserrat-SemiBold.ttf", fontFiles.semibold);
    pdfDoc.addFont("Montserrat-Regular.ttf", "Montserrat", "normal");
    pdfDoc.addFont("Montserrat-SemiBold.ttf", "Montserrat", "bold");
  }

  return true;
}

function toPdfSafeText(value: string) {
  return value
    .replaceAll("ə", "e")
    .replaceAll("Ə", "E")
    .replaceAll("ı", "i")
    .replaceAll("İ", "I")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "");
}

function loadPublicImageAsDataUrl(path: string): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  return fetch(path)
    .then((response) => {
      if (!response.ok) return null;
      return response.blob();
    })
    .then((blob) => {
      if (!blob) return null;

      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(typeof reader.result === "string" ? reader.result : null);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    })
    .catch(() => null);
}

function getPublicImageDataUrl(path: string) {
  const existing = pdfImageCache.get(path);
  if (existing) return existing;

  const promise = loadPublicImageAsDataUrl(path);
  pdfImageCache.set(path, promise);
  return promise;
}

function getSignatureDataUrl() {
  return getPublicImageDataUrl("/sign.png");
}

function getInvoiceLogoDataUrl() {
  return getPublicImageDataUrl("/inv.png");
}

function getPdfDisplayStatus(status: string) {
  return pdfSafeStatusLabels[status] ?? toPdfSafeText(status);
}

function getPdfDisplayService(service: string) {
  if (pdfSafeServiceLabels[service]) {
    return pdfSafeServiceLabels[service];
  }

  return toPdfSafeText(service);
}

function PremiumFilterSelect({
  label,
  selectedValue,
  valueLabel,
  isOpen,
  onToggle,
  options,
  onSelect,
}: {
  label: string;
  selectedValue: string;
  valueLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  options: FilterOption[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="relative w-full min-w-0 sm:min-w-[170px]">
      <button
        type="button"
        onClick={onToggle}
        className="group flex h-12 w-full items-center justify-between rounded-[18px] border border-white/10 bg-[#0d0d0e] px-4 text-left shadow-[0_10px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-200 hover:border-white/18 hover:bg-[#121214] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-100/10"
      >
        <span className="min-w-0 text-left">
          <span className="block text-[9px] uppercase tracking-[0.18em] text-white/32">{label}</span>
          <span title={valueLabel} className="block truncate text-sm font-medium tracking-tight text-white">{valueLabel}</span>
        </span>
        <span className="ml-3 flex h-7 w-7 flex-none items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/60 transition-all duration-200 group-hover:border-white/15 group-hover:bg-white/[0.03] group-hover:text-white">
          <CaretDown
            className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            weight="bold"
          />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26, mass: 0.9 }}
            className="mt-2 max-h-64 w-full origin-top overflow-auto rounded-[20px] border border-white/10 bg-[#0a0a0b] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.62)] sm:absolute sm:left-0 sm:right-0 sm:top-[calc(100%+8px)] sm:mt-0 sm:z-[80]"
          >
            {options.map((option) => {
              const active = option.value === selectedValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className={`w-full rounded-[14px] px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                    active
                      ? "border border-white/10 bg-[#1a1a1c] text-white shadow-[0_1px_0_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.02)]"
                      : "border border-transparent text-white/72 hover:border-white/5 hover:bg-[#141416] hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function InvoicesPage() {
  const { client } = usePortal();
  const { language } = usePortalLanguage();
  const copy = invoicesCopy[language];
  const serviceLabels = serviceLabelsByLanguage[language];
  const [serviceFilter, setServiceFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [issueFrom, setIssueFrom] = useState("");
  const [issueTo, setIssueTo] = useState("");
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [isInvoiceListMinimized, setIsInvoiceListMinimized] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [openFilter, setOpenFilter] = useState<"service" | "project" | "status" | "date" | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const isGeneratingInvoicePdfRef = useRef(false);

  const invoiceRecords = useMemo<InvoiceRecord[]>(() => {
    if (!client) return [];

    return client.projects.flatMap((project) =>
      project.invoices.map((invoice) => ({
        invoice,
        project: {
          id: project.id,
          name: project.name,
          service: project.service,
          progress: project.progress,
          deliveryDate: project.deliveryDate,
        },
      }))
    );
  }, [client]);

  const getInvoiceProjectLabel = (record: InvoiceRecord) => {
    const metadataService = record.invoice.metadata?.serviceCategory?.trim().toLowerCase();
    const effectiveService = metadataService && metadataService in serviceLabelsByLanguage.en
      ? metadataService
      : record.project.service;

    if (effectiveService === "smm") {
      return record.project.name.replace(/\s*\(smm\)\s*$/i, "");
    }

    const projectLabel = record.invoice.metadata?.projectLabel?.trim();
    if (projectLabel) return projectLabel;

    const companyName = record.invoice.metadata?.companyName?.trim();
    if (companyName) return companyName;

    return record.project.name;
  };

  const getInvoiceService = (record: InvoiceRecord) => {
    const metadataService = record.invoice.metadata?.serviceCategory?.trim().toLowerCase();
    if (metadataService && metadataService in serviceLabelsByLanguage.en) {
      return metadataService;
    }

    return record.project.service;
  };

  const filteredInvoices = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const fromDate = issueFrom ? new Date(`${issueFrom}T00:00:00`) : null;
    const toDate = issueTo ? new Date(`${issueTo}T23:59:59`) : null;

    return invoiceRecords.filter((record) => {
      const effectiveService = getInvoiceService(record);
      const matchesService = serviceFilter === "all" || effectiveService === serviceFilter;
      const matchesProject = projectFilter === "all" || record.project.id === projectFilter;
      const matchesStatus = statusFilter === "all" || record.invoice.status === statusFilter;
      const matchesSearch =
        !search ||
        record.invoice.invoiceNumber.toLowerCase().includes(search) ||
        getInvoiceProjectLabel(record).toLowerCase().includes(search) ||
        effectiveService.toLowerCase().includes(search);

      const issueDate = new Date(`${record.invoice.issueDate}T00:00:00`);
      const matchesFrom = !fromDate || issueDate >= fromDate;
      const matchesTo = !toDate || issueDate <= toDate;

      return matchesService && matchesProject && matchesStatus && matchesSearch && matchesFrom && matchesTo;
    });
  }, [invoiceRecords, issueFrom, issueTo, projectFilter, searchQuery, serviceFilter, statusFilter]);

  const openBalance = useMemo(
    () =>
      filteredInvoices.reduce((sum, record) => {
        const paidAmount = Math.max(
          0,
          Math.min(
            record.invoice.amount,
            record.invoice.paidAmount ?? (record.invoice.status === "paid" ? record.invoice.amount : 0)
          )
        );
        return sum + Math.max(record.invoice.amount - paidAmount, 0);
      }, 0),
    [filteredInvoices]
  );

  const paidTotal = useMemo(
    () =>
      filteredInvoices.reduce((sum, record) => {
        const paidAmount = Math.max(
          0,
          Math.min(
            record.invoice.amount,
            record.invoice.paidAmount ?? (record.invoice.status === "paid" ? record.invoice.amount : 0)
          )
        );
        return sum + paidAmount;
      }, 0),
    [filteredInvoices]
  );

  const overdueCount = useMemo(
    () => filteredInvoices.filter((record) => new Date(record.invoice.dueDate).getTime() < Date.now() && record.invoice.status !== "paid").length,
    [filteredInvoices]
  );

  const activeInvoiceRecord = useMemo(() => {
    return invoiceRecords.find((record) => record.invoice.id === activeInvoiceId) ?? null;
  }, [activeInvoiceId, invoiceRecords]);

  const activeInvoiceItems: InvoiceLineItem[] = activeInvoiceRecord
    ? (activeInvoiceRecord.invoice.metadata?.items?.length
        ? activeInvoiceRecord.invoice.metadata.items.map((item) => {
            const quantity = Number(item.quantity) || 0;
            const rate = Number(item.rate) || 0;
            return {
              description: item.description,
              quantity,
              rate,
              total: quantity * rate,
            };
          })
        : buildLineItems(getInvoiceProjectLabel(activeInvoiceRecord), getInvoiceService(activeInvoiceRecord), activeInvoiceRecord.invoice.amount))
    : [];

  const activeInvoiceItemSubtotal = activeInvoiceItems.reduce((sum, item) => sum + item.total, 0);
  const activeInvoiceDiscount = 0;
  const activeInvoiceCustomerName = activeInvoiceRecord ? getInvoiceProjectLabel(activeInvoiceRecord) : "—";
  const activeInvoiceCustomerAddress = "Bakhishov Brands";

  const activeInvoicePaidAmount = activeInvoiceRecord
    ? Math.max(
        0,
        Math.min(
          activeInvoiceRecord.invoice.amount,
          activeInvoiceRecord.invoice.paidAmount ?? (activeInvoiceRecord.invoice.status === "paid" ? activeInvoiceRecord.invoice.amount : 0)
        )
      )
    : 0;

  const activeInvoiceBalanceDue = activeInvoiceRecord
    ? Math.max(activeInvoiceRecord.invoice.amount - activeInvoicePaidAmount, 0)
    : 0;

  const activeInvoicePaidPercent = activeInvoiceRecord
    ? Math.round((activeInvoicePaidAmount / Math.max(activeInvoiceRecord.invoice.amount, 1)) * 100)
    : 0;

  const projectLabel =
    projectFilter === "all"
      ? copy.allProjects
      : client?.projects.find((project) => project.id === projectFilter)?.name ?? copy.allProjects;

  const statusLabelMap: Record<string, string> = {
    all: copy.allStatuses,
    paid: copy.paid,
    partial: copy.partial,
    unpaid: copy.unpaid,
  };

  const getStatusLabel = (status: string) => statusLabelMap[status] ?? status;
  const getServiceLabel = (service: string) => serviceLabels[service] ?? service;

  const dateLabel = issueFrom || issueTo
    ? `${issueFrom ? formatDate(issueFrom) : copy.any} — ${issueTo ? formatDate(issueTo) : copy.any}`
    : copy.anyDate;

  const hasActiveFilters =
    serviceFilter !== "all" ||
    projectFilter !== "all" ||
    statusFilter !== "all" ||
    searchQuery.trim().length > 0 ||
    issueFrom.length > 0 ||
    issueTo.length > 0;

  const serviceOptions: FilterOption[] = Object.entries(serviceLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const projectOptions: FilterOption[] = [
    { value: "all", label: copy.allProjects },
    ...(client?.projects ?? []).map((project) => ({ value: project.id, label: project.name })),
  ];

  const statusOptions: FilterOption[] = [
    { value: "all", label: copy.allStatuses },
    { value: "paid", label: copy.paid },
    { value: "partial", label: copy.partial },
    { value: "unpaid", label: copy.unpaid },
  ];

  const showInvoiceListPanel = !isCompactViewport || !activeInvoiceRecord;
  const canToggleListPanel = Boolean(activeInvoiceRecord) && !isCompactViewport;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 1023px)");
    const updateViewport = () => {
      setIsCompactViewport(media.matches);
      setIsMobileFiltersOpen(!media.matches);
    };

    updateViewport();
    media.addEventListener("change", updateViewport);

    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!isCompactViewport) {
      setIsInvoiceListMinimized(false);
      return;
    }

    setIsInvoiceListMinimized(false);
  }, [activeInvoiceId, isCompactViewport]);

  useEffect(() => {
    if (!isCompactViewport || !activeInvoiceId || typeof window === "undefined") return;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [activeInvoiceId, isCompactViewport]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveInvoiceId(null);
        setOpenFilter(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!client) return null;

  async function createInvoicePdfDoc(project: InvoiceRecord["project"], invoice: InvoiceRecord["invoice"], meta?: InvoiceMeta) {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const effectiveService = (meta?.serviceCategory || project.service || "").toLowerCase();
    const effectiveProjectLabel = effectiveService === "smm"
      ? project.name.replace(/\s*\(smm\)\s*$/i, "")
      : (meta?.projectLabel || meta?.companyName || project.name);
    const items = meta?.items?.length
      ? meta.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          total: (Number(item.quantity) || 0) * (Number(item.rate) || 0),
        }))
      : buildLineItems(effectiveProjectLabel, effectiveService || project.service, invoice.amount);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountValue = Number(meta?.discountValue) || 0;
    const discount = discountValue > 0 ? (meta?.discountType === "fixed" ? discountValue : (subtotal * discountValue) / 100) : 0;
    const totalAfterDiscount = Math.max(0, subtotal - discount);
    const paidAmount = Math.max(
      0,
      Math.min(totalAfterDiscount, invoice.paidAmount ?? (invoice.status === "paid" ? totalAfterDiscount : 0))
    );
    const balanceDue = Math.max(totalAfterDiscount - paidAmount, 0);
    const billToName = toPdfSafeText(meta?.customerName || meta?.companyName || effectiveProjectLabel);
    const billToCompany = toPdfSafeText(meta?.companyName || "");
    const billToPhone = toPdfSafeText(meta?.customerPhone || "");
    const billToAddress = toPdfSafeText(meta?.customerAddress || meta?.companyName || "Bakhishov Brands");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;
    const navy: [number, number, number] = [18, 18, 18];
    const bodyText: [number, number, number] = [42, 42, 42];
    const mutedText: [number, number, number] = [120, 120, 120];
    const lineSoft: [number, number, number] = [225, 225, 225];
    const lineStrong: [number, number, number] = [10, 10, 10];
    const headerFill: [number, number, number] = [0, 0, 0];
    const invoiceLogo = await getInvoiceLogoDataUrl();
    const signatureImage = await getSignatureDataUrl();
    const hasMontserrat = await ensureMontserratFont(doc);
    const pdfFont = hasMontserrat ? "Montserrat" : "helvetica";

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setDrawColor(...lineSoft);
    doc.setLineWidth(1);
    doc.roundedRect(margin, margin, contentWidth, pageHeight - margin * 2, 14, 14, "S");

    doc.setFillColor(...headerFill);
    doc.roundedRect(margin + 14, margin + 14, contentWidth - 28, 160, 12, 12, "F");

    if (invoiceLogo) {
      try {
        doc.addImage(invoiceLogo, "PNG", margin + 26, margin + 34, 48, 48);
      } catch {
        // Ignore logo rendering failures and continue PDF generation.
      }
    }

    doc.setFont(pdfFont, "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.text("FAKTURA", margin + 86, margin + 65);

    doc.setFont(pdfFont, "normal");
    doc.setFontSize(10);
    doc.setTextColor(212, 212, 212);
    doc.setFont(pdfFont, "bold");
    doc.setFontSize(11);
    doc.text("Bakhishov Brands", margin + 26, margin + 100);
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text("Nasimi, Baku, Azerbaijan", margin + 26, margin + 112);
    doc.text("+994 (55) 575 77 77", margin + 26, margin + 124);
    doc.text("www.bakhishov.com", margin + 26, margin + 136);
    doc.text("sales@bakhishov.com", margin + 26, margin + 148);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - margin - 152, margin + 28, 122, 28, 13, 13, "F");
    doc.setTextColor(...lineStrong);
    doc.setFont(pdfFont, "bold");
    doc.setFontSize(7.5);
    const statusText = getPdfDisplayStatus(invoice.status).toUpperCase();
    doc.text(statusText, pageWidth - margin - 91, margin + 45, { align: "center" });

    doc.setFont(pdfFont, "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(`Nömrə: ${invoice.invoiceNumber}`, pageWidth - margin - 160, margin + 100);
    doc.text(`Tarix: ${formatDate(invoice.issueDate)}`, pageWidth - margin - 160, margin + 117);
    doc.text(`Son tarix: ${formatDate(invoice.dueDate)}`, pageWidth - margin - 160, margin + 134);

    const infoY = margin + 190;
    const cardHeight = 96;
    const leftCardX = margin + 14;
    const rightCardX = margin + contentWidth / 2 + 2;
    const cardWidth = contentWidth / 2 - 18;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...lineSoft);
    doc.roundedRect(leftCardX, infoY, cardWidth, cardHeight, 10, 10, "FD");
    doc.roundedRect(rightCardX, infoY, cardWidth, cardHeight, 10, 10, "FD");

    // Left card: Customer info header and details
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(...navy);
    doc.setFontSize(11);
    doc.text("Müştəri Məlumatları", leftCardX + 14, infoY + 18);
    
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(...bodyText);
    doc.setFontSize(10);
    doc.text(billToName, leftCardX + 14, infoY + 32);
    
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(130, 130, 130);
    doc.setFontSize(8.5);
    if (billToCompany && billToCompany !== billToName) {
      doc.text(billToCompany, leftCardX + 14, infoY + 43);
    }
    if (billToPhone) {
      doc.text(billToPhone, leftCardX + 14, infoY + 53);
    } else if (billToCompany && billToCompany !== billToName) {
      doc.text(billToAddress, leftCardX + 14, infoY + 53);
    }

    // Right card: Project info header and details
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(...navy);
    doc.setFontSize(11);
    doc.text("Layihə Detalları", rightCardX + 14, infoY + 18);
    
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(...bodyText);
    doc.setFontSize(10.5);
    doc.text(toPdfSafeText(effectiveProjectLabel), rightCardX + 14, infoY + 35);
    
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(130, 130, 130);
    doc.setFontSize(8.5);
    doc.text(getPdfDisplayService(effectiveService || project.service), rightCardX + 14, infoY + 48);
    
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(formatDate(project.deliveryDate), rightCardX + 14, infoY + 60);

    autoTable(doc, {
      startY: infoY + cardHeight + 20,
      head: [["Təsvir", "Say", "Qiymət", "Məbləğ"]],
      body: items.map((item) => [
        toPdfSafeText(item.description),
        item.quantity.toString(),
        formatAznPdf(item.rate),
        formatAznPdf(item.total),
      ]),
      theme: "plain",
      styles: {
        fillColor: [255, 255, 255],
        textColor: [...bodyText],
        lineColor: [...lineSoft],
        lineWidth: 0.4,
        font: pdfFont,
        fontSize: 10,
        cellPadding: { top: 9, right: 8, bottom: 9, left: 8 },
      },
      headStyles: {
        fillColor: [...headerFill],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        lineColor: [...headerFill],
        lineWidth: 0,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 420;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...lineSoft);
    doc.roundedRect(pageWidth - margin - 230, finalY + 18, 210, 122, 12, 12, "FD");
    doc.setFillColor(0, 0, 0);
    doc.roundedRect(pageWidth - margin - 230, finalY + 18, 4, 122, 2, 2, "F");
    doc.setTextColor(...navy);
    doc.setFont(pdfFont, "bold");
    doc.setFontSize(12);
    doc.text("Ödəniş xülasəsi", pageWidth - margin - 206, finalY + 42);
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(...bodyText);
    doc.text(`Ara cəmi: ${formatAznPdf(subtotal)}`, pageWidth - margin - 206, finalY + 62);
    doc.text(`Güzəşt: ${formatAznPdf(discount)}`, pageWidth - margin - 206, finalY + 80);
    doc.text(`Ödənilib: ${formatAznPdf(paidAmount)}`, pageWidth - margin - 206, finalY + 98);
    doc.setFont(pdfFont, "bold");
    doc.setFontSize(13.5);
    doc.setTextColor(...navy);
    doc.text(`Qalıq borc: ${formatAznPdf(balanceDue)}`, pageWidth - margin - 206, finalY + 124);

    doc.setDrawColor(...lineSoft);
    doc.line(margin + 20, pageHeight - 162, pageWidth - margin - 20, pageHeight - 162);

    if (signatureImage) {
      try {
        doc.addImage(signatureImage, "PNG", margin + 24, pageHeight - 136, 106, 34);
      } catch {
        // Ignore signature rendering failures to keep PDF download reliable.
      }
    }

    doc.setFont(pdfFont, "bold");
    doc.setTextColor(...bodyText);
    doc.setFontSize(10);
    doc.text("Elbay Bakhishov", margin + 24, pageHeight - 90);
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...mutedText);
    doc.text("Authorized Signature", margin + 24, pageHeight - 73);

    doc.setTextColor(...mutedText);
    doc.setFontSize(9);
    doc.setFont(pdfFont, "normal");
    doc.text("Şərtlər: Ödəniş qeyd olunan son tarixdə edilməlidir.", margin + 24, pageHeight - 34);
    doc.text("Bakhishov Brands seçdiyiniz üçün təşəkkür edirik.", pageWidth - margin - 250, pageHeight - 34);

    return doc;
  }

  async function handleDownloadPdf() {
    if (isGeneratingInvoicePdfRef.current) return;

    const project = activeInvoiceRecord?.project;
    const invoice = activeInvoiceRecord?.invoice;

    if (!project || !invoice) return;
    isGeneratingInvoicePdfRef.current = true;
    setIsDownloadingPdf(true);
    try {
      const doc = await createInvoicePdfDoc(project, invoice, invoice.metadata ?? undefined);
      doc.save(`${invoice.invoiceNumber}-${project.name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } finally {
      isGeneratingInvoicePdfRef.current = false;
      setIsDownloadingPdf(false);
    }
  }

  async function downloadFilteredReportPdf(records: InvoiceRecord[]) {
    if (records.length === 0) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const hasMontserrat = await ensureMontserratFont(doc);
    const pdfFont = hasMontserrat ? "Montserrat" : "helvetica";

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 841.89, "F");
    doc.setDrawColor(225, 225, 225);
    doc.roundedRect(30, 30, pageWidth - 60, 780, 14, 14, "S");

    doc.setFillColor(0, 0, 0);
    doc.roundedRect(44, 44, pageWidth - 88, 86, 12, 12, "F");
    doc.setFont(pdfFont, "bold");
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text("Faktura Hesabatı", 60, 84);
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(10);
    doc.setTextColor(212, 212, 212);
    doc.text("Bakhishov Brands", 60, 102);
    doc.text(`Filtr nəticələri: ${records.length} faktura`, 60, 118);
    doc.text(`Yaradılma: ${new Date().toLocaleString()}`, pageWidth - 220, 84);

    autoTable(doc, {
      startY: 154,
      head: [["Faktura", "Layihə", "Xidmət", "Məbləğ", "Status", "Tarix", "Son tarix"]],
      body: records.map((record) => [
        record.invoice.invoiceNumber,
        toPdfSafeText(getInvoiceProjectLabel(record)),
        getPdfDisplayService(getInvoiceService(record)),
        formatAznPdf(record.invoice.amount),
        getPdfDisplayStatus(record.invoice.status),
        formatDate(record.invoice.issueDate),
        formatDate(record.invoice.dueDate),
      ]),
      theme: "plain",
      styles: {
        fillColor: [255, 255, 255],
        textColor: [42, 42, 42],
        lineColor: [225, 225, 225],
        lineWidth: 0.4,
        font: pdfFont,
        fontSize: 9,
        cellPadding: 7,
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        lineWidth: 0,
      },
      alternateRowStyles: {
        fillColor: [247, 247, 247],
      },
      columnStyles: {
        3: { halign: "right" },
      },
    });

    doc.save(`invoice-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <>
      <div className={`font-sans w-full max-w-7xl overflow-x-hidden ${activeInvoiceRecord ? "xl:flex xl:h-[calc(100dvh-6rem)] xl:flex-col" : ""}`}>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.billing}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-white/60">
              {copy.subtitle}
            </p>
          </div>
        </div>

        {!activeInvoiceRecord && (
        <>
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4 sm:gap-3">
          <div className="relative w-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:rounded-3xl sm:p-6 sm:shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/38 sm:text-[10px] sm:tracking-[0.16em] sm:text-white/42">{copy.visibleInvoices}</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={`count-${filteredInvoices.length}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mt-2 text-[1.55rem] font-semibold leading-none tracking-tight text-white sm:mt-4 sm:text-3xl"
              >
                {filteredInvoices.length}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="relative w-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:rounded-3xl sm:p-6 sm:shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/38 sm:text-[10px] sm:tracking-[0.16em] sm:text-white/42">{copy.openBalance}</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={`open-${openBalance}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mt-2 text-[1.25rem] font-semibold leading-none tracking-tight text-white sm:mt-4 sm:text-3xl"
              >
                {formatAzn(openBalance)}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="relative w-full overflow-hidden rounded-2xl border border-amber-400/18 bg-gradient-to-br from-amber-400/14 to-black/40 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:rounded-3xl sm:p-6 sm:shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-x-0 top-0 h-px bg-amber-300/20" />
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/38 sm:text-[10px] sm:tracking-[0.16em] sm:text-white/42">{copy.paidTotal}</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={`paid-${paidTotal}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mt-2 text-[1.25rem] font-semibold leading-none tracking-tight text-white sm:mt-4 sm:text-3xl"
              >
                {formatAzn(paidTotal)}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="relative w-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.03] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:rounded-3xl sm:p-6 sm:shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/38 sm:text-[10px] sm:tracking-[0.16em] sm:text-white/42">{copy.overdueInvoices}</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={`overdue-${overdueCount}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mt-2 text-[1.55rem] font-semibold leading-none tracking-tight text-white sm:mt-4 sm:text-3xl"
              >
                {overdueCount}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div
          ref={filterBarRef}
          className="mt-6 rounded-3xl border border-white/12 bg-black/65 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)] sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.filters}</p>
              <p className="mt-1 text-sm text-white/55">{filteredInvoices.length} {copy.matchingInvoices}</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen((value) => !value)}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black/40 px-4 text-sm font-semibold text-white/90 sm:hidden"
              >
                {copy.show} {copy.filters}
                <CaretDown className={`h-4 w-4 transition-transform duration-200 ${isMobileFiltersOpen ? "rotate-180" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => downloadFilteredReportPdf(filteredInvoices)}
                disabled={filteredInvoices.length === 0}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black/45 px-4 text-sm font-semibold tracking-tight text-white transition-all duration-200 hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <DownloadSimple className="h-4 w-4" weight="bold" />
                {copy.exportPdf}
              </button>

              <AnimatePresence initial={false}>
                {hasActiveFilters && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.94, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    onClick={() => {
                      setServiceFilter("all");
                      setProjectFilter("all");
                      setStatusFilter("all");
                      setSearchQuery("");
                      setIssueFrom("");
                      setIssueTo("");
                      setOpenFilter(null);
                    }}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black/20 px-4 text-sm font-semibold tracking-tight text-white transition-all duration-200 hover:bg-black/30 sm:w-auto"
                  >
                    <X className="h-4 w-4" />
                    {copy.reset}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            initial={false}
            animate={isMobileFiltersOpen ? { opacity: 1, height: "auto", marginTop: 16 } : { opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-visible sm:!overflow-visible sm:!opacity-100 sm:!h-auto sm:!mt-4"
          >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_minmax(0,1.05fr)]">
            <div className="relative min-w-0">
              <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" weight="bold" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="h-11 w-full rounded-2xl border border-white/15 bg-black/20 pl-11 pr-4 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-white/30 focus:bg-black/30"
              />
            </div>

            <PremiumFilterSelect
              label={copy.service}
              selectedValue={serviceFilter}
              valueLabel={serviceLabels[serviceFilter] ?? serviceLabels.all}
              isOpen={openFilter === "service"}
              onToggle={() => setOpenFilter((value) => (value === "service" ? null : "service"))}
              options={serviceOptions}
              onSelect={(value) => {
                setServiceFilter(value);
                setOpenFilter(null);
              }}
            />

            <PremiumFilterSelect
              label={copy.project}
              selectedValue={projectFilter}
              valueLabel={projectLabel}
              isOpen={openFilter === "project"}
              onToggle={() => setOpenFilter((value) => (value === "project" ? null : "project"))}
              options={projectOptions}
              onSelect={(value) => {
                setProjectFilter(value);
                setOpenFilter(null);
              }}
            />

            <PremiumFilterSelect
              label={copy.status}
              selectedValue={statusFilter}
              valueLabel={statusLabelMap[statusFilter] ?? copy.allStatuses}
              isOpen={openFilter === "status"}
              onToggle={() => setOpenFilter((value) => (value === "status" ? null : "status"))}
              options={statusOptions}
              onSelect={(value) => {
                setStatusFilter(value);
                setOpenFilter(null);
              }}
            />

            <div className="relative min-w-0">
              <button
                type="button"
                onClick={() => setOpenFilter((value) => (value === "date" ? null : "date"))}
                className="group flex h-12 w-full items-center justify-between rounded-[18px] border border-white/10 bg-[#0d0d0e] px-4 text-left shadow-[0_10px_24px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-200 hover:border-white/18 hover:bg-[#121214] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-100/10"
              >
                <span className="min-w-0 text-left">
                  <span className="block text-[9px] uppercase tracking-[0.18em] text-white/32">{copy.date}</span>
                  <span title={dateLabel} className="block truncate text-sm font-medium tracking-tight text-white">{dateLabel}</span>
                </span>
                <span className="ml-3 flex h-7 w-7 flex-none items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/60 transition-all duration-200 group-hover:border-white/15 group-hover:bg-white/[0.03] group-hover:text-white">
                  <CalendarBlank className="h-3.5 w-3.5" weight="bold" />
                </span>
              </button>

              <AnimatePresence>
                {openFilter === "date" && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 340, damping: 28 }}
                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-[90] w-full rounded-[20px] border border-white/10 bg-[#0a0a0b] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.62)] sm:left-auto sm:right-0 sm:mt-0 sm:w-[min(340px,calc(100vw-2rem))] sm:p-5"
                  >
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.issueDateRange}</p>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.12em] text-white/45">{copy.from}</label>
                        <input
                          type="date"
                          value={issueFrom}
                          onChange={(event) => setIssueFrom(event.target.value)}
                          className="mt-1 h-11 w-full rounded-[16px] border border-white/10 bg-[#0d0d0e] px-4 text-sm font-medium text-white outline-none transition-all duration-200 focus:border-amber-100/10 focus:bg-[#121214] [color-scheme:dark] [accent-color:#c9a56a]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-[0.12em] text-white/45">{copy.to}</label>
                        <input
                          type="date"
                          value={issueTo}
                          onChange={(event) => setIssueTo(event.target.value)}
                          className="mt-1 h-11 w-full rounded-[16px] border border-white/10 bg-[#0d0d0e] px-4 text-sm font-medium text-white outline-none transition-all duration-200 focus:border-amber-100/10 focus:bg-[#121214] [color-scheme:dark] [accent-color:#c9a56a]"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIssueFrom("");
                          setIssueTo("");
                        }}
                        className="text-xs font-semibold text-white/60 transition-colors hover:text-white"
                      >
                        {copy.clearDates}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenFilter(null)}
                        className="inline-flex h-9 items-center rounded-2xl border border-white/20 bg-white/10 px-4 text-xs font-semibold text-white transition-all duration-200 hover:bg-white/15"
                      >
                        {copy.done}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </motion.div>
        </div>
        </>
        )}

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 180, damping: 26 }}
          className={`${activeInvoiceRecord ? "xl:mt-4 xl:flex-1 xl:min-h-0" : "mt-6"} grid gap-6 ${
            activeInvoiceRecord
              ? showInvoiceListPanel
                ? isInvoiceListMinimized
                  ? "xl:grid-cols-[72px_minmax(0,1fr)]"
                  : "xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]"
                : "xl:grid-cols-1"
              : "xl:grid-cols-1"
          } ${activeInvoiceRecord ? "xl:h-full xl:min-h-0 xl:overflow-hidden" : ""} items-start overflow-x-hidden`}
        >
          {showInvoiceListPanel && (
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className={`min-w-0 rounded-[32px] border border-white/10 bg-black/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)] transition-[padding] duration-300 ease-out ${activeInvoiceRecord ? "xl:h-full xl:min-h-0 xl:flex xl:flex-col" : ""} ${isInvoiceListMinimized ? "p-3" : "p-4 sm:p-6"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <AnimatePresence initial={false}>
                {!isInvoiceListMinimized && (
                  <motion.div
                    key="invoice-list-header"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.invoiceResults}</p>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.h2
                        key={`matches-${filteredInvoices.length}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mt-1 text-2xl font-semibold tracking-tight text-white"
                      >
                        {filteredInvoices.length} {copy.matchingInvoices}
                      </motion.h2>
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className={`flex items-center gap-2 ${isInvoiceListMinimized ? "w-full justify-center" : ""}`}>
                {canToggleListPanel && (
                  <button
                    type="button"
                    onClick={() => setIsInvoiceListMinimized((value) => !value)}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 text-[11px] uppercase tracking-[0.12em] text-white/65 transition-all duration-200 hover:border-white/20 hover:bg-black/40 hover:text-white"
                  >
                    <CaretDown className={`h-3.5 w-3.5 transition-transform ${isInvoiceListMinimized ? "-rotate-90" : "rotate-0"}`} weight="bold" />
                    {isInvoiceListMinimized ? copy.show : copy.minimize}
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence initial={false} mode="wait">
              {!isInvoiceListMinimized && (
                <motion.div
                  key="invoice-list-content"
                  layout
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className={`space-y-4 ${activeInvoiceRecord ? "min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain xl:pr-1" : "min-h-[220px] overflow-hidden"}`}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredInvoices.length === 0 ? (
                      <motion.div
                        key="empty-state"
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="rounded-3xl border border-white/10 bg-black/30 p-10 text-center"
                      >
                        <p className="text-white/40">{copy.noMatch}</p>
                      </motion.div>
                    ) : (
                      filteredInvoices.map((record) => (
                        (() => {
                          const rowPaid = Math.max(
                            0,
                            Math.min(
                              record.invoice.amount,
                              record.invoice.paidAmount ?? (record.invoice.status === "paid" ? record.invoice.amount : 0)
                            )
                          );
                          const rowBalance = Math.max(record.invoice.amount - rowPaid, 0);
                          return (
                        <motion.button
                          key={record.invoice.id}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.99 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.99 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          whileHover={{ y: -2, scale: 1.003 }}
                          whileTap={{ scale: 0.998 }}
                          type="button"
                          onClick={() => setActiveInvoiceId(record.invoice.id)}
                          className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3.5 text-left transition-all duration-300 hover:border-white/25 sm:px-4 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b lg:bg-transparent lg:px-2 lg:py-4 lg:hover:border-white/18"
                        >
                          <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/[0.02] via-white/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <h3 title={getInvoiceProjectLabel(record)} className="truncate text-base font-semibold tracking-tight text-white transition-colors duration-300 group-hover:text-white sm:text-xl">
                                {getInvoiceProjectLabel(record)}
                              </h3>
                              <p className="mt-1 text-xs text-white/55 transition-colors duration-300 group-hover:text-white/75 sm:text-sm">
                                {record.invoice.invoiceNumber} · {formatDate(record.invoice.issueDate)}
                              </p>
                              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/40 transition-colors duration-300 group-hover:text-white/60">
                                {getServiceLabel(getInvoiceService(record))}
                              </p>
                            </div>

                            <div className="relative z-[1] flex flex-col items-end gap-2 text-right">
                              <p className="text-2xl font-semibold tracking-tight text-white transition-colors duration-300 group-hover:text-white sm:text-3xl">{formatAzn(record.invoice.amount)}</p>
                              <span
                                className={`inline-flex min-h-7 max-w-[9.5rem] items-center justify-center rounded-full border px-2.5 py-1 text-center text-[10px] font-medium leading-none tracking-tight capitalize whitespace-nowrap ${statusStyles[record.invoice.status]}`}
                              >
                                {getStatusLabel(record.invoice.status)}
                              </span>
                            </div>
                          </div>
                        </motion.button>
                          );
                        })()
                      ))
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          )}

          <AnimatePresence>
            {activeInvoiceRecord && (
              <motion.aside
                key="invoice-details-panel"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                className="min-w-0 xl:h-full xl:min-h-0"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeInvoiceRecord.invoice.id}
                    initial={{ opacity: 0, y: 10, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.995 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="min-h-0 min-w-0 h-full space-y-4 overflow-y-auto overscroll-contain scroll-smooth pb-4 sm:pr-1 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30"
                  >
                  <div className="rounded-[32px] border border-white/10 bg-black/95 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">{copy.modalTitle}</p>
                          <h3 className="mt-2 text-xl font-semibold tracking-tight text-white capitalize">
                            {activeInvoiceRecord.invoice.status}
                          </h3>
                          <p className="mt-2 text-sm text-white/55">
                            Due {formatDate(activeInvoiceRecord.invoice.dueDate)}
                          </p>
                        </div>
                        <div className="flex w-full items-center gap-2 sm:w-auto">
                          <motion.button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isDownloadingPdf}
                            whileHover={{ y: -1.5, scale: 1.02 }}
                            whileTap={{ scale: 0.985 }}
                            transition={{ type: "spring", stiffness: 360, damping: 24 }}
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-black/45 px-3 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(0,0,0,0.35)] transition-all duration-200 hover:border-white/30 hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-80 sm:flex-none sm:px-4"
                          >
                            <DownloadSimple className={`h-4 w-4 ${isDownloadingPdf ? "animate-spin" : ""}`} weight="bold" />
                            <span>{isDownloadingPdf ? copy.preparing : copy.downloadPdf}</span>
                          </motion.button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveInvoiceId(null);
                              setIsInvoiceListMinimized(false);
                            }}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/70 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                            aria-label="Back to invoice list"
                          >
                            <span>{copy.back}</span>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="grid gap-4">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">{copy.client}</p>
                            <p className="mt-2 text-lg font-semibold tracking-tight text-white">{activeInvoiceCustomerName}</p>
                            <p className="mt-1 text-sm text-white/55">{activeInvoiceCustomerAddress}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">{copy.status}</p>
                            <p className="mt-2 inline-flex min-h-7 max-w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-sm font-semibold tracking-tight text-white capitalize leading-none">
                              {getStatusLabel(activeInvoiceRecord.invoice.status)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 overflow-x-auto rounded-3xl border border-white/10 bg-black/40">
                          <table className="min-w-[620px] w-full border-collapse text-left text-sm">
                            <thead className="border-b border-white/10 bg-white/[0.03] text-white/55">
                              <tr>
                                <th className="px-4 py-3 font-medium">{copy.description}</th>
                                <th className="px-4 py-3 font-medium">{copy.qty}</th>
                                <th className="px-4 py-3 font-medium">{copy.rate}</th>
                                <th className="px-4 py-3 font-medium text-right">{copy.amount}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeInvoiceItems.map((item) => (
                                <tr key={item.description} className="border-b border-white/5 last:border-b-0">
                                  <td className="px-4 py-4 text-white/85">{item.description}</td>
                                  <td className="px-4 py-4 text-white/65">{item.quantity}</td>
                                  <td className="px-4 py-4 text-white/65">{formatAzn(item.rate)}</td>
                                  <td className="px-4 py-4 text-right text-white">{formatAzn(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                  <div className="grid gap-4">
                      <div className="rounded-3xl border border-white/12 bg-black/40 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.invoiceSummary}</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{copy.invoiceTotal}</p>
                            <p className="mt-2 text-lg font-semibold text-white">{formatAzn(activeInvoiceRecord.invoice.amount)}</p>
                          </div>
                          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-300/80">{copy.paidAmount}</p>
                            <p className="mt-2 text-lg font-semibold text-emerald-200">{formatAzn(activeInvoicePaidAmount)}</p>
                          </div>
                          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-amber-300/80">{copy.balanceDue}</p>
                            <p className="mt-2 text-lg font-semibold text-amber-100">{formatAzn(activeInvoiceBalanceDue)}</p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-3">
                          <div className="flex items-center justify-between text-xs text-white/60">
                            <span>{copy.paymentProgress}</span>
                            <span>{activeInvoicePaidPercent}%</span>
                          </div>
                          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                              style={{ width: `${activeInvoicePaidPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-white/70">
                          <div className="flex items-center justify-between">
                            <span>Subtotal</span>
                            <span className="font-semibold text-white">{formatAzn(activeInvoiceItemSubtotal)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Discount</span>
                            <span className="font-semibold text-white">-{formatAzn(activeInvoiceDiscount)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{copy.invoiceTotal}</span>
                            <span className="font-semibold text-white">{formatAzn(activeInvoiceRecord.invoice.amount)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{copy.paidAmount}</span>
                            <span className="font-semibold text-white">{formatAzn(activeInvoicePaidAmount)}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-white/10 pt-3">
                            <span>{copy.balanceDue}</span>
                            <span className="font-semibold text-white">{formatAzn(activeInvoiceBalanceDue)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-black/35 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">{copy.timeline}</p>
                        <div className="mt-4 space-y-3 text-sm text-white/60">
                          <div className="flex items-center justify-between gap-3">
                            <span>{copy.issued}</span>
                            <span>{formatDate(activeInvoiceRecord.invoice.issueDate)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>{copy.due}</span>
                            <span>{formatDate(activeInvoiceRecord.invoice.dueDate)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>{copy.deliveryDate}</span>
                            <span>{formatDate(activeInvoiceRecord.project.deliveryDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.aside>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
