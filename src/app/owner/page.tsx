"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarDots, CaretDown, ChartBar, DotsThreeOutline, FileText, GearSix, House, Package, SpeakerHigh, Users } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import type { ProjectStatus, ServiceType } from "@/lib/types";

type OwnerLanguage = "en" | "ru" | "az";
type OwnerTab = "overview" | "status" | "invoices" | "materials" | "smm" | "profiles" | "labels" | "setup";

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
};

type DeliverableRow = {
  id: string;
  project_id: string;
  title: string;
  category: string;
  created_at: string | null;
  url: string;
};

const serviceOptions: ServiceType[] = ["website", "smm", "software", "app", "branding"];
const projectStatusOptions: ProjectStatus[] = ["planning", "in_progress", "review", "delivered"];
const invoiceStatusOptions = ["unpaid", "partial", "paid"] as const;
const tabs: OwnerTab[] = ["overview", "status", "invoices", "materials", "smm", "profiles", "setup"];

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
    clients: "Clients",
    projects: "Projects",
    avgProjects: "Avg projects/client",
    overview: "Overview",
    profiles: "Profiles",
    labels: "Labels",
    status: "Status",
    invoices: "Invoices",
    materials: "Materials",
    smm: "SMM",
    setup: "Setup",
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
    clients: "Клиенты",
    projects: "Проекты",
    avgProjects: "Среднее проектов/клиент",
    overview: "Обзор",
    profiles: "Профили",
    labels: "Лейблы",
    status: "Статус",
    invoices: "Счета",
    materials: "Материалы",
    smm: "SMM",
    setup: "Настройка",
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
    clients: "Müştərilər",
    projects: "Layihələr",
    avgProjects: "Orta layihə/müştəri",
    overview: "Ümumi",
    profiles: "Profillər",
    labels: "Etiketlər",
    status: "Status",
    invoices: "Fakturalar",
    materials: "Materiallar",
    smm: "SMM",
    setup: "Quraşdırma",
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
  { key: "status", icon: ChartBar },
  { key: "invoices", icon: FileText },
  { key: "materials", icon: Package },
  { key: "smm", icon: SpeakerHigh },
  { key: "profiles", icon: Users },
  { key: "setup", icon: GearSix },
];

