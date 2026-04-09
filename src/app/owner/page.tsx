"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type FocusEvent as ReactFocusEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarDots, CaretDown, ChartBar, Check, DotsThreeOutline, FileText, FunnelSimple, GearSix, House, MagnifyingGlass, Package, ShieldCheck, SlidersHorizontal, SpeakerHigh, Users, X } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { formatAzn } from "@/lib/currency";
import type { ProjectStatus, ServiceType } from "@/lib/types";

type OwnerLanguage = "en" | "ru" | "az";
type OwnerTab = "overview" | "projects" | "invoices" | "materials" | "smm" | "clients" | "lineItems" | "security" | "system";

type SmmDraft = {
  cadence: string;
  nextPostTime: string;
  focus: string;
  managerNote: string;
};

type SmmScheduleStatus = "planned" | "scheduled" | "review" | "done";

type SmmScheduleItem = {
  id: string;
  day: string;
  time: string;
  content: string;
  status: SmmScheduleStatus;
  mediaUrl: string;
};

type SmmAdminPayload = {
  heroTitle: string;
  heroSubtitle: string;
  summaryTitle: string;
  summaryText: string;
  calendarTitle: string;
  calendarText: string;
  postsTitle: string;
  postsText: string;
  reportingTitle: string;
  reportingText: string;
  heroImageUrl: string;
  cadence: string;
  nextPostTime: string;
  focus: string;
  managerNote: string;
  postsPerWeek: number;
  schedule: SmmScheduleItem[];
};

type ClientOption = {
  id: string;
  brand_name: string;
  username: string;
  password: string;
  whatsapp_number: string;
  portal_enabled?: boolean;
  notes?: string | null;
  source?: string | null;
  preferred_language?: string | null;
  preferred_currency?: string | null;
};

type ProjectOption = {
  id: string;
  client_id: string;
  name: string;
  service: ServiceType;
  status: ProjectStatus;
  progress: number;
  start_date: string | null;
  delivery_date: string | null;
  latest_update: string | null;
};

type InvoiceRow = {
  id: string;
  project_id: string;
  project_name?: string;
  project_service?: ServiceType;
  invoice_number: string;
  amount: number;
  status: "paid" | "unpaid" | "partial";
  paid_amount?: number | null;
  issue_date: string | null;
  due_date: string | null;
  metadata?: {
    companyName?: string;
    serviceCategory?: string;
    projectLabel?: string;
    domain?: string;
    note?: string;
    customerName?: string;
    customerEmail?: string;
    customerAddress?: string;
    discountType?: "percent" | "fixed";
    discountValue?: number;
    taxType?: "percent" | "fixed" | "none";
    taxValue?: number;
    items?: InvoiceLineDraft[];
  } | null;
};

type InvoiceLineDraft = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

type InvoiceLabel = {
  id: string;
  title: string;
  rate: number;
};

type InvoiceDraft = {
  invoiceNumber: string;
  status: "paid" | "unpaid" | "partial";
  issueDate: string;
  dueDate: string;
  projectLabel: string;
  companyName: string;
  serviceCategory: ServiceType;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  taxType: "percent" | "fixed" | "none";
  taxValue: number;
  items: InvoiceLineDraft[];
};

type InvoiceMeta = Partial<Pick<InvoiceDraft, "projectLabel" | "companyName" | "serviceCategory" | "customerName" | "customerEmail" | "customerAddress" | "discountType" | "discountValue" | "taxType" | "taxValue" | "items">> & { isVoided?: boolean };

type PaymentForm = {
  customerName: string;
  paymentNumber: string;
  amountReceived: number;
  bankCharges: number;
  taxDeducted: "no" | "tds";
  paymentDate: string;
  paymentReceivedOn: string;
  paymentMode: "Cash" | "Bank transfer" | "Card" | "Online";
  reference: string;
  notes: string;
};

type ClientProfileDraft = {
  companyName: string;
  representativeName: string;
  whatsappNumber: string;
  portalEnabled: boolean;
  portalUsername: string;
  portalPassword: string;
  notes: string;
  source: string;
  preferredLanguage: string;
  preferredCurrency: string;
};

type DeliverableRow = {
  id: string;
  project_id: string;
  title: string;
  category: string;
  created_at: string | null;
  url: string;
};

type SessionRow = {
  id: string;
  client_id: string | null;
  customer_name: string | null;
  company_name: string | null;
  device_label: string | null;
  location_label: string | null;
  user_agent: string | null;
  last_seen_at: string | null;
  created_at: string | null;
};

const serviceOptions: ServiceType[] = ["website", "smm", "software", "app", "branding"];
type InvoiceServiceFilter = "all" | ServiceType | "misc";
const projectStatusOptions: ProjectStatus[] = ["planning", "in_progress", "review", "delivered"];
const invoiceStatusOptions = ["unpaid", "partial", "paid"] as const;
const tabs: OwnerTab[] = ["overview", "projects", "invoices", "materials", "smm", "clients", "security", "system"];

const copy: Record<OwnerLanguage, Record<string, string>> = {
  en: {
    title: "Admin Control Center",
    subtitle: "Select a client once, then manage everything for that client across tabs.",
    clientContext: "Client context",
    activeClient: "Active client",
    activeProject: "Active project",
    noClients: "No clients found.",
    noProjects: "No projects for this client yet.",
    logout: "Logout",
    clientsContext: "Clients",
    projectsContext: "Projects",
    avgProjects: "Avg projects/client",
    overview: "Company overview",
    clients: "Clients",
    lineItems: "Line Item Presets",
    projects: "Projects",
    invoices: "Invoices",
    materials: "Materials",
    smm: "SMM",
    security: "Security",
    system: "System",
    saveChanges: "Save changes",
    addInvoice: "Add invoice",
    addMaterial: "Add material",
    createClient: "Create client",
    createProject: "Create project",
    smmUpdate: "Save SMM update",
    latestInvoices: "Latest invoices",
    latestMaterials: "Latest materials",
    dashboardInfo: "Dashboard info",
    appWebsiteStatus: "App / website status",
    chooseSmmProject: "Select an SMM project to manage SMM updates.",
    noticeSaved: "Saved successfully.",
    noticeCreated: "Created successfully.",
    errorLoad: "Could not load admin data.",
    errorRequired: "Please fill required fields.",
    allGood: "Everything for this client is now managed in one place.",
  },
  ru: {
    title: "Центр управления",
    subtitle: "Выберите клиента один раз и управляйте всем по нему через вкладки.",
    clientContext: "Контекст клиента",
    activeClient: "Активный клиент",
    activeProject: "Активный проект",
    noClients: "Клиенты не найдены.",
    noProjects: "У этого клиента пока нет проектов.",
    logout: "Выйти",
    clientsContext: "Клиенты",
    projectsContext: "Проекты",
    avgProjects: "Среднее проектов/клиент",
    overview: "Обзор компании",
    clients: "Клиенты",
    lineItems: "Шаблоны позиций",
    projects: "Проекты",
    invoices: "Счета",
    materials: "Материалы",
    smm: "SMM",
    security: "Безопасность",
    system: "Система",
    saveChanges: "Сохранить",
    addInvoice: "Добавить счет",
    addMaterial: "Добавить материал",
    createClient: "Создать клиента",
    createProject: "Создать проект",
    smmUpdate: "Сохранить SMM-обновление",
    latestInvoices: "Последние счета",
    latestMaterials: "Последние материалы",
    dashboardInfo: "Инфо для дашборда",
    appWebsiteStatus: "Статус app / website",
    chooseSmmProject: "Выберите SMM-проект для управления обновлениями.",
    noticeSaved: "Успешно сохранено.",
    noticeCreated: "Успешно создано.",
    errorLoad: "Не удалось загрузить данные.",
    errorRequired: "Заполните обязательные поля.",
    allGood: "Теперь всё по клиенту управляется в одном месте.",
  },
  az: {
    title: "Admin İdarəetmə Mərkəzi",
    subtitle: "Müştərini bir dəfə seçin və bütün idarəetməni tablar üzrə aparın.",
    clientContext: "Müştəri konteksti",
    activeClient: "Aktiv müştəri",
    activeProject: "Aktiv layihə",
    noClients: "Müştəri tapılmadı.",
    noProjects: "Bu müştəri üçün hələ layihə yoxdur.",
    logout: "Çıxış",
    clientsContext: "Müştərilər",
    projectsContext: "Layihələr",
    avgProjects: "Orta layihə/müştəri",
    overview: "Şirkət icmalı",
    clients: "Müştərilər",
    lineItems: "Sıra Maddə Şablonları",
    projects: "Layihələr",
    invoices: "Fakturalar",
    materials: "Materiallar",
    smm: "SMM",
    security: "Təhlükəsizlik",
    system: "Sistem",
    saveChanges: "Yadda saxla",
    addInvoice: "Faktura əlavə et",
    addMaterial: "Material əlavə et",
    createClient: "Müştəri yarat",
    createProject: "Layihə yarat",
    smmUpdate: "SMM yeniləməsini saxla",
    latestInvoices: "Son fakturalar",
    latestMaterials: "Son materiallar",
    dashboardInfo: "Dashboard məlumatı",
    appWebsiteStatus: "App / website status",
    chooseSmmProject: "SMM yeniləməsi üçün SMM layihəsi seçin.",
    noticeSaved: "Uğurla saxlanıldı.",
    noticeCreated: "Uğurla yaradıldı.",
    errorLoad: "Məlumatlar yüklənmədi.",
    errorRequired: "Məcburi sahələri doldurun.",
    allGood: "Bu müştəri üçün bütün idarəetmə bir yerdədir.",
  },
};

const languageOptions: Array<{ value: OwnerLanguage; short: string; flag: string }> = [
  { value: "en", short: "EN", flag: "/flags/en.svg" },
  { value: "ru", short: "RU", flag: "/flags/ru.svg" },
  { value: "az", short: "AZ", flag: "/flags/az.svg" },
];

const projectStatusLabels: Record<OwnerLanguage, Record<ProjectStatus, string>> = {
  en: { planning: "Planning", in_progress: "In progress", review: "Review", delivered: "Delivered" },
  ru: { planning: "План", in_progress: "В работе", review: "Проверка", delivered: "Сдано" },
  az: { planning: "Plan", in_progress: "İcrada", review: "Yoxlama", delivered: "Təhvil" },
};

const ownerTabItems: Array<{ key: OwnerTab; icon: typeof House }> = [
  { key: "overview", icon: House },
  { key: "projects", icon: ChartBar },
  { key: "invoices", icon: FileText },
  { key: "materials", icon: Package },
  { key: "smm", icon: SpeakerHigh },
  { key: "clients", icon: Users },
  { key: "security", icon: ShieldCheck },
  { key: "system", icon: GearSix },
];

const generalOwnerTabItems: Array<{ key: OwnerTab; icon: typeof House }> = [
  { key: "overview", icon: House },
  { key: "invoices", icon: FileText },
  { key: "lineItems", icon: Package },
  { key: "clients", icon: Users },
  { key: "security", icon: ShieldCheck },
  { key: "system", icon: GearSix },
];

const smmStatusOptions: SmmScheduleStatus[] = ["planned", "scheduled", "review", "done"];
const smmDayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const defaultSmmSchedule: SmmScheduleItem[] = [
  { id: "1", day: "Mon", time: "11:00", content: "Problem / solution post", status: "done", mediaUrl: "" },
  { id: "2", day: "Wed", time: "15:00", content: "Product explanation reel", status: "scheduled", mediaUrl: "" },
  { id: "3", day: "Fri", time: "13:00", content: "Case post", status: "planned", mediaUrl: "" },
];

const defaultInvoiceLines: InvoiceLineDraft[] = [
  { id: "1", description: "Service item", quantity: 1, rate: 0 },
];

const materialsBucketCandidates = ["deliverables", "materials", "uploads", "files"];
const materialCategoryOptions = ["design", "website", "branding", "software", "app", "smm", "documents", "video", "other"];

const SMM_ADMIN_PREFIX = "SMM_ADMIN::";

function toInputDate(value: string | null | undefined) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

const smmFallbackDraft: SmmDraft = {
  cadence: "5 posts / week",
  nextPostTime: "Thu · 19:00",
  focus: "Weekly delivery and publication timing",
  managerNote: "",
};

const smmClientCopyFallback = {
  heroTitle: "Weekly SMM delivery",
  heroSubtitle: "Clients can follow what is planned, what is posted, and what is being prepared next.",
  summaryTitle: "Weekly delivery snapshot",
  summaryText: "This is the live view clients can use to follow what is published, what is scheduled, and what is still being prepared.",
  calendarTitle: "Publishing calendar",
  calendarText: "Posts are mapped out across the week so clients can see exactly how often content goes out and at what time.",
  postsTitle: "Post-by-post status",
  postsText: "Every planned post is shown with its channel, time, status, and a short note so progress is easy to follow.",
  reportingTitle: "Reporting rhythm",
  reportingText: "We update weekly delivery, engagement, and results so the client always knows what changed and what comes next.",
  heroImageUrl: "",
};

function parseSmmUpdate(update: string | null | undefined): SmmDraft {
  if (!update || !update.startsWith("[SMM]")) return smmFallbackDraft;

  const match = update.match(/Cadence:\s*(.*?)\s*\|\s*Next:\s*(.*?)\s*\|\s*Focus:\s*(.*?)\s*\|\s*Note:\s*(.*)$/);
  if (!match) return smmFallbackDraft;

  return {
    cadence: match[1] && match[1] !== "-" ? match[1] : smmFallbackDraft.cadence,
    nextPostTime: match[2] && match[2] !== "-" ? match[2] : smmFallbackDraft.nextPostTime,
    focus: match[3] && match[3] !== "-" ? match[3] : smmFallbackDraft.focus,
    managerNote: match[4] && match[4] !== "-" ? match[4] : "",
  };
}

function parseSmmAdminPayload(update: string | null | undefined): SmmAdminPayload | null {
  if (!update || !update.startsWith(SMM_ADMIN_PREFIX)) return null;

  try {
    const raw = update.slice(SMM_ADMIN_PREFIX.length);
    const parsed = JSON.parse(raw) as Partial<SmmAdminPayload>;

    return {
      heroTitle: parsed.heroTitle ?? smmClientCopyFallback.heroTitle,
      heroSubtitle: parsed.heroSubtitle ?? smmClientCopyFallback.heroSubtitle,
      summaryTitle: parsed.summaryTitle ?? smmClientCopyFallback.summaryTitle,
      summaryText: parsed.summaryText ?? smmClientCopyFallback.summaryText,
      calendarTitle: parsed.calendarTitle ?? smmClientCopyFallback.calendarTitle,
      calendarText: parsed.calendarText ?? smmClientCopyFallback.calendarText,
      postsTitle: parsed.postsTitle ?? smmClientCopyFallback.postsTitle,
      postsText: parsed.postsText ?? smmClientCopyFallback.postsText,
      reportingTitle: parsed.reportingTitle ?? smmClientCopyFallback.reportingTitle,
      reportingText: parsed.reportingText ?? smmClientCopyFallback.reportingText,
      heroImageUrl: parsed.heroImageUrl ?? smmClientCopyFallback.heroImageUrl,
      cadence: parsed.cadence ?? smmFallbackDraft.cadence,
      nextPostTime: parsed.nextPostTime ?? smmFallbackDraft.nextPostTime,
      focus: parsed.focus ?? smmFallbackDraft.focus,
      managerNote: parsed.managerNote ?? "",
      postsPerWeek: Number(parsed.postsPerWeek) || 3,
      schedule: Array.isArray(parsed.schedule) && parsed.schedule.length > 0
        ? parsed.schedule.map((item, index) => ({
            id: item.id ?? String(index + 1),
            day: item.day ?? "Mon",
            time: item.time ?? "11:00",
            content: item.content ?? "Post",
            status: item.status ?? "planned",
            mediaUrl: item.mediaUrl ?? "",
          }))
        : defaultSmmSchedule,
    };
  } catch {
    return null;
  }
}

function formatSmmReadableUpdate(payload: SmmAdminPayload) {
  return `SMM calendar: ${payload.postsPerWeek} posts/week · Next: ${payload.nextPostTime || "—"} · Focus: ${payload.focus || "—"}`;
}

function getNextPostFromSmmSchedule(schedule: SmmScheduleItem[]) {
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const todayIndex = (now.getDay() + 6) % 7;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const parseTime = (time: string) => {
    const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  };

  const normalized = schedule
    .map((item) => {
      const day = item.day.trim().slice(0, 3);
      const dayIndex = dayOrder.indexOf(day);
      return {
        day,
        dayIndex,
        time: item.time?.trim() || "",
        minutes: parseTime(item.time || ""),
      };
    })
    .filter((item) => item.dayIndex >= 0)
    .sort((a, b) => {
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
      return (a.minutes ?? Number.MAX_SAFE_INTEGER) - (b.minutes ?? Number.MAX_SAFE_INTEGER);
    });

  if (!normalized.length) return "";

  const next =
    normalized.find((item) => item.dayIndex > todayIndex || (item.dayIndex === todayIndex && (item.minutes === null || item.minutes >= nowMinutes))) ??
    normalized[0];

  const hasTime = next.time && next.time !== "—";
  return hasTime ? `${next.day} · ${next.time}` : next.day;
}

function createEmptyInvoiceDraft(): InvoiceDraft {
  return {
    invoiceNumber: "",
    status: "unpaid",
    issueDate: "",
    dueDate: "",
    projectLabel: "",
    companyName: "",
    serviceCategory: "website",
    customerName: "",
    customerEmail: "",
    customerAddress: "",
    discountType: "percent",
    discountValue: 0,
    taxType: "none",
    taxValue: 0,
    items: defaultInvoiceLines,
  };
}

function createEmptyPaymentForm(): PaymentForm {
  return {
    customerName: "",
    paymentNumber: "",
    amountReceived: 0,
    bankCharges: 0,
    taxDeducted: "no",
    paymentDate: toInputDate(new Date().toISOString()),
    paymentReceivedOn: "",
    paymentMode: "Cash",
    reference: "",
    notes: "",
  };
}

function createEmptyClientProfileDraft(): ClientProfileDraft {
  return {
    companyName: "",
    representativeName: "",
    whatsappNumber: "",
    portalEnabled: false,
    portalUsername: "",
    portalPassword: "",
    notes: "",
    source: "",
    preferredLanguage: "az",
    preferredCurrency: "AZN",
  };
}

function calcInvoiceSubtotal(items: InvoiceLineDraft[]) {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
}

function hasInvoiceDraftChanged(original: InvoiceDraft | null, current: InvoiceDraft): boolean {
  if (!original) return true;
  return JSON.stringify(original) !== JSON.stringify(current);
}

function calcInvoiceDiscount(subtotal: number, type: "percent" | "fixed", value: number) {
  const safeValue = Number(value) || 0;
  if (safeValue <= 0) return 0;
  if (type === "percent") return (subtotal * safeValue) / 100;
  return safeValue;
}

function calcInvoiceTotal(items: InvoiceLineDraft[], discountType: "percent" | "fixed", discountValue: number, taxType: "percent" | "fixed" | "none" = "none", taxValue: number = 0) {
  const subtotal = calcInvoiceSubtotal(items);
  const discount = calcInvoiceDiscount(subtotal, discountType, discountValue);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = taxType === "none" ? 0 : taxType === "percent" ? (afterDiscount * taxValue) / 100 : taxValue;
  return Math.max(0, afterDiscount + tax);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeProjectLabel(value: string) {
  return value.trim().replace(/^@+/, "");
}

function normalizeInvoiceLineDescription(description: string, projectLabel: string, service: ServiceType | string) {
  const cleanLabel = sanitizeProjectLabel(projectLabel);
  let next = description.trim();

  if (cleanLabel) {
    const prefixedLabel = new RegExp(`^@+${escapeRegExp(cleanLabel)}\\b`, "i");
    next = next.replace(prefixedLabel, cleanLabel);
  }

  if (String(service).toLowerCase() === "smm") {
    next = next.replace(/campaign\s+plan\b/i, "Campaign planning");
  }

  return next;
}

function buildDefaultInvoiceLineItems(projectLabel: string, service: ServiceType | string, amount: number): InvoiceLineDraft[] {
  const normalizedService = String(service || "website").toLowerCase();
  const baseByService: Record<string, Array<{ description: string; percent: number }>> = {
    website: [
      { description: `${projectLabel} — Strategy & UX structure`, percent: 0.32 },
      { description: `${projectLabel} — UI design & development`, percent: 0.48 },
      { description: `${projectLabel} — QA, revisions & launch prep`, percent: 0.2 },
    ],
    smm: [
      { description: `${projectLabel} — Campaign planning`, percent: 0.3 },
      { description: `${projectLabel} — Content creation & design`, percent: 0.45 },
      { description: `${projectLabel} — Posting, reporting & optimization`, percent: 0.25 },
    ],
    app: [
      { description: `${projectLabel} — Product discovery & flows`, percent: 0.28 },
      { description: `${projectLabel} — Design & implementation`, percent: 0.5 },
      { description: `${projectLabel} — Testing, polish & release support`, percent: 0.22 },
    ],
    software: [
      { description: `${projectLabel} — Technical planning`, percent: 0.3 },
      { description: `${projectLabel} — Core system build`, percent: 0.5 },
      { description: `${projectLabel} — QA, deployment & handoff`, percent: 0.2 },
    ],
    branding: [
      { description: `${projectLabel} — Brand direction`, percent: 0.32 },
      { description: `${projectLabel} — Visual identity development`, percent: 0.46 },
      { description: `${projectLabel} — Final refinements & guideline pack`, percent: 0.22 },
    ],
  };

  const source = baseByService[normalizedService] ?? baseByService.website;
  const firstItems = source.slice(0, -1).map((item, index) => {
    const rate = Math.round(amount * item.percent);
    return {
      id: `auto-${index + 1}`,
      description: item.description,
      quantity: 1,
      rate,
    };
  });

  const allocated = firstItems.reduce((sum, item) => sum + item.rate, 0);
  const finalRate = Math.max(0, amount - allocated);
  const last = source[source.length - 1];

  return [
    ...firstItems,
    {
      id: `auto-${source.length}`,
      description: last.description,
      quantity: 1,
      rate: finalRate,
    },
  ];
}

function numberInputValue(value: number) {
  return value === 0 ? "" : String(value);
}

function parseNumberInput(value: string) {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeWhatsappForStorage(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("994")) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith("0")) return `+994${digits.slice(1, 10)}`;
  return `+${digits.slice(0, 15)}`;
}

function normalizeCredentialSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 24) || "client";
}

function withErrorDetails(base: string, error?: { message?: string } | null) {
  const detail = error?.message?.trim();
  return detail ? `${base} (${detail})` : base;
}

function createRandomToken(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

function createPortalUsername(companyName: string, representativeName = "") {
  const base = normalizeCredentialSlug(companyName || representativeName);
  return `${base}${createRandomToken(3).toLowerCase()}`;
}

function createPortalPassword() {
  return createRandomToken(12);
}

function isDisabledPortalPassword(password: string) {
  return password.startsWith("DISABLED::");
}

function inferPortalEnabled(client: ClientOption) {
  const username = (client.username ?? "").trim();
  const password = (client.password ?? "").trim();
  const hasCredentials = Boolean(username && password);
  const disabledByPassword = isDisabledPortalPassword(password);

  if (typeof client.portal_enabled === "boolean") {
    if (!client.portal_enabled && hasCredentials && !disabledByPassword) {
      return true;
    }
    return client.portal_enabled;
  }

  return hasCredentials && !disabledByPassword;
}

function normalizeInvoiceServiceFilterValue(raw: string | null | undefined, fallback: ServiceType | "misc" = "website"): ServiceType | "misc" {
  const normalized = String(raw ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized === "misc" || normalized === "miscellaneous") return "misc";
  if ((serviceOptions as string[]).includes(normalized)) return normalized as ServiceType;
  return "misc";
}

function normalizeInvoiceServiceDraftValue(raw: string | null | undefined, fallback: ServiceType = "website"): ServiceType {
  const normalized = normalizeInvoiceServiceFilterValue(raw, fallback);
  return normalized === "misc" ? fallback : normalized;
}

function inferInvoiceMeta(invoice: InvoiceRow) {
  const metadata = invoice.metadata ?? {};
  const serviceCategory = normalizeInvoiceServiceFilterValue(metadata.serviceCategory, invoice.project_service ?? "website");
  const fallbackProjectLabel = serviceCategory === "smm"
    ? (invoice.project_name ?? "Unknown project").replace(/\s*\(smm\)\s*$/i, "")
    : (invoice.project_name ?? "Unknown project");
  const companyName = metadata.companyName ?? metadata.domain ?? metadata.customerName ?? fallbackProjectLabel;

  return {
    companyName,
    serviceCategory,
    projectLabel: metadata.projectLabel ?? fallbackProjectLabel,
  };
}

type PickerOption = {
  id: string;
  label: string;
  description?: string;
};

type FilterChoice = {
  value: string;
  label: string;
  description?: string;
};

function FilterModal({
  open,
  title,
  subtitle,
  icon: Icon,
  selectedValue,
  options,
  onClose,
  onSelect,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  icon: typeof FunnelSimple;
  selectedValue: string;
  options: FilterChoice[];
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 px-3 py-4 sm:items-center sm:px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-[30px] border border-white/12 bg-[#0d0d0d] shadow-[0_30px_90px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
                  <Icon className="h-5 w-5" weight="bold" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Invoice filter</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-white/55">{subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                aria-label="Close filter"
              >
                <X className="h-4 w-4" weight="bold" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-3">
              <div className="grid gap-2">
                {options.map((option) => {
                  const active = option.value === selectedValue;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onSelect(option.value);
                        onClose();
                      }}
                      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                        active
                          ? "border-white/25 bg-white/[0.1] text-white shadow-[0_12px_35px_rgba(255,255,255,0.06)]"
                          : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{option.label}</span>
                          {active && <Check className="h-4 w-4 text-emerald-300" weight="bold" />}
                        </div>
                        {option.description && <p className="mt-1 truncate text-xs text-white/45">{option.description}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchablePicker({
  title,
  value,
  placeholder,
  emptyLabel,
  options,
  onChange,
  actionLabel,
  onAction,
  actionDisabled,
}: {
  title: string;
  value: string;
  placeholder: string;
  emptyLabel: string;
  options: PickerOption[];
  onChange: (id: string) => void;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((option) => option.id === value) ?? null;
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => {
      const text = `${option.label} ${option.description ?? ""}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [options, query]);

  useEffect(() => {
    setQuery("");
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (pickerRef.current && target && !pickerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, title]);

  return (
    <div ref={pickerRef} className="relative">
      <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-white/45">{title}</p>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-white/15 bg-black/40 px-3 text-left text-sm text-white outline-none transition hover:border-white/25 hover:bg-black/50 focus:border-white/35"
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? selected.label : emptyLabel}
        </span>
        <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">{options.length}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-white/15 bg-[#101010] shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
          >
            <div className="border-b border-white/10 p-2">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25"
              />
            </div>
            <div className="max-h-72 overflow-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-sm text-white/45">No matches.</p>
              ) : (
                filtered.map((option) => {
                  const active = option.id === value;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        onChange(option.id);
                        setIsOpen(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                        active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium">{option.label}</span>
                        {active && <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">Selected</span>}
                      </div>
                      {option.description && <p className="mt-1 truncate text-xs text-white/45">{option.description}</p>}
                    </button>
                  );
                })
              )}
            </div>
            {actionLabel && onAction && (
              <div className="border-t border-white/10 p-2">
                <button
                  type="button"
                  onClick={() => {
                    onAction();
                    setIsOpen(false);
                  }}
                  disabled={actionDisabled}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-left text-sm font-semibold text-white/90 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  + {actionLabel}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SwipeRevealDeleteRow({ children, onDelete }: { children: ReactNode; onDelete: () => void }) {
  const revealWidth = 92;
  const x = useMotionValue(0);
  const [revealed, setRevealed] = useState(false);
  const deleteOpacity = useTransform(x, [0, -18, -revealWidth], [0, 0.45, 1]);
  const deleteShift = useTransform(x, [0, -revealWidth], [14, 0]);
  const deleteScale = useTransform(x, [0, -revealWidth], [0.94, 1]);

  useEffect(() => {
    const controls = animate(x, revealed ? -revealWidth : 0, {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.95,
    });
    return () => controls.stop();
  }, [revealed, x]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60">
      <motion.div
        style={{ opacity: deleteOpacity, x: deleteShift, scale: deleteScale }}
        className="absolute inset-y-0 right-0 flex w-[92px] items-center justify-center border-l border-red-300/20 bg-red-500/20"
      >
        <button
          type="button"
          onClick={onDelete}
          disabled={!revealed}
          className="h-9 rounded-lg border border-red-300/30 bg-red-500/20 px-3 text-xs font-semibold text-red-100 hover:bg-red-500/30"
        >
          Delete
        </button>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -revealWidth, right: 0 }}
        dragElastic={0.035}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={(_, info) => {
          const currentX = x.get();
          if (info.offset.x < -46 || info.velocity.x < -360 || currentX < -revealWidth * 0.58) {
            setRevealed(true);
            return;
          }
          if (info.offset.x > 34 || info.velocity.x > 320 || currentX > -revealWidth * 0.36) {
            setRevealed(false);
            return;
          }
          setRevealed((prev) => prev);
        }}
        className="relative z-10 w-full bg-black/90 will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}

async function resolveMaterialsBucket() {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();

  if (listErr) {
    return {
      bucket: "deliverables",
      note: `Could not list buckets (${listErr.message}). Trying 'deliverables' bucket directly.`,
    };
  }

  const names = (buckets ?? []).map((bucket) => bucket.name);
  const preferred = materialsBucketCandidates.find((name) => names.includes(name));
  if (preferred) {
    return { bucket: preferred, note: `Using existing bucket '${preferred}'.` };
  }

  return {
    bucket: "deliverables",
    note: "Could not verify buckets from this client key. Trying 'deliverables' directly. If upload fails with 'Bucket not found', create public bucket 'deliverables' in Supabase Dashboard.",
  };
}

export default function OwnerPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<OwnerLanguage>("en");
  const [activeTab, setActiveTab] = useState<OwnerTab>("overview");

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectInvoices, setProjectInvoices] = useState<InvoiceRow[]>([]);
  const [projectDeliverables, setProjectDeliverables] = useState<DeliverableRow[]>([]);
  const [securitySessions, setSecuritySessions] = useState<SessionRow[]>([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [allInvoiceCount, setAllInvoiceCount] = useState(0);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [invoiceTargetClientId, setInvoiceTargetClientId] = useState("");
  const [invoiceTargetProjectId, setInvoiceTargetProjectId] = useState("");
  const [invoiceEditProjectId, setInvoiceEditProjectId] = useState("");
  const [supportsPortalEnabled, setSupportsPortalEnabled] = useState<boolean | null>(null);
  const [supportsClientOptionalFields, setSupportsClientOptionalFields] = useState<boolean | null>(null);
  const [lastScopedSelection, setLastScopedSelection] = useState<{ clientId: string; projectId: string }>({ clientId: "", projectId: "" });

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successPopup, setSuccessPopup] = useState<string | null>(null);
  const [lastAddedLabelId, setLastAddedLabelId] = useState<string | null>(null);

  const [projectDraft, setProjectDraft] = useState({
    name: "",
    service: "website" as ServiceType,
    status: "planning" as ProjectStatus,
    progress: 0,
    startDate: "",
    deliveryDate: "",
    latestUpdate: "",
  });

  const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft>(createEmptyInvoiceDraft());
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoiceMetaMap, setInvoiceMetaMap] = useState<Record<string, InvoiceMeta>>({});
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<"all" | InvoiceRow["status"]>("all");
  const [invoiceServiceFilter, setInvoiceServiceFilter] = useState<InvoiceServiceFilter>("all");
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoicePageSize, setInvoicePageSize] = useState(10);
  const [invoiceFilterModal, setInvoiceFilterModal] = useState<"status" | "service" | "pageSize" | null>(null);
  const [isMobileInvoiceViewport, setIsMobileInvoiceViewport] = useState(false);
  const mobileInvoiceScrollYRef = useRef<number | null>(null);
  const adminDataNormalizationRanRef = useRef(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const deferredInvoiceSearchQuery = useDeferredValue(invoiceSearchQuery);
  const deferredInvoiceStatusFilter = useDeferredValue(invoiceStatusFilter);
  const deferredInvoiceServiceFilter = useDeferredValue(invoiceServiceFilter);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isInvoiceEditMode, setIsInvoiceEditMode] = useState(false);
  const [isInvoiceActionsOpen, setIsInvoiceActionsOpen] = useState(false);
  const [isPaymentPromptOpen, setIsPaymentPromptOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(createEmptyPaymentForm());
  const [invoiceLabels, setInvoiceLabels] = useState<InvoiceLabel[]>([]);
  const [newInvoiceLabelTitle, setNewInvoiceLabelTitle] = useState("");
  const [newInvoiceLabelRate, setNewInvoiceLabelRate] = useState(0);
  const [selectedExistingLabelId, setSelectedExistingLabelId] = useState("");
  const [isClientProfileOpen, setIsClientProfileOpen] = useState(false);
  const [isClientProjectsModalOpen, setIsClientProjectsModalOpen] = useState(false);
  const [profileClientId, setProfileClientId] = useState("");
  const [clientProfileDraft, setClientProfileDraft] = useState<ClientProfileDraft>(createEmptyClientProfileDraft());
  const [profilesViewMode, setProfilesViewMode] = useState<"grid" | "rows">("grid");
  const [showClientDetailsPanel, setShowClientDetailsPanel] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<string | null>(null);
  const [isInlineCreateClientMode, setIsInlineCreateClientMode] = useState(false);
  const [isInlineEditClientMode, setIsInlineEditClientMode] = useState(false);
  const [profileSearchQuery, setProfileSearchQuery] = useState("");
  const [profileFilterMode, setProfileFilterMode] = useState<"all" | "portal" | "non-portal" | "with-invoices">("all");
  const [overviewRange, setOverviewRange] = useState<"7d" | "30d" | "ytd" | "12m" | "custom" | "all">("30d");
  const [overviewCustomRange, setOverviewCustomRange] = useState(() => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 29);
    return {
      start: toInputDate(start.toISOString()),
      end: toInputDate(end.toISOString()),
    };
  });
  const [overviewMetric, setOverviewMetric] = useState<"received" | "invoiced">("received");
  const [hoveredOverviewBar, setHoveredOverviewBar] = useState<null | {
    label: string;
    value: number;
    metricLabel: string;
    trendLabel: string;
  }>(null);

  const [deliverableForm, setDeliverableForm] = useState({
    title: "",
    category: "design",
    url: "",
    createdAt: "",
  });
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [materialsDiagRunning, setMaterialsDiagRunning] = useState(false);
  const [materialsDiagLines, setMaterialsDiagLines] = useState<string[]>([]);

  const [newClientForm, setNewClientForm] = useState({
    brandName: "",
    username: "",
    password: "",
    whatsapp: "",
    portalEnabled: false,
  });

  const [newProjectForm, setNewProjectForm] = useState({
    name: "",
    service: "website" as ServiceType,
    status: "planning" as ProjectStatus,
    progress: 0,
    startDate: "",
    deliveryDate: "",
    latestUpdate: "",
  });

  const [smmCadence, setSmmCadence] = useState(smmFallbackDraft.cadence);
  const [smmNextPostTime, setSmmNextPostTime] = useState(smmFallbackDraft.nextPostTime);
  const [smmFocus, setSmmFocus] = useState(smmFallbackDraft.focus);
  const [smmManagerNote, setSmmManagerNote] = useState("");
  const [smmHeroTitle, setSmmHeroTitle] = useState(smmClientCopyFallback.heroTitle);
  const [smmHeroSubtitle, setSmmHeroSubtitle] = useState(smmClientCopyFallback.heroSubtitle);
  const [smmSummaryTitle, setSmmSummaryTitle] = useState(smmClientCopyFallback.summaryTitle);
  const [smmSummaryText, setSmmSummaryText] = useState(smmClientCopyFallback.summaryText);
  const [smmCalendarTitle, setSmmCalendarTitle] = useState(smmClientCopyFallback.calendarTitle);
  const [smmCalendarText, setSmmCalendarText] = useState(smmClientCopyFallback.calendarText);
  const [smmPostsTitle, setSmmPostsTitle] = useState(smmClientCopyFallback.postsTitle);
  const [smmPostsText, setSmmPostsText] = useState(smmClientCopyFallback.postsText);
  const [smmReportingTitle, setSmmReportingTitle] = useState(smmClientCopyFallback.reportingTitle);
  const [smmReportingText, setSmmReportingText] = useState(smmClientCopyFallback.reportingText);
  const [smmHeroImageUrl, setSmmHeroImageUrl] = useState(smmClientCopyFallback.heroImageUrl);
  const [smmInitialDraft, setSmmInitialDraft] = useState<SmmDraft>(smmFallbackDraft);
  const [smmPostsPerWeek, setSmmPostsPerWeek] = useState(3);
  const [smmSchedule, setSmmSchedule] = useState<SmmScheduleItem[]>(defaultSmmSchedule);
  const [smmInitialSchedule, setSmmInitialSchedule] = useState<SmmScheduleItem[]>(defaultSmmSchedule);

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; message: string; onConfirm: () => void } | null>(null);
  const [originalInvoiceDraft, setOriginalInvoiceDraft] = useState<InvoiceDraft | null>(null);

  const t = copy[language];

  const filteredProjects = useMemo(
    () => projects.filter((project) => project.client_id === selectedClientId),
    [projects, selectedClientId]
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  const onlineThresholdMs = 2 * 60 * 1000;
  const decoratedSessions = useMemo(() => {
    const now = Date.now();
    const clientMap = new Map(clients.map((item) => [item.id, item]));

    return securitySessions.map((session) => {
      const linkedClient = session.client_id ? clientMap.get(session.client_id) : undefined;
      const customerName = session.customer_name || linkedClient?.username || "Unknown customer";
      const companyName = session.company_name || linkedClient?.brand_name || "Unknown company";
      const lastSeenMs = session.last_seen_at ? new Date(session.last_seen_at).getTime() : 0;

      return {
        ...session,
        customerName,
        companyName,
        isOnline: lastSeenMs > 0 && now - lastSeenMs <= onlineThresholdMs,
      };
    });
  }, [clients, securitySessions]);

  const activeProfileClientId = profileClientId || selectedClientId;
  const profileProjects = useMemo(
    () => projects.filter((project) => project.client_id === activeProfileClientId),
    [projects, activeProfileClientId]
  );

  const avgProjects = clients.length === 0 ? 0 : Number((projects.length / clients.length).toFixed(1));
  const isGeneralMode = selectedClientId === "";

  const ownerSelectionStorageKeys = {
    client: "owner_selected_client_id",
    project: "owner_selected_project_id",
  };
  const invoiceLabelsStorageKey = "owner_invoice_labels_v1";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(invoiceLabelsStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as InvoiceLabel[];
      if (Array.isArray(parsed)) {
        setInvoiceLabels(
          parsed
            .filter((item) => item && typeof item.id === "string" && typeof item.title === "string")
            .map((item) => ({ ...item, rate: Number(item.rate) || 0 }))
        );
      }
    } catch {
      setInvoiceLabels([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(invoiceLabelsStorageKey, JSON.stringify(invoiceLabels));
  }, [invoiceLabels]);

  useEffect(() => {
    if (!notice && !error) return;
    const timeoutId = window.setTimeout(() => {
      setNotice(null);
      setError(null);
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [notice, error]);

  useEffect(() => {
    if (!successPopup) return;
    const timeoutId = window.setTimeout(() => setSuccessPopup(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [successPopup]);

  useEffect(() => {
    if (!lastAddedLabelId) return;
    const timeoutId = window.setTimeout(() => setLastAddedLabelId(null), 1400);
    return () => window.clearTimeout(timeoutId);
  }, [lastAddedLabelId]);

  function persistOwnerSelection(nextClientId: string, nextProjectId: string) {
    if (typeof window === "undefined") return;
    if (nextClientId) {
      localStorage.setItem(ownerSelectionStorageKeys.client, nextClientId);
    } else {
      localStorage.removeItem(ownerSelectionStorageKeys.client);
    }

    if (nextProjectId) {
      localStorage.setItem(ownerSelectionStorageKeys.project, nextProjectId);
    } else {
      localStorage.removeItem(ownerSelectionStorageKeys.project);
    }
  }

  function handleCreateInvoiceLabel() {
    const title = newInvoiceLabelTitle.trim();
    const rate = Number(newInvoiceLabelRate) || 0;
    if (!title) {
      setError("Label title is required.");
      return;
    }

    setError(null);
    setNotice(null);
    const id = String(Date.now());
    setInvoiceLabels((prev) => [{ id, title, rate }, ...prev]);
    setLastAddedLabelId(id);
    setNewInvoiceLabelTitle("");
    setNewInvoiceLabelRate(0);
    setNotice("Label saved.");
  }

  function handleDeleteInvoiceLabel(id: string) {
    setInvoiceLabels((prev) => prev.filter((item) => item.id !== id));
  }

  function handleAddExistingInvoiceItem() {
    const selected = invoiceLabels.find((item) => item.id === selectedExistingLabelId);
    if (!selected) {
      setError("Choose an existing label first.");
      return;
    }

    setError(null);
    const newId = String(Date.now());
    setInvoiceDraft((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: newId, description: selected.title, quantity: 1, rate: selected.rate },
      ],
    }));
  }

  function enterGeneralMode() {
    if (selectedClientId) {
      setLastScopedSelection({ clientId: selectedClientId, projectId: selectedProjectId });
    }
    setSelectedClientId("");
    setSelectedProjectId("");
    setInvoiceTargetClientId("");
    setInvoiceTargetProjectId("");
    setActiveTab("overview");
    persistOwnerSelection("", "");
  }

  function toggleGeneralMode() {
    if (!isGeneralMode) {
      enterGeneralMode();
      return;
    }

    const restoreClientId = lastScopedSelection.clientId || clients[0]?.id || "";
    if (!restoreClientId) return;
    const clientProjects = projects.filter((project) => project.client_id === restoreClientId);
    const restoreProjectId = clientProjects.some((project) => project.id === lastScopedSelection.projectId)
      ? lastScopedSelection.projectId
      : clientProjects[0]?.id ?? "";

    setSelectedClientId(restoreClientId);
    setSelectedProjectId(restoreProjectId);
    setInvoiceTargetClientId(restoreClientId);
    setInvoiceTargetProjectId(restoreProjectId);
    persistOwnerSelection(restoreClientId, restoreProjectId);
  }

  function getInvoiceMetaStorageKey(projectId: string) {
    return `owner_invoice_meta_${projectId}`;
  }

  function persistInvoiceMeta(nextMap: Record<string, InvoiceMeta>, projectId: string) {
    setInvoiceMetaMap(nextMap);
    if (typeof window !== "undefined" && projectId) {
      localStorage.setItem(getInvoiceMetaStorageKey(projectId), JSON.stringify(nextMap));
    }
  }

  async function loadProjectResources(projectId: string) {
    const isGeneralScope = !projectId;
    const clientProjectIds = projects
      .filter((project) => project.client_id === selectedClientId)
      .map((project) => project.id);
    const scopedProjectIds = isGeneralScope ? [] : (clientProjectIds.length > 0 ? clientProjectIds : [projectId]);
    const projectMap = new Map(projects.map((project) => [project.id, project]));

    const deliverablesReq = isGeneralScope
      ? supabase.from("deliverables").select("id, project_id, title, category, created_at, url").order("created_at", { ascending: false })
      : supabase.from("deliverables").select("id, project_id, title, category, created_at, url").in("project_id", scopedProjectIds).order("created_at", { ascending: false });
    let invoiceRows: unknown[] | null = null;
    let invoiceErr: { message?: string } | null = null;

    const invoiceSelect = "id, project_id, invoice_number, amount, status, paid_amount, issue_date, due_date, metadata";
    const withPaid = isGeneralScope
      ? await supabase.from("invoices").select(invoiceSelect).order("issue_date", { ascending: false })
      : await supabase.from("invoices").select(invoiceSelect).in("project_id", scopedProjectIds).order("issue_date", { ascending: false });

    if (withPaid.error) {
      const fallback = isGeneralScope
        ? await supabase.from("invoices").select("id, project_id, invoice_number, amount, status, issue_date, due_date, metadata").order("issue_date", { ascending: false })
        : await supabase.from("invoices").select("id, project_id, invoice_number, amount, status, issue_date, due_date, metadata").in("project_id", scopedProjectIds).order("issue_date", { ascending: false });

      invoiceRows = (fallback.data ?? []).map((row) => ({ ...row, paid_amount: null })) as unknown[];
      invoiceErr = fallback.error as { message?: string } | null;
    } else {
      invoiceRows = withPaid.data as unknown[];
      invoiceErr = null;
    }

    const { data: deliverableRows, error: deliverableErr } = await deliverablesReq;

    if (invoiceErr || deliverableErr) {
      setError(t.errorLoad);
      return;
    }

    const enrichedInvoices = ((invoiceRows ?? []) as InvoiceRow[]).map((invoice) => ({
      ...invoice,
      project_name: projectMap.get(invoice.project_id)?.name ?? "Unknown project",
      project_service: projectMap.get(invoice.project_id)?.service,
    }));

    setProjectInvoices(enrichedInvoices);
    setProjectDeliverables((deliverableRows ?? []) as DeliverableRow[]);
  }

  async function loadSecuritySessions(clientId = selectedClientId) {
    setSecurityLoading(true);

    let query = supabase
      .from("portal_sessions")
      .select("id, client_id, customer_name, company_name, device_label, location_label, user_agent, last_seen_at, created_at")
      .order("last_seen_at", { ascending: false })
      .limit(200);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error: sessionsErr } = await query;
    if (sessionsErr) {
      setSecuritySessions([]);
      setSecurityLoading(false);
      return;
    }

    setSecuritySessions((data ?? []) as SessionRow[]);
    setSecurityLoading(false);
  }

  async function loadLists(preferredClientId?: string, preferredProjectId?: string) {
    setLoading(true);
    setError(null);

    const fetchClients = async (includePortal: boolean, includeOptional: boolean) => {
      const portalCols = includePortal ? ", portal_enabled" : "";
      const optionalCols = includeOptional ? ", notes, source, preferred_language, preferred_currency" : "";

      return (supabase.from("clients") as any)
        // Dynamic column list based on schema support flags.
        .select(`id, brand_name, username, password, whatsapp_number${portalCols}${optionalCols}`)
        .order("brand_name", { ascending: true });
    };

    const initialIncludePortal = supportsPortalEnabled !== false;
    const initialIncludeOptional = supportsClientOptionalFields !== false;

    const [{ data: initialClientRows, error: initialClientErr }, { data: projectRows, error: projectErr }, { count: invoiceCount }] = await Promise.all([
      fetchClients(initialIncludePortal, initialIncludeOptional),
      supabase.from("projects").select("id, client_id, name, service, status, progress, start_date, delivery_date, latest_update").order("name", { ascending: true }),
      supabase.from("invoices").select("id", { count: "exact", head: true }),
    ]);

    let clientRows = initialClientRows;
    let clientErr = initialClientErr;

    if (initialClientErr?.code === "42703") {
      if (supportsClientOptionalFields !== false) {
        setSupportsClientOptionalFields(false);
        const fallbackWithoutOptional = await fetchClients(initialIncludePortal, false);
        clientRows = fallbackWithoutOptional.data;
        clientErr = fallbackWithoutOptional.error;
      }

      if (clientErr?.code === "42703" && supportsPortalEnabled !== false) {
        setSupportsPortalEnabled(false);
        const fallbackWithoutPortal = await fetchClients(false, false);
        clientRows = (fallbackWithoutPortal.data ?? []).map((row: any) => ({ ...row, portal_enabled: null }));
        clientErr = fallbackWithoutPortal.error;
      }
    } else {
      if (supportsPortalEnabled !== false) setSupportsPortalEnabled(true);
      if (supportsClientOptionalFields !== false) setSupportsClientOptionalFields(true);
    }

    if (clientErr || projectErr) {
      setError(t.errorLoad);
      setLoading(false);
      return;
    }

    let nextClients = (clientRows ?? []) as ClientOption[];
    let nextProjects = (projectRows ?? []) as ProjectOption[];

    let mergedFromClientId = "";
    let mergedToClientId = "";

    const normalizedJavarSource = nextClients.find((client) => {
      const brand = (client.brand_name ?? "").trim().toLowerCase();
      const username = (client.username ?? "").trim().toLowerCase();
      const phone = normalizeWhatsappForStorage(client.whatsapp_number ?? "");

      return (brand === "javar" || username === "javar.az") && (!phone || phone === "994" || phone === "9940");
    });

    const normalizedJavarTarget = nextClients.find((client) => {
      const brand = (client.brand_name ?? "").trim().toLowerCase();
      const username = (client.username ?? "").trim().toLowerCase();
      const phone = normalizeWhatsappForStorage(client.whatsapp_number ?? "");

      return brand === "javar.az" && (username.includes("rufan") || phone === "994552380538");
    });

    if (normalizedJavarSource && normalizedJavarTarget && normalizedJavarSource.id !== normalizedJavarTarget.id) {
      const sourceProjectsCount = nextProjects.filter((project) => project.client_id === normalizedJavarSource.id).length;

      if (sourceProjectsCount > 0) {
        const { error: mergeProjectsErr } = await supabase
          .from("projects")
          .update({ client_id: normalizedJavarTarget.id })
          .eq("client_id", normalizedJavarSource.id);

        if (!mergeProjectsErr) {
          const { data: mergedProjectRows, error: mergedProjectErr } = await supabase
            .from("projects")
            .select("id, client_id, name, service, status, progress, start_date, delivery_date, latest_update")
            .order("name", { ascending: true });

          if (!mergedProjectErr) {
            nextProjects = (mergedProjectRows ?? []) as ProjectOption[];
            mergedFromClientId = normalizedJavarSource.id;
            mergedToClientId = normalizedJavarTarget.id;
            setSelectedClientForDetails((prev) => (prev === normalizedJavarSource.id ? normalizedJavarTarget.id : prev));
          }
        }
      }
    }

    if (!adminDataNormalizationRanRef.current) {
      adminDataNormalizationRanRef.current = true;

      const projectColumns = "id, client_id, name, service, status, progress, start_date, delivery_date, latest_update";
      const invoiceColumns = "id, project_id, invoice_number, amount, status, issue_date, due_date, metadata";

      const canonicalJavarClient = nextClients.find((client) => {
        const brand = (client.brand_name ?? "").trim().toLowerCase();
        const username = (client.username ?? "").trim().toLowerCase();
        return brand === "javar.az" || username === "javar.az";
      });

      let javarAppProjectId = "";

      if (canonicalJavarClient) {
        let javarProjects = nextProjects.filter((project) => project.client_id === canonicalJavarClient.id);

        let javarWebsiteProject =
          javarProjects.find((project) => project.name.trim().toLowerCase() === "javar.az")
          ?? javarProjects.find((project) => project.service === "website")
          ?? null;

        if (!javarWebsiteProject) {
          const { data: createdWebsiteProject } = await supabase
            .from("projects")
            .insert({
              client_id: canonicalJavarClient.id,
              name: "javar.az",
              service: "website",
              status: "in_progress",
              progress: 0,
              start_date: null,
              delivery_date: null,
              latest_update: "Website project normalized by admin.",
            })
            .select(projectColumns)
            .single();

          if (createdWebsiteProject) {
            const typed = createdWebsiteProject as ProjectOption;
            nextProjects = [typed, ...nextProjects];
            javarProjects = [typed, ...javarProjects];
            javarWebsiteProject = typed;
          }
        }

        if (javarWebsiteProject && (javarWebsiteProject.name !== "javar.az" || javarWebsiteProject.service !== "website")) {
          const { data: updatedWebsiteProject } = await supabase
            .from("projects")
            .update({ name: "javar.az", service: "website" })
            .eq("id", javarWebsiteProject.id)
            .select(projectColumns)
            .single();

          if (updatedWebsiteProject) {
            const typed = updatedWebsiteProject as ProjectOption;
            nextProjects = nextProjects.map((project) => (project.id === typed.id ? typed : project));
            javarProjects = javarProjects.map((project) => (project.id === typed.id ? typed : project));
          }
        }

        let javarAppProject =
          javarProjects.find((project) => project.name.trim().toLowerCase() === "javarski update")
          ?? javarProjects.find((project) => project.service === "app")
          ?? null;

        if (!javarAppProject) {
          const { data: createdAppProject } = await supabase
            .from("projects")
            .insert({
              client_id: canonicalJavarClient.id,
              name: "Javarski update",
              service: "app",
              status: "in_progress",
              progress: 0,
              start_date: null,
              delivery_date: null,
              latest_update: "App project normalized by admin.",
            })
            .select(projectColumns)
            .single();

          if (createdAppProject) {
            const typed = createdAppProject as ProjectOption;
            nextProjects = [typed, ...nextProjects];
            javarProjects = [typed, ...javarProjects];
            javarAppProject = typed;
          }
        }

        if (javarAppProject) {
          javarAppProjectId = javarAppProject.id;
          if (javarAppProject.name !== "Javarski update" || javarAppProject.service !== "app") {
            const { data: updatedAppProject } = await supabase
              .from("projects")
              .update({ name: "Javarski update", service: "app" })
              .eq("id", javarAppProject.id)
              .select(projectColumns)
              .single();

            if (updatedAppProject) {
              const typed = updatedAppProject as ProjectOption;
              nextProjects = nextProjects.map((project) => (project.id === typed.id ? typed : project));
            }
          }
        }
      }

      const { data: invoiceRowsForNormalization } = await supabase.from("invoices").select(invoiceColumns);
      if (Array.isArray(invoiceRowsForNormalization) && invoiceRowsForNormalization.length > 0) {
        const latestProjectMap = new Map(nextProjects.map((project) => [project.id, project]));
        const invoiceRows = invoiceRowsForNormalization as InvoiceRow[];
        const updates: Array<PromiseLike<unknown>> = [];

        if (javarAppProjectId) {
          const realJavarAppInvoice = invoiceRows.find((invoice) => (invoice.invoice_number ?? "").trim().toUpperCase() === "BBK-000045");

          if (realJavarAppInvoice) {
            const baseMeta = realJavarAppInvoice.metadata ?? {};
            updates.push(
              supabase
                .from("invoices")
                .update({
                  project_id: javarAppProjectId,
                  amount: 712,
                  status: "paid",
                  issue_date: "2026-02-25",
                  due_date: "2026-02-25",
                  metadata: {
                    ...baseMeta,
                    serviceCategory: "app",
                    projectLabel: "Javarski update",
                    companyName: "Javar.az",
                    customerName: baseMeta.customerName || "Javar.az",
                    customerAddress: baseMeta.customerAddress || "Nasimi, Baku, Azerbaijan",
                    discountType: "percent",
                    discountValue: 5,
                    taxType: "none",
                    taxValue: 0,
                    items: [
                      { id: "1", description: "Mobil Tətbiqin Hazırlanması (iOS və Android platformaları üzrə)", quantity: 1, rate: 254.13 },
                      { id: "2", description: "Backend Sisteminin Qurulması və API İnteqrasiyası", quantity: 1, rate: 152.48 },
                      { id: "3", description: "Baza Arxitektura Hazırlanması və Konfiqurasiyası", quantity: 1, rate: 152.48 },
                      { id: "4", description: "UI/UX Dizaynın Hazırlanması və Optimallaşdırılması", quantity: 1, rate: 101.65 },
                      { id: "5", description: "Texniki Dəstək, Test və Sistem Baxımı", quantity: 1, rate: 50.81 },
                    ],
                  },
                })
                .eq("id", realJavarAppInvoice.id)
            );
          }
        }

        invoiceRows.forEach((invoice) => {
          if ((invoice.invoice_number ?? "").trim().toUpperCase() === "BBK-000045") return;

          const projectExists = Boolean(invoice.project_id && latestProjectMap.has(invoice.project_id));
          if (projectExists) return;

          const currentMeta = invoice.metadata ?? {};
          const currentService = normalizeInvoiceServiceFilterValue(currentMeta.serviceCategory, "misc");
          if (currentService === "misc" && currentMeta.projectLabel) return;

          updates.push(
            supabase
              .from("invoices")
              .update({
                metadata: {
                  ...currentMeta,
                  serviceCategory: "misc",
                  projectLabel: currentMeta.projectLabel || "Miscellaneous",
                  companyName: currentMeta.companyName || currentMeta.customerName || "Miscellaneous",
                },
              })
              .eq("id", invoice.id)
          );
        });

        if (updates.length > 0) {
          await Promise.all(updates);
        }
      }

      const { data: refreshedProjects } = await supabase.from("projects").select(projectColumns).order("name", { ascending: true });
      if (Array.isArray(refreshedProjects)) {
        nextProjects = refreshedProjects as ProjectOption[];
      }
    }

    setAllInvoiceCount(invoiceCount ?? 0);

    setClients(nextClients);
    setProjects(nextProjects);

    let nextClientId = preferredClientId ?? selectedClientId ?? "";
    if (mergedFromClientId && mergedToClientId && nextClientId === mergedFromClientId) {
      nextClientId = mergedToClientId;
    }
    const clientProjects = nextClientId ? nextProjects.filter((project) => project.client_id === nextClientId) : [];

    const nextProjectId =
      preferredProjectId && clientProjects.some((project) => project.id === preferredProjectId)
        ? preferredProjectId
        : nextClientId && selectedProjectId && clientProjects.some((project) => project.id === selectedProjectId)
          ? selectedProjectId
          : clientProjects[0]?.id ?? "";

    setSelectedClientId(nextClientId);
    setSelectedProjectId(nextProjectId);
    persistOwnerSelection(nextClientId, nextProjectId);
    await loadSecuritySessions(nextClientId);
    setLoading(false);
  }

  useEffect(() => {
    const ownerSession = localStorage.getItem("owner_session");
    if (ownerSession !== "active") {
      router.replace("/owner/login");
      return;
    }

    setAuthorized(true);
    const storedClientId = typeof window !== "undefined" ? localStorage.getItem(ownerSelectionStorageKeys.client) ?? undefined : undefined;
    const storedProjectId = typeof window !== "undefined" ? localStorage.getItem(ownerSelectionStorageKeys.project) ?? undefined : undefined;
    void loadLists(storedClientId, storedProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    persistOwnerSelection(selectedClientId, selectedProjectId);
  }, [selectedClientId, selectedProjectId]);

  useEffect(() => {
    void loadSecuritySessions(selectedClientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  useEffect(() => {
    if (!selectedClientId) return;

    const scoped = projects.filter((project) => project.client_id === selectedClientId);
    if (scoped.length === 0) {
      setSelectedProjectId("");
      return;
    }

    if (!scoped.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(scoped[0].id);
    }
  }, [projects, selectedClientId, selectedProjectId]);

  useEffect(() => {
    if (!selectedProject) {
      setProjectDraft({
        name: "",
        service: "website",
        status: "planning",
        progress: 0,
        startDate: "",
        deliveryDate: "",
        latestUpdate: "",
      });
      setSelectedInvoiceId(null);
      setIsCreatingInvoice(false);
      setIsPaymentPromptOpen(false);
      setIsInvoiceActionsOpen(false);
      void loadProjectResources("");
      return;
    }

    if (typeof window !== "undefined") {
      const rawMeta = localStorage.getItem(getInvoiceMetaStorageKey(selectedProject.id));
      if (rawMeta) {
        try {
          setInvoiceMetaMap(JSON.parse(rawMeta) as Record<string, InvoiceMeta>);
        } catch {
          setInvoiceMetaMap({});
        }
      } else {
        setInvoiceMetaMap({});
      }
    }

    setProjectDraft({
      name: selectedProject.name,
      service: selectedProject.service,
      status: selectedProject.status,
      progress: selectedProject.progress,
      startDate: toInputDate(selectedProject.start_date),
      deliveryDate: toInputDate(selectedProject.delivery_date),
      latestUpdate: (() => {
        const structured = parseSmmAdminPayload(selectedProject.latest_update);
        return structured ? formatSmmReadableUpdate(structured) : selectedProject.latest_update ?? "";
      })(),
    });

    void loadProjectResources(selectedProject.id);

    if (selectedProject.service === "smm") {
      const structured = parseSmmAdminPayload(selectedProject.latest_update);
      if (structured) {
        setSmmHeroTitle(structured.heroTitle);
        setSmmHeroSubtitle(structured.heroSubtitle);
        setSmmSummaryTitle(structured.summaryTitle);
        setSmmSummaryText(structured.summaryText);
        setSmmCalendarTitle(structured.calendarTitle);
        setSmmCalendarText(structured.calendarText);
        setSmmPostsTitle(structured.postsTitle);
        setSmmPostsText(structured.postsText);
        setSmmReportingTitle(structured.reportingTitle);
        setSmmReportingText(structured.reportingText);
        setSmmHeroImageUrl(structured.heroImageUrl);
        setSmmCadence(structured.cadence);
        setSmmNextPostTime(structured.nextPostTime);
        setSmmFocus(structured.focus);
        setSmmManagerNote(structured.managerNote);
        setSmmPostsPerWeek(structured.postsPerWeek);
        setSmmSchedule(structured.schedule);
        setSmmInitialSchedule(structured.schedule);
        setSmmInitialDraft({
          cadence: structured.cadence,
          nextPostTime: structured.nextPostTime,
          focus: structured.focus,
          managerNote: structured.managerNote,
        });
        return;
      }

      const parsed = parseSmmUpdate(selectedProject.latest_update);
      setSmmHeroTitle(smmClientCopyFallback.heroTitle);
      setSmmHeroSubtitle(smmClientCopyFallback.heroSubtitle);
      setSmmSummaryTitle(smmClientCopyFallback.summaryTitle);
      setSmmSummaryText(smmClientCopyFallback.summaryText);
      setSmmCalendarTitle(smmClientCopyFallback.calendarTitle);
      setSmmCalendarText(smmClientCopyFallback.calendarText);
      setSmmPostsTitle(smmClientCopyFallback.postsTitle);
      setSmmPostsText(smmClientCopyFallback.postsText);
      setSmmReportingTitle(smmClientCopyFallback.reportingTitle);
      setSmmReportingText(smmClientCopyFallback.reportingText);
      setSmmHeroImageUrl(smmClientCopyFallback.heroImageUrl);
      setSmmCadence(parsed.cadence);
      setSmmNextPostTime(parsed.nextPostTime);
      setSmmFocus(parsed.focus);
      setSmmManagerNote(parsed.managerNote);
      setSmmInitialDraft(parsed);
      setSmmPostsPerWeek(3);
      setSmmSchedule(defaultSmmSchedule);
      setSmmInitialSchedule(defaultSmmSchedule);
    } else {
      setSmmHeroTitle(smmClientCopyFallback.heroTitle);
      setSmmHeroSubtitle(smmClientCopyFallback.heroSubtitle);
      setSmmSummaryTitle(smmClientCopyFallback.summaryTitle);
      setSmmSummaryText(smmClientCopyFallback.summaryText);
      setSmmCalendarTitle(smmClientCopyFallback.calendarTitle);
      setSmmCalendarText(smmClientCopyFallback.calendarText);
      setSmmPostsTitle(smmClientCopyFallback.postsTitle);
      setSmmPostsText(smmClientCopyFallback.postsText);
      setSmmReportingTitle(smmClientCopyFallback.reportingTitle);
      setSmmReportingText(smmClientCopyFallback.reportingText);
      setSmmHeroImageUrl(smmClientCopyFallback.heroImageUrl);
      setSmmCadence(smmFallbackDraft.cadence);
      setSmmNextPostTime(smmFallbackDraft.nextPostTime);
      setSmmFocus(smmFallbackDraft.focus);
      setSmmManagerNote("");
      setSmmInitialDraft(smmFallbackDraft);
      setSmmPostsPerWeek(3);
      setSmmSchedule(defaultSmmSchedule);
      setSmmInitialSchedule(defaultSmmSchedule);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  useEffect(() => {
    const allowedTabs = isGeneralMode ? generalOwnerTabItems.map((item) => item.key) : ownerTabItems.map((item) => item.key);
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab("overview");
    }
  }, [activeTab, isGeneralMode]);

  function handleOwnerLogout() {
    localStorage.removeItem("owner_session");
    router.replace("/owner/login");
  }

  async function handleSaveProject() {
    setNotice(null);
    setError(null);

    if (!selectedProjectId || !projectDraft.name.trim()) {
      setError(t.errorRequired);
      return;
    }

    const structuredCurrent = parseSmmAdminPayload(selectedProject?.latest_update);
    const latestUpdateForSave = structuredCurrent
      ? (selectedProject?.latest_update ?? (projectDraft.latestUpdate.trim() || null))
      : projectDraft.latestUpdate.trim() || null;

    const { error: updateErr } = await supabase
      .from("projects")
      .update({
        name: projectDraft.name.trim(),
        service: projectDraft.service,
        status: projectDraft.status,
        progress: Number(projectDraft.progress) || 0,
        start_date: projectDraft.startDate || null,
        delivery_date: projectDraft.deliveryDate || null,
        latest_update: latestUpdateForSave,
      })
      .eq("id", selectedProjectId);

    if (updateErr) {
      setError(t.errorLoad);
      return;
    }

    setNotice(t.noticeSaved);
    await loadLists(selectedClientId, selectedProjectId);
  }

  function resetInvoiceDraft() {
    const emptyDraft = createEmptyInvoiceDraft();
    setInvoiceDraft(emptyDraft);
    setOriginalInvoiceDraft(null);
    setSelectedInvoiceId(null);
    setInvoiceEditProjectId("");
    setIsCreatingInvoice(false);
    setIsInvoiceEditMode(false);
    setIsInvoiceActionsOpen(false);
    setIsPaymentPromptOpen(false);
    setPaymentAmount(0);
    setPaymentForm(createEmptyPaymentForm());
  }

  function getSuggestedInvoiceNumber() {
    const maxNumericSuffix = projectInvoices.reduce((max, invoice) => {
      const match = invoice.invoice_number.match(/(\d+)$/);
      if (!match) return max;
      const numeric = Number(match[1]);
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);

    return `BBK-${String(maxNumericSuffix + 1).padStart(6, "0")}`;
  }

  function syncInvoiceDraftWithProject(projectId: string) {
    const targetProject = projects.find((project) => project.id === projectId) ?? null;
    if (!targetProject) return;

    const normalizedLabel = targetProject.service === "smm"
      ? targetProject.name.replace(/\s*\(smm\)\s*$/i, "")
      : targetProject.name;

    setInvoiceDraft((prev) => ({
      ...prev,
      projectLabel: sanitizeProjectLabel(normalizedLabel),
      serviceCategory: targetProject.service,
      companyName: sanitizeProjectLabel(normalizedLabel) || prev.companyName,
    }));
  }

  function handleStartCreateInvoice() {
    const emptyDraft = createEmptyInvoiceDraft();
    const fallbackProject = selectedProjectId || invoiceTargetProjectId;
    const fallbackClient = selectedClientId || invoiceTargetClientId;
    const targetProject = projects.find((project) => project.id === fallbackProject) ?? null;
    const normalizedLabel = targetProject?.service === "smm"
      ? (targetProject?.name ?? "").replace(/\s*\(smm\)\s*$/i, "")
      : (targetProject?.name ?? "");
    setInvoiceDraft({
      ...emptyDraft,
      invoiceNumber: getSuggestedInvoiceNumber(),
      issueDate: toInputDate(new Date().toISOString()),
      projectLabel: normalizedLabel,
      companyName: normalizedLabel,
      serviceCategory: targetProject?.service ?? "website",
    });
    setInvoiceTargetClientId(fallbackClient);
    setInvoiceTargetProjectId(fallbackProject);
    setInvoiceEditProjectId("");
    setOriginalInvoiceDraft(null);
    setSelectedInvoiceId(null);
    setIsCreatingInvoice(true);
    setIsInvoiceEditMode(true);
    setIsInvoiceActionsOpen(false);
    setIsPaymentPromptOpen(false);
    setPaymentAmount(0);
  }

  function handleSelectInvoice(invoice: InvoiceRow) {
    if (isMobileInvoiceViewport && typeof window !== "undefined") {
      mobileInvoiceScrollYRef.current = window.scrollY;
    }

    const meta = {
      ...(invoice.metadata ?? {}),
      ...(invoiceMetaMap[invoice.id] ?? {}),
    };
    const inferred = inferInvoiceMeta(invoice);
    const effectiveService = normalizeInvoiceServiceDraftValue(meta?.serviceCategory ?? inferred.serviceCategory, "website");
    const effectiveProjectLabel = sanitizeProjectLabel(meta?.projectLabel ?? inferred.projectLabel);
    const fallbackItems = buildDefaultInvoiceLineItems(effectiveProjectLabel, effectiveService, Number(invoice.amount) || 0);
    const hasMeaningfulItems = Array.isArray(meta?.items) && meta.items.length > 0;
    const hasGenericSingleItem =
      hasMeaningfulItems &&
      meta!.items!.length === 1 &&
      /^Invoice\s+/i.test(meta!.items![0].description || "") &&
      Number(meta!.items![0].quantity || 0) === 1 &&
      Number(meta!.items![0].rate || 0) === Number(invoice.amount || 0);

    const draft = {
      invoiceNumber: invoice.invoice_number,
      status: invoice.status,
      issueDate: toInputDate(invoice.issue_date),
      dueDate: toInputDate(invoice.due_date),
      projectLabel: effectiveProjectLabel,
      companyName: meta?.companyName ?? inferred.companyName,
      serviceCategory: normalizeInvoiceServiceDraftValue(meta?.serviceCategory ?? inferred.serviceCategory, "website"),
      customerName: meta?.customerName ?? "",
      customerEmail: meta?.customerEmail ?? "",
      customerAddress: meta?.customerAddress ?? "",
      discountType: meta?.discountType ?? "percent",
      discountValue: meta?.discountValue ?? 0,
      taxType: meta?.taxType ?? "none",
      taxValue: meta?.taxValue ?? 0,
      items: (hasMeaningfulItems && !hasGenericSingleItem ? meta!.items! : fallbackItems).map((item, index) => ({
        ...item,
        id: item.id || `line-${index + 1}`,
        description: normalizeInvoiceLineDescription(item.description || "", effectiveProjectLabel, effectiveService),
      })),
    };
    setSelectedInvoiceId(invoice.id);
    setInvoiceEditProjectId(invoice.project_id);
    setOriginalInvoiceDraft(draft);
    setInvoiceDraft(draft);
    setIsCreatingInvoice(false);
    setIsInvoiceEditMode(false);
    setIsInvoiceActionsOpen(false);
    setIsPaymentPromptOpen(false);
    setPaymentAmount(0);
  }

  function handleCancelInvoiceEditing() {
    if (originalInvoiceDraft) {
      setInvoiceDraft(originalInvoiceDraft);
    }
    const selectedInvoice = selectedInvoiceId
      ? projectInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null
      : null;
    setInvoiceEditProjectId(selectedInvoice?.project_id ?? "");
    setIsInvoiceEditMode(false);
    setIsInvoiceActionsOpen(false);
  }

  function handleOpenClientProfileFromInvoiceProjectPicker() {
    if (!invoiceTargetClientId) {
      setError("Choose a client first, then add a project.");
      return;
    }

    const client = clients.find((item) => item.id === invoiceTargetClientId);
    if (!client) {
      setError("Selected client not found.");
      return;
    }

    setError(null);
    setSelectedClientId(client.id);
    openClientProfile(client);
  }

  function buildInvoiceMetadataPayload(targetProjectId: string, draft: InvoiceDraft, existing?: InvoiceRow["metadata"]) {
    const targetProject = projects.find((project) => project.id === targetProjectId);
    const serviceCategory = draft.serviceCategory || targetProject?.service || existing?.serviceCategory || "website";
    const defaultProjectLabel = sanitizeProjectLabel(draft.projectLabel) || targetProject?.name || existing?.projectLabel || "Project";
    const normalizedProjectLabel = serviceCategory === "smm"
      ? defaultProjectLabel.replace(/\s*\(smm\)\s*$/i, "")
      : defaultProjectLabel;

    return {
      ...(existing ?? {}),
      customerName: draft.customerName.trim(),
      customerEmail: draft.customerEmail.trim(),
      customerAddress: draft.customerAddress.trim(),
      discountType: draft.discountType,
      discountValue: Number(draft.discountValue) || 0,
      taxType: draft.taxType,
      taxValue: Number(draft.taxValue) || 0,
      items: draft.items.map((item) => ({
        ...item,
        description: normalizeInvoiceLineDescription(item.description || "", normalizedProjectLabel, serviceCategory),
      })),
      serviceCategory,
      projectLabel: normalizedProjectLabel,
      companyName: draft.customerName.trim() || existing?.companyName || normalizedProjectLabel,
    };
  }

  function handleAddInvoiceItem() {
    setInvoiceDraft((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: String(Date.now()), description: "", quantity: 1, rate: 0 },
      ],
    }));
  }

  function handleRemoveInvoiceItem(id: string) {
    setInvoiceDraft((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }

  function handleUpdateInvoiceItem(id: string, patch: Partial<InvoiceLineDraft>) {
    setInvoiceDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  async function handleCreateInvoice() {
    setNotice(null);
    setError(null);

    const amount = calcInvoiceTotal(invoiceDraft.items, invoiceDraft.discountType, invoiceDraft.discountValue, invoiceDraft.taxType, invoiceDraft.taxValue);
    const targetProjectId = invoiceTargetProjectId || selectedProjectId;
    if (!targetProjectId || !invoiceDraft.invoiceNumber.trim() || !Number.isFinite(amount)) {
      setError(t.errorRequired);
      return;
    }

    const targetProject = projects.find((project) => project.id === targetProjectId) ?? null;
    if (!targetProject) {
      setError("Select an existing project before saving invoice.");
      return;
    }

    if (invoiceTargetClientId && targetProject.client_id !== invoiceTargetClientId) {
      setError("Selected project does not belong to selected client.");
      return;
    }

    const { data: createdInvoice, error: insertErr } = await supabase
      .from("invoices")
      .insert({
        project_id: targetProjectId,
        invoice_number: invoiceDraft.invoiceNumber.trim(),
        amount,
        status: "unpaid",
        issue_date: invoiceDraft.issueDate || null,
        due_date: invoiceDraft.dueDate || null,
        metadata: buildInvoiceMetadataPayload(targetProjectId, invoiceDraft),
      })
      .select("id")
      .single();

    if (insertErr) {
      setError(withErrorDetails(t.errorLoad, insertErr));
      return;
    }

    if (createdInvoice?.id) {
      const nextMap: Record<string, InvoiceMeta> = {
        ...invoiceMetaMap,
        [createdInvoice.id]: {
          projectLabel: invoiceDraft.projectLabel,
          companyName: invoiceDraft.companyName,
          serviceCategory: invoiceDraft.serviceCategory,
          customerName: invoiceDraft.customerName,
          customerEmail: invoiceDraft.customerEmail,
          customerAddress: invoiceDraft.customerAddress,
          discountType: invoiceDraft.discountType,
          discountValue: invoiceDraft.discountValue,
          taxType: invoiceDraft.taxType,
          taxValue: invoiceDraft.taxValue,
          items: invoiceDraft.items,
        },
      };
      persistInvoiceMeta(nextMap, targetProjectId);
    }

    setNotice(t.noticeCreated);
    resetInvoiceDraft();
    await loadLists(selectedClientId || undefined, targetProjectId);
  }

  async function handleUpdateInvoice() {
    setNotice(null);
    setError(null);

    if (!selectedInvoiceId) {
      setError("Choose an invoice to update.");
      return;
    }

    const amount = calcInvoiceTotal(invoiceDraft.items, invoiceDraft.discountType, invoiceDraft.discountValue, invoiceDraft.taxType, invoiceDraft.taxValue);
    const activeRow = projectInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null;
    const targetProjectId = invoiceEditProjectId || activeRow?.project_id || selectedProjectId;
    const targetProject = projects.find((project) => project.id === targetProjectId) ?? null;
    if (!targetProjectId || !targetProject) {
      setError("Select an existing project before updating invoice.");
      return;
    }

    if (selectedInvoiceClient && targetProject.client_id !== selectedInvoiceClient.id) {
      setError("Invoice can only be assigned to one of this client's projects.");
      return;
    }

    const nextMetadata = buildInvoiceMetadataPayload(targetProjectId, invoiceDraft, activeRow?.metadata);

    const { error: updateErr } = await supabase
      .from("invoices")
      .update({
        project_id: targetProjectId,
        invoice_number: invoiceDraft.invoiceNumber.trim(),
        amount,
        status: invoiceDraft.status,
        issue_date: invoiceDraft.issueDate || null,
        due_date: invoiceDraft.dueDate || null,
        metadata: nextMetadata,
      })
      .eq("id", selectedInvoiceId);

    if (updateErr) {
      setError(withErrorDetails(t.errorLoad, updateErr));
      return;
    }

    if (selectedInvoiceId) {
      const nextMap: Record<string, InvoiceMeta> = {
        ...invoiceMetaMap,
        [selectedInvoiceId]: {
          projectLabel: invoiceDraft.projectLabel,
          companyName: invoiceDraft.companyName,
          serviceCategory: invoiceDraft.serviceCategory,
          customerName: invoiceDraft.customerName,
          customerEmail: invoiceDraft.customerEmail,
          customerAddress: invoiceDraft.customerAddress,
          discountType: invoiceDraft.discountType,
          discountValue: invoiceDraft.discountValue,
          taxType: invoiceDraft.taxType,
          taxValue: invoiceDraft.taxValue,
          items: invoiceDraft.items,
        },
      };
      persistInvoiceMeta(nextMap, targetProjectId);
    }

    setNotice(t.noticeSaved);
    setSuccessPopup("Invoice saved successfully");
    setOriginalInvoiceDraft({
      ...invoiceDraft,
      items: invoiceDraft.items.map((item) => ({ ...item })),
    });
    setIsInvoiceEditMode(false);
    await loadProjectResources(selectedProjectId);
  }

  async function handleDeleteInvoice(id: string) {
    setNotice(null);
    setError(null);

    const { error: deleteErr } = await supabase.from("invoices").delete().eq("id", id);
    if (deleteErr) {
      setError(withErrorDetails(t.errorLoad, deleteErr));
      return;
    }

    if (selectedInvoiceId === id) {
      resetInvoiceDraft();
    }
    const nextMap = { ...invoiceMetaMap };
    delete nextMap[id];
    const activeRow = projectInvoices.find((invoice) => invoice.id === id) ?? null;
    persistInvoiceMeta(nextMap, activeRow?.project_id || selectedProjectId);
    setNotice("Invoice deleted.");
    await loadProjectResources(selectedProjectId);
  }

  async function handleVoidInvoice() {
    setNotice(null);
    setError(null);

    if (!selectedInvoiceId) {
      setError("Choose an invoice first.");
      return;
    }

    const { error: updateErr } = await supabase
      .from("invoices")
      .update({ status: "unpaid", paid_amount: 0 })
      .eq("id", selectedInvoiceId);

    if (updateErr) {
      setError(withErrorDetails(t.errorLoad, updateErr));
      return;
    }

    const nextMap: Record<string, InvoiceMeta> = {
      ...invoiceMetaMap,
      [selectedInvoiceId]: {
        ...(invoiceMetaMap[selectedInvoiceId] ?? {}),
        isVoided: true,
      },
    };
    const activeRow = projectInvoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null;
    persistInvoiceMeta(nextMap, activeRow?.project_id || selectedProjectId);

    setIsInvoiceActionsOpen(false);
    setIsPaymentPromptOpen(false);
    setPaymentAmount(0);
    setNotice("Invoice marked as void.");
    await loadProjectResources(selectedProjectId);
  }

  async function handleRecordPayment() {
    setNotice(null);
    setError(null);

    const normalizedAmount = Number(paymentForm.amountReceived) || 0;
    setPaymentAmount(normalizedAmount);

    if (!selectedInvoiceId || normalizedAmount <= 0) {
      setError("Select invoice and enter payment amount.");
      return;
    }

    const invoice = projectInvoices.find((item) => item.id === selectedInvoiceId);
    if (!invoice) {
      setError("Invoice not found.");
      return;
    }

    if (invoiceMetaMap[selectedInvoiceId]?.isVoided) {
      setError("Voided invoice cannot receive payments.");
      return;
    }

    const currentPaid = Math.max(
      0,
      Math.min(
        invoice.amount,
        Number(invoice.paid_amount ?? (invoice.status === "paid" ? invoice.amount : 0))
      )
    );

    const nextPaid = Math.min(invoice.amount, currentPaid + normalizedAmount);
    const nextStatus: InvoiceRow["status"] = nextPaid >= invoice.amount ? "paid" : nextPaid > 0 ? "partial" : "unpaid";

    let updateErr: { message?: string } | null = null;

    const withPaid = await supabase
      .from("invoices")
      .update({ paid_amount: nextPaid, status: nextStatus })
      .eq("id", selectedInvoiceId);

    if (withPaid.error) {
      const fallbackStatus = nextPaid >= invoice.amount ? "paid" : nextPaid > 0 ? "partial" : "unpaid";
      const fallback = await supabase
        .from("invoices")
        .update({ status: fallbackStatus })
        .eq("id", selectedInvoiceId);
      updateErr = fallback.error as { message?: string } | null;
    }

    if (updateErr) {
      setError(withErrorDetails(t.errorLoad, updateErr));
      return;
    }

    setPaymentAmount(0);
    setIsPaymentPromptOpen(false);
    setIsInvoiceActionsOpen(false);
    setPaymentForm(createEmptyPaymentForm());
    setNotice("Payment recorded.");
    await loadProjectResources(selectedProjectId);
  }

  async function handleCreateDeliverable() {
    setNotice(null);
    setError(null);

    const effectiveProjectId = selectedProjectId || selectedProject?.id || "";
    const effectiveClientId = selectedClientId || selectedProject?.client_id || "";

    if (!effectiveProjectId) {
      setError(t.errorRequired);
      return;
    }

    let finalUrl = deliverableForm.url.trim();
    if (deliverableFile) {
      const { bucket, note } = await resolveMaterialsBucket();
      if (!bucket) {
        setError(note || "No storage bucket available for upload.");
        return;
      }

      const maxSizeMb = 20;
      const sizeMb = deliverableFile.size / (1024 * 1024);
      if (sizeMb > maxSizeMb) {
        setError(`File is too large. Max ${maxSizeMb}MB.`);
        return;
      }

      const safeName = deliverableFile.name.replace(/\s+/g, "-");
      const filePath = `${effectiveClientId || "unknown-client"}/${effectiveProjectId}/${Date.now()}-${safeName}`;
      const { error: uploadErr } = await supabase.storage.from(bucket).upload(filePath, deliverableFile, { upsert: false });

      if (uploadErr) {
        const reason = uploadErr.message || "Unknown upload error";
        if (/origin not allowed/i.test(reason)) {
          setError("Upload blocked by browser extension or CORS policy. Disable interfering extensions for localhost and check Supabase Storage CORS/bucket policies.");
        } else {
          setError(`File upload failed: ${reason}`);
        }
        return;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      finalUrl = data.publicUrl;
      if (note) {
        setNotice(note);
      }
    }

    const inferredFromFile = deliverableFile?.name?.replace(/\.[^/.]+$/, "")?.trim() ?? "";
    const inferredFromUrl = (() => {
      if (!finalUrl) return "";
      try {
        const path = new URL(finalUrl).pathname;
        const last = decodeURIComponent(path.split("/").filter(Boolean).pop() ?? "");
        return last.replace(/\.[^/.]+$/, "").trim();
      } catch {
        return "";
      }
    })();
    const finalTitle = deliverableForm.title.trim() || inferredFromFile || inferredFromUrl || `Material ${new Date().toLocaleString()}`;

    if (!finalUrl || !/^https?:\/\//i.test(finalUrl)) {
      setError("Provide a valid file URL or upload a file.");
      return;
    }

    const { error: insertErr } = await supabase.from("deliverables").insert({
      project_id: effectiveProjectId,
      title: finalTitle,
      category: deliverableForm.category.trim(),
      url: finalUrl,
      created_at: new Date().toISOString(),
    });

    if (insertErr) {
      setError(t.errorLoad);
      return;
    }

    setNotice(t.noticeCreated);
    setDeliverableForm((prev) => ({ ...prev, title: "", url: "", createdAt: "" }));
    setDeliverableFile(null);
    await loadProjectResources(effectiveProjectId);
  }

  async function handleDeleteDeliverable(id: string) {
    setNotice(null);
    setError(null);

    const { error: deleteErr } = await supabase.from("deliverables").delete().eq("id", id);
    if (deleteErr) {
      setError(t.errorLoad);
      return;
    }

    setNotice("Material deleted.");
    await loadProjectResources(selectedProjectId);
  }

  async function handleRunMaterialsDiagnostics() {
    const lines: string[] = [];
    setMaterialsDiagRunning(true);
    setMaterialsDiagLines([]);

    try {
      const effectiveProjectId = selectedProjectId || selectedProject?.id || "";
      const effectiveClientId = selectedClientId || selectedProject?.client_id || "";

      lines.push(`Project selected: ${effectiveProjectId ? "yes" : "no"}`);
      lines.push(`Client selected: ${effectiveClientId ? "yes" : "no"}`);
      lines.push(`Supabase URL configured: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "yes" : "no"}`);
      lines.push(`Supabase anon key configured: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "yes" : "no"}`);

      const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
      if (bucketsErr) {
        lines.push(`Bucket list error: ${bucketsErr.message}`);
      } else {
        const exists = (buckets ?? []).some((bucket) => bucket.name === "deliverables");
        lines.push(`Bucket 'deliverables' exists: ${exists ? "yes" : "no"}`);
        const visibleBuckets = (buckets ?? []).map((bucket) => bucket.name);
        lines.push(`Available buckets: ${visibleBuckets.join(", ") || "none"}`);
        if (visibleBuckets.length === 0) {
          lines.push("Note: bucket listing can be hidden by RLS for anon key; direct upload to known bucket may still work.");
        }
      }

      const resolved = await resolveMaterialsBucket();
      lines.push(`Resolved upload bucket: ${resolved.bucket ?? "none"}`);
      if (resolved.note) lines.push(resolved.note);

      if (!effectiveProjectId) {
        lines.push("Stop: select a project first.");
        setMaterialsDiagLines(lines);
        return;
      }

      const folder = `${effectiveClientId || "unknown-client"}/${effectiveProjectId}`;
      const bucketForTest = resolved.bucket || "deliverables";
      const { error: readErr } = await supabase.storage.from(bucketForTest).list(folder, { limit: 1 });
      if (readErr) {
        lines.push(`Read test failed: ${readErr.message}`);
      } else {
        lines.push("Read test passed.");
      }

      const diagPath = `__diag__/${folder}/${Date.now()}-check.txt`;
      const diagBlob = new Blob(["storage diagnostic"], { type: "text/plain" });
      const { error: uploadErr } = await supabase.storage.from(bucketForTest).upload(diagPath, diagBlob, { upsert: false });

      if (uploadErr) {
        lines.push(`Upload test failed: ${uploadErr.message}`);
        if (/origin not allowed/i.test(uploadErr.message)) {
          lines.push("Hint: disable interfering browser extensions for localhost and verify Storage CORS settings.");
        }
      } else {
        lines.push("Upload test passed.");
        const { error: removeErr } = await supabase.storage.from(bucketForTest).remove([diagPath]);
        if (removeErr) {
          lines.push(`Cleanup warning: ${removeErr.message}`);
        } else {
          lines.push("Cleanup passed.");
        }
      }
    } finally {
      setMaterialsDiagRunning(false);
      setMaterialsDiagLines(lines);
    }
  }

  async function handleCreateClient() {
    setNotice(null);
    setError(null);

    const payload = {
      brand_name: newClientForm.brandName.trim(),
      username: newClientForm.portalEnabled ? newClientForm.username.trim() : "",
      password: newClientForm.portalEnabled ? newClientForm.password.trim() : "",
      whatsapp_number: normalizeWhatsappForStorage(newClientForm.whatsapp.trim()),
      ...(supportsPortalEnabled ? { portal_enabled: newClientForm.portalEnabled } : {}),
      ...(supportsClientOptionalFields
        ? {
            notes: "",
            source: "",
            preferred_language: language,
            preferred_currency: "AZN",
          }
        : {}),
    };

    if (!payload.brand_name || !payload.whatsapp_number) {
      setError(t.errorRequired);
      return;
    }

    if (payload.portal_enabled && (!payload.username || !payload.password)) {
      setError("Generate portal credentials before activating access.");
      return;
    }

    const { error: insertErr } = await supabase.from("clients").insert(payload);
    if (insertErr) {
      setError(t.errorLoad);
      return;
    }

    setNotice(t.noticeCreated);
    setNewClientForm({ brandName: "", username: "", password: "", whatsapp: "", portalEnabled: false });
    await loadLists();
  }

  function openClientProfile(client: ClientOption) {
    setSelectedClientId(client.id);
    setProfileClientId(client.id);
    setIsClientProjectsModalOpen(false);
    const inferred = inferPortalEnabled(client);
    const companyName = client.brand_name ?? "";
    const representativeName = client.username ?? "";
    const portalUsername = (client.username ?? "").trim() || createPortalUsername(companyName, representativeName);
    const rawPassword = (client.password ?? "").trim();
    const portalPassword = isDisabledPortalPassword(rawPassword) ? rawPassword.replace(/^DISABLED::/, "") : rawPassword;

    setClientProfileDraft({
      companyName,
      representativeName,
      whatsappNumber: client.whatsapp_number ?? "",
      portalEnabled: inferred,
      portalUsername,
      portalPassword,
      notes: client.notes ?? "",
      source: client.source ?? "",
      preferredLanguage: client.preferred_language ?? "az",
      preferredCurrency: client.preferred_currency ?? "AZN",
    });
    setIsClientProfileOpen(true);
  }

  function handleTogglePortalAccess() {
    setClientProfileDraft((prev) => {
      const nextEnabled = !prev.portalEnabled;
      const nextUsername = prev.portalUsername.trim() || createPortalUsername(prev.companyName, prev.representativeName);
      const cleanedPassword = prev.portalPassword.replace(/^DISABLED::/, "").trim();
      const nextPassword = cleanedPassword || createPortalPassword();

      return {
        ...prev,
        portalEnabled: nextEnabled,
        portalUsername: nextUsername,
        portalPassword: nextPassword,
      };
    });
  }

  async function handleSaveClientProfile() {
    setNotice(null);
    setError(null);

    const targetClientId = profileClientId || selectedClientId;

    if (!targetClientId) {
      setError("Choose a client first.");
      return;
    }

    const cleanedPassword = clientProfileDraft.portalPassword.replace(/^DISABLED::/, "").trim() || createPortalPassword();

    const payload = {
      brand_name: clientProfileDraft.companyName.trim(),
      username: clientProfileDraft.portalUsername.trim() || createPortalUsername(clientProfileDraft.companyName, clientProfileDraft.representativeName),
      password: clientProfileDraft.portalEnabled
        ? cleanedPassword
        : `DISABLED::${cleanedPassword}`,
      whatsapp_number: normalizeWhatsappForStorage(clientProfileDraft.whatsappNumber),
      ...(supportsPortalEnabled ? { portal_enabled: clientProfileDraft.portalEnabled } : {}),
      ...(supportsClientOptionalFields
        ? {
            notes: clientProfileDraft.notes.trim(),
            source: clientProfileDraft.source.trim(),
            preferred_language: clientProfileDraft.preferredLanguage,
            preferred_currency: clientProfileDraft.preferredCurrency,
          }
        : {}),
    };

    if (!payload.brand_name || !payload.username || !payload.whatsapp_number) {
      setError("Company, representative and WhatsApp are required.");
      return;
    }

    if (clientProfileDraft.portalEnabled && !payload.password) {
      setError("Portal access needs a password.");
      return;
    }

    const { error: updateErr } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", targetClientId);

    if (updateErr) {
      setError(t.errorLoad);
      return;
    }

    setNotice("Client profile updated.");
    setSuccessPopup("Profile saved successfully");
    setIsClientProfileOpen(false);
    setIsClientProjectsModalOpen(false);
    setProfileClientId("");
    await loadLists(targetClientId, selectedProjectId);
  }

  async function handleCreateClientFromProfileDraft() {
    setNotice(null);
    setError(null);

    const companyName = clientProfileDraft.companyName.trim();
    const representativeName = clientProfileDraft.representativeName.trim();
    const portalUsername = clientProfileDraft.portalUsername.trim() || createPortalUsername(companyName, representativeName);
    const cleanedPassword = clientProfileDraft.portalPassword.replace(/^DISABLED::/, "").trim() || createPortalPassword();

    const payload = {
      brand_name: companyName,
      username: representativeName || portalUsername,
      password: clientProfileDraft.portalEnabled ? cleanedPassword : `DISABLED::${cleanedPassword}`,
      whatsapp_number: normalizeWhatsappForStorage(clientProfileDraft.whatsappNumber),
      ...(supportsPortalEnabled ? { portal_enabled: clientProfileDraft.portalEnabled } : {}),
      ...(supportsClientOptionalFields
        ? {
            notes: clientProfileDraft.notes.trim(),
            source: clientProfileDraft.source.trim(),
            preferred_language: clientProfileDraft.preferredLanguage,
            preferred_currency: clientProfileDraft.preferredCurrency,
          }
        : {}),
    };

    if (!payload.brand_name || !payload.whatsapp_number) {
      setError("Company and WhatsApp are required.");
      return;
    }

    if (clientProfileDraft.portalEnabled && (!portalUsername || !cleanedPassword)) {
      setError("Portal access requires username and password.");
      return;
    }

    const { data, error: insertErr } = await supabase
      .from("clients")
      .insert(payload)
      .select("id")
      .single();

    if (insertErr) {
      setError(t.errorLoad);
      return;
    }

    const createdClientId = data?.id ?? "";
    setNotice(t.noticeCreated);
    setSuccessPopup("Client created successfully");
    setProfileClientId("");
    setIsInlineCreateClientMode(false);
    setIsInlineEditClientMode(false);
    setClientProfileDraft(createEmptyClientProfileDraft());

    await loadLists(createdClientId || selectedClientId, selectedProjectId);

    if (createdClientId) {
      setSelectedClientForDetails(createdClientId);
      setSelectedClientId(createdClientId);
      persistOwnerSelection(createdClientId, selectedProjectId);
    }
  }

  async function handleSaveClientProfileInline() {
    setNotice(null);
    setError(null);

    const targetClientId = profileClientId || selectedClientForDetails || selectedClientId;

    if (!targetClientId) {
      setError("Choose a client first.");
      return;
    }

    const cleanedPassword = clientProfileDraft.portalPassword.replace(/^DISABLED::/, "").trim() || createPortalPassword();

    const payload = {
      brand_name: clientProfileDraft.companyName.trim(),
      username: clientProfileDraft.portalUsername.trim() || createPortalUsername(clientProfileDraft.companyName, clientProfileDraft.representativeName),
      password: clientProfileDraft.portalEnabled
        ? cleanedPassword
        : `DISABLED::${cleanedPassword}`,
      whatsapp_number: normalizeWhatsappForStorage(clientProfileDraft.whatsappNumber),
      ...(supportsPortalEnabled ? { portal_enabled: clientProfileDraft.portalEnabled } : {}),
      ...(supportsClientOptionalFields
        ? {
            notes: clientProfileDraft.notes.trim(),
            source: clientProfileDraft.source.trim(),
            preferred_language: clientProfileDraft.preferredLanguage,
            preferred_currency: clientProfileDraft.preferredCurrency,
          }
        : {}),
    };

    if (!payload.brand_name || !payload.username || !payload.whatsapp_number) {
      setError("Company, representative and WhatsApp are required.");
      return;
    }

    const { error: updateErr } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", targetClientId);

    if (updateErr) {
      setError(t.errorLoad);
      return;
    }

    setNotice("Client profile updated.");
    setSuccessPopup("Profile saved successfully");
    setIsInlineEditClientMode(false);
    setProfileClientId("");
    await loadLists(targetClientId, selectedProjectId);
    setSelectedClientForDetails(targetClientId);
  }

  async function handleDeleteClientProfile(clientId: string) {
    setNotice(null);
    setError(null);

    const clientProjects = projects.filter((project) => project.client_id === clientId);
    const projectIds = clientProjects.map((project) => project.id);

    if (projectIds.length > 0) {
      const { error: deleteDeliverablesErr } = await supabase
        .from("deliverables")
        .delete()
        .in("project_id", projectIds);

      if (deleteDeliverablesErr) {
        setError("Could not remove deliverables for this client.");
        return;
      }

      const { error: deleteInvoicesErr } = await supabase
        .from("invoices")
        .delete()
        .in("project_id", projectIds);

      if (deleteInvoicesErr) {
        setError("Could not remove invoices for this client.");
        return;
      }

      const { error: deleteProjectsErr } = await supabase
        .from("projects")
        .delete()
        .in("id", projectIds);

      if (deleteProjectsErr) {
        setError("Could not remove projects for this client.");
        return;
      }
    }

    const { error: deleteSessionsErr } = await supabase
      .from("portal_sessions")
      .delete()
      .eq("client_id", clientId);

    if (deleteSessionsErr) {
      setError("Could not remove client sessions.");
      return;
    }

    const { error: deleteClientErr } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (deleteClientErr) {
      setError("Could not delete client profile.");
      return;
    }

    setNotice("Client deleted.");
    setSuccessPopup("Client removed successfully");
    setIsInlineEditClientMode(false);
    setIsInlineCreateClientMode(false);
    setProfileClientId("");
    setSelectedClientForDetails(null);

    await loadLists("", "");
  }

  async function handleCreateProject() {
    setNotice(null);
    setError(null);

    if (!selectedClientId || !newProjectForm.name.trim()) {
      setError(t.errorRequired);
      return;
    }

    const { data, error: insertErr } = await supabase
      .from("projects")
      .insert({
        client_id: selectedClientId,
        name: newProjectForm.name.trim(),
        service: newProjectForm.service,
        status: newProjectForm.status,
        progress: Number(newProjectForm.progress) || 0,
        start_date: newProjectForm.startDate || null,
        delivery_date: newProjectForm.deliveryDate || null,
        latest_update: newProjectForm.latestUpdate.trim() || "Project created.",
      })
      .select("id")
      .single();

    if (insertErr) {
      setError(t.errorLoad);
      return;
    }

    setNotice(t.noticeCreated);
    setNewProjectForm({
      name: "",
      service: "website",
      status: "planning",
      progress: 0,
      startDate: "",
      deliveryDate: "",
      latestUpdate: "",
    });
    await loadLists(selectedClientId, data?.id);
  }

  async function handleUpdateProject() {
    setNotice(null);
    setError(null);

    if (!selectedProjectId) {
      setError("No project selected.");
      return;
    }

    const updatedProject = {
      name: projectDraft.name.trim(),
      service: projectDraft.service,
      status: projectDraft.status,
      progress: Number(projectDraft.progress) || 0,
      start_date: projectDraft.startDate || null,
      delivery_date: projectDraft.deliveryDate || null,
      latest_update: projectDraft.latestUpdate.trim() || null,
    };

    const { error: updateErr } = await supabase
      .from("projects")
      .update(updatedProject)
      .eq("id", selectedProjectId);

    if (updateErr) {
      setError(withErrorDetails("Could not update project.", updateErr));
      return;
    }

    setNotice("Project updated.");
    setIsEditingProject(false);
    
    // Reload lists to update projects state
    await loadLists(selectedClientId, selectedProjectId);
    
    // Re-enrich invoices with updated project data
    const clientProjectIds = projects
      .filter((project) => project.client_id === selectedClientId)
      .map((project) => project.id);
    const scopedProjectIds = clientProjectIds.length > 0 ? clientProjectIds : [selectedProjectId];
    
    const updatedProjectMap = new Map(
      projects.map((p) => [
        p.id,
        p.id === selectedProjectId ? { ...p, ...updatedProject } : p,
      ] as const)
    );

    const { data: invoiceRows } = await supabase
      .from("invoices")
      .select("id, project_id, invoice_number, amount, status, issue_date, due_date, metadata, paid_amount")
      .in("project_id", scopedProjectIds)
      .order("issue_date", { ascending: false });

    const enrichedInvoices = ((invoiceRows ?? []) as InvoiceRow[]).map((invoice) => {
      const proj = updatedProjectMap.get(invoice.project_id);
      return {
        ...invoice,
        project_name: proj?.name ?? "Unknown project",
        project_service: proj?.service,
      };
    });

    setProjectInvoices(enrichedInvoices);
  }

  async function handleDeleteProject(projectId: string) {
    setNotice(null);
    setError(null);

    const { error: deleteErr } = await supabase.from("projects").delete().eq("id", projectId);
    if (deleteErr) {
      setError(withErrorDetails("Could not delete project (invoices preserved).", deleteErr));
      return;
    }

    if (selectedProjectId === projectId) {
      setSelectedProjectId("");
      persistOwnerSelection(selectedClientId, "");
    }

    setNotice("Project deleted. Associated invoices preserved.");
    await loadLists(selectedClientId, selectedProjectId === projectId ? undefined : selectedProjectId);
  }

  async function handleMarkInvoiceAsMisc(invoiceId: string) {
    setNotice(null);
    setError(null);

    const activeRow = projectInvoices.find((inv) => inv.id === invoiceId);
    if (!activeRow) {
      setError("Invoice not found.");
      return;
    }

    const { error: updateErr } = await supabase
      .from("invoices")
      .update({
        metadata: {
          ...(activeRow.metadata ?? {}),
          serviceCategory: "misc",
          projectLabel: activeRow.metadata?.projectLabel || "Miscellaneous",
          companyName: activeRow.metadata?.companyName || activeRow.metadata?.customerName || "Miscellaneous",
        },
      })
      .eq("id", invoiceId);

    if (updateErr) {
      setError(withErrorDetails("Could not mark as MISC.", updateErr));
      return;
    }

    const nextMap: Record<string, InvoiceMeta> = {
      ...invoiceMetaMap,
      [invoiceId]: {
        ...(invoiceMetaMap[invoiceId] ?? {}),
        serviceCategory: "misc" as any,
      },
    };
    persistInvoiceMeta(nextMap, activeRow.project_id);
    setIsInvoiceActionsOpen(false);
    setNotice("Invoice marked as MISC.");
    await loadProjectResources(selectedProjectId);
  }

  async function handleSaveSmmUpdate() {
    setNotice(null);
    setError(null);

    if (!selectedProjectId || selectedProject?.service !== "smm") {
      setError(t.chooseSmmProject);
      return;
    }

    const normalizedNextPost = getNextPostFromSmmSchedule(smmSchedule) || smmNextPostTime.trim();
    const payload: SmmAdminPayload = {
      heroTitle: smmHeroTitle || smmClientCopyFallback.heroTitle,
      heroSubtitle: smmHeroSubtitle || smmClientCopyFallback.heroSubtitle,
      summaryTitle: "",
      summaryText: "",
      calendarTitle: smmCalendarTitle || smmClientCopyFallback.calendarTitle,
      calendarText: smmCalendarText || smmClientCopyFallback.calendarText,
      postsTitle: smmPostsTitle || smmClientCopyFallback.postsTitle,
      postsText: smmPostsText || smmClientCopyFallback.postsText,
      reportingTitle: "",
      reportingText: "",
      heroImageUrl: smmHeroImageUrl,
      cadence: smmCadence || smmFallbackDraft.cadence,
      nextPostTime: normalizedNextPost || smmFallbackDraft.nextPostTime,
      focus: smmFocus || smmFallbackDraft.focus,
      managerNote: smmManagerNote,
      postsPerWeek: Number(smmPostsPerWeek) || 0,
      schedule: smmSchedule,
    };

    const composed = `${SMM_ADMIN_PREFIX}${JSON.stringify(payload)}`;
    const { error: updateErr } = await supabase.from("projects").update({ latest_update: composed }).eq("id", selectedProjectId);

    if (updateErr) {
      setError(t.errorLoad);
      return;
    }

    setProjectDraft((prev) => ({ ...prev, latestUpdate: composed }));
    setSmmInitialDraft({
      cadence: smmCadence,
      nextPostTime: normalizedNextPost,
      focus: smmFocus,
      managerNote: smmManagerNote,
    });
    setSmmNextPostTime(normalizedNextPost);
    setSmmInitialSchedule(smmSchedule);
    setSmmHeroTitle(payload.heroTitle);
    setSmmHeroSubtitle(payload.heroSubtitle);
    setSmmCalendarTitle(payload.calendarTitle);
    setSmmCalendarText(payload.calendarText);
    setSmmPostsTitle(payload.postsTitle);
    setSmmPostsText(payload.postsText);
    setSmmHeroImageUrl(payload.heroImageUrl);
    setNotice(t.noticeSaved);
    await loadLists(selectedClientId, selectedProjectId);
  }

  function handleResetSmmDraft() {
    setSmmCadence(smmInitialDraft.cadence);
    setSmmNextPostTime(smmInitialDraft.nextPostTime);
    setSmmFocus(smmInitialDraft.focus);
    setSmmManagerNote(smmInitialDraft.managerNote);
    setSmmSchedule(smmInitialSchedule);
    setSmmHeroTitle(smmClientCopyFallback.heroTitle);
    setSmmHeroSubtitle(smmClientCopyFallback.heroSubtitle);
    setSmmSummaryTitle(smmClientCopyFallback.summaryTitle);
    setSmmSummaryText(smmClientCopyFallback.summaryText);
    setSmmCalendarTitle(smmClientCopyFallback.calendarTitle);
    setSmmCalendarText(smmClientCopyFallback.calendarText);
    setSmmPostsTitle(smmClientCopyFallback.postsTitle);
    setSmmPostsText(smmClientCopyFallback.postsText);
    setSmmReportingTitle(smmClientCopyFallback.reportingTitle);
    setSmmReportingText(smmClientCopyFallback.reportingText);
    setSmmHeroImageUrl(smmClientCopyFallback.heroImageUrl);
  }

  function handleAddSmmItem(day: string = "Mon") {
    setSmmSchedule((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        day,
        time: "11:00",
        content: "New post",
        status: "planned",
        mediaUrl: "",
      },
    ]);
  }

  function handleRemoveSmmItem(id: string) {
    setSmmSchedule((prev) => prev.filter((item) => item.id !== id));
  }

  function handleUpdateSmmItem(id: string, patch: Partial<SmmScheduleItem>) {
    setSmmSchedule((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  const invoiceSubtotal = calcInvoiceSubtotal(invoiceDraft.items);
  const invoiceDiscount = calcInvoiceDiscount(invoiceSubtotal, invoiceDraft.discountType, invoiceDraft.discountValue);
  const invoiceTotal = calcInvoiceTotal(invoiceDraft.items, invoiceDraft.discountType, invoiceDraft.discountValue, invoiceDraft.taxType, invoiceDraft.taxValue);
  const selectedInvoiceRow = selectedInvoiceId ? projectInvoices.find((item) => item.id === selectedInvoiceId) ?? null : null;
  const selectedInvoiceProject = selectedInvoiceRow ? projects.find((project) => project.id === selectedInvoiceRow.project_id) ?? null : null;
  const selectedInvoiceClient = selectedInvoiceProject ? clients.find((client) => client.id === selectedInvoiceProject.client_id) ?? null : null;
  const selectedInvoiceProjectClientId = selectedInvoiceProject?.client_id ?? "";
  const effectiveInvoiceClientId = isCreatingInvoice
    ? invoiceTargetClientId
    : selectedInvoiceProjectClientId;
  const invoiceProjectsForActiveClient = projects.filter((project) => project.client_id === effectiveInvoiceClientId);
  const effectiveInvoiceProjectId = isCreatingInvoice
    ? invoiceTargetProjectId
    : (invoiceEditProjectId || selectedInvoiceRow?.project_id || "");
  const invoiceProjectOptions = invoiceProjectsForActiveClient.map((project) => ({
    id: project.id,
    label: project.name,
    description: project.service.toUpperCase(),
  }));
  const selectedInvoiceDisplayMeta = selectedInvoiceRow ? inferInvoiceMeta(selectedInvoiceRow) : null;
  const selectedInvoiceVoided = selectedInvoiceId ? Boolean(invoiceMetaMap[selectedInvoiceId]?.isVoided) : false;
  const showInvoiceDetails = isCreatingInvoice || Boolean(selectedInvoiceId && selectedInvoiceRow);
  const showMobileInvoiceDetails = showInvoiceDetails && isMobileInvoiceViewport;
  const isInvoiceEditable = isCreatingInvoice || isInvoiceEditMode;
  const selectedInvoicePaid = selectedInvoiceRow
    ? Math.max(
        0,
        Math.min(
          selectedInvoiceRow.amount,
          Number(selectedInvoiceRow.paid_amount ?? (selectedInvoiceRow.status === "paid" ? selectedInvoiceRow.amount : 0))
        )
      )
    : 0;
  const selectedInvoiceRemaining = selectedInvoiceRow ? Math.max(selectedInvoiceRow.amount - selectedInvoicePaid, 0) : 0;
  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);

  const filteredInvoiceRows = useMemo(() => {
    const search = deferredInvoiceSearchQuery.trim().toLowerCase();

    return projectInvoices.filter((invoice) => {
      const invoiceMeta = inferInvoiceMeta(invoice);
      const invoiceProject = projectsById.get(invoice.project_id) ?? null;
      const invoiceClient = invoiceProject ? clientsById.get(invoiceProject.client_id) ?? null : null;
      const effectiveService = normalizeInvoiceServiceFilterValue(
        invoiceMeta.serviceCategory ?? invoice.project_service ?? invoiceProject?.service,
        "website"
      );
      const searchHaystack = [
        invoice.invoice_number,
        invoice.project_name ?? "",
        invoiceClient?.brand_name ?? "",
        invoiceClient?.username ?? "",
        invoiceMeta.companyName ?? "",
        invoice.metadata?.customerName ?? "",
        invoiceMeta.projectLabel ?? "",
        invoice.metadata?.customerEmail ?? "",
        invoice.issue_date ?? "",
        invoice.due_date ?? "",
        invoice.status,
        effectiveService,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchHaystack.includes(search);
      const matchesStatus = deferredInvoiceStatusFilter === "all" || invoice.status === deferredInvoiceStatusFilter;
      const matchesService = deferredInvoiceServiceFilter === "all" || effectiveService === deferredInvoiceServiceFilter;

      return matchesSearch && matchesStatus && matchesService;
    });
  }, [clientsById, deferredInvoiceSearchQuery, deferredInvoiceServiceFilter, deferredInvoiceStatusFilter, projectInvoices, projectsById]);

  const totalInvoicePages = Math.max(1, Math.ceil(filteredInvoiceRows.length / invoicePageSize));
  const currentInvoicePage = Math.min(invoicePage, totalInvoicePages);
  const paginatedInvoiceRows = useMemo(() => {
    const start = (currentInvoicePage - 1) * invoicePageSize;
    return filteredInvoiceRows.slice(start, start + invoicePageSize);
  }, [currentInvoicePage, filteredInvoiceRows, invoicePageSize]);

  const invoiceStatusCounts = useMemo(
    () =>
      filteredInvoiceRows.reduce(
        (acc, invoice) => {
          acc.all += 1;
          acc[invoice.status] += 1;
          return acc;
        },
        { all: 0, paid: 0, unpaid: 0, partial: 0 }
      ),
    [filteredInvoiceRows]
  );

  const invoiceServiceOptions = useMemo(() => {
    const serviceSet = new Set<Exclude<InvoiceServiceFilter, "all">>();

    projectInvoices.forEach((invoice) => {
      const invoiceMeta = inferInvoiceMeta(invoice);
      const service = normalizeInvoiceServiceFilterValue(invoiceMeta.serviceCategory ?? invoice.project_service, "website");
      serviceSet.add(service);
    });

    return Array.from(serviceSet).sort();
  }, [projectInvoices]);

  const invoiceStatusFilterLabel =
    invoiceStatusFilter === "all"
      ? "All statuses"
      : invoiceStatusFilter === "paid"
        ? "Paid"
        : invoiceStatusFilter === "partial"
          ? "Partial"
          : "Unpaid";

  const invoiceServiceFilterLabel = invoiceServiceFilter === "all" ? "All services" : invoiceServiceFilter.toUpperCase();
  const invoicePageSizeLabel = `${invoicePageSize} / page`;
  const invoiceStatusModalOptions: FilterChoice[] = [
    { value: "all", label: "All statuses", description: `Show every invoice · ${invoiceStatusCounts.all}` },
    { value: "paid", label: "Paid", description: `${invoiceStatusCounts.paid} invoices` },
    { value: "partial", label: "Partial", description: `${invoiceStatusCounts.partial} invoices` },
    { value: "unpaid", label: "Unpaid", description: `${invoiceStatusCounts.unpaid} invoices` },
  ];

  const invoiceServiceModalOptions: FilterChoice[] = [
    { value: "all", label: "All services", description: "Show invoices from every service" },
    ...invoiceServiceOptions.map((service) => ({
      value: service,
      label: service.toUpperCase(),
      description: `Filter by ${service.toUpperCase()}`,
    })),
  ];

  const invoicePageSizeModalOptions: FilterChoice[] = [
    { value: "10", label: "10 / page", description: "Balanced default view" },
    { value: "25", label: "25 / page", description: "Show more rows at once" },
    { value: "50", label: "50 / page", description: "Maximize page density" },
  ];

  useEffect(() => {
    setInvoicePage(1);
  }, [invoiceSearchQuery, invoiceStatusFilter, invoiceServiceFilter, selectedClientId, selectedProjectId, invoicePageSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const syncViewport = () => setIsMobileInvoiceViewport(mediaQuery.matches);

    syncViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    if (!showMobileInvoiceDetails) return;

    const bodyStyle = document.body.style;
    const lockScrollY = mobileInvoiceScrollYRef.current ?? window.scrollY;
    mobileInvoiceScrollYRef.current = lockScrollY;

    const previous = {
      position: bodyStyle.position,
      top: bodyStyle.top,
      left: bodyStyle.left,
      right: bodyStyle.right,
      width: bodyStyle.width,
      overflow: bodyStyle.overflow,
    };

    bodyStyle.position = "fixed";
    bodyStyle.top = `-${lockScrollY}px`;
    bodyStyle.left = "0";
    bodyStyle.right = "0";
    bodyStyle.width = "100%";
    bodyStyle.overflow = "hidden";

    return () => {
      bodyStyle.position = previous.position;
      bodyStyle.top = previous.top;
      bodyStyle.left = previous.left;
      bodyStyle.right = previous.right;
      bodyStyle.width = previous.width;
      bodyStyle.overflow = previous.overflow;

      window.scrollTo({ top: mobileInvoiceScrollYRef.current ?? 0, behavior: "auto" });
    };
  }, [showMobileInvoiceDetails]);

  useEffect(() => {
    if (!invoiceFilterModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setInvoiceFilterModal(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [invoiceFilterModal]);

  useEffect(() => {
    if (currentInvoicePage !== invoicePage) {
      setInvoicePage(currentInvoicePage);
    }
  }, [currentInvoicePage, invoicePage]);

  const overviewProjectText = (() => {
    if (!selectedProject) return "Select a client or switch to general mode to see company-wide stats.";
    const structured = parseSmmAdminPayload(selectedProject.latest_update);
    if (structured) return formatSmmReadableUpdate(structured);
    return selectedProject.latest_update ?? "No update yet.";
  })();
  const visibleTabItems = isGeneralMode ? generalOwnerTabItems : ownerTabItems;
  const smmDoneCount = smmSchedule.filter((item) => item.status === "done").length;
  const smmPendingCount = smmSchedule.filter((item) => item.status !== "done").length;
  const smmAutoNextPost = getNextPostFromSmmSchedule(smmSchedule) || smmNextPostTime || "—";

  const generalOverviewAnalytics = useMemo(() => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayMs = 24 * 60 * 60 * 1000;

    const projectMap = new Map(projects.map((project) => [project.id, project]));

    const resolveInvoiceDate = (invoice: InvoiceRow) => {
      const raw = invoice.issue_date || invoice.due_date;
      if (!raw) return null;
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed;
    };

    const earliestAvailableDate = (() => {
      const invoiceDates = projectInvoices.map(resolveInvoiceDate).filter((date): date is Date => Boolean(date));
      if (invoiceDates.length > 0) {
        return new Date(Math.min(...invoiceDates.map((date) => date.getTime())));
      }

      const projectDates = projects
        .flatMap((project) => [project.start_date, project.delivery_date])
        .map((value) => (value ? new Date(value) : null))
        .filter((date): date is Date => date !== null && !Number.isNaN(date.getTime()));

      if (projectDates.length > 0) {
        return new Date(Math.min(...projectDates.map((date) => date.getTime())));
      }

      return new Date(now.getFullYear(), 0, 1);
    })();

    const toDateStart = (value: string) => {
      const parsed = new Date(`${value}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed;
    };

    const toDateEnd = (value: string) => {
      const parsed = new Date(`${value}T23:59:59`);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed;
    };

    const customStart = overviewCustomRange.start ? toDateStart(overviewCustomRange.start) : null;
    const customEnd = overviewCustomRange.end ? toDateEnd(overviewCustomRange.end) : null;
    const hasValidCustomRange = Boolean(customStart && customEnd && customStart <= customEnd);

    const startDate = (() => {
      if (overviewRange === "7d") return new Date(todayMidnight.getTime() - 6 * 24 * 60 * 60 * 1000);
      if (overviewRange === "30d") return new Date(todayMidnight.getTime() - 29 * 24 * 60 * 60 * 1000);
      if (overviewRange === "ytd") return new Date(now.getFullYear(), 0, 1);
      if (overviewRange === "custom" && hasValidCustomRange && customStart) return customStart;
      if (overviewRange === "all") return earliestAvailableDate;
      return new Date(now.getFullYear(), now.getMonth() - 11, 1);
    })();

    const endDate = overviewRange === "custom" && hasValidCustomRange && customEnd ? customEnd : now;

    const scopedInvoices = projectInvoices.filter((invoice) => {
      const date = resolveInvoiceDate(invoice);
      if (!date) return false;
      return date >= startDate && date <= endDate;
    });

    const amountForInvoice = (invoice: InvoiceRow) => Number(invoice.amount) || 0;
    const receivedForInvoice = (invoice: InvoiceRow) => {
      if (typeof invoice.paid_amount === "number" && Number.isFinite(invoice.paid_amount)) return Math.max(0, invoice.paid_amount);
      if (invoice.status === "paid") return amountForInvoice(invoice);
      return 0;
    };

    const totalInvoiced = scopedInvoices.reduce((sum, invoice) => sum + amountForInvoice(invoice), 0);
    const totalReceived = scopedInvoices.reduce((sum, invoice) => sum + Math.min(receivedForInvoice(invoice), amountForInvoice(invoice)), 0);
    const outstandingAmount = Math.max(0, totalInvoiced - totalReceived);

    const overdueInvoices = scopedInvoices.filter((invoice) => {
      if (invoice.status === "paid") return false;
      if (!invoice.due_date) return false;
      const due = new Date(invoice.due_date);
      if (Number.isNaN(due.getTime())) return false;
      return due < todayMidnight;
    });

    const averageInvoice = scopedInvoices.length ? totalInvoiced / scopedInvoices.length : 0;
    const collectionRate = totalInvoiced > 0 ? (totalReceived / totalInvoiced) * 100 : 0;
    const unpaidCount = scopedInvoices.filter((invoice) => invoice.status !== "paid").length;
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => {
      const amount = amountForInvoice(invoice);
      const remaining = amount - Math.min(receivedForInvoice(invoice), amount);
      return sum + Math.max(0, remaining);
    }, 0);

    const rangeDurationMs = Math.max(dayMs, endDate.getTime() - startDate.getTime() + 1);
    const previousStartDate = new Date(startDate.getTime() - rangeDurationMs);
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousInvoices = projectInvoices.filter((invoice) => {
      const date = resolveInvoiceDate(invoice);
      if (!date) return false;
      return date >= previousStartDate && date <= previousEndDate;
    });
    const previousInvoiced = previousInvoices.reduce((sum, invoice) => sum + amountForInvoice(invoice), 0);
    const previousReceived = previousInvoices.reduce((sum, invoice) => sum + Math.min(receivedForInvoice(invoice), amountForInvoice(invoice)), 0);

    const calcDeltaPct = (currentValue: number, previousValue: number) => {
      if (previousValue <= 0) return currentValue > 0 ? 100 : 0;
      return ((currentValue - previousValue) / previousValue) * 100;
    };

    const activeClients = new Set(
      projects
        .filter((project) => project.status !== "delivered")
        .map((project) => project.client_id),
    ).size;

    const serviceRevenueMap = new Map<ServiceType, number>();
    scopedInvoices.forEach((invoice) => {
      const project = projectMap.get(invoice.project_id);
      if (!project) return;
      const current = serviceRevenueMap.get(project.service) ?? 0;
      serviceRevenueMap.set(project.service, current + receivedForInvoice(invoice));
    });

    const topServiceEntry = Array.from(serviceRevenueMap.entries()).sort((a, b) => b[1] - a[1])[0];

    const buildKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const buildMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    const chartRows: Array<{ key: string; label: string; year: number; invoiced: number; received: number }> = [];
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const totalDays = Math.max(1, Math.floor((endDay.getTime() - startDay.getTime()) / dayMs) + 1);
    const dayBased = overviewRange === "7d" || overviewRange === "30d" || (overviewRange === "custom" && totalDays <= 62);

    if (dayBased) {
      const days = overviewRange === "7d" ? 7 : overviewRange === "30d" ? 30 : totalDays;
      for (let i = 0; i < days; i += 1) {
        const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
        chartRows.push({
          key: buildKey(d),
          label: d.toLocaleDateString("en-US", {
            weekday: days <= 10 ? "short" : undefined,
            month: days > 10 ? "short" : undefined,
            day: "numeric",
          }),
          year: d.getFullYear(),
          invoiced: 0,
          received: 0,
        });
      }
    } else {
      const monthStart = overviewRange === "ytd"
        ? new Date(now.getFullYear(), 0, 1)
        : overviewRange === "custom"
          ? new Date(startDate.getFullYear(), startDate.getMonth(), 1)
          : overviewRange === "all"
            ? new Date(earliestAvailableDate.getFullYear(), earliestAvailableDate.getMonth(), 1)
          : new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const monthCount = overviewRange === "ytd"
        ? now.getMonth() + 1
        : overviewRange === "custom"
          ? Math.max(1, (endDate.getFullYear() - monthStart.getFullYear()) * 12 + (endDate.getMonth() - monthStart.getMonth()) + 1)
          : overviewRange === "all"
            ? Math.max(1, (now.getFullYear() - monthStart.getFullYear()) * 12 + (now.getMonth() - monthStart.getMonth()) + 1)
          : 12;
      for (let i = 0; i < monthCount; i += 1) {
        const d = new Date(monthStart.getFullYear(), monthStart.getMonth() + i, 1);
        chartRows.push({
          key: buildMonthKey(d),
          label:
            overviewRange === "all"
              ? d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : d.toLocaleDateString("en-US", { month: "short" }),
          year: d.getFullYear(),
          invoiced: 0,
          received: 0,
        });
      }
    }

    const rowMap = new Map(chartRows.map((row) => [row.key, row]));
    scopedInvoices.forEach((invoice) => {
      const date = resolveInvoiceDate(invoice);
      if (!date) return;
      const key = dayBased ? buildKey(date) : buildMonthKey(date);
      const row = rowMap.get(key);
      if (!row) return;
      row.invoiced += amountForInvoice(invoice);
      row.received += Math.min(receivedForInvoice(invoice), amountForInvoice(invoice));
    });

    const chartPeak = Math.max(1, ...chartRows.map((row) => Math.max(row.invoiced, row.received)));
    const chartYears = Array.from(new Set(chartRows.map((row) => row.year))).sort((a, b) => a - b);
    const chartYearLabel =
      chartYears.length === 0
        ? ""
        : chartYears.length === 1
          ? String(chartYears[0])
          : `${chartYears[0]}–${chartYears[chartYears.length - 1]}`;

    return {
      totalInvoiced,
      totalReceived,
      outstandingAmount,
      overdueCount: overdueInvoices.length,
      averageInvoice,
      collectionRate,
      unpaidCount,
      overdueAmount,
      activeClients,
      topService: topServiceEntry?.[0] ?? "—",
      topServiceRevenue: topServiceEntry?.[1] ?? 0,
      invoicedDeltaPct: calcDeltaPct(totalInvoiced, previousInvoiced),
      receivedDeltaPct: calcDeltaPct(totalReceived, previousReceived),
      invoiceCountDeltaPct: calcDeltaPct(scopedInvoices.length, previousInvoices.length),
      chartRows,
      chartPeak,
      chartYears,
      chartYearLabel,
      scopedInvoiceCount: scopedInvoices.length,
      hasValidCustomRange,
      rangeLabel:
        overviewRange === "7d"
          ? "Last 7 days"
          : overviewRange === "30d"
            ? "Last 30 days"
            : overviewRange === "ytd"
              ? "Year to date"
              : overviewRange === "custom" && hasValidCustomRange && customStart && customEnd
                ? `${customStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} → ${customEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : overviewRange === "custom"
                  ? "Custom range"
                  : overviewRange === "all"
                    ? "All time"
                  : "Last 12 months",
    };
  }, [projectInvoices, projects, overviewRange, overviewCustomRange]);

  const tabButtonClass = (tab: OwnerTab) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition ${
      activeTab === tab
        ? "border-white bg-white text-black"
        : "border-white/15 bg-black/30 text-white/70 hover:border-white/25 hover:text-white"
    }`;

  function updateOverviewBarTooltip(
    _event: ReactMouseEvent<HTMLDivElement> | ReactFocusEvent<HTMLDivElement>,
    payload: {
      label: string;
      value: number;
      metricLabel: string;
      trendLabel: string;
    }
  ) {
    setHoveredOverviewBar(payload);
  }

  return authorized ? (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_52%),#040404] text-white">
      <div className="relative min-h-screen w-full">
        <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-[288px] flex-col overflow-y-auto border-r border-white/10 bg-[#090909]/95 px-5 py-6 backdrop-blur lg:flex xl:w-[320px]">
            <div className="flex flex-1 flex-col space-y-4">
              <button
                type="button"
                onClick={toggleGeneralMode}
                className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                  isGeneralMode ? "border-white bg-white text-black" : "border-white/15 bg-black/30 text-white/75 hover:border-white/25 hover:text-white"
                }`}
              >
                {isGeneralMode ? "Exit general view" : "General view"}
              </button>

            <SearchablePicker
              title={t.activeClient}
              value={selectedClientId}
              emptyLabel={t.noClients}
              placeholder="Search client..."
              options={clients.map((client) => ({
                id: client.id,
                label: client.brand_name,
                description: `${client.username} · ${client.whatsapp_number}`,
              }))}
              onChange={(nextClientId) => {
                setSelectedClientId(nextClientId);
                const clientProjects = projects.filter((project) => project.client_id === nextClientId);
                const nextProjectId = clientProjects[0]?.id ?? "";
                setSelectedProjectId(nextProjectId);
                setLastScopedSelection({ clientId: nextClientId, projectId: nextProjectId });
                  setInvoiceTargetClientId(nextClientId);
                  setInvoiceTargetProjectId(nextProjectId);
                persistOwnerSelection(nextClientId, nextProjectId);
              }}
            />

            <SearchablePicker
              title={t.activeProject}
              value={selectedProjectId}
              emptyLabel={t.noProjects}
              placeholder="Search project..."
              options={filteredProjects.map((project) => ({
                id: project.id,
                label: project.name,
                description: `${project.service.toUpperCase()} · ${projectStatusLabels[language][project.status]} · ${project.progress}%`,
              }))}
              onChange={(nextProjectId) => {
                setSelectedProjectId(nextProjectId);
                if (selectedClientId) {
                  setLastScopedSelection({ clientId: selectedClientId, projectId: nextProjectId });
                }
                setInvoiceTargetProjectId(nextProjectId);
                persistOwnerSelection(selectedClientId, nextProjectId);
              }}
            />

            <div className="pt-2 border-t border-white/10">
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/45 mb-3 mt-4">{isGeneralMode ? "General sections" : "Admin sections"}</p>
              <nav className="space-y-1">
                {visibleTabItems.map((item) => {
                  const active = activeTab === item.key;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveTab(item.key)}
                      className={`group relative flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
                      {t[item.key]}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

        </aside>

        <main className="min-w-0 px-2 py-2 sm:px-5 sm:py-5 lg:ml-[288px] lg:px-7 lg:py-6 xl:ml-[320px] xl:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-4 rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Admin quick controls</p>
            <button
              type="button"
              onClick={toggleGeneralMode}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                isGeneralMode
                  ? "border-white bg-white text-black"
                  : "border-white/15 bg-black/30 text-white/75 hover:border-white/25 hover:text-white"
              }`}
            >
              {isGeneralMode ? "Exit general" : "General view"}
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            <SearchablePicker
              title={t.activeClient}
              value={selectedClientId}
              emptyLabel={t.noClients}
              placeholder="Search client..."
              options={clients.map((client) => ({
                id: client.id,
                label: client.brand_name,
                description: `${client.username} · ${client.whatsapp_number}`,
              }))}
              onChange={(nextClientId) => {
                setSelectedClientId(nextClientId);
                const clientProjects = projects.filter((project) => project.client_id === nextClientId);
                const nextProjectId = clientProjects[0]?.id ?? "";
                setSelectedProjectId(nextProjectId);
                setLastScopedSelection({ clientId: nextClientId, projectId: nextProjectId });
                setInvoiceTargetClientId(nextClientId);
                setInvoiceTargetProjectId(nextProjectId);
                persistOwnerSelection(nextClientId, nextProjectId);
              }}
            />

            <SearchablePicker
              title={t.activeProject}
              value={selectedProjectId}
              emptyLabel={t.noProjects}
              placeholder="Search project..."
              options={filteredProjects.map((project) => ({
                id: project.id,
                label: project.name,
                description: `${project.service.toUpperCase()} · ${projectStatusLabels[language][project.status]} · ${project.progress}%`,
              }))}
              onChange={(nextProjectId) => {
                setSelectedProjectId(nextProjectId);
                if (selectedClientId) {
                  setLastScopedSelection({ clientId: selectedClientId, projectId: nextProjectId });
                }
                setInvoiceTargetProjectId(nextProjectId);
                persistOwnerSelection(selectedClientId, nextProjectId);
              }}
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleTabItems.map((item) => (
              <button key={`mobile-${item.key}`} type="button" onClick={() => setActiveTab(item.key)} className={`${tabButtonClass(item.key)} whitespace-nowrap`}>
                {t[item.key]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{t.title}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">{t.clientContext}</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/60 sm:mt-3 sm:text-base">{t.subtitle}</p>
        </div>

        <AnimatePresence initial={false} mode="wait">
          {(notice || error) && (
            <motion.div
              key={error ? `error-${error}` : `notice-${notice}`}
              initial={{ opacity: 0, y: -8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className={`mb-6 rounded-2xl border p-3 text-sm ${error ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}
            >
              {error ?? notice}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {successPopup && (
            <motion.div
              key={`success-popup-${successPopup}`}
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              className="fixed bottom-6 right-6 z-[70] rounded-2xl border border-emerald-200/70 bg-emerald-500 px-4 py-3 text-sm font-semibold text-black shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
            >
              {successPopup}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={
            showMobileInvoiceDetails
              ? "mt-4 border-0 bg-transparent p-0 shadow-none lg:rounded-[28px] lg:border lg:border-white/8 lg:bg-black/50 lg:p-6 lg:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
              : "mt-4 rounded-[28px] border border-white/8 bg-black/50 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] sm:p-6"
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
                <p className="text-xs text-white/65 sm:text-sm">{t.allGood}</p>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{t.appWebsiteStatus}</p>
                    <p className="mt-2 text-base font-semibold text-white sm:text-lg">{selectedProject?.name ?? (isGeneralMode ? "General company view" : "—")}</p>
                    <p className="mt-1 text-xs text-white/60 sm:text-sm">{selectedProject ? `${selectedProject.service.toUpperCase()} · ${projectStatusLabels[language][selectedProject.status]} · ${selectedProject.progress}%` : isGeneralMode ? `Clients · ${clients.length} · Projects · ${projects.length}` : "—"}</p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{t.dashboardInfo}</p>
                    <p className="mt-2 text-sm text-white/75">{overviewProjectText}</p>
                  </div>
                </div>

                {isGeneralMode && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[24px] border border-white/10 bg-white/[0.04] p-3 sm:gap-3 sm:p-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Business intelligence</p>
                        <p className="mt-1 text-xs text-white/70 sm:text-sm">{generalOverviewAnalytics.rangeLabel} · {generalOverviewAnalytics.scopedInvoiceCount} invoices tracked</p>
                        {generalOverviewAnalytics.chartYearLabel && (
                          <p className="mt-1 text-[11px] text-white/45">Chart years: {generalOverviewAnalytics.chartYearLabel}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {generalOverviewAnalytics.chartYearLabel && (
                          <span className="rounded-full border border-white/12 bg-black/55 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70 sm:px-3 sm:text-[10px]">
                            Years {generalOverviewAnalytics.chartYearLabel}
                          </span>
                        )}
                        {[
                          { key: "7d", label: "7D" },
                          { key: "30d", label: "30D" },
                          { key: "ytd", label: "YTD" },
                          { key: "12m", label: "12M" },
                          { key: "all", label: "All time" },
                          { key: "custom", label: "Custom" },
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setOverviewRange(item.key as "7d" | "30d" | "ytd" | "12m" | "custom" | "all")}
                            className={`rounded-full border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition sm:px-3 sm:text-[11px] ${
                              overviewRange === item.key
                                ? "border-white/30 bg-white/15 text-white"
                                : "border-white/15 bg-black/50 text-white/65 hover:border-white/25 hover:text-white"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {overviewRange === "custom" && (
                      <div className="grid gap-3 rounded-[20px] border border-white/10 bg-black/35 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <label className="space-y-1 text-[11px] uppercase tracking-[0.12em] text-white/45">
                          Start date
                          <input
                            type="date"
                            value={overviewCustomRange.start}
                            onChange={(event) => setOverviewCustomRange((prev) => ({ ...prev, start: event.target.value }))}
                            className="h-10 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/25 focus:border-white/35 [color-scheme:dark]"
                          />
                        </label>
                        <label className="space-y-1 text-[11px] uppercase tracking-[0.12em] text-white/45">
                          End date
                          <input
                            type="date"
                            value={overviewCustomRange.end}
                            onChange={(event) => setOverviewCustomRange((prev) => ({ ...prev, end: event.target.value }))}
                            className="h-10 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/25 focus:border-white/35 [color-scheme:dark]"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const end = new Date();
                            const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 29);
                            setOverviewCustomRange({
                              start: toInputDate(start.toISOString()),
                              end: toInputDate(end.toISOString()),
                            });
                          }}
                          className="h-10 self-end rounded-lg border border-white/15 bg-black/50 px-3 text-xs font-semibold text-white/75 transition hover:border-white/25 hover:text-white"
                        >
                          Reset to 30D
                        </button>
                        {!generalOverviewAnalytics.hasValidCustomRange && (
                          <p className="md:col-span-3 text-xs text-amber-200/85">Choose a valid range where start date is earlier than end date.</p>
                        )}
                      </div>
                    )}

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={overviewRange === "custom" ? `${overviewRange}-${overviewCustomRange.start}-${overviewCustomRange.end}` : overviewRange}
                        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className="space-y-4"
                      >
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-white/45 sm:text-[10px]">Revenue received</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-300 sm:text-3xl">{formatAzn(generalOverviewAnalytics.totalReceived)}</p>
                        <p className="mt-1 text-[11px] text-white/55 sm:text-xs">Collection {generalOverviewAnalytics.collectionRate.toFixed(1)}%</p>
                        <p className={`mt-1 text-[10px] font-medium sm:text-[11px] ${generalOverviewAnalytics.receivedDeltaPct >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
                          {generalOverviewAnalytics.receivedDeltaPct >= 0 ? "+" : ""}{generalOverviewAnalytics.receivedDeltaPct.toFixed(1)}% vs previous period
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-white/45 sm:text-[10px]">Invoiced volume</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{formatAzn(generalOverviewAnalytics.totalInvoiced)}</p>
                        <p className="mt-1 text-[11px] text-white/55 sm:text-xs">Avg invoice {formatAzn(generalOverviewAnalytics.averageInvoice)}</p>
                        <p className={`mt-1 text-[10px] font-medium sm:text-[11px] ${generalOverviewAnalytics.invoicedDeltaPct >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
                          {generalOverviewAnalytics.invoicedDeltaPct >= 0 ? "+" : ""}{generalOverviewAnalytics.invoicedDeltaPct.toFixed(1)}% vs previous period
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-white/45 sm:text-[10px]">Outstanding</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-amber-200 sm:text-3xl">{formatAzn(generalOverviewAnalytics.outstandingAmount)}</p>
                        <p className="mt-1 text-[11px] text-white/55 sm:text-xs">Overdue invoices {generalOverviewAnalytics.overdueCount}</p>
                        <p className="mt-1 text-[10px] text-white/65 sm:text-[11px]">Overdue value {formatAzn(generalOverviewAnalytics.overdueAmount)}</p>
                      </div>
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-white/45 sm:text-[10px]">Top service</p>
                        <p className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">{String(generalOverviewAnalytics.topService).toUpperCase()}</p>
                        <p className="mt-1 text-[11px] text-white/55 sm:text-xs">{formatAzn(generalOverviewAnalytics.topServiceRevenue)} received</p>
                        <p className="mt-1 text-[10px] text-white/65 sm:text-[11px]">Unpaid invoices {generalOverviewAnalytics.unpaidCount}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
                      <div className="self-start rounded-[24px] border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-white/45 sm:text-[10px]">Revenue trend</p>
                          <div className="inline-flex rounded-full border border-white/15 bg-black/35 p-1">
                            {[
                              { key: "received", label: "Received" },
                              { key: "invoiced", label: "Invoiced" },
                            ].map((metric) => (
                              <button
                                key={metric.key}
                                type="button"
                                onClick={() => setOverviewMetric(metric.key as "received" | "invoiced")}
                                className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition sm:px-3 sm:text-[11px] ${
                                  overviewMetric === metric.key
                                    ? "bg-white text-black"
                                    : "text-white/65 hover:text-white"
                                }`}
                              >
                                {metric.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={hoveredOverviewBar ? `${hoveredOverviewBar.metricLabel}-${hoveredOverviewBar.label}-${hoveredOverviewBar.value}` : "overview-hint"}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.16, ease: "easeOut" }}
                            className="mb-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                          >
                            {hoveredOverviewBar ? (
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">{hoveredOverviewBar.metricLabel}</p>
                                  <p className="mt-0.5 truncate text-sm font-semibold text-white">{hoveredOverviewBar.label}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-sm font-semibold tracking-tight text-white sm:text-base">{formatAzn(hoveredOverviewBar.value)}</p>
                                  <p className="text-[9px] text-white/45 sm:text-[10px]">{hoveredOverviewBar.trendLabel}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-white/45 sm:text-xs">Hover a bar to see the amount and range details here.</p>
                            )}
                          </motion.div>
                        </AnimatePresence>

                        <div className="relative h-[188px] w-full max-w-full overflow-x-hidden overflow-y-hidden rounded-2xl border border-white/8 bg-black/20 px-2 pt-3 sm:h-[232px] sm:overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          <div className="pointer-events-none absolute inset-x-2 top-3 h-[146px] sm:h-[178px]">
                            {[0, 1, 2, 3].map((line) => (
                              <div
                                key={line}
                                className="absolute left-0 right-0 border-t border-white/6"
                                style={{ top: `${(line / 3) * 100}%` }}
                              />
                            ))}
                          </div>

                          <div className="relative flex h-full w-full min-w-0 items-end gap-1 pr-0 sm:min-w-max sm:gap-2 sm:pr-2">
                            {generalOverviewAnalytics.chartRows.map((row, idx) => {
                              const value = overviewMetric === "received" ? row.received : row.invoiced;
                              const heightPct = Math.max(4, Math.round((value / generalOverviewAnalytics.chartPeak) * 100));
                              const metricLabel = overviewMetric === "received" ? "Received" : "Invoiced";
                              const showYear = generalOverviewAnalytics.chartYears.length > 1 && row.year !== generalOverviewAnalytics.chartRows[idx - 1]?.year;

                              return (
                                <div
                                  key={`${row.key}-${idx}`}
                                  className="relative flex h-full w-0 min-w-0 flex-1 flex-col items-center justify-end gap-2 sm:w-12 sm:min-w-[48px] sm:flex-none"
                                  onMouseEnter={(event) => updateOverviewBarTooltip(event, { label: row.label, value, metricLabel, trendLabel: generalOverviewAnalytics.rangeLabel })}
                                  onMouseMove={(event) => updateOverviewBarTooltip(event, { label: row.label, value, metricLabel, trendLabel: generalOverviewAnalytics.rangeLabel })}
                                  onMouseLeave={() => setHoveredOverviewBar(null)}
                                  onFocus={(event) => updateOverviewBarTooltip(event, { label: row.label, value, metricLabel, trendLabel: generalOverviewAnalytics.rangeLabel })}
                                  onBlur={() => setHoveredOverviewBar(null)}
                                  tabIndex={0}
                                >
                                  <div className="flex h-[146px] w-full items-end rounded-md border border-white/5 bg-black/10 px-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors duration-200 hover:border-white/12 hover:bg-black/20 sm:h-[178px]">
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: `${heightPct}%`, opacity: 1 }}
                                      transition={{ duration: 0.4, delay: idx * 0.012, ease: [0.16, 1, 0.3, 1] }}
                                      className={`w-full rounded-sm shadow-[0_0_18px_rgba(255,255,255,0.05)] ${overviewMetric === "received" ? "bg-gradient-to-t from-emerald-400/85 to-emerald-200/50" : "bg-gradient-to-t from-white/80 to-white/40"}`}
                                    />
                                  </div>
                                  <p className="w-full truncate text-center text-[9px] text-white/45 sm:text-[10px]">
                                    {row.label}
                                    {showYear ? <span className="ml-1 text-white/30">{String(row.year).slice(-2)}</span> : null}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="hidden self-start rounded-[24px] border border-white/10 bg-white/[0.04] p-4 md:block">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Executive snapshot</p>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                            <p className="text-white/50">Active clients</p>
                            <p className="mt-1 text-xl font-semibold text-white">{generalOverviewAnalytics.activeClients}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                            <p className="text-white/50">Total clients</p>
                            <p className="mt-1 text-xl font-semibold text-white">{clients.length}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                            <p className="text-white/50">Total projects</p>
                            <p className="mt-1 text-xl font-semibold text-white">{projects.length}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                            <p className="text-white/50">All invoices</p>
                            <p className="mt-1 text-xl font-semibold text-white">{allInvoiceCount}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                            <p className="text-white/50">Invoice activity</p>
                            <p className="mt-1 text-xl font-semibold text-white">{generalOverviewAnalytics.scopedInvoiceCount}</p>
                            <p className={`mt-1 text-[11px] ${generalOverviewAnalytics.invoiceCountDeltaPct >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
                              {generalOverviewAnalytics.invoiceCountDeltaPct >= 0 ? "+" : ""}{generalOverviewAnalytics.invoiceCountDeltaPct.toFixed(1)}% vs previous period
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}

                <div className="hidden gap-4 md:grid md:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{t.latestInvoices}</p>
                    <div className="mt-3 space-y-2">
                      {projectInvoices.slice(0, 4).map((invoice) => (
                        <div key={invoice.id} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm">
                          <p className="font-medium text-white">{invoice.invoice_number}</p>
                          <p className="text-white/55">{invoice.amount} AZN · {invoice.status}</p>
                        </div>
                      ))}
                      {projectInvoices.length === 0 && <p className="text-sm text-white/45">No invoices.</p>}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{t.latestMaterials}</p>
                    <div className="mt-3 space-y-2">
                      {projectDeliverables.slice(0, 4).map((item) => (
                        <div key={item.id} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm">
                          <p title={item.title} className="truncate font-medium text-white">{item.title}</p>
                          <p className="text-white/55">{item.category}</p>
                        </div>
                      ))}
                      {projectDeliverables.length === 0 && <p className="text-sm text-white/45">No materials.</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "projects" && (
              <motion.div key="projects" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={projectDraft.name} onChange={(e) => setProjectDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Project name" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                  <select value={projectDraft.service} onChange={(e) => setProjectDraft((p) => ({ ...p, service: e.target.value as ServiceType }))} className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none">
                    {serviceOptions.map((service) => <option key={service} value={service}>{service.toUpperCase()}</option>)}
                  </select>
                  <select value={projectDraft.status} onChange={(e) => setProjectDraft((p) => ({ ...p, status: e.target.value as ProjectStatus }))} className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none">
                    {projectStatusOptions.map((status) => <option key={status} value={status}>{projectStatusLabels[language][status]}</option>)}
                  </select>
                  <input type="number" min={0} max={100} value={numberInputValue(projectDraft.progress)} onChange={(e) => setProjectDraft((p) => ({ ...p, progress: parseNumberInput(e.target.value) }))} placeholder="Progress" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                  <input type="date" value={projectDraft.startDate} onChange={(e) => setProjectDraft((p) => ({ ...p, startDate: e.target.value }))} className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none [color-scheme:dark]" />
                  <input type="date" value={projectDraft.deliveryDate} onChange={(e) => setProjectDraft((p) => ({ ...p, deliveryDate: e.target.value }))} className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none [color-scheme:dark]" />
                  <input
                    value={projectDraft.latestUpdate}
                    onChange={(e) => setProjectDraft((p) => ({ ...p, latestUpdate: e.target.value }))}
                    placeholder="Latest update / dashboard note"
                    readOnly={selectedProject?.service === "smm" && Boolean(parseSmmAdminPayload(selectedProject?.latest_update))}
                    className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none read-only:cursor-not-allowed read-only:opacity-70 sm:col-span-2"
                  />
                  {selectedProject?.service === "smm" && Boolean(parseSmmAdminPayload(selectedProject?.latest_update)) && (
                    <p className="text-xs text-white/55 sm:col-span-2">SMM latest update is managed from the SMM tab calendar editor.</p>
                  )}
                </div>
                <button type="button" onClick={handleSaveProject} className="h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold hover:bg-white/15">{t.saveChanges}</button>
              </motion.div>
            )}

            {activeTab === "invoices" && (
              <motion.div
                key="invoices"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                layout
                className={`grid gap-6 ${
                  showInvoiceDetails
                    ? "lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]"
                    : "lg:grid-cols-1"
                }`}
              >
                {/* Invoice List */}
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                  className={`min-w-0 rounded-[32px] border border-white/10 bg-black/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${showMobileInvoiceDetails ? "hidden lg:block" : ""}`}
                >
                  <div className="p-6">
                    <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Invoice results · {isGeneralMode ? "general view" : "active client"}</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{filteredInvoiceRows.length} invoices</p>
                          </div>

                          <button
                            type="button"
                            onClick={handleStartCreateInvoice}
                            className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-gradient-to-r from-white/15 via-white/10 to-white/5 px-5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/15 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] active:translate-y-0 active:scale-[0.99] sm:self-start"
                          >
                            + New invoice
                          </button>
                        </div>

                        <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:grid-cols-2 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.72fr)]">
                          <label className="group flex h-12 min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 text-sm text-white/65 transition-all duration-200 hover:border-white/20 hover:bg-black/45 focus-within:border-white/25 focus-within:bg-black/50 focus-within:ring-2 focus-within:ring-white/10 sm:col-span-2 xl:col-span-1">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/55">
                              <MagnifyingGlass className="h-4 w-4" weight="bold" />
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.14em] text-white/35">Search</span>
                            <input
                              value={invoiceSearchQuery}
                              onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                              placeholder="Invoice, client, project, date..."
                              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => setInvoiceFilterModal("status")}
                            className="flex h-12 min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 px-3 text-left text-sm text-white transition-all duration-200 hover:border-white/20 hover:bg-black/45 hover:shadow-[0_12px_30px_rgba(0,0,0,0.22)] focus:border-white/25 focus:bg-black/50 sm:col-span-1"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/55">
                                <FunnelSimple className="h-4 w-4" weight="bold" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[10px] uppercase tracking-[0.14em] text-white/35">Status</span>
                                <span className="block truncate font-medium text-white/90">{invoiceStatusFilterLabel}</span>
                              </span>
                            </span>
                            <CaretDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 ${invoiceFilterModal === "status" ? "rotate-180" : ""}`} weight="bold" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setInvoiceFilterModal("service")}
                            className="flex h-12 min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 px-3 text-left text-sm text-white transition-all duration-200 hover:border-white/20 hover:bg-black/45 hover:shadow-[0_12px_30px_rgba(0,0,0,0.22)] focus:border-white/25 focus:bg-black/50 sm:col-span-1"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/55">
                                <SlidersHorizontal className="h-4 w-4" weight="bold" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[10px] uppercase tracking-[0.14em] text-white/35">Service</span>
                                <span className="block truncate font-medium text-white/90">{invoiceServiceFilterLabel}</span>
                              </span>
                            </span>
                            <CaretDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 ${invoiceFilterModal === "service" ? "rotate-180" : ""}`} weight="bold" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setInvoiceFilterModal("pageSize")}
                            className="flex h-12 min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 px-3 text-left text-sm text-white transition-all duration-200 hover:border-white/20 hover:bg-black/45 hover:shadow-[0_12px_30px_rgba(0,0,0,0.22)] focus:border-white/25 focus:bg-black/50 sm:col-span-2 xl:col-span-1"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/55">
                                <CaretDown className="h-4 w-4 rotate-90" weight="bold" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[10px] uppercase tracking-[0.14em] text-white/35">Rows</span>
                                <span className="block truncate font-medium text-white/90">{invoicePageSizeLabel}</span>
                              </span>
                            </span>
                            <CaretDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 ${invoiceFilterModal === "pageSize" ? "rotate-180" : ""}`} weight="bold" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {[
                            { key: "all", label: `All · ${invoiceStatusCounts.all}` },
                            { key: "paid", label: `Paid · ${invoiceStatusCounts.paid}` },
                            { key: "partial", label: `Partial · ${invoiceStatusCounts.partial}` },
                            { key: "unpaid", label: `Unpaid · ${invoiceStatusCounts.unpaid}` },
                          ].map((chip) => {
                            const isActive = invoiceStatusFilter === chip.key;
                            return (
                              <button
                                key={chip.key}
                                type="button"
                                onClick={() => {
                                  if (invoiceStatusFilter !== chip.key) {
                                    setInvoiceStatusFilter(chip.key as typeof invoiceStatusFilter);
                                  }
                                }}
                                className={`group relative inline-flex h-9 items-center overflow-hidden rounded-full border px-4 text-xs font-medium tracking-wide transition-all duration-200 active:scale-[0.98] ${
                                  isActive
                                    ? "border-white/30 text-black shadow-[0_10px_30px_rgba(255,255,255,0.12)]"
                                    : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                                }`}
                              >
                                {isActive && (
                                  <motion.span
                                    layoutId="invoice-status-chip-active"
                                    transition={{ type: "spring", stiffness: 360, damping: 32, mass: 0.6 }}
                                    className="absolute inset-0 rounded-full bg-white"
                                  />
                                )}
                                <span className="relative z-10 transition-transform duration-200 group-hover:-translate-y-px">{chip.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <FilterModal
                        open={invoiceFilterModal === "status"}
                        title="Status"
                        subtitle="Choose which invoice states are visible in the list."
                        icon={FunnelSimple}
                        selectedValue={invoiceStatusFilter}
                        options={invoiceStatusModalOptions}
                        onClose={() => setInvoiceFilterModal(null)}
                        onSelect={(value) => setInvoiceStatusFilter(value as typeof invoiceStatusFilter)}
                      />

                      <FilterModal
                        open={invoiceFilterModal === "service"}
                        title="Service"
                        subtitle="Filter invoices by the linked service type."
                        icon={SlidersHorizontal}
                        selectedValue={invoiceServiceFilter}
                        options={invoiceServiceModalOptions}
                        onClose={() => setInvoiceFilterModal(null)}
                        onSelect={(value) => setInvoiceServiceFilter(value as typeof invoiceServiceFilter)}
                      />

                      <FilterModal
                        open={invoiceFilterModal === "pageSize"}
                        title="Rows per page"
                        subtitle="Set how many invoices appear before pagination kicks in."
                        icon={CaretDown}
                        selectedValue={String(invoicePageSize)}
                        options={invoicePageSizeModalOptions}
                        onClose={() => setInvoiceFilterModal(null)}
                        onSelect={(value) => setInvoicePageSize(Number(value) || 10)}
                      />
                    </div>

                    {filteredInvoiceRows.length === 0 ? (
                      <div className="text-center text-white/55 text-sm py-6">
                        No invoices match the current search and filters.
                      </div>
                    ) : (
                      <AnimatePresence initial={false} mode="wait">
                        <motion.div
                          key={`${deferredInvoiceStatusFilter}-${deferredInvoiceServiceFilter}-${deferredInvoiceSearchQuery}-${currentInvoicePage}-${invoicePageSize}`}
                          initial={{ opacity: 0, y: 6, filter: "blur(1.5px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: -4, filter: "blur(1px)" }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="space-y-0"
                        >
                          {paginatedInvoiceRows.map((invoice) => {
                            const isVoided = Boolean(invoiceMetaMap[invoice.id]?.isVoided);
                            const invoiceMeta = inferInvoiceMeta(invoice);
                            const rowPaid = Math.max(
                              0,
                              Math.min(
                                invoice.amount,
                                Number(invoice.paid_amount ?? (invoice.status === "paid" ? invoice.amount : 0))
                              )
                            );
                            const rowBalance = Math.max(invoice.amount - rowPaid, 0);
                            return (
                              <motion.button
                                key={invoice.id}
                                whileHover={{ y: -1, scale: 1.001 }}
                                whileTap={{ scale: 0.998 }}
                                type="button"
                                onClick={() => handleSelectInvoice(invoice)}
                                onMouseMove={(event) => {
                                  const rect = event.currentTarget.getBoundingClientRect();
                                  const x = event.clientX - rect.left;
                                  const y = event.clientY - rect.top;
                                  const centerX = rect.width / 2;
                                  const centerY = rect.height / 2;
                                  const dx = x - centerX;
                                  const dy = y - centerY;
                                  const maxDistance = Math.hypot(centerX, centerY) || 1;
                                  const distanceRatio = Math.min(1, Math.hypot(dx, dy) / maxDistance);
                                  const focus = 1 - distanceRatio;

                                  const glowWidth = 110 + focus * 180;
                                  const glowHeight = 42 + focus * 82;
                                  const strongOpacity = 0.03 + focus * 0.07;
                                  const softOpacity = 0.012 + focus * 0.035;

                                  event.currentTarget.style.setProperty("--mx", `${x}px`);
                                  event.currentTarget.style.setProperty("--my", `${y}px`);
                                  event.currentTarget.style.setProperty("--glow-w", `${glowWidth}px`);
                                  event.currentTarget.style.setProperty("--glow-h", `${glowHeight}px`);
                                  event.currentTarget.style.setProperty("--fade-strong", String(strongOpacity));
                                  event.currentTarget.style.setProperty("--fade-soft", String(softOpacity));
                                }}
                                onMouseLeave={(event) => {
                                  event.currentTarget.style.setProperty("--mx", "50%");
                                  event.currentTarget.style.setProperty("--my", "50%");
                                  event.currentTarget.style.setProperty("--glow-w", "170px");
                                  event.currentTarget.style.setProperty("--glow-h", "70px");
                                  event.currentTarget.style.setProperty("--fade-strong", "0.07");
                                  event.currentTarget.style.setProperty("--fade-soft", "0.03");
                                }}
                                className={`group relative w-full overflow-hidden border-b px-2 py-4 text-left transition-all duration-300 last:border-b-0 ${
                                  selectedInvoiceId === invoice.id
                                    ? "border-white/25 bg-white/[0.05]"
                                    : "border-white/10 hover:border-white/25"
                                }`}
                              >
                                <span
                                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                  style={{
                                    background:
                                      "radial-gradient(ellipse var(--glow-w,170px) var(--glow-h,70px) at var(--mx,50%) var(--my,50%), rgba(255,255,255,var(--fade-strong,0.07)) 0%, rgba(255,255,255,var(--fade-soft,0.03)) 38%, rgba(255,255,255,0.012) 56%, transparent 74%)",
                                  }}
                                />
                                <div className="flex items-center justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-xl font-semibold tracking-tight text-white">{invoice.invoice_number}</h3>
                                    <p className="mt-1 text-sm text-white/55">
                                      {toInputDate(invoice.issue_date) || "—"} · {toInputDate(invoice.due_date) || "—"}
                                    </p>
                                    <p className="mt-1 text-xs text-white/45 uppercase tracking-[0.08em]">
                                      {invoiceMeta.serviceCategory.toUpperCase()} · {invoiceMeta.projectLabel}
                                    </p>
                                  </div>

                                  <div className="relative z-[1] text-right">
                                    <p className="text-3xl font-semibold tracking-tight text-white">{invoice.amount.toFixed(2)} AZN</p>
                                    <span
                                      className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                                        isVoided
                                          ? "border-zinc-400/30 bg-zinc-400/10 text-zinc-200"
                                          : invoice.status === "paid"
                                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                                          : invoice.status === "partial"
                                          ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-200"
                                          : "border-red-400/30 bg-red-400/10 text-red-200"
                                      }`}
                                    >
                                      {isVoided ? "void" : invoice.status}
                                    </span>
                                    <p className="mt-2 text-[11px] text-white/60">Paid: {rowPaid.toFixed(2)} AZN</p>
                                    <p className="text-[11px] text-white/45">Remaining: {rowBalance.toFixed(2)} AZN</p>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {filteredInvoiceRows.length > 0 && (
                      <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-white/55">
                          Showing {Math.min(filteredInvoiceRows.length, (currentInvoicePage - 1) * invoicePageSize + 1)}–{Math.min(filteredInvoiceRows.length, currentInvoicePage * invoicePageSize)} of {filteredInvoiceRows.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInvoicePage((prev) => Math.max(1, prev - 1))}
                            disabled={currentInvoicePage <= 1}
                            className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Prev
                          </button>
                          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70">
                            Page {currentInvoicePage} / {totalInvoicePages}
                          </div>
                          <button
                            type="button"
                            onClick={() => setInvoicePage((prev) => Math.min(totalInvoicePages, prev + 1))}
                            disabled={currentInvoicePage >= totalInvoicePages}
                            className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Modern Invoice Details - Editable */}
                <AnimatePresence>
                  {showInvoiceDetails ? (
                    <motion.div
                      key="invoice-details"
                      initial={showMobileInvoiceDetails ? { opacity: 0, y: 22 } : { opacity: 0, x: 24 }}
                      animate={showMobileInvoiceDetails ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
                      exit={showMobileInvoiceDetails ? { opacity: 0, y: 22 } : { opacity: 0, x: 24 }}
                      transition={showMobileInvoiceDetails ? { duration: 0.22, ease: [0.22, 1, 0.36, 1] } : { type: "spring", stiffness: 260, damping: 28 }}
                      className={`min-w-0 overflow-hidden flex flex-col ${
                        showMobileInvoiceDetails
                          ? "fixed inset-0 z-[75] rounded-none border-0 bg-[#070707] shadow-none lg:static lg:z-auto lg:rounded-[32px] lg:border lg:border-white/10 lg:bg-black/95 lg:shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
                          : "rounded-[32px] border border-white/10 bg-black/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
                      }`}
                    >
                      {showMobileInvoiceDetails && (
                        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-[#0b0b0b]/95 px-4 py-3 backdrop-blur lg:hidden">
                          <button
                            type="button"
                            onClick={resetInvoiceDraft}
                            className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/[0.05] px-4 text-sm font-semibold text-white/85 hover:border-white/25 hover:bg-white/[0.12]"
                          >
                            ← Back
                          </button>
                          <p className="text-sm font-medium text-white/75">Invoice details</p>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Modern Invoice Details</p>
                          <h3 className="mt-2 text-xl font-semibold tracking-tight text-white capitalize">
                            {isCreatingInvoice ? "new" : selectedInvoiceVoided ? "void" : selectedInvoiceRow?.status ?? "unpaid"}
                          </h3>
                          <p className="mt-2 text-sm text-white/55">
                            Due {invoiceDraft.dueDate ? new Date(invoiceDraft.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </p>
                        </div>
                        <div className="relative flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              resetInvoiceDraft();
                            }}
                            className="hidden h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white lg:inline-flex"
                          >
                            Back
                          </button>

                          {!isCreatingInvoice && (
                            <>
                              {isInvoiceEditMode && (
                                <button
                                  type="button"
                                  onClick={handleCancelInvoiceEditing}
                                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3 text-sm font-semibold text-white/80 hover:border-white/25 hover:bg-white/10"
                                >
                                  Stop
                                </button>
                              )}
                            <button
                              type="button"
                              onClick={() => setIsInvoiceActionsOpen((prev) => !prev)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                              aria-label="Invoice actions"
                            >
                              <DotsThreeOutline className="h-4 w-4" weight="bold" />
                            </button>
                            </>
                          )}

                          {isInvoiceActionsOpen && selectedInvoiceRow && !isCreatingInvoice && (
                            <div className="absolute right-0 top-12 z-20 min-w-[220px] rounded-2xl border border-white/15 bg-[#111] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsInvoiceEditMode((prev) => !prev);
                                  setIsInvoiceActionsOpen(false);
                                }}
                                className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/85 hover:bg-white/10"
                              >
                                {isInvoiceEditMode ? "View invoice" : "Edit invoice"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const today = toInputDate(new Date().toISOString());
                                  const suggestedPaymentNo = String(Date.now()).slice(-4);
                                  setPaymentForm({
                                    customerName: invoiceDraft.customerName || clients.find((client) => client.id === selectedClientId)?.brand_name || "",
                                    paymentNumber: suggestedPaymentNo,
                                    amountReceived: Number(selectedInvoiceRemaining.toFixed(2)),
                                    bankCharges: 0,
                                    taxDeducted: "no",
                                    paymentDate: today,
                                    paymentReceivedOn: "",
                                    paymentMode: "Cash",
                                    reference: "",
                                    notes: "",
                                  });
                                  setPaymentAmount(Number(selectedInvoiceRemaining.toFixed(2)));
                                  setIsPaymentPromptOpen(true);
                                  setIsInvoiceActionsOpen(false);
                                }}
                                disabled={selectedInvoiceVoided}
                                className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Record payment
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleMarkInvoiceAsMisc(selectedInvoiceRow.id);
                                }}
                                className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm text-cyan-200 hover:bg-cyan-500/15"
                              >
                                Mark as MISC
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    message: `Void invoice ${selectedInvoiceRow.invoice_number}?`,
                                    onConfirm: handleVoidInvoice,
                                  });
                                }}
                                className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm text-amber-100 hover:bg-amber-400/15"
                              >
                                Void invoice
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    message: `Delete invoice ${selectedInvoiceRow.invoice_number} permanently?`,
                                    onConfirm: () => handleDeleteInvoice(selectedInvoiceRow.id),
                                  });
                                }}
                                className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-200 hover:bg-red-500/15"
                              >
                                Delete permanently
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-5 space-y-4 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 space-y-4">
                          {isCreatingInvoice && (
                            <div className="grid gap-4 lg:grid-cols-2">
                              <SearchablePicker
                                title="Invoice for client"
                                value={invoiceTargetClientId}
                                emptyLabel={t.noClients}
                                placeholder="Search client..."
                                options={clients.map((client) => ({
                                  id: client.id,
                                  label: client.brand_name,
                                  description: `${client.username} · ${client.whatsapp_number}`,
                                }))}
                                onChange={(nextClientId) => {
                                  setInvoiceTargetClientId(nextClientId);
                                  const clientProjects = projects.filter((project) => project.client_id === nextClientId);
                                  const nextProjectId = clientProjects[0]?.id ?? "";
                                  setInvoiceTargetProjectId(nextProjectId);
                                  if (nextProjectId) {
                                    syncInvoiceDraftWithProject(nextProjectId);
                                  }
                                }}
                              />

                              <SearchablePicker
                                title="Invoice for project"
                                value={invoiceTargetProjectId}
                                emptyLabel={t.noProjects}
                                placeholder="Search project..."
                                options={invoiceProjectOptions}
                                onChange={(nextProjectId) => {
                                  setInvoiceTargetProjectId(nextProjectId);
                                  const project = projects.find((item) => item.id === nextProjectId);
                                  if (project) {
                                    setInvoiceTargetClientId(project.client_id);
                                    syncInvoiceDraftWithProject(nextProjectId);
                                  }
                                }}
                                actionLabel="Add new project"
                                actionDisabled={!invoiceTargetClientId}
                                onAction={handleOpenClientProfileFromInvoiceProjectPicker}
                              />
                            </div>
                          )}

                          <div>
                            <label className="text-[11px] uppercase tracking-[0.14em] text-white/40">Invoice number</label>
                            <input
                              value={invoiceDraft.invoiceNumber}
                              onChange={(e) => setInvoiceDraft((p) => ({ ...p, invoiceNumber: e.target.value }))}
                              readOnly={!isInvoiceEditable}
                              className="mt-2 w-full text-lg font-semibold tracking-tight text-white bg-transparent border-b border-white/10 pb-2 outline-none hover:border-white/20 focus:border-white/30 read-only:cursor-default read-only:opacity-90"
                            />
                          </div>

                          <div className="grid gap-4">
                            <div>
                              <label className="text-[11px] uppercase tracking-[0.14em] text-white/40">Issue date</label>
                              <input
                                type="date"
                                value={invoiceDraft.issueDate}
                                onChange={(e) => setInvoiceDraft((p) => ({ ...p, issueDate: e.target.value }))}
                                disabled={!isInvoiceEditable}
                                className="mt-2 w-full text-sm text-white bg-transparent border-b border-white/10 pb-2 outline-none [color-scheme:dark] hover:border-white/20 focus:border-white/30 disabled:cursor-default disabled:opacity-90"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] uppercase tracking-[0.14em] text-white/40">Due date</label>
                              <input
                                type="date"
                                value={invoiceDraft.dueDate}
                                onChange={(e) => setInvoiceDraft((p) => ({ ...p, dueDate: e.target.value }))}
                                disabled={!isInvoiceEditable}
                                className="mt-2 w-full text-sm text-white bg-transparent border-b border-white/10 pb-2 outline-none [color-scheme:dark] hover:border-white/20 focus:border-white/30 disabled:cursor-default disabled:opacity-90"
                              />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Client information</p>
                            <div className="mt-3 space-y-2 text-sm">
                              <p className="text-white/75">
                                <span className="text-white/45">Company:</span>{" "}
                                <button
                                  type="button"
                                  onClick={() => selectedInvoiceClient && openClientProfile(selectedInvoiceClient)}
                                  className="font-semibold text-white underline-offset-4 hover:underline"
                                >
                                  {selectedInvoiceClient?.brand_name || invoiceDraft.customerName || "—"}
                                </button>
                              </p>
                              <p className="text-white/75"><span className="text-white/45">Representative:</span> {selectedInvoiceClient?.username || invoiceDraft.customerEmail || "—"}</p>
                              <p className="text-white/75"><span className="text-white/45">WhatsApp:</span> {selectedInvoiceClient?.whatsapp_number || invoiceDraft.customerAddress || "—"}</p>
                            </div>
                          </div>

                          {!isCreatingInvoice && selectedInvoiceDisplayMeta && (
                            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Client-visible invoice labels</p>
                              {isInvoiceEditable ? (
                                <div className="mt-3 space-y-3">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <SearchablePicker
                                        title="Linked project"
                                        value={effectiveInvoiceProjectId}
                                        emptyLabel={t.noProjects}
                                        placeholder="Search project..."
                                        options={invoiceProjectOptions}
                                        onChange={(nextProjectId) => {
                                          setInvoiceEditProjectId(nextProjectId);
                                          syncInvoiceDraftWithProject(nextProjectId);
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] uppercase tracking-[0.12em] text-white/45">Service type (from linked project)</label>
                                      <div className="mt-1.5 flex h-11 w-full items-center rounded-lg border border-white/12 bg-black/35 px-3 text-sm text-white/85">
                                        {(projects.find((project) => project.id === effectiveInvoiceProjectId)?.service ?? invoiceDraft.serviceCategory).toUpperCase()}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs text-white/65">
                                    Preview: <span className="text-white/85">{invoiceDraft.serviceCategory.toUpperCase()} · {invoiceDraft.projectLabel || selectedInvoiceDisplayMeta.projectLabel}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2 space-y-1.5 text-sm text-white/80">
                                  <p><span className="text-white/45">Project title:</span> {invoiceDraft.projectLabel || selectedInvoiceDisplayMeta.projectLabel}</p>
                                  <p><span className="text-white/45">Service type:</span> {invoiceDraft.serviceCategory.toUpperCase()}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-black/40 overflow-hidden">
                          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Line items</p>
                            {isInvoiceEditable && (
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={handleAddInvoiceItem}
                                  className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
                                >
                                  + Add item
                                </button>
                                <select
                                  value={selectedExistingLabelId}
                                  onChange={(e) => setSelectedExistingLabelId(e.target.value)}
                                  className="h-8 min-w-[128px] rounded-lg border border-white/12 bg-black/35 px-2 text-xs outline-none"
                                >
                                  <option value="">Select saved</option>
                                  {invoiceLabels.map((label) => (
                                    <option key={label.id} value={label.id}>{label.title} · {label.rate.toFixed(2)} AZN</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={handleAddExistingInvoiceItem}
                                  className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
                                >
                                  Add existing
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="hidden border-b border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] text-white/50 sm:block">
                            <div className="grid grid-cols-[minmax(0,1fr)_84px_116px_116px] gap-3">
                              <span>Description</span>
                              <span>Qty</span>
                              <span>Rate</span>
                              <span className="text-right">Amount</span>
                            </div>
                          </div>

                          <div className="space-y-2 p-3">
                            {invoiceDraft.items.map((item) => (
                              isInvoiceEditable ? (
                                <SwipeRevealDeleteRow key={item.id} onDelete={() => handleRemoveInvoiceItem(item.id)}>
                                  <div className="px-3 py-2.5">
                                    <div className="space-y-2 sm:hidden">
                                      <input
                                        value={item.description}
                                        onChange={(e) => {
                                          const nextDescription = e.target.value;
                                          const matched = invoiceLabels.find((label) => label.title.toLowerCase() === nextDescription.trim().toLowerCase());
                                          handleUpdateInvoiceItem(item.id, {
                                            description: nextDescription,
                                            ...(matched ? { rate: matched.rate } : {}),
                                          });
                                        }}
                                        list="owner-invoice-label-options"
                                        placeholder="Item description"
                                        className="h-10 w-full rounded-lg border border-white/12 bg-black/35 px-2.5 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-white/45">Qty</p>
                                          <input
                                            type="number"
                                            min={0}
                                            value={numberInputValue(item.quantity)}
                                            onChange={(e) => handleUpdateInvoiceItem(item.id, { quantity: parseNumberInput(e.target.value) })}
                                            className="h-10 w-full rounded-lg border border-white/12 bg-black/35 px-2.5 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                          />
                                        </div>
                                        <div>
                                          <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-white/45">Rate</p>
                                          <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={numberInputValue(item.rate)}
                                            onChange={(e) => handleUpdateInvoiceItem(item.id, { rate: parseNumberInput(e.target.value) })}
                                            className="h-10 w-full rounded-lg border border-white/12 bg-black/35 px-2.5 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/35 px-3 py-2">
                                        <span className="text-xs text-white/55">Amount</span>
                                        <p className="text-sm font-semibold text-white">{(item.quantity * item.rate).toFixed(2)} AZN</p>
                                      </div>
                                    </div>

                                    <div className="hidden grid-cols-[minmax(0,1fr)_84px_116px_116px] items-center gap-3 sm:grid">
                                      <input
                                        value={item.description}
                                        onChange={(e) => {
                                          const nextDescription = e.target.value;
                                          const matched = invoiceLabels.find((label) => label.title.toLowerCase() === nextDescription.trim().toLowerCase());
                                          handleUpdateInvoiceItem(item.id, {
                                            description: nextDescription,
                                            ...(matched ? { rate: matched.rate } : {}),
                                          });
                                        }}
                                        list="owner-invoice-label-options"
                                        placeholder="Item description"
                                        className="h-9 w-full rounded-lg border border-white/12 bg-black/35 px-2.5 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                      />
                                      <input
                                        type="number"
                                        min={0}
                                        value={numberInputValue(item.quantity)}
                                        onChange={(e) => handleUpdateInvoiceItem(item.id, { quantity: parseNumberInput(e.target.value) })}
                                        className="h-9 w-full rounded-lg border border-white/12 bg-black/35 px-2.5 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                      />
                                      <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={numberInputValue(item.rate)}
                                        onChange={(e) => handleUpdateInvoiceItem(item.id, { rate: parseNumberInput(e.target.value) })}
                                        className="h-9 w-full rounded-lg border border-white/12 bg-black/35 px-2.5 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                      />
                                      <p className="text-right text-sm font-semibold text-white">{(item.quantity * item.rate).toFixed(2)} AZN</p>
                                    </div>
                                  </div>
                                </SwipeRevealDeleteRow>
                              ) : (
                                <div key={item.id} className="rounded-xl border border-white/10 bg-black/70 px-3 py-2.5">
                                  <div className="space-y-2 sm:hidden">
                                    <p className="text-sm text-white/85">{item.description || "—"}</p>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-white/65">
                                      <div>
                                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Qty</p>
                                        <p className="mt-1 text-sm text-white/80">{item.quantity}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Rate</p>
                                        <p className="mt-1 text-sm text-white/80">{item.rate.toFixed(2)} AZN</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Amount</p>
                                        <p className="mt-1 text-sm font-semibold text-white">{(item.quantity * item.rate).toFixed(2)} AZN</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="hidden grid-cols-[minmax(0,1fr)_84px_116px_116px] items-center gap-3 sm:grid">
                                    <p className="truncate text-sm text-white/85">{item.description || "—"}</p>
                                    <p className="text-sm text-white/65">{item.quantity}</p>
                                    <p className="text-sm text-white/65">{item.rate.toFixed(2)} AZN</p>
                                    <p className="text-right text-sm font-semibold text-white">{(item.quantity * item.rate).toFixed(2)} AZN</p>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>

                          {isInvoiceEditable && <p className="px-4 pb-3 text-xs text-white/45">Swipe any row left to reveal delete.</p>}
                          <datalist id="owner-invoice-label-options">
                            {invoiceLabels.map((label) => <option key={`label-${label.id}`} value={label.title} />)}
                          </datalist>
                        </div>

                        <div className="rounded-3xl border border-white/12 bg-black/40 p-5">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Invoice summary</p>
                          {isInvoiceEditable && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Discount</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <select
                                    value={invoiceDraft.discountType}
                                    onChange={(e) => setInvoiceDraft((p) => ({ ...p, discountType: e.target.value as InvoiceDraft["discountType"] }))}
                                    className="h-9 rounded-lg border border-white/12 bg-black/35 px-2 text-sm outline-none"
                                  >
                                    <option value="percent">%</option>
                                    <option value="fixed">AZN</option>
                                  </select>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={numberInputValue(invoiceDraft.discountValue)}
                                    onChange={(e) => setInvoiceDraft((p) => ({ ...p, discountValue: parseNumberInput(e.target.value) }))}
                                    className="h-9 w-full rounded-lg border border-white/12 bg-black/35 px-2.5 text-sm outline-none"
                                  />
                                </div>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Tax</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <select
                                    value={invoiceDraft.taxType}
                                    onChange={(e) => setInvoiceDraft((p) => ({ ...p, taxType: e.target.value as InvoiceDraft["taxType"] }))}
                                    className="h-9 rounded-lg border border-white/12 bg-black/35 px-2 text-sm outline-none"
                                  >
                                    <option value="none">None</option>
                                    <option value="percent">%</option>
                                    <option value="fixed">AZN</option>
                                  </select>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={numberInputValue(invoiceDraft.taxValue)}
                                    onChange={(e) => setInvoiceDraft((p) => ({ ...p, taxValue: parseNumberInput(e.target.value) }))}
                                    className="h-9 w-full rounded-lg border border-white/12 bg-black/35 px-2.5 text-sm outline-none"
                                    disabled={invoiceDraft.taxType === "none"}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-white/60">Subtotal</span>
                              <span className="text-lg font-semibold text-white">{invoiceSubtotal.toFixed(2)} AZN</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white/60">Discount</span>
                              <span className="text-lg font-semibold text-white">-{invoiceDiscount.toFixed(2)} AZN</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white/60">Tax</span>
                              <span className="text-lg font-semibold text-white">{Math.max(0, invoiceTotal - Math.max(0, invoiceSubtotal - invoiceDiscount)).toFixed(2)} AZN</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white/60">Invoice total</span>
                              <span className="text-lg font-semibold text-white">{(isCreatingInvoice ? invoiceTotal : selectedInvoiceRow?.amount ?? invoiceTotal).toFixed(2)} AZN</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white/60">Paid amount</span>
                              <span className="text-lg font-semibold text-emerald-200">{(isCreatingInvoice ? 0 : selectedInvoicePaid).toFixed(2)} AZN</span>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div className="flex items-center justify-between">
                              <span className="text-white/60">Balance due</span>
                              <span className="text-lg font-semibold text-amber-200">{(isCreatingInvoice ? invoiceTotal : selectedInvoiceRemaining).toFixed(2)} AZN</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/10 p-5 space-y-3">
                        {isCreatingInvoice ? (
                          <button
                            type="button"
                            onClick={handleCreateInvoice}
                            className="w-full h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-semibold hover:bg-white/15"
                          >
                            Create Invoice
                          </button>
                        ) : (
                          <>
                            <AnimatePresence initial={false}>
                              {isInvoiceEditable && hasInvoiceDraftChanged(originalInvoiceDraft, invoiceDraft) && (
                                <motion.button
                                  key="save-invoice-changes"
                                  type="button"
                                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      message: "Save changes to this invoice?",
                                      onConfirm: handleUpdateInvoice,
                                    });
                                  }}
                                  className="h-10 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-semibold hover:bg-white/15"
                                >
                                  Save Changes
                                </motion.button>
                              )}
                            </AnimatePresence>

                            {isPaymentPromptOpen && (
                              <div className="rounded-3xl border border-white/12 bg-black/40 p-4 space-y-4">
                                <h4 className="text-base font-semibold text-white">Payment for {selectedInvoiceRow?.invoice_number}</h4>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Customer name*</label>
                                    <input
                                      value={paymentForm.customerName}
                                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, customerName: e.target.value }))}
                                      className="mt-2 h-10 w-full rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Payment #*</label>
                                    <input
                                      value={paymentForm.paymentNumber}
                                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentNumber: e.target.value }))}
                                      className="mt-2 h-10 w-full rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Amount received (AZN)*</label>
                                    <input
                                      type="number"
                                      value={paymentForm.amountReceived || ""}
                                      onChange={(e) => {
                                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                                        const safeAmount = Math.max(0, Math.min(val || 0, selectedInvoiceRemaining));
                                        setPaymentForm((prev) => ({ ...prev, amountReceived: safeAmount }));
                                        setPaymentAmount(safeAmount);
                                      }}
                                      className="mt-2 h-10 w-full rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Bank charges (if any)</label>
                                    <input
                                      type="number"
                                      value={paymentForm.bankCharges || ""}
                                      onChange={(e) => {
                                        const val = e.target.value === "" ? 0 : Math.max(0, Number(e.target.value) || 0);
                                        setPaymentForm((prev) => ({ ...prev, bankCharges: val }));
                                      }}
                                      className="mt-2 h-10 w-full rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Tax deducted?</p>
                                  <div className="mt-2 flex items-center gap-5 text-sm text-white/90">
                                    <label className="inline-flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name="taxDeducted"
                                        checked={paymentForm.taxDeducted === "no"}
                                        onChange={() => setPaymentForm((prev) => ({ ...prev, taxDeducted: "no" }))}
                                        className="accent-white"
                                      />
                                      <span>No Tax deducted</span>
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name="taxDeducted"
                                        checked={paymentForm.taxDeducted === "tds"}
                                        onChange={() => setPaymentForm((prev) => ({ ...prev, taxDeducted: "tds" }))}
                                        className="accent-white"
                                      />
                                      <span>Yes, TDS</span>
                                    </label>
                                  </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Payment date*</label>
                                    <input
                                      type="date"
                                      value={paymentForm.paymentDate}
                                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                                      className="mt-2 h-10 w-full rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-white outline-none [color-scheme:dark] hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Payment mode</label>
                                    <select
                                      value={paymentForm.paymentMode}
                                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentMode: e.target.value as PaymentForm["paymentMode"] }))}
                                      className="mt-2 h-10 w-full rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-white outline-none"
                                    >
                                      <option value="Cash">Cash</option>
                                      <option value="Bank transfer">Bank transfer</option>
                                      <option value="Card">Card</option>
                                      <option value="Online">Online</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Payment received on</label>
                                    <input
                                      type="date"
                                      value={paymentForm.paymentReceivedOn}
                                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentReceivedOn: e.target.value }))}
                                      className="mt-2 h-10 w-full rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-white outline-none [color-scheme:dark] hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Reference #</label>
                                    <input
                                      value={paymentForm.reference}
                                      onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))}
                                      className="mt-2 h-10 w-full rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Notes</label>
                                  <textarea
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    className="mt-2 w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                                  />
                                </div>

                                <div className="mt-3 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handleRecordPayment}
                                    className="h-9 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-semibold hover:bg-white/15"
                                  >
                                    Apply Payment
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsPaymentPromptOpen(false);
                                      setPaymentAmount(0);
                                      setPaymentForm(createEmptyPaymentForm());
                                    }}
                                    className="h-9 flex-1 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white/70 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === "materials" && (
              <motion.div key="materials" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={deliverableForm.title} onChange={(e) => setDeliverableForm((p) => ({ ...p, title: e.target.value }))} placeholder="Material title" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                  <>
                    <input
                      list="material-category-options"
                      value={deliverableForm.category}
                      onChange={(e) => setDeliverableForm((p) => ({ ...p, category: e.target.value }))}
                      placeholder="Category (pick or type)"
                      className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none"
                    />
                    <datalist id="material-category-options">
                      {materialCategoryOptions.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </>
                  <input value={deliverableForm.url} onChange={(e) => setDeliverableForm((p) => ({ ...p, url: e.target.value }))} placeholder="File URL" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none sm:col-span-2" />
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-white/45">Upload from PC (max 20MB)</label>
                    <input
                      type="file"
                      onChange={(e) => {
                        const picked = e.target.files?.[0] ?? null;
                        setDeliverableFile(picked);
                        if (picked && !deliverableForm.title.trim()) {
                          setDeliverableForm((prev) => ({ ...prev, title: picked.name.replace(/\.[^/.]+$/, "") }));
                        }
                      }}
                      className="h-11 w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-white/10 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-white/90 hover:file:bg-white/15"
                    />
                    <p className="mt-1 text-xs text-white/45">You can use either URL or file upload. Uploaded files are validated and stored before saving.</p>
                  </div>
                  <p className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white/60 sm:col-span-2">Upload time is automatically set to current date/time.</p>
                </div>
                <button type="button" onClick={handleCreateDeliverable} className="h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold hover:bg-white/15">{t.addMaterial}</button>

                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-cyan-100">Upload diagnostics</p>
                    <button
                      type="button"
                      onClick={handleRunMaterialsDiagnostics}
                      disabled={materialsDiagRunning}
                      className="h-8 rounded-lg border border-cyan-200/30 bg-black/35 px-3 text-xs font-semibold text-cyan-100 hover:bg-black/50 disabled:opacity-60"
                    >
                      {materialsDiagRunning ? "Running..." : "Run checks"}
                    </button>
                  </div>
                  {materialsDiagLines.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs text-cyan-100/90">
                      {materialsDiagLines.map((line, index) => (
                        <p key={`${line}-${index}`}>• {line}</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {projectDeliverables.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">No materials yet for this project.</div>
                  ) : (
                    projectDeliverables.slice(0, 10).map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p title={item.title} className="truncate text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-1 text-xs text-white/55">{item.category} · {toInputDate(item.created_at) || "—"}</p>
                            <a href={item.url} target="_blank" rel="noreferrer" title={item.url} className="mt-1 block truncate text-xs text-cyan-200/85 hover:text-cyan-100">{item.url}</a>
                          </div>
                          <button type="button" onClick={() => handleDeleteDeliverable(item.id)} className="rounded-lg border border-red-300/25 bg-red-400/10 px-2.5 py-1 text-xs font-semibold text-red-100 hover:bg-red-400/15">Delete</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "smm" && (
              <motion.div key="smm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
                {selectedProject?.service !== "smm" ? (
                  <p className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70">{t.chooseSmmProject}</p>
                ) : (
                  <>
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[28px] border border-white/10 bg-black/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">SMM control room</p>
                            <h3 className="mt-1 text-lg font-semibold text-white">Calendar + client copy</h3>
                            <p className="mt-1 text-xs text-white/55">Edit schedule first, then polish what client sees.</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-right">
                            <div className="rounded-xl border border-white/10 bg-black/60 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Slots</p>
                              <p className="mt-1 text-sm font-semibold text-white">{smmSchedule.length}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/60 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Done</p>
                              <p className="mt-1 text-sm font-semibold text-white">{smmDoneCount}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-black/60 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Next</p>
                              <p className="mt-1 text-sm font-semibold text-white">{smmAutoNextPost}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/70 p-3">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Client-facing copy</p>
                          <div className="mt-2 grid gap-3 sm:grid-cols-2">
                            <input value={smmHeroTitle} onChange={(e) => setSmmHeroTitle(e.target.value)} placeholder="Hero title" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none sm:col-span-2" />
                            <input value={smmHeroSubtitle} onChange={(e) => setSmmHeroSubtitle(e.target.value)} placeholder="Hero subtitle" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none sm:col-span-2" />
                            <input value={smmCalendarTitle} onChange={(e) => setSmmCalendarTitle(e.target.value)} placeholder="Calendar title" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                            <input value={smmCalendarText} onChange={(e) => setSmmCalendarText(e.target.value)} placeholder="Calendar text" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                            <input value={smmPostsTitle} onChange={(e) => setSmmPostsTitle(e.target.value)} placeholder="Posts title" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                            <input value={smmPostsText} onChange={(e) => setSmmPostsText(e.target.value)} placeholder="Posts text" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                            <input value={smmHeroImageUrl} onChange={(e) => setSmmHeroImageUrl(e.target.value)} placeholder="Hero image URL" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none sm:col-span-2" />
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/70 p-3">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Weekly delivery settings</p>
                          <div className="mt-2 grid gap-3 sm:grid-cols-2">
                            <input value={smmCadence} onChange={(e) => setSmmCadence(e.target.value)} placeholder="Cadence" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                            <input value={smmNextPostTime} onChange={(e) => setSmmNextPostTime(e.target.value)} placeholder="Optional manual next post" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                            <input
                              type="number"
                              min={0}
                              max={14}
                              value={numberInputValue(smmPostsPerWeek)}
                              onChange={(e) => setSmmPostsPerWeek(parseNumberInput(e.target.value))}
                              placeholder="Posts per week"
                              className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none"
                            />
                            <input value={smmFocus} onChange={(e) => setSmmFocus(e.target.value)} placeholder="This week focus" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none sm:col-span-2" />
                            <input value={smmManagerNote} onChange={(e) => setSmmManagerNote(e.target.value)} placeholder="Manager note" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none sm:col-span-2" />
                          </div>
                          <p className="mt-2 text-xs text-white/50">Tip: leave manual next post empty to auto-calculate from schedule.</p>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold text-white/85">Weekly calendar board</p>
                            <div className="flex flex-wrap gap-1.5">
                              {smmDayOptions.map((day) => (
                                <button key={`quick-${day}`} type="button" onClick={() => handleAddSmmItem(day)} className="h-7 rounded-md border border-white/15 bg-white/10 px-2.5 text-[10px] font-semibold hover:bg-white/15">
                                  + {day}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="overflow-x-auto pb-2">
                            <div className="flex w-max gap-2">
                              {smmDayOptions.map((day) => {
                                const dayItems = smmSchedule.filter((item) => item.day === day);
                                return (
                                  <div key={day} className="w-[220px] rounded-xl border border-white/10 bg-black/70 p-2.5">
                                    <div className="mb-2 flex items-center justify-between">
                                      <p className="text-xs font-semibold text-white">{day}</p>
                                      <button type="button" onClick={() => handleAddSmmItem(day)} className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold">+ Slot</button>
                                    </div>

                                    <div className="space-y-2">
                                      {dayItems.map((item) => (
                                        <div key={item.id} className="rounded-lg border border-white/10 bg-black/80 p-2">
                                          <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-white/40">Time</p>
                                          <input value={item.time} onChange={(e) => handleUpdateSmmItem(item.id, { time: e.target.value })} placeholder="11:00" className="h-8 w-full rounded-md border border-white/12 bg-black/35 px-2 text-xs outline-none" />
                                          <p className="mb-1 mt-2 text-[10px] uppercase tracking-[0.12em] text-white/40">Post</p>
                                          <input value={item.content} onChange={(e) => handleUpdateSmmItem(item.id, { content: e.target.value })} placeholder="Post content" className="h-8 w-full rounded-md border border-white/12 bg-black/35 px-2 text-xs outline-none" />
                                          <p className="mb-1 mt-2 text-[10px] uppercase tracking-[0.12em] text-white/40">Media URL</p>
                                          <input value={item.mediaUrl} onChange={(e) => handleUpdateSmmItem(item.id, { mediaUrl: e.target.value })} placeholder="https://..." className="h-8 w-full rounded-md border border-white/12 bg-black/35 px-2 text-xs outline-none" />
                                          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                                            <select value={item.status} onChange={(e) => handleUpdateSmmItem(item.id, { status: e.target.value as SmmScheduleStatus })} className="h-8 rounded-md border border-white/12 bg-black/35 px-2 text-[11px] outline-none">
                                              {smmStatusOptions.map((status) => (
                                                <option key={status} value={status}>{status}</option>
                                              ))}
                                            </select>
                                            <button type="button" onClick={() => handleRemoveSmmItem(item.id)} className="h-8 rounded-md border border-red-300/25 bg-red-400/10 px-2 text-[11px] font-semibold text-red-100">Delete</button>
                                          </div>
                                        </div>
                                      ))}

                                      {dayItems.length === 0 && <p className="text-[11px] text-white/45">No slots</p>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button type="button" onClick={handleSaveSmmUpdate} className="h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold hover:bg-white/15">{t.smmUpdate}</button>
                          <button type="button" onClick={handleResetSmmDraft} className="h-11 rounded-xl border border-white/15 bg-black/35 px-4 text-sm font-semibold text-white/85 hover:border-white/25 hover:bg-black/55">
                            Reset draft
                          </button>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-white/10 bg-black/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Client portal preview</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">What client will see</h3>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Cadence</p>
                            <p className="mt-2 text-sm font-semibold text-white">{smmCadence || "—"}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Next publish</p>
                            <p className="mt-2 text-sm font-semibold text-white">{getNextPostFromSmmSchedule(smmSchedule) || smmNextPostTime || "—"}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Posts / week</p>
                            <p className="mt-2 text-sm font-semibold text-white">{smmPostsPerWeek}</p>
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Focus this week</p>
                          <p className="mt-2 text-sm text-white/80">{smmFocus || "—"}</p>
                        </div>

                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Manager note</p>
                          <p className="mt-2 text-sm text-white/80">{smmManagerNote || "—"}</p>
                        </div>

                        {smmHeroImageUrl ? (
                          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                            <img src={smmHeroImageUrl} alt={smmHeroTitle || "SMM hero"} className="h-44 w-full object-cover" />
                          </div>
                        ) : null}

                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Calendar preview</p>
                            <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{smmSchedule.length} slots</p>
                          </div>
                          <div className="grid gap-2">
                            {smmSchedule.map((item) => (
                              <div key={item.id} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-xs font-semibold text-white">{item.day} · {item.time}</p>
                                  <span className="rounded-full border border-white/12 bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-white/75">{item.status}</span>
                                </div>
                                {item.mediaUrl ? <img src={item.mediaUrl} alt={item.content} className="mt-2 h-20 w-full rounded-lg border border-white/10 object-cover" /> : null}
                                <p title={item.content} className="mt-1 truncate text-sm text-white/75">{item.content || "—"}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-amber-100/85">New posts notification</p>
                          {smmSchedule.filter((item) => item.status !== "done").length === 0 ? (
                            <p className="mt-2 text-xs text-amber-100/80">No new posts pending.</p>
                          ) : (
                            <>
                              <p className="mt-2 text-xs text-amber-100/90">
                                {smmSchedule.filter((item) => item.status !== "done").length} new/updated posts pending in calendar.
                              </p>
                              <div className="mt-2 space-y-1.5">
                                {smmSchedule
                                  .filter((item) => item.status !== "done")
                                  .slice(0, 4)
                                  .map((item) => (
                                    <p key={`notify-${item.id}`} className="truncate text-xs text-amber-100/85">
                                      • {item.day}{item.time ? ` · ${item.time}` : ""} — {item.content || "Post"}
                                    </p>
                                  ))}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="mt-3 rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/10 p-3">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-fuchsia-100/80">Saved client view summary</p>
                          <p className="mt-2 text-xs text-fuchsia-100/90">{`${smmPostsPerWeek} posts/week · Next: ${getNextPostFromSmmSchedule(smmSchedule) || smmNextPostTime || "—"} · ${smmSchedule.length} calendar slots`}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === "lineItems" && (
              <motion.div key="lineItems" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
                <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <h3 className="text-lg font-semibold">Line Item Presets</h3>
                  <p className="mt-1 text-sm text-white/55">Save reusable item titles with default prices. You can add them from Invoices using “Add existing”.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                    <input
                      value={newInvoiceLabelTitle}
                      onChange={(e) => setNewInvoiceLabelTitle(e.target.value)}
                      placeholder="Label title (e.g. SMM Monthly Package)"
                      className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={numberInputValue(newInvoiceLabelRate)}
                      onChange={(e) => setNewInvoiceLabelRate(parseNumberInput(e.target.value))}
                      placeholder="Default price"
                      className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none"
                    />
                    <motion.button
                      type="button"
                      onClick={handleCreateInvoiceLabel}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ y: -1 }}
                      className="h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold hover:bg-white/15"
                    >
                      Save label
                    </motion.button>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/65">Saved labels</h4>
                  <div className="mt-3 space-y-2">
                    {invoiceLabels.length === 0 ? (
                      <p className="text-sm text-white/45">No labels saved yet.</p>
                    ) : (
                      <AnimatePresence initial={false}>
                        {invoiceLabels.map((label) => (
                          <motion.div
                            key={label.id}
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 280, damping: 24 }}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${lastAddedLabelId === label.id ? "border-emerald-300/30 bg-emerald-400/10" : "border-white/10 bg-black/40"}`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">{label.title}</p>
                              <p className="text-xs text-white/55">{label.rate.toFixed(2)} AZN</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteInvoiceLabel(label.id)}
                              className="rounded-lg border border-red-300/25 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Total sessions</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{decoratedSessions.length}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-100/80">Online now</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-100">{decoratedSessions.filter((session) => session.isOnline).length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Selected scope</p>
                    <p className="mt-2 truncate text-lg font-semibold text-white">{selectedClient?.brand_name || "All customers"}</p>
                  </div>
                </div>

                <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Client session security</h3>
                      <p className="mt-1 text-sm text-white/55">Live session activity with device and location tracking.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadSecuritySessions(selectedClientId)}
                      disabled={securityLoading}
                      className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
                    >
                      {securityLoading ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {securityLoading ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/60">Loading sessions...</div>
                  ) : decoratedSessions.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/60">No tracked sessions yet. Client activity will appear here after login.</div>
                  ) : (
                    <div className="space-y-2">
                      {decoratedSessions.map((session) => {
                        const initials = session.customerName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase();

                        return (
                          <div key={session.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-xs font-semibold text-white/85">
                                  {initials || "--"}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-white">{session.customerName}</p>
                                  <p className="truncate text-xs text-white/55">{session.companyName}</p>
                                </div>
                              </div>

                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${session.isOnline ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100" : "border-zinc-300/20 bg-zinc-400/10 text-zinc-200"}`}>
                                <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${session.isOnline ? "bg-emerald-300" : "bg-zinc-300/70"}`} />
                                {session.isOnline ? "Online" : "Offline"}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-2 text-xs text-white/65 sm:grid-cols-3">
                              <p className="truncate"><span className="text-white/40">Device:</span> {session.device_label || "Unknown"}</p>
                              <p className="truncate"><span className="text-white/40">Location:</span> {session.location_label || "Unknown"}</p>
                              <p className="truncate"><span className="text-white/40">Last seen:</span> {session.last_seen_at ? new Date(session.last_seen_at).toLocaleString() : "—"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {activeTab === "system" && (
              <motion.div key="system" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="grid gap-5 xl:grid-cols-2">
                <section className="rounded-2xl border border-white/10 bg-black/25 p-4 xl:col-span-2">
                  <h3 className="text-lg font-semibold">Language</h3>
                  <p className="mt-1 text-sm text-white/55">Choose admin panel language.</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-xs">
                    {languageOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setLanguage(option.value)}
                        className={`rounded-xl border px-2 py-2 text-center transition ${option.value === language ? "border-white/28 bg-white/[0.08]" : "border-white/10 bg-black/75 text-white/75 hover:border-white/20 hover:text-white"}`}
                      >
                        <span className="flex flex-col items-center gap-1">
                          <img src={option.flag} alt={option.short} width={28} height={20} className="h-4.5 w-7 rounded-sm border border-white/20" draggable={false} />
                          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{option.short}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleOwnerLogout}
                    className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-medium text-white/85 hover:border-white/25 hover:bg-white/10"
                  >
                    {t.logout}
                  </button>
                </section>

                <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <h3 className="text-lg font-semibold">{t.createClient}</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input value={newClientForm.brandName} onChange={(e) => setNewClientForm((p) => ({ ...p, brandName: e.target.value }))} placeholder="Company name" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                    <input value={newClientForm.username} onChange={(e) => setNewClientForm((p) => ({ ...p, username: e.target.value }))} placeholder="Representative name" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                    <input value={newClientForm.whatsapp} onChange={(e) => setNewClientForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp number" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                    <input value={newClientForm.password} onChange={(e) => setNewClientForm((p) => ({ ...p, password: e.target.value }))} placeholder="Portal password" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                  </div>
                  <p className="mt-2 text-xs text-white/50">Required: company name, representative name, WhatsApp number, and portal password.</p>
                  <button type="button" onClick={handleCreateClient} className="mt-4 h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold hover:bg-white/15">{t.createClient}</button>
                </section>

                <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <h3 className="text-lg font-semibold">{t.createProject}</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input value={newProjectForm.name} onChange={(e) => setNewProjectForm((p) => ({ ...p, name: e.target.value }))} placeholder="Project name" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                    <select value={newProjectForm.service} onChange={(e) => setNewProjectForm((p) => ({ ...p, service: e.target.value as ServiceType }))} className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none">
                      {serviceOptions.map((service) => <option key={service} value={service}>{service.toUpperCase()}</option>)}
                    </select>
                    <select value={newProjectForm.status} onChange={(e) => setNewProjectForm((p) => ({ ...p, status: e.target.value as ProjectStatus }))} className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none">
                      {projectStatusOptions.map((status) => <option key={status} value={status}>{projectStatusLabels[language][status]}</option>)}
                    </select>
                    <input type="number" min={0} max={100} value={numberInputValue(newProjectForm.progress)} onChange={(e) => setNewProjectForm((p) => ({ ...p, progress: parseNumberInput(e.target.value) }))} placeholder="Progress" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                    <input type="date" value={newProjectForm.startDate} onChange={(e) => setNewProjectForm((p) => ({ ...p, startDate: e.target.value }))} className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none [color-scheme:dark]" />
                    <input type="date" value={newProjectForm.deliveryDate} onChange={(e) => setNewProjectForm((p) => ({ ...p, deliveryDate: e.target.value }))} className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none [color-scheme:dark]" />
                    <input value={newProjectForm.latestUpdate} onChange={(e) => setNewProjectForm((p) => ({ ...p, latestUpdate: e.target.value }))} placeholder="Initial update" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none sm:col-span-2" />
                  </div>
                  <button type="button" onClick={handleCreateProject} className="mt-4 h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold hover:bg-white/15">{t.createProject}</button>
                </section>
              </motion.div>
            )}

            {activeTab === "clients" && (
              <motion.div key="clients" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex min-h-0 flex-col gap-2 md:h-[calc(100vh-280px)] md:gap-3 md:overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/45 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">Client Profiles</h2>
                    <p className="mt-0.5 text-[11px] text-white/50 sm:text-xs">Premium client workspace with independent panel scrolling.</p>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setProfileClientId("");
                      setClientProfileDraft(createEmptyClientProfileDraft());
                      setIsInlineCreateClientMode(true);
                      setIsInlineEditClientMode(false);
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="h-8 rounded-lg border border-white/20 bg-black px-3 text-[11px] font-semibold text-white transition hover:bg-[#101010] sm:ml-auto sm:h-9 sm:text-xs"
                  >
                    + New Client
                  </motion.button>
                </div>

                {clients.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-[#050505]"
                  >
                    <div className="text-center">
                      <Users className="mx-auto mb-3 text-white/25" size={32} weight="light" />
                      <p className="text-sm text-white/45">No clients yet.</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[330px_minmax(0,1fr)] lg:gap-3">
                    <aside className="min-h-0 max-h-[32vh] rounded-2xl border border-white/10 bg-[#050505] p-2.5 sm:max-h-[44vh] sm:p-3 lg:max-h-none">
                      <div className="mb-2.5 flex items-center justify-between px-1 sm:mb-3 sm:px-1.5">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/45 sm:text-[11px]">Clients</p>
                        <p className="text-[10px] text-white/45 sm:text-[11px]">{clients.length}</p>
                      </div>
                      <div className="mb-2.5 space-y-2 px-1 sm:mb-3">
                        <input
                          value={profileSearchQuery}
                          onChange={(e) => setProfileSearchQuery(e.target.value)}
                          placeholder="Search clients..."
                          className="h-8 w-full rounded-lg border border-white/15 bg-[#0b0b0b] px-3 text-[11px] text-white outline-none transition hover:border-white/25 focus:border-white/35 sm:h-9 sm:text-xs"
                        />
                        <div className="flex flex-wrap gap-1">
                          {[
                            { key: "all", label: "All" },
                            { key: "portal", label: "Portal" },
                            { key: "non-portal", label: "No Portal" },
                            { key: "with-invoices", label: "Invoices" },
                          ].map((chip) => (
                            <button
                              key={chip.key}
                              type="button"
                              onClick={() => setProfileFilterMode(chip.key as "all" | "portal" | "non-portal" | "with-invoices")}
                              className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] transition sm:px-2.5 sm:text-[10px] ${
                                profileFilterMode === chip.key
                                  ? "border-white/35 bg-white/15 text-white"
                                  : "border-white/15 bg-[#0f0f0f] text-white/65 hover:border-white/25 hover:text-white"
                              }`}
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="max-h-[calc(32vh-52px)] space-y-2 overflow-y-auto pr-1 sm:max-h-[calc(44vh-52px)] lg:h-[calc(100%-28px)] lg:max-h-none">
                        {(() => {
                          const normalizedSearch = profileSearchQuery.trim().toLowerCase();
                          const filteredClients = clients.filter((client) => {
                            const isPortalActive = inferPortalEnabled(client);
                            const clientProjects = projects.filter((p) => p.client_id === client.id);
                            const hasInvoices = projectInvoices.some((inv: InvoiceRow) => clientProjects.some((project) => project.id === inv.project_id));

                            const matchesSearch =
                              !normalizedSearch ||
                              client.brand_name.toLowerCase().includes(normalizedSearch) ||
                              (client.username ?? "").toLowerCase().includes(normalizedSearch) ||
                              (client.whatsapp_number ?? "").toLowerCase().includes(normalizedSearch);

                            const matchesFilter =
                              profileFilterMode === "all" ||
                              (profileFilterMode === "portal" && isPortalActive) ||
                              (profileFilterMode === "non-portal" && !isPortalActive) ||
                              (profileFilterMode === "with-invoices" && hasInvoices);

                            return matchesSearch && matchesFilter;
                          });

                          const activeClientId =
                            filteredClients.find((c) => c.id === selectedClientForDetails)?.id ??
                            filteredClients[0]?.id ??
                            null;

                          return (
                            <AnimatePresence>
                              {filteredClients.map((client, idx) => {
                                const clientProjects = projects.filter((p) => p.client_id === client.id);
                                const isSelected = activeClientId === client.id;
                                const isPortalActive = inferPortalEnabled(client);

                                return (
                                  <motion.button
                                    key={client.id}
                                    type="button"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => {
                                      setSelectedClientForDetails(client.id);
                                      setShowClientDetailsPanel(false);
                                      setIsInlineCreateClientMode(false);
                                      setIsInlineEditClientMode(false);
                                    }}
                                    className={`w-full rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                                      isSelected
                                        ? "border-white/30 bg-gradient-to-r from-white/15 to-white/[0.04] shadow-[0_14px_30px_rgba(0,0,0,0.45)]"
                                        : "border-white/10 bg-gradient-to-r from-[#080808] to-[#0d0d0d] hover:border-white/25 hover:from-[#0d0d0d] hover:to-[#141414]"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex min-w-0 items-start gap-2.5">
                                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                          isSelected
                                            ? "bg-white text-black"
                                            : "bg-[#171717] text-white/80"
                                        }`}>
                                          {client.brand_name.slice(0, 1).toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-white">{client.brand_name}</p>
                                          <p className="mt-0.5 truncate text-[11px] text-white/55">{client.username || "No representative"}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {isPortalActive && <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/90">Portal</span>}
                                        <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[9px] font-semibold text-white/80">{clientProjects.length}</span>
                                      </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                                      <span className="truncate rounded-full border border-white/10 bg-[#0f0f0f] px-2 py-1 text-white/60">{client.whatsapp_number || "No phone"}</span>
                                      <span className="rounded-full border border-white/15 bg-[#151515] px-2 py-1 text-white/75">{clientProjects.length} project{clientProjects.length !== 1 ? "s" : ""}</span>
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </AnimatePresence>
                          );
                        })()}
                      </div>
                    </aside>

                    <section className="min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-[#050505] p-3 sm:p-4 xl:p-5">
                      <AnimatePresence mode="wait" initial={false}>
                      {isInlineCreateClientMode ? (
                        <motion.div
                          key="profile-create"
                          initial={{ opacity: 0, x: 14 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -14 }}
                          transition={{ duration: 0.2 }}
                          className="flex min-h-full flex-col gap-4"
                        >
                          <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">New Client</p>
                            <h3 className="mt-1 text-base font-semibold tracking-tight text-white sm:text-lg">Create Client Profile</h3>
                            <p className="mt-1 text-[11px] text-white/55 sm:text-xs">Fill details below. This replaces the old popup.</p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-3 sm:p-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Company name*</label>
                                <input
                                  value={clientProfileDraft.companyName}
                                  onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, companyName: e.target.value }))}
                                  className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Representative</label>
                                <input
                                  value={clientProfileDraft.representativeName}
                                  onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, representativeName: e.target.value }))}
                                  className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">WhatsApp*</label>
                                <input
                                  value={clientProfileDraft.whatsappNumber}
                                  onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                                  className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Source (optional)</label>
                                <input
                                  value={clientProfileDraft.source}
                                  onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, source: e.target.value }))}
                                  placeholder="Instagram, referral, website..."
                                  className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Preferred language</label>
                                <select
                                  value={clientProfileDraft.preferredLanguage}
                                  onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, preferredLanguage: e.target.value }))}
                                  className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                >
                                  <option value="az">AZ</option>
                                  <option value="en">EN</option>
                                  <option value="ru">RU</option>
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Preferred currency</label>
                                <select
                                  value={clientProfileDraft.preferredCurrency}
                                  onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, preferredCurrency: e.target.value }))}
                                  className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                >
                                  <option value="AZN">AZN</option>
                                  <option value="USD">USD</option>
                                  <option value="EUR">EUR</option>
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Notes (optional)</label>
                                <textarea
                                  value={clientProfileDraft.notes}
                                  onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, notes: e.target.value }))}
                                  rows={3}
                                  className="mt-2 w-full rounded-lg border border-white/12 bg-black px-3 py-2 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-3 sm:p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Portal Access</p>
                                <p className="mt-1 text-xs text-white/55">Enable optional client login credentials</p>
                              </div>
                              <button
                                type="button"
                                onClick={handleTogglePortalAccess}
                                className={`h-9 rounded-lg px-3 text-xs font-semibold transition ${clientProfileDraft.portalEnabled ? "border border-white/20 bg-white/10 text-white" : "border border-white/15 bg-black text-white/80 hover:bg-[#121212]"}`}
                              >
                                {clientProfileDraft.portalEnabled ? "Enabled" : "Disabled"}
                              </button>
                            </div>

                            <AnimatePresence>
                              {clientProfileDraft.portalEnabled && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2"
                                >
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Portal username</label>
                                    <div className="mt-2 flex gap-2">
                                      <input
                                        value={clientProfileDraft.portalUsername}
                                        onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, portalUsername: e.target.value }))}
                                        className="h-10 flex-1 rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setClientProfileDraft((prev) => ({ ...prev, portalUsername: createPortalUsername(prev.companyName, prev.representativeName) }))}
                                        className="rounded-lg border border-white/15 bg-[#141414] px-2.5 text-[11px] font-semibold text-white/80 hover:bg-[#1a1a1a]"
                                      >
                                        Gen
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Portal password</label>
                                    <div className="mt-2 flex gap-2">
                                      <input
                                        value={clientProfileDraft.portalPassword}
                                        onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, portalPassword: e.target.value }))}
                                        className="h-10 flex-1 rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setClientProfileDraft((prev) => ({ ...prev, portalPassword: createPortalPassword() }))}
                                        className="rounded-lg border border-white/15 bg-[#141414] px-2.5 text-[11px] font-semibold text-white/80 hover:bg-[#1a1a1a]"
                                      >
                                        Gen
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-3">
                            <button
                              type="button"
                              onClick={() => {
                                setIsInlineCreateClientMode(false);
                                setClientProfileDraft(createEmptyClientProfileDraft());
                              }}
                              className="h-9 rounded-lg border border-white/15 bg-[#121212] px-4 text-sm font-semibold text-white/75 transition hover:bg-[#1a1a1a] sm:h-10"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleCreateClientFromProfileDraft}
                              className="h-9 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 sm:h-10"
                            >
                              Create Client
                            </button>
                          </div>
                        </motion.div>
                      ) : isInlineEditClientMode ? (
                        (() => {
                          const editingClient = clients.find((c) => c.id === profileClientId || c.id === selectedClientForDetails);
                          if (!editingClient) return null;

                          return (
                            <motion.div
                              key={`profile-edit-${editingClient.id}`}
                              initial={{ opacity: 0, x: 14 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -14 }}
                              transition={{ duration: 0.2 }}
                              className="flex min-h-full flex-col gap-3"
                            >
                              <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                                <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Edit Client</p>
                                <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">{editingClient.brand_name}</h3>
                                <p className="mt-1 text-xs text-white/55">Update profile details and portal access settings.</p>
                              </div>

                              <div className="rounded-xl border border-white/10 bg-[#0e0e0e] p-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="sm:col-span-2">
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Company name*</label>
                                    <input
                                      value={clientProfileDraft.companyName}
                                      onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, companyName: e.target.value }))}
                                      className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Representative</label>
                                    <input
                                      value={clientProfileDraft.representativeName}
                                      onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, representativeName: e.target.value }))}
                                      className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">WhatsApp*</label>
                                    <input
                                      value={clientProfileDraft.whatsappNumber}
                                      onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                                      className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Source (optional)</label>
                                    <input
                                      value={clientProfileDraft.source}
                                      onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, source: e.target.value }))}
                                      className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Preferred language</label>
                                    <select
                                      value={clientProfileDraft.preferredLanguage}
                                      onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, preferredLanguage: e.target.value }))}
                                      className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                    >
                                      <option value="az">AZ</option>
                                      <option value="en">EN</option>
                                      <option value="ru">RU</option>
                                    </select>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Preferred currency</label>
                                    <select
                                      value={clientProfileDraft.preferredCurrency}
                                      onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, preferredCurrency: e.target.value }))}
                                      className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                    >
                                      <option value="AZN">AZN</option>
                                      <option value="USD">USD</option>
                                      <option value="EUR">EUR</option>
                                    </select>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Notes (optional)</label>
                                    <textarea
                                      value={clientProfileDraft.notes}
                                      onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, notes: e.target.value }))}
                                      rows={3}
                                      className="mt-2 w-full rounded-lg border border-white/12 bg-black px-3 py-2 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-4">
                                <div className="mb-3 flex items-center justify-between">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Portal Access</p>
                                    <p className="mt-1 text-xs text-white/55">Enable/disable login credentials for this client</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleTogglePortalAccess}
                                    className={`h-9 rounded-lg px-3 text-xs font-semibold transition ${clientProfileDraft.portalEnabled ? "border border-white/20 bg-white/10 text-white" : "border border-white/15 bg-black text-white/80 hover:bg-[#121212]"}`}
                                  >
                                    {clientProfileDraft.portalEnabled ? "Enabled" : "Disabled"}
                                  </button>
                                </div>

                                <AnimatePresence>
                                  {clientProfileDraft.portalEnabled && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2"
                                    >
                                      <div>
                                        <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Portal username</label>
                                        <div className="mt-2 flex gap-2">
                                          <input
                                            value={clientProfileDraft.portalUsername}
                                            onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, portalUsername: e.target.value }))}
                                            className="h-10 flex-1 rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setClientProfileDraft((prev) => ({ ...prev, portalUsername: createPortalUsername(prev.companyName, prev.representativeName) }))}
                                            className="rounded-lg border border-white/15 bg-[#141414] px-2.5 text-[11px] font-semibold text-white/80 hover:bg-[#1a1a1a]"
                                          >
                                            Gen
                                          </button>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Portal password</label>
                                        <div className="mt-2 flex gap-2">
                                          <input
                                            value={clientProfileDraft.portalPassword}
                                            onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, portalPassword: e.target.value }))}
                                            className="h-10 flex-1 rounded-lg border border-white/12 bg-black px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-white/30"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setClientProfileDraft((prev) => ({ ...prev, portalPassword: createPortalPassword() }))}
                                            className="rounded-lg border border-white/15 bg-[#141414] px-2.5 text-[11px] font-semibold text-white/80 hover:bg-[#1a1a1a]"
                                          >
                                            Gen
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const targetClientId = profileClientId || selectedClientForDetails || "";
                                    if (!targetClientId) return;

                                    setConfirmDialog({
                                      isOpen: true,
                                      message: "Delete this client and all related projects/invoices?",
                                      onConfirm: () => {
                                        void handleDeleteClientProfile(targetClientId);
                                      },
                                    });
                                  }}
                                  className="mr-auto h-10 rounded-lg border border-red-300/30 bg-red-500/10 px-4 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
                                >
                                  Delete Client
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsInlineEditClientMode(false);
                                    setProfileClientId("");
                                  }}
                                  className="h-10 rounded-lg border border-white/15 bg-[#121212] px-4 text-sm font-semibold text-white/75 transition hover:bg-[#1a1a1a]"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveClientProfileInline}
                                  className="h-10 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </motion.div>
                          );
                        })()
                      ) : (
                        (() => {
                          const activeClient = clients.find((c) => c.id === selectedClientForDetails) ?? clients[0];
                          if (!activeClient) return null;

                          const activeProjects = projects.filter((p) => p.client_id === activeClient.id);
                          const clientInvoices = projectInvoices.filter((inv: InvoiceRow) => {
                            const project = projects.find((p) => p.id === inv.project_id);
                            return project?.client_id === activeClient.id;
                          });
                          const paidTotal = clientInvoices.reduce((sum: number, inv: InvoiceRow) => sum + (inv.paid_amount ?? 0), 0);
                          const outstandingTotal = clientInvoices.reduce((sum: number, inv: InvoiceRow) => {
                            const amount = Number(inv.amount) || 0;
                            const paid = Math.min(Number(inv.paid_amount ?? 0), amount);
                            return sum + Math.max(0, amount - paid);
                          }, 0);
                          const clientOverdueCount = clientInvoices.filter((inv: InvoiceRow) => {
                            if (inv.status === "paid") return false;
                            if (!inv.due_date) return false;
                            const dueDate = new Date(inv.due_date);
                            if (Number.isNaN(dueDate.getTime())) return false;
                            return dueDate < new Date();
                          }).length;
                          const recentClientSessions = decoratedSessions
                            .filter((session) => session.client_id === activeClient.id)
                            .slice(0, 4);

                          return (
                            <motion.div
                              key={`profile-details-${activeClient.id}`}
                              initial={{ opacity: 0, x: 14 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -14 }}
                              transition={{ duration: 0.2 }}
                              className="flex min-h-full flex-col gap-4"
                            >
                              <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#0e0e0e] p-4">
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Profile Details</p>
                                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">{activeClient.brand_name}</h3>
                                  <p className="mt-1 text-xs text-white/55">{activeClient.username || "No representative"} · {activeClient.whatsapp_number || "No phone"}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  {inferPortalEnabled(activeClient) && (
                                    <span className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90">
                                      Portal Active
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const inferred = inferPortalEnabled(activeClient);
                                      const companyName = activeClient.brand_name ?? "";
                                      const representativeName = activeClient.username ?? "";
                                      const portalUsername = (activeClient.username ?? "").trim() || createPortalUsername(companyName, representativeName);
                                      const rawPassword = (activeClient.password ?? "").trim();
                                      const portalPassword = isDisabledPortalPassword(rawPassword) ? rawPassword.replace(/^DISABLED::/, "") : rawPassword;

                                      setProfileClientId(activeClient.id);
                                      setClientProfileDraft({
                                        companyName,
                                        representativeName,
                                        whatsappNumber: activeClient.whatsapp_number ?? "",
                                        portalEnabled: inferred,
                                        portalUsername,
                                        portalPassword,
                                        notes: activeClient.notes ?? "",
                                        source: activeClient.source ?? "",
                                        preferredLanguage: activeClient.preferred_language ?? "az",
                                        preferredCurrency: activeClient.preferred_currency ?? "AZN",
                                      });
                                      setIsInlineCreateClientMode(false);
                                      setIsInlineEditClientMode(true);
                                    }}
                                    className="h-8 rounded-lg border border-white/20 bg-[#141414] px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/85 transition hover:bg-[#1b1b1b]"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-white/10 bg-[#111111] p-3">
                                  <p className="text-[10px] uppercase tracking-wider text-white/45">Projects</p>
                                  <p className="mt-1 text-xl font-semibold text-white">{activeProjects.length}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-[#111111] p-3">
                                  <p className="text-[10px] uppercase tracking-wider text-white/45">Invoices</p>
                                  <p className="mt-1 text-xl font-semibold text-white">{clientInvoices.length}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-[#111111] p-3">
                                  <p className="text-[10px] uppercase tracking-wider text-white/45">Paid</p>
                                  <p className="mt-1 text-xl font-semibold text-emerald-300">{formatAzn(paidTotal)}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-[#111111] p-3 sm:col-span-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                    <span className="text-white/60">Outstanding: <span className="font-semibold text-amber-200">{formatAzn(outstandingTotal)}</span></span>
                                    <span className="text-white/60">Overdue invoices: <span className="font-semibold text-white">{clientOverdueCount}</span></span>
                                    <span className="text-white/60">Portal: <span className="font-semibold text-white">{inferPortalEnabled(activeClient) ? "Enabled" : "Disabled"}</span></span>
                                  </div>
                                </div>
                              </div>

                              <div className="hidden gap-3 md:grid md:grid-cols-2">
                                <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-3">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Client context</h4>
                                  <div className="mt-2 space-y-2 text-xs text-white/70">
                                    <p><span className="text-white/45">Source:</span> {activeClient.source?.trim() || "Not specified"}</p>
                                    <p><span className="text-white/45">Preferred language:</span> {(activeClient.preferred_language || "AZ").toUpperCase()}</p>
                                    <p><span className="text-white/45">Preferred currency:</span> {(activeClient.preferred_currency || "AZN").toUpperCase()}</p>
                                    <p><span className="text-white/45">Notes:</span> {activeClient.notes?.trim() || "No notes"}</p>
                                  </div>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-3">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Recent activity</h4>
                                  {recentClientSessions.length > 0 ? (
                                    <div className="mt-2 space-y-2">
                                      {recentClientSessions.map((session) => (
                                        <div key={session.id} className="rounded-lg border border-white/10 bg-[#121212] px-2.5 py-2 text-[11px] text-white/70">
                                          <p className="font-medium text-white/90">{session.device_label || "Unknown device"}</p>
                                          <p className="mt-0.5 text-white/55">{session.location_label || "Unknown location"}</p>
                                          <p className="mt-0.5 text-white/45">{session.last_seen_at ? new Date(session.last_seen_at).toLocaleString() : "No activity timestamp"}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-xs text-white/45">No portal activity yet.</p>
                                  )}
                                </div>
                              </div>

                              <div className="min-h-0 flex-1 rounded-xl border border-white/10 bg-[#0f0f0f] p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Recent Invoices</h4>
                                  <span className="text-[10px] text-white/50">{clientInvoices.length}</span>
                                </div>
                                {clientInvoices.length > 0 ? (
                                  <div className="h-[calc(100%-28px)] space-y-2 overflow-y-auto pr-1">
                                    {clientInvoices.slice(0, 8).map((invoice: InvoiceRow) => (
                                      <button
                                        key={invoice.id}
                                        type="button"
                                        onClick={() => {
                                          setActiveTab("invoices");
                                          setSelectedInvoiceId(invoice.id);
                                          const project = projects.find((p) => p.id === invoice.project_id);
                                          if (project) {
                                            setSelectedClientId(project.client_id);
                                            setSelectedProjectId(project.id);
                                            persistOwnerSelection(project.client_id, project.id);
                                          }
                                        }}
                                        className="w-full rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-left transition hover:border-white/25 hover:bg-[#181818]"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="text-xs font-semibold text-white">#{invoice.invoice_number}</p>
                                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${invoice.status === "paid" ? "bg-emerald-400/20 text-emerald-200" : invoice.status === "partial" ? "bg-yellow-400/20 text-yellow-200" : "bg-red-400/20 text-red-200"}`}>
                                            {invoice.status}
                                          </span>
                                        </div>
                                          <p className="mt-0.5 text-[11px] text-white/55">{formatAzn(invoice.amount)}</p>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex h-[calc(100%-28px)] items-center justify-center rounded-lg border border-dashed border-white/10 text-center">
                                    <p className="text-xs text-white/45">No invoices for this client.</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })()
                      )}
                      </AnimatePresence>
                    </section>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {confirmDialog?.isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60"
              onClick={() => setConfirmDialog(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-2xl border border-white/20 bg-black/80 backdrop-blur-xl p-6 shadow-2xl max-w-sm"
              >
                <h2 className="text-lg font-semibold text-white">{confirmDialog?.message}</h2>
                <p className="mt-2 text-sm text-white/60">This action will be saved to your account.</p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 h-10 rounded-lg border border-white/15 bg-white/5 text-sm font-semibold text-white/80 transition-all duration-200 hover:bg-white/10 hover:border-white/25"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      confirmDialog?.onConfirm();
                      setConfirmDialog(null);
                    }}
                    className="flex-1 h-10 rounded-lg bg-white/15 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/25 hover:shadow-lg hover:shadow-white/10"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isClientProfileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 sm:p-6"
              onClick={() => {
                setIsClientProfileOpen(false);
                setIsClientProjectsModalOpen(false);
                setProfileClientId("");
              }}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 24, stiffness: 280 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/15 bg-[#0d0d0d] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              >
                {/* Header - Sticky */}
                <div className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-b from-[#0d0d0d] to-[#0d0d0d]/80 backdrop-blur-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Client Profile</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                        {clientProfileDraft.companyName || "New client"}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsClientProfileOpen(false);
                        setProfileClientId("");
                      }}
                      className="mt-1 text-white/50 hover:text-white transition"
                    >
                      <X size={24} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Content - Scrollable */}
                <div className="space-y-5 p-6">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Basic Information</h3>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
                      <div>
                        <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Company name*</label>
                        <input
                          value={clientProfileDraft.companyName}
                          onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, companyName: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30 transition"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Representative name*</label>
                          <input
                            value={clientProfileDraft.representativeName}
                            onChange={(e) => {
                              const nextName = e.target.value;
                              setClientProfileDraft((prev) => ({
                                ...prev,
                                representativeName: nextName,
                                portalUsername:
                                  !prev.portalUsername || prev.portalUsername === prev.representativeName
                                    ? nextName
                                    : prev.portalUsername,
                              }));
                            }}
                            className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30 transition"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">WhatsApp number*</label>
                          <input
                            value={clientProfileDraft.whatsappNumber}
                            onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                            className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30 transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portal Access */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Portal Access</h3>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-white/45">Status</p>
                          <p className="mt-1 text-sm text-white/70">
                            {clientProfileDraft.portalEnabled ? "✓ Enabled and ready for login" : "○ Disabled"}
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          onClick={handleTogglePortalAccess}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`h-10 rounded-lg px-4 text-sm font-semibold transition ${clientProfileDraft.portalEnabled ? "border border-emerald-400/30 bg-emerald-400/15 text-emerald-100" : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"}`}
                        >
                          {clientProfileDraft.portalEnabled ? "Deactivate" : "Activate"}
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {clientProfileDraft.portalEnabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 border-t border-white/10 pt-4"
                          >
                            <div>
                              <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Portal username</label>
                              <div className="mt-2 flex gap-2">
                                <input
                                  value={clientProfileDraft.portalUsername}
                                  onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, portalUsername: e.target.value }))}
                                  placeholder="Generated on activation"
                                  className="h-11 flex-1 rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30 transition"
                                />
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setClientProfileDraft((prev) => ({ ...prev, portalUsername: createPortalUsername(prev.companyName, prev.representativeName) }))}
                                  className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
                                >
                                  Generate
                                </motion.button>
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Portal password</label>
                              <div className="mt-2 flex gap-2">
                                <input
                                  value={clientProfileDraft.portalPassword}
                                  onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, portalPassword: e.target.value }))}
                                  placeholder="Generated on activation"
                                  className="h-11 flex-1 rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30 transition"
                                />
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setClientProfileDraft((prev) => ({ ...prev, portalPassword: createPortalPassword() }))}
                                  className="h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
                                >
                                  Generate
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Projects Management */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Projects & Details</h3>
                        <p className="mt-1 text-xs text-white/50">Manage and view all associated projects</p>
                      </div>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => setIsClientProjectsModalOpen(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-11 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15 transition flex items-center justify-center gap-2"
                    >
                      <Package size={16} />
                      Manage Projects & Details
                    </motion.button>
                  </div>
                </div>

                {/* Footer - Sticky */}
                <div className="sticky bottom-0 border-t border-white/10 bg-gradient-to-t from-[#0d0d0d] to-[#0d0d0d]/80 backdrop-blur-sm flex gap-3 p-6">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setIsClientProfileOpen(false);
                      setIsClientProjectsModalOpen(false);
                      setProfileClientId("");
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="h-11 flex-1 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleSaveClientProfile}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-11 flex-1 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15 transition"
                  >
                    Save Profile
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isClientProjectsModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 sm:p-6"
              onClick={() => setIsClientProjectsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 24, stiffness: 280 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-white/15 bg-[#0d0d0d] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              >
                {/* Header - Sticky */}
                <div className="sticky top-0 z-10 border-b border-white/10 bg-gradient-to-b from-[#0d0d0d] to-[#0d0d0d]/80 backdrop-blur-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Projects & Details</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                        {clientProfileDraft.companyName || "Projects"}
                      </h2>
                      <p className="mt-1 text-xs text-white/50">
                        {profileProjects.length} project{profileProjects.length !== 1 ? "s" : ""} in total
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsClientProjectsModalOpen(false)}
                      className="mt-1 text-white/50 hover:text-white transition"
                    >
                      <X size={24} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Content - Scrollable */}
                <div className="space-y-6 p-6">
                  {/* Existing Projects */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Existing Projects</h3>
                      {profileProjects.length > 0 && (
                        <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-white/60">
                          {profileProjects.length}
                        </span>
                      )}
                    </div>

                    {profileProjects.length > 0 ? (
                      <div className="grid gap-3">
                        <AnimatePresence>
                          {profileProjects.map((project, idx) => (
                            <motion.div
                              key={project.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-4 hover:border-white/20 transition"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-semibold text-white truncate">{project.name}</h4>
                                    <span className="inline-block rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/60">
                                      {project.service}
                                    </span>
                                    <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold ${
                                      project.status === "delivered" ? "bg-emerald-400/20 text-emerald-200" :
                                      project.status === "review" ? "bg-yellow-400/20 text-yellow-200" :
                                      project.status === "in_progress" ? "bg-blue-400/20 text-blue-200" :
                                      "bg-white/10 text-white/60"
                                    }`}>
                                      {projectStatusLabels[language][project.status]}
                                    </span>
                                  </div>
                                  
                                  <div className="mt-3 grid gap-2 text-xs text-white/60">
                                    {project.progress > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span>Progress:</span>
                                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500"
                                            style={{ width: `${project.progress}%` }}
                                          />
                                        </div>
                                        <span className="font-semibold">{project.progress}%</span>
                                      </div>
                                    )}
                                    {project.start_date && (
                                      <div className="flex items-center gap-2">
                                        <CalendarDots size={12} />
                                        <span>Started: {new Date(project.start_date).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                    {project.delivery_date && (
                                      <div className="flex items-center gap-2">
                                        <FileText size={12} />
                                        <span>Delivery: {new Date(project.delivery_date).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                    {project.latest_update && (
                                      <div className="text-[10px] text-white/40">
                                        Last updated: {new Date(project.latest_update).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <motion.button
                                  type="button"
                                  onClick={() => {
                                    setProjectDraft({
                                      name: project.name,
                                      service: project.service,
                                      status: project.status,
                                      progress: project.progress,
                                      startDate: toInputDate(project.start_date),
                                      deliveryDate: toInputDate(project.delivery_date),
                                      latestUpdate: project.latest_update ?? "",
                                    });
                                    setSelectedProjectId(project.id);
                                    setIsEditingProject(true);
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="shrink-0 rounded-lg border border-blue-300/30 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100 hover:bg-blue-500/25 transition"
                                >
                                  Edit
                                </motion.button>
                                <motion.button
                                  type="button"
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      message: `Delete project "${project.name}"? Invoices will be preserved.`,
                                      onConfirm: () => handleDeleteProject(project.id),
                                    });
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="shrink-0 rounded-lg border border-red-300/30 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/25 transition"
                                >
                                  Delete
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center"
                      >
                        <Package className="mx-auto mb-2 text-white/30" size={32} weight="light" />
                        <p className="text-sm text-white/45">No projects yet. Create one to get started.</p>
                      </motion.div>
                    )}
                  </div>

                  {/* Add New Project */}
                  <div className="space-y-3 border-t border-white/10 pt-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Add New Project</h3>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                      <input
                        value={newProjectForm.name}
                        onChange={(e) => setNewProjectForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Project name"
                        className="h-11 w-full rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white placeholder-white/40 outline-none hover:border-white/20 focus:border-white/30 transition"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <select
                          value={newProjectForm.service}
                          onChange={(e) => setNewProjectForm((p) => ({ ...p, service: e.target.value as ServiceType }))}
                          className="h-11 rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30 transition"
                        >
                          {serviceOptions.map((service) => (
                            <option key={service} value={service}>
                              {service.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newProjectForm.status}
                          onChange={(e) => setNewProjectForm((p) => ({ ...p, status: e.target.value as ProjectStatus }))}
                          className="h-11 rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30 transition"
                        >
                          {projectStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {projectStatusLabels[language][status]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <motion.button
                        type="button"
                        onClick={handleCreateProject}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-11 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15 transition flex items-center justify-center gap-2"
                      >
                        <span>+</span>
                        Add project
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Footer - Sticky */}
                <div className="sticky bottom-0 border-t border-white/10 bg-gradient-to-t from-[#0d0d0d] to-[#0d0d0d]/80 backdrop-blur-sm p-6">
                  <motion.button
                    type="button"
                    onClick={() => setIsClientProjectsModalOpen(false)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Edit Project Modal */}
          <AnimatePresence>
            {isEditingProject && selectedProjectId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 sm:p-6"
                onClick={() => setIsEditingProject(false)}
              >
                <motion.div
                  initial={{ scale: 0.96, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.96, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 24, stiffness: 280 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl rounded-[28px] border border-white/15 bg-[#0d0d0d] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
                >
                  {/* Header */}
                  <div className="sticky top-0 border-b border-white/10 bg-[#0d0d0d]/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">Edit Project</p>
                      <h2 className="mt-1 text-lg font-semibold text-white">{projectDraft.name || "Project"}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingProject(false)}
                      className="text-white/50 hover:text-white"
                    >
                      <X size={20} weight="bold" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-white/60 font-semibold">Project Name</label>
                      <input
                        value={projectDraft.name}
                        onChange={(e) => setProjectDraft((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Project name"
                        className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white placeholder-white/40 outline-none hover:border-white/20 focus:border-white/30 transition"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs uppercase tracking-wider text-white/60 font-semibold">Service Type</label>
                        <select
                          value={projectDraft.service}
                          onChange={(e) => setProjectDraft((p) => ({ ...p, service: e.target.value as ServiceType }))}
                          className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30 transition"
                        >
                          {serviceOptions.map((service) => (
                            <option key={service} value={service}>
                              {service.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-wider text-white/60 font-semibold">Status</label>
                        <select
                          value={projectDraft.status}
                          onChange={(e) => setProjectDraft((p) => ({ ...p, status: e.target.value as ProjectStatus }))}
                          className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30 transition"
                        >
                          {projectStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {projectStatusLabels[language][status]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-wider text-white/60 font-semibold">Progress (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={numberInputValue(projectDraft.progress)}
                          onChange={(e) => setProjectDraft((p) => ({ ...p, progress: parseNumberInput(e.target.value) }))}
                          placeholder="0-100"
                          className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white placeholder-white/40 outline-none hover:border-white/20 focus:border-white/30 transition"
                        />
                      </div>

                      <div className="col-span-1" />

                      <div>
                        <label className="text-xs uppercase tracking-wider text-white/60 font-semibold">Start Date</label>
                        <input
                          type="date"
                          value={projectDraft.startDate}
                          onChange={(e) => setProjectDraft((p) => ({ ...p, startDate: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30 transition [color-scheme:dark]"
                        />
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-wider text-white/60 font-semibold">Delivery Date</label>
                        <input
                          type="date"
                          value={projectDraft.deliveryDate}
                          onChange={(e) => setProjectDraft((p) => ({ ...p, deliveryDate: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-lg border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30 transition [color-scheme:dark]"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs uppercase tracking-wider text-white/60 font-semibold">Latest Update / Notes</label>
                        <textarea
                          value={projectDraft.latestUpdate}
                          onChange={(e) => setProjectDraft((p) => ({ ...p, latestUpdate: e.target.value }))}
                          placeholder="Latest update or notes..."
                          className="mt-2 col-span-2 rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/40 outline-none hover:border-white/20 focus:border-white/30 transition resize-none"
                          rows={3}
                        />
                      </div>
                    </div>

                    {notice && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3 py-2 text-xs text-emerald-200"
                      >
                        {notice}
                      </motion.div>
                    )}

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-red-500/15 border border-red-400/30 px-3 py-2 text-xs text-red-200"
                      >
                        {error}
                      </motion.div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 border-t border-white/10 bg-gradient-to-t from-[#0d0d0d] to-[#0d0d0d]/80 backdrop-blur-sm flex gap-3 p-6">
                    <motion.button
                      type="button"
                      onClick={() => setIsEditingProject(false)}
                      whileTap={{ scale: 0.98 }}
                      className="h-11 flex-1 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleUpdateProject}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="h-11 flex-1 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15 transition"
                    >
                      Save Changes
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Client Details Panel - Like Invoice Details */}
          <AnimatePresence>
            {showClientDetailsPanel && selectedClientForDetails && (
              <motion.div
                key="client-details"
                initial={{ opacity: 0, x: 400 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 400 }}
                transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#0a0a0a] shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
              >
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Client Profile</p>
                      <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                        {(() => {
                          const client = clients.find((c) => c.id === selectedClientForDetails);
                          return client?.brand_name || "Loading...";
                        })()}
                      </h2>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => {
                        setShowClientDetailsPanel(false);
                        setSelectedClientForDetails(null);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-white/50 hover:text-white transition"
                    >
                      <X size={24} weight="bold" />
                    </motion.button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6 p-6">
                  {(() => {
                    const client = clients.find((c) => c.id === selectedClientForDetails);
                    const clientInvoices = projectInvoices.filter((inv: InvoiceRow) => {
                      const project = projects.find((p) => p.id === inv.project_id);
                      return project?.client_id === selectedClientForDetails;
                    });
                    const isPortalActive = client ? inferPortalEnabled(client) : false;

                    if (!client) return <p className="text-white/50">Loading client details...</p>;

                    return (
                      <>
                        {/* Client Info Card */}
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-white/45">Company</p>
                            <p className="mt-2 text-lg font-semibold text-white">{client.brand_name}</p>
                          </div>
                          <div className="grid gap-4 grid-cols-2">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-white/45">Representative</p>
                              <p className="mt-1 text-sm text-white/80">{client.username || "—"}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-white/45">WhatsApp</p>
                              <p className="mt-1 text-sm text-white/80">{client.whatsapp_number || "—"}</p>
                            </div>
                          </div>
                          {isPortalActive && (
                            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/15 p-3">
                              <p className="text-xs text-emerald-100">✓ Portal access active</p>
                            </div>
                          )}
                        </div>

                        {/* Projects Summary */}
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                          <p className="text-[11px] uppercase tracking-wider text-white/45 font-semibold">Projects</p>
                          <div className="mt-3 grid gap-3 grid-cols-3">
                            <div className="rounded-lg bg-white/5 p-3 text-center">
                              <p className="text-2xl font-bold text-white">{projects.filter((p) => p.client_id === client.id).length}</p>
                              <p className="mt-1 text-[10px] uppercase text-white/50">Total</p>
                            </div>
                            <div className="rounded-lg bg-white/5 p-3 text-center">
                              <p className="text-2xl font-bold text-blue-400">{projects.filter((p) => p.client_id === client.id && p.status !== "delivered").length}</p>
                              <p className="mt-1 text-[10px] uppercase text-white/50">Active</p>
                            </div>
                            <div className="rounded-lg bg-white/5 p-3 text-center">
                              <p className="text-2xl font-bold text-emerald-400">{projects.filter((p) => p.client_id === client.id && p.status === "delivered").length}</p>
                              <p className="mt-1 text-[10px] uppercase text-white/50">Done</p>
                            </div>
                          </div>
                        </div>

                        {/* Invoices Section */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Invoices ({clientInvoices.length})</h3>
                          {clientInvoices.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                              <AnimatePresence>
                                {clientInvoices.map((invoice: InvoiceRow, idx: number) => (
                                  <motion.button
                                    key={invoice.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: idx * 0.05 }}
                                    type="button"
                                    onClick={() => {
                                      setActiveTab("invoices");
                                      setSelectedInvoiceId(invoice.id);
                                      const project = projects.find((p) => p.id === invoice.project_id);
                                      if (project) {
                                        setSelectedClientId(project.client_id);
                                        setSelectedProjectId(project.id);
                                        persistOwnerSelection(project.client_id, project.id);
                                      }
                                      setShowClientDetailsPanel(false);
                                    }}
                                    className="group w-full rounded-lg border border-white/10 bg-gradient-to-r from-white/[0.05] to-white/[0.02] p-3 text-left transition hover:border-white/20 hover:from-white/[0.08] hover:to-white/[0.03]"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">Invoice #{invoice.invoice_number}</p>
                                        <div className="mt-1 flex items-center gap-2 text-[10px] text-white/50">
                                          <FileText size={12} />
                                          <span>{(() => {
                                            const proj = projects.find((p) => p.id === invoice.project_id);
                                            return proj?.name || "Unknown project";
                                          })()}</span>
                                        </div>
                                      </div>
                                      <div className="shrink-0 text-right">
                                        <p className="text-sm font-semibold text-white">${invoice.amount.toLocaleString()}</p>
                                        <span className={`inline-block mt-1 px-2 py-1 rounded text-[10px] font-semibold uppercase ${
                                          invoice.status === "paid" ? "bg-emerald-400/20 text-emerald-200" :
                                          invoice.status === "partial" ? "bg-yellow-400/20 text-yellow-200" :
                                          "bg-red-400/20 text-red-200"
                                        }`}>
                                          {invoice.status}
                                        </span>
                                      </div>
                                    </div>
                                  </motion.button>
                                ))}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-white/10 py-6 px-4 text-center">
                              <p className="text-sm text-white/50">No invoices yet</p>
                            </div>
                          )}
                        </div>

                        {/* Activity Log */}
                        <div className="space-y-3 border-t border-white/10 pt-6">
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Activity</h3>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                              <p className="text-[10px] uppercase tracking-wider text-white/40">Client Created</p>
                              <p className="mt-1 text-xs text-white/70">Profile established</p>
                            </div>
                            {clientInvoices.map((invoice: InvoiceRow) => (
                              <div key={invoice.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                                <p className="text-[10px] uppercase tracking-wider text-white/40">Invoice #{invoice.invoice_number} Created</p>
                                <p className="mt-1 text-xs text-white/70">${invoice.amount.toLocaleString()} • {invoice.status.toUpperCase()}</p>
                                {invoice.issue_date && (
                                  <p className="mt-1 text-[10px] text-white/50">{new Date(invoice.issue_date).toLocaleDateString()}</p>
                                )}
                              </div>
                            ))}
                            {clientInvoices.filter((inv: InvoiceRow) => (inv.paid_amount ?? 0) > 0).length > 0 && (
                              <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3">
                                <p className="text-[10px] uppercase tracking-wider text-emerald-300">Payments Received</p>
                                <p className="mt-1 text-xs text-emerald-100">
                                  Total: ${clientInvoices.reduce((sum: number, inv: InvoiceRow) => sum + (inv.paid_amount ?? 0), 0).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
        </main>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-black" />
  );
}