const generalOwnerTabItems: Array<{ key: OwnerTab; icon: typeof House }> = [
  { key: "overview", icon: House },
  { key: "invoices", icon: FileText },
  { key: "labels", icon: Package },
  { key: "profiles", icon: Users },
  { key: "setup", icon: GearSix },
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

function inferInvoiceMeta(invoice: InvoiceRow) {
  const metadata = invoice.metadata ?? {};
  const normalizedMetaService = (metadata.serviceCategory ?? "").toLowerCase();
  const serviceCategory = normalizedMetaService || invoice.project_service || "website";
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
  const [allInvoiceCount, setAllInvoiceCount] = useState(0);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [invoiceTargetClientId, setInvoiceTargetClientId] = useState("");
  const [invoiceTargetProjectId, setInvoiceTargetProjectId] = useState("");
  const [invoiceEditProjectId, setInvoiceEditProjectId] = useState("");
  const [supportsPortalEnabled, setSupportsPortalEnabled] = useState<boolean | null>(null);
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

  async function loadLists(preferredClientId?: string, preferredProjectId?: string) {
    setLoading(true);
    setError(null);

    const clientsReq =
      supportsPortalEnabled === false
        ? supabase.from("clients").select("id, brand_name, username, password, whatsapp_number").order("brand_name", { ascending: true })
        : supabase.from("clients").select("id, brand_name, username, password, whatsapp_number, portal_enabled").order("brand_name", { ascending: true });

    const [{ data: initialClientRows, error: initialClientErr }, { data: projectRows, error: projectErr }, { count: invoiceCount }] = await Promise.all([
      clientsReq,
      supabase.from("projects").select("id, client_id, name, service, status, progress, start_date, delivery_date, latest_update").order("name", { ascending: true }),
      supabase.from("invoices").select("id", { count: "exact", head: true }),
    ]);

    let clientRows = initialClientRows;
    let clientErr = initialClientErr;

    if (supportsPortalEnabled !== false && initialClientErr?.code === "42703") {
      setSupportsPortalEnabled(false);
      const fallback = await supabase.from("clients").select("id, brand_name, username, password, whatsapp_number").order("brand_name", { ascending: true });
      clientRows = (fallback.data ?? []).map((row) => ({ ...row, portal_enabled: null }));
      clientErr = fallback.error;
    } else if (supportsPortalEnabled !== false && !initialClientErr) {
      setSupportsPortalEnabled(true);
    }

    if (clientErr || projectErr) {
      setError(t.errorLoad);
      setLoading(false);
      return;
    }

    const nextClients = (clientRows ?? []) as ClientOption[];
    const nextProjects = (projectRows ?? []) as ProjectOption[];

    setAllInvoiceCount(invoiceCount ?? 0);

    setClients(nextClients);
    setProjects(nextProjects);

    const nextClientId = preferredClientId ?? selectedClientId ?? "";
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
    const meta = {
      ...(invoice.metadata ?? {}),
      ...(invoiceMetaMap[invoice.id] ?? {}),
    };
    const inferred = inferInvoiceMeta(invoice);
    const effectiveService = ((meta?.serviceCategory as ServiceType | undefined) ?? (inferred.serviceCategory as ServiceType)) || "website";
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
      serviceCategory: (meta?.serviceCategory as ServiceType) ?? (inferred.serviceCategory as ServiceType),
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

  async function handleDeleteProject(projectId: string) {
    setNotice(null);
    setError(null);

    const { error: deleteErr } = await supabase.from("projects").delete().eq("id", projectId);
    if (deleteErr) {
      setError(withErrorDetails("Could not delete project.", deleteErr));
      return;
    }

    if (selectedProjectId === projectId) {
      setSelectedProjectId("");
      persistOwnerSelection(selectedClientId, "");
    }

    setNotice("Project deleted.");
    await loadLists(selectedClientId, selectedProjectId === projectId ? undefined : selectedProjectId);
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

  if (!authorized) {
    return <div className="min-h-screen bg-black" />;
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

  const tabButtonClass = (tab: OwnerTab) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition ${
      activeTab === tab
        ? "border-white bg-white text-black"
        : "border-white/15 bg-black/30 text-white/70 hover:border-white/25 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
        <aside className="sticky top-0 hidden h-screen w-[302px] shrink-0 flex-col border-r border-white/10 bg-[#090909] px-5 py-6 xl:flex">
            <div className="space-y-4 flex-1 flex flex-col">
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

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{t.title}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{t.clientContext}</h1>
          <p className="mt-3 max-w-3xl text-white/60">{t.subtitle}</p>
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

        <div className="mt-5 rounded-[28px] border border-white/8 bg-black/50 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
                <p className="text-sm text-white/65">{t.allGood}</p>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{t.appWebsiteStatus}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedProject?.name ?? (isGeneralMode ? "General company view" : "—")}</p>
                    <p className="mt-1 text-sm text-white/60">{selectedProject ? `${selectedProject.service.toUpperCase()} · ${projectStatusLabels[language][selectedProject.status]} · ${selectedProject.progress}%` : isGeneralMode ? `Clients · ${clients.length} · Projects · ${projects.length}` : "—"}</p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{t.dashboardInfo}</p>
                    <p className="mt-2 text-sm text-white/75">{overviewProjectText}</p>
                  </div>
                </div>

                {isGeneralMode && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">All clients</p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{clients.length}</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">All projects</p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{projects.length}</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">All invoices</p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{allInvoiceCount}</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
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

            {activeTab === "status" && (
              <motion.div key="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
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
                    ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]"
                    : "lg:grid-cols-1"
                }`}
              >
                {/* Invoice List */}
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                  className="min-w-0 rounded-[32px] border border-white/10 bg-black/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Invoice results · active client</p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{projectInvoices.length} invoices</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartCreateInvoice}
                        className="h-10 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold hover:bg-white/15"
                      >
                        + New
                      </button>
                    </div>

                    {projectInvoices.length === 0 ? (
                      <div className="text-center text-white/55 text-sm py-6">
                        No invoices yet for this client.
                      </div>
                    ) : (
                      <div className="space-y-0">
                        <AnimatePresence>
                          {projectInvoices.map((invoice) => {
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
                                layout
                                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                whileHover={{ y: -2, scale: 1.003 }}
                                whileTap={{ scale: 0.998 }}
                                type="button"
                                onClick={() => handleSelectInvoice(invoice)}
                                className={`group relative w-full overflow-hidden border-b px-2 py-4 text-left transition-all duration-300 last:border-b-0 ${
                                  selectedInvoiceId === invoice.id
                                    ? "border-white/25 bg-white/[0.05]"
                                    : "border-white/10 hover:border-white/25"
                                }`}
                              >
                                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/[0.02] via-white/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Modern Invoice Details - Editable */}
                <AnimatePresence>
                  {showInvoiceDetails ? (
                    <motion.div
                      key="invoice-details"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ type: "spring", stiffness: 260, damping: 28 }}
                      className="min-w-0 rounded-[32px] border border-white/10 bg-black/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col"
                    >
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
                            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
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
                              <div className="flex items-center gap-2">
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
                                  className="h-8 rounded-lg border border-white/12 bg-black/35 px-2 text-xs outline-none"
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
                          <div className="border-b border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] text-white/50">
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
                                  <div className="grid grid-cols-[minmax(0,1fr)_84px_116px_116px] items-center gap-3 px-3 py-2.5">
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
                                    <p className="text-right text-sm font-semibold text-white">₼{(item.quantity * item.rate).toFixed(2)}</p>
                                  </div>
                                </SwipeRevealDeleteRow>
                              ) : (
                                <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_84px_116px_116px] items-center gap-3 rounded-xl border border-white/10 bg-black/70 px-3 py-2.5">
                                  <p className="truncate text-sm text-white/85">{item.description || "—"}</p>
                                  <p className="text-sm text-white/65">{item.quantity}</p>
                                  <p className="text-sm text-white/65">₼{item.rate.toFixed(2)}</p>
                                  <p className="text-right text-sm font-semibold text-white">₼{(item.quantity * item.rate).toFixed(2)}</p>
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

            {activeTab === "labels" && (
              <motion.div key="labels" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
                <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <h3 className="text-lg font-semibold">Invoice labels</h3>
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

            {activeTab === "setup" && (
              <motion.div key="setup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="grid gap-5 xl:grid-cols-2">
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

            {activeTab === "profiles" && (
              <motion.div key="profiles" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <h3 className="text-lg font-semibold">{t.createClient}</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input value={newClientForm.brandName} onChange={(e) => setNewClientForm((p) => ({ ...p, brandName: e.target.value }))} placeholder="Company name" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                      <input value={newClientForm.username} onChange={(e) => setNewClientForm((p) => ({ ...p, username: e.target.value }))} placeholder="Representative name" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                      <input value={newClientForm.whatsapp} onChange={(e) => setNewClientForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp" className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                      <div className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-white/12 bg-black/25 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setNewClientForm((p) => ({ ...p, portalEnabled: !p.portalEnabled }))}
                          className={`h-9 rounded-lg px-3 text-xs font-semibold transition ${newClientForm.portalEnabled ? "border border-emerald-400/30 bg-emerald-400/15 text-emerald-100" : "border border-white/15 bg-white/5 text-white/70"}`}
                        >
                          {newClientForm.portalEnabled ? "Portal enabled" : "Portal disabled"}
                        </button>
                        <p className="text-xs text-white/50">Leave it disabled for legacy clients until you activate them.</p>
                      </div>
                      <input value={newClientForm.password} onChange={(e) => setNewClientForm((p) => ({ ...p, password: e.target.value }))} placeholder={newClientForm.portalEnabled ? "Password" : "Optional password"} className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none" />
                    </div>
                    <button type="button" onClick={handleCreateClient} className="mt-4 h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold hover:bg-white/15">{t.createClient}</button>
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <h3 className="text-lg font-semibold">Profiles</h3>
                    <div className="mt-3 max-h-[320px] space-y-2 overflow-auto pr-1">
                      {clients.length === 0 ? (
                        <p className="text-sm text-white/45">No profiles yet.</p>
                      ) : (
                        clients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setSelectedClientId(client.id);
                              const firstProject = projects.find((project) => project.client_id === client.id)?.id ?? "";
                              setSelectedProjectId(firstProject);
                              persistOwnerSelection(client.id, firstProject);
                              openClientProfile(client);
                            }}
                            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left hover:border-white/20 hover:bg-white/[0.06]"
                          >
                            <p className="text-sm font-semibold text-white">{client.brand_name}</p>
                            <p className="mt-1 text-xs text-white/50">{inferPortalEnabled(client) ? "Portal active" : "Portal disabled"} · {client.username || "No username"}</p>
                            <p className="mt-1 text-xs text-white/45">{client.whatsapp_number}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </section>
                </div>
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/65"
              onClick={() => {
                setIsClientProfileOpen(false);
                setIsClientProjectsModalOpen(false);
                setProfileClientId("");
              }}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ type: "spring", damping: 24, stiffness: 280 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl rounded-[28px] border border-white/15 bg-[#0d0d0d] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Client profile</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{clientProfileDraft.companyName || "Edit client info"}</h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Company name*</label>
                    <input
                      value={clientProfileDraft.companyName}
                      onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, companyName: e.target.value }))}
                      className="mt-2 h-11 w-full rounded-xl border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                    />
                  </div>
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
                      className="mt-2 h-11 w-full rounded-xl border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">WhatsApp number*</label>
                    <input
                      value={clientProfileDraft.whatsappNumber}
                      onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                      className="mt-2 h-11 w-full rounded-xl border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-white/45">Portal access</p>
                      <p className="mt-1 text-sm text-white/60">{clientProfileDraft.portalEnabled ? "Enabled and ready for login." : "Disabled until you activate it."}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTogglePortalAccess}
                      className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${clientProfileDraft.portalEnabled ? "border border-emerald-400/30 bg-emerald-400/15 text-emerald-100" : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"}`}
                    >
                      {clientProfileDraft.portalEnabled ? "Deactivate portal" : "Activate portal"}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Portal username</label>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={clientProfileDraft.portalUsername}
                          onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, portalUsername: e.target.value }))}
                          placeholder="Generated on activation"
                          className="h-11 flex-1 rounded-xl border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                        />
                        <button
                          type="button"
                          onClick={() => setClientProfileDraft((prev) => ({ ...prev, portalUsername: createPortalUsername(prev.companyName, prev.representativeName) }))}
                          className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/10"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.14em] text-white/45">Portal password</label>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={clientProfileDraft.portalPassword}
                          onChange={(e) => setClientProfileDraft((prev) => ({ ...prev, portalPassword: e.target.value }))}
                          placeholder="Generated on activation"
                          className="h-11 flex-1 rounded-xl border border-white/12 bg-black/40 px-3 text-sm text-white outline-none hover:border-white/20 focus:border-white/30"
                        />
                        <button
                          type="button"
                          onClick={() => setClientProfileDraft((prev) => ({ ...prev, portalPassword: createPortalPassword() }))}
                          className="h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/10"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-white/45">Projects</p>
                      <p className="mt-1 text-sm text-white/60">Manage this client's saved projects in a separate popup.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsClientProjectsModalOpen(true)}
                      className="h-10 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15"
                    >
                      Manage projects
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsClientProfileOpen(false);
                      setIsClientProjectsModalOpen(false);
                      setProfileClientId("");
                    }}
                    className="h-11 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/80 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClientProfile}
                    className="h-11 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15"
                  >
                    Save profile
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isClientProjectsModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/65"
              onClick={() => setIsClientProjectsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ type: "spring", damping: 24, stiffness: 280 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl rounded-[28px] border border-white/15 bg-[#0d0d0d] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Client projects</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {clientProfileDraft.companyName || "Projects"}
                </h3>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/45">Saved projects</p>
                  <div className="mt-3 max-h-[320px] space-y-2 overflow-auto pr-1">
                    {profileProjects.length > 0 ? (
                      profileProjects.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{project.name}</p>
                            <p className="mt-1 truncate text-xs text-white/45">
                              {project.service.toUpperCase()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                message: `Delete project ${project.name}?`,
                                onConfirm: () => handleDeleteProject(project.id),
                              });
                            }}
                            className="shrink-0 rounded-lg border border-red-300/30 bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-500/25"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-dashed border-white/10 px-3 py-2.5 text-sm text-white/45">
                        No projects for this client yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/45">Add project</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      value={newProjectForm.name}
                      onChange={(e) => setNewProjectForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Project name"
                      className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none"
                    />
                    <select
                      value={newProjectForm.service}
                      onChange={(e) => setNewProjectForm((p) => ({ ...p, service: e.target.value as ServiceType }))}
                      className="h-11 rounded-xl border border-white/12 bg-black/40 px-3 text-sm outline-none"
                    >
                      {serviceOptions.map((service) => <option key={service} value={service}>{service.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateProject}
                    className="mt-3 h-10 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15"
                  >
                    Add project
                  </button>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setIsClientProjectsModalOpen(false)}
                    className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/80 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
        </main>
      </div>
    </div>
  );
}
