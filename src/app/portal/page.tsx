"use client";

import { formatAzn } from "@/lib/currency";
import { usePortal } from "@/components/portal/portal-provider";
import { usePortalLanguage, type PortalLanguage } from "@/components/portal/portal-language";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SMM_ADMIN_PREFIX = "SMM_ADMIN::";

function formatLatestUpdate(latestUpdate: string | null | undefined) {
  if (!latestUpdate) return "—";
  if (!latestUpdate.startsWith(SMM_ADMIN_PREFIX)) return latestUpdate;

  try {
    const payload = JSON.parse(latestUpdate.slice(SMM_ADMIN_PREFIX.length)) as {
      postsPerWeek?: number;
      nextPostTime?: string;
      focus?: string;
      managerNote?: string;
    };

    const note = payload.managerNote?.trim();
    if (note) return note;

    return `SMM delivery: ${payload.postsPerWeek ?? 0} posts/week · Next: ${payload.nextPostTime || "—"} · Focus: ${payload.focus || "—"}`;
  } catch {
    return "SMM weekly delivery is configured from admin.";
  }
}

const overviewCopy: Record<
  PortalLanguage,
  {
    loading: string;
    overview: string;
    welcome: string;
    intro: string;
    projectHero: string;
    progressSummary: (progress: number, status: string) => string;
    quickActions: string;
    viewDeliverables: string;
    openInvoicesAction: string;
    invoiceUrgency: string;
    openInvoiceCount: (count: number) => string;
    notificationInvoiceDue: (date: string) => string;
    notificationDeliverable: (title: string) => string;
    notificationProjectUpdate: string;
    versionTag: (count: number) => string;
    billingClear: string;
    nextDue: string;
    noPending: string;
    supportOnline: string;
    supportOffline: string;
    supportHours: string;
    milestonesBilling: string;
    currentMilestone: string;
    paymentCompletion: string;
    notificationsCenter: string;
    noNotifications: string;
    versioning: string;
    noFilesYet: string;
    kpiPaymentCompletion: string;
    kpiDeliverables: string;
    kpiOpenInvoices: string;
    kpiSupportWindow: string;
    currentEngagement: string;
    selectedProjectLabel: string;
    currentPhase: string;
    dueDate: string;
    serviceType: string;
    supportStatus: string;
    supportLive: string;
    projectStatusPlanning: string;
    projectStatusInProgress: string;
    projectStatusReview: string;
    projectStatusDelivered: string;
    milestonePlanning: string;
    milestoneInProgress: string;
    milestoneReview: string;
    milestoneDelivered: string;
    activeProjects: string;
    openInvoices: string;
    selectedService: string;
    deliveryDate: string;
    currentProject: string;
    progress: string;
    status: string;
    started: string;
    relatedInvoices: string;
    noInvoices: string;
    smmBoardTitle: string;
    smmBoardSubtitle: string;
    smmBoardTab: string;
    smmBoardDay: string;
    smmBoardTime: string;
    smmBoardStatus: string;
    smmBoardDone: string;
    smmBoardQueued: string;
  }
> = {
  en: {
    loading: "Loading workspace...",
    overview: "Workspace Overview",
    welcome: "Welcome back",
    intro: "This is your command center for deliverables, billing, and support. Start with the guided actions below.",
    projectHero: "Current Project Focus",
    progressSummary: (progress, status) => `Progress is at ${progress}% · ${status.replace("_", " ")}`,
    quickActions: "Quick actions",
    viewDeliverables: "View Deliverables",
    openInvoicesAction: "Open Invoices",
    invoiceUrgency: "Invoice urgency",
    openInvoiceCount: (count) => `You currently have ${count} open invoice${count > 1 ? "s" : ""}.`,
    notificationInvoiceDue: (date) => `Invoice due on ${date}`,
    notificationDeliverable: (title) => `${title} uploaded`,
    notificationProjectUpdate: "Project status updated",
    versionTag: (count) => `v${count}`,
    billingClear: "Your billing is clear. You can focus on reviewing recent project assets.",
    nextDue: "Next due",
    noPending: "No pending invoices",
    supportOnline: "Online now",
    supportOffline: "Offline now",
    supportHours: "Every day, 10:00 — 22:00",
    milestonesBilling: "Milestones and Billing",
    currentMilestone: "Current milestone",
    paymentCompletion: "Paid",
    notificationsCenter: "Notifications Center",
    noNotifications: "No new alerts.",
    versioning: "File Versioning",
    noFilesYet: "No versioned files yet.",
    kpiPaymentCompletion: "Paid",
    kpiDeliverables: "Deliverables",
    kpiOpenInvoices: "Open invoices",
    kpiSupportWindow: "Support window",
    currentEngagement: "Current Engagement",
    selectedProjectLabel: "Selected project",
    currentPhase: "Current phase",
    dueDate: "Due date",
    serviceType: "Service type",
    supportStatus: "Support status",
    supportLive: "Available on WhatsApp",
    projectStatusPlanning: "Planning",
    projectStatusInProgress: "In progress",
    projectStatusReview: "Review",
    projectStatusDelivered: "Delivered",
    milestonePlanning: "Planning",
    milestoneInProgress: "In progress",
    milestoneReview: "Review",
    milestoneDelivered: "Delivered",
    activeProjects: "Active Projects",
    openInvoices: "Open Invoices",
    selectedService: "Selected Service",
    deliveryDate: "Delivery Date",
    currentProject: "Current Project",
    progress: "Progress",
    status: "Status",
    started: "Started",
    relatedInvoices: "Related Invoices · Home Snapshot",
    noInvoices: "No invoices yet.",
    smmBoardTitle: "SMM Content Board",
    smmBoardSubtitle: "Track post timings, status, and what is already published.",
    smmBoardTab: "Post Schedule",
    smmBoardDay: "Day",
    smmBoardTime: "Time",
    smmBoardStatus: "Status",
    smmBoardDone: "Done",
    smmBoardQueued: "Queued",
  },
  ru: {
    loading: "Загрузка рабочего пространства...",
    overview: "Обзор рабочего пространства",
    welcome: "С возвращением",
    intro: "Это ваш центр управления материалами, счетами и поддержкой. Начните с шагов ниже.",
    projectHero: "Текущий проект",
    progressSummary: (progress, status) => `Готово ${progress}% · ${status.replace("_", " ")}`,
    quickActions: "Быстрые действия",
    viewDeliverables: "Открыть материалы",
    openInvoicesAction: "Открыть счета",
    invoiceUrgency: "Срочность по счетам",
    openInvoiceCount: (count) => `У вас сейчас ${count} открытых ${count > 1 ? "счета" : "счёт"}.`,
    notificationInvoiceDue: (date) => `Счёт к оплате: ${date}`,
    notificationDeliverable: (title) => `Загружено: ${title}`,
    notificationProjectUpdate: "Статус проекта обновлён",
    versionTag: (count) => `v${count}`,
    billingClear: "По оплатам всё в порядке. Можно сосредоточиться на просмотре последних материалов.",
    nextDue: "Ближайший срок",
    noPending: "Нет ожидающих счетов",
    supportOnline: "Сейчас онлайн",
    supportOffline: "Сейчас офлайн",
    supportHours: "Ежедневно, 10:00 — 22:00",
    milestonesBilling: "Этапы и оплаты",
    currentMilestone: "Текущий этап",
    paymentCompletion: "Оплачено",
    notificationsCenter: "Центр уведомлений",
    noNotifications: "Новых уведомлений нет.",
    versioning: "Версионирование файлов",
    noFilesYet: "Версий файлов пока нет.",
    kpiPaymentCompletion: "Оплачено",
    kpiDeliverables: "Материалы",
    kpiOpenInvoices: "Открытые счета",
    kpiSupportWindow: "Окно поддержки",
    currentEngagement: "Текущая работа",
    selectedProjectLabel: "Выбранный проект",
    currentPhase: "Текущая фаза",
    dueDate: "Срок сдачи",
    serviceType: "Тип услуги",
    supportStatus: "Статус поддержки",
    supportLive: "Доступны в WhatsApp",
    projectStatusPlanning: "Планирование",
    projectStatusInProgress: "В работе",
    projectStatusReview: "На проверке",
    projectStatusDelivered: "Сдано",
    milestonePlanning: "Планирование",
    milestoneInProgress: "В работе",
    milestoneReview: "На проверке",
    milestoneDelivered: "Сдано",
    activeProjects: "Активные проекты",
    openInvoices: "Открытые счета",
    selectedService: "Выбранная услуга",
    deliveryDate: "Дата сдачи",
    currentProject: "Текущий проект",
    progress: "Прогресс",
    status: "Статус",
    started: "Начало",
    relatedInvoices: "Связанные счета · Главный обзор",
    noInvoices: "Счетов пока нет.",
    smmBoardTitle: "Контент-панель SMM",
    smmBoardSubtitle: "Отслеживайте время публикаций, статус и то, что уже вышло.",
    smmBoardTab: "График постов",
    smmBoardDay: "День",
    smmBoardTime: "Время",
    smmBoardStatus: "Статус",
    smmBoardDone: "Готово",
    smmBoardQueued: "В очереди",
  },
  az: {
    loading: "İş sahəsi yüklənir...",
    overview: "İş sahəsinə ümumi baxış",
    welcome: "Xoş gəlmisiniz",
    intro: "Bu bölmə materiallar, fakturalar və dəstək üçün idarəetmə mərkəzinizdir. Aşağıdakı addımlardan başlayın.",
    projectHero: "Cari layihə",
    progressSummary: (progress, status) => `Tamamlanma ${progress}% · ${status.replace("_", " ")}`,
    quickActions: "Sürətli əməliyyatlar",
    viewDeliverables: "Materiallara bax",
    openInvoicesAction: "Fakturaları aç",
    invoiceUrgency: "Faktura təciliyyəti",
    openInvoiceCount: (count) => `Hazırda ${count} açıq fakturanız var.`,
    notificationInvoiceDue: (date) => `Ödəniş tarixi: ${date}`,
    notificationDeliverable: (title) => `${title} yüklənib`,
    notificationProjectUpdate: "Layihə statusu yeniləndi",
    versionTag: (count) => `v${count}`,
    billingClear: "Ödənişlər qaydasındadır. Son layihə materiallarını yoxlaya bilərsiniz.",
    nextDue: "Növbəti ödəniş tarixi",
    noPending: "Gözləyən faktura yoxdur",
    supportOnline: "Hazırda onlayn",
    supportOffline: "Hazırda oflayn",
    supportHours: "Hər gün, 10:00 — 22:00",
    milestonesBilling: "Mərhələlər və ödəniş",
    currentMilestone: "Cari mərhələ",
    paymentCompletion: "Ödənilib",
    notificationsCenter: "Bildiriş mərkəzi",
    noNotifications: "Yeni bildiriş yoxdur.",
    versioning: "Fayl versiyaları",
    noFilesYet: "Hələ versiyalı fayl yoxdur.",
    kpiPaymentCompletion: "Ödənilib",
    kpiDeliverables: "Materiallar",
    kpiOpenInvoices: "Açıq fakturalar",
    kpiSupportWindow: "Dəstək saatları",
    currentEngagement: "Cari əməkdaşlıq",
    selectedProjectLabel: "Seçilmiş layihə",
    currentPhase: "Cari mərhələ",
    dueDate: "Təhvil tarixi",
    serviceType: "Xidmət növü",
    supportStatus: "Dəstək statusu",
    supportLive: "WhatsApp-da əlçatırıq",
    projectStatusPlanning: "Planlama",
    projectStatusInProgress: "İcradadır",
    projectStatusReview: "Yoxlamadadır",
    projectStatusDelivered: "Təhvil verilib",
    milestonePlanning: "Planlama",
    milestoneInProgress: "İcradadır",
    milestoneReview: "Yoxlamadadır",
    milestoneDelivered: "Təhvil verilib",
    activeProjects: "Aktiv layihələr",
    openInvoices: "Açıq fakturalar",
    selectedService: "Seçilmiş xidmət",
    deliveryDate: "Təhvil tarixi",
    currentProject: "Cari layihə",
    progress: "İrəliləyiş",
    status: "Status",
    started: "Başlama tarixi",
    relatedInvoices: "Əlaqəli fakturalar · Baş səhifə görünüşü",
    noInvoices: "Hələ faktura yoxdur.",
    smmBoardTitle: "SMM Məzmun Paneli",
    smmBoardSubtitle: "Paylaşım saatlarını, statusunu və artıq yayımlanan məzmunu izləyin.",
    smmBoardTab: "Paylaşım cədvəli",
    smmBoardDay: "Gün",
    smmBoardTime: "Saat",
    smmBoardStatus: "Status",
    smmBoardDone: "Hazırdır",
    smmBoardQueued: "Növbədə",
  },
};

const serviceDashboardCopy: Record<
  PortalLanguage,
  Record<string, {
    title: string;
    subtitle: string;
    mainLabel: string;
    sideLabel: string;
    chips: string[];
    rows: Array<{ label: string; value: string }>;
  }>
> = {
  en: {
    website: {
      title: "Website Delivery Dashboard",
      subtitle: "Track pages, launch readiness, and current build progress.",
      mainLabel: "Current focus",
      sideLabel: "Next step",
      chips: ["Pages", "UX/UI", "QA", "Launch"],
      rows: [
        { label: "Pages", value: "Home, services, contact, legal" },
        { label: "Stage", value: "Build and revisions" },
        { label: "Review", value: "Desktop + mobile QA" },
        { label: "Launch", value: "Ready for deployment" },
      ],
    },
    smm: {
      title: "SMM Management Dashboard",
      subtitle: "Track the monthly content plan, reels, stories, and active social platforms.",
      mainLabel: "Content plan",
      sideLabel: "Execution",
      chips: ["12 posts", "Stories", "FB", "Instagram", "TikTok"],
      rows: [
        { label: "Posts", value: "12 custom posts per month" },
        { label: "Stories", value: "1–2 Instagram/Facebook stories per week" },
        { label: "Platforms", value: "Instagram, Facebook, TikTok" },
        { label: "Community", value: "DMs, comments, and weekly reporting" },
      ],
    },
    app: {
      title: "App Delivery Dashboard",
      subtitle: "Track sprint progress, testing, and release readiness.",
      mainLabel: "Current sprint",
      sideLabel: "Release",
      chips: ["Sprint", "API", "Testing", "Release"],
      rows: [
        { label: "Sprint", value: "Development and polish" },
        { label: "Backend", value: "API + database sync" },
        { label: "Testing", value: "QA and device review" },
        { label: "Release", value: "Store preparation" },
      ],
    },
    software: {
      title: "Software Delivery Dashboard",
      subtitle: "Track implementation, integrations, and deployment progress.",
      mainLabel: "Current build",
      sideLabel: "Delivery track",
      chips: ["Build", "Integration", "QA", "Deploy"],
      rows: [
        { label: "Build", value: "Core features and modules" },
        { label: "Integrations", value: "APIs and external tools" },
        { label: "QA", value: "Testing and bug fixes" },
        { label: "Deploy", value: "Staging to production" },
      ],
    },
    branding: {
      title: "Brand Identity Dashboard",
      subtitle: "Track concept work, visual direction, and final identity delivery.",
      mainLabel: "Identity phase",
      sideLabel: "Assets",
      chips: ["Concept", "Logo", "Guidelines", "Assets"],
      rows: [
        { label: "Concepts", value: "Direction and moodboard" },
        { label: "Logo", value: "Primary and secondary marks" },
        { label: "Guidelines", value: "Typography, colors, usage" },
        { label: "Assets", value: "Export pack and source files" },
      ],
    },
  },
  ru: {
    website: {
      title: "Панель сайта",
      subtitle: "Страницы, готовность к запуску и текущий прогресс разработки.",
      mainLabel: "Текущий фокус",
      sideLabel: "Следующий шаг",
      chips: ["Страницы", "UX/UI", "QA", "Запуск"],
      rows: [
        { label: "Страницы", value: "Главная, услуги, контакты, юридические" },
        { label: "Этап", value: "Разработка и правки" },
        { label: "Проверка", value: "QA для десктопа и мобильных" },
        { label: "Запуск", value: "Готово к публикации" },
      ],
    },
    smm: {
      title: "Панель SMM",
      subtitle: "Ежемесячный контент-план, reels, stories и активные соцсети.",
      mainLabel: "Контент-план",
      sideLabel: "Исполнение",
      chips: ["12 постов", "Stories", "FB", "Instagram", "TikTok"],
      rows: [
        { label: "Посты", value: "12 уникальных постов в месяц" },
        { label: "Stories", value: "1–2 stories в Instagram/Facebook в неделю" },
        { label: "Платформы", value: "Instagram, Facebook, TikTok" },
        { label: "Комьюнити", value: "DM, комментарии и недельный отчёт" },
      ],
    },
    app: {
      title: "Панель приложения",
      subtitle: "Спринты, тестирование и готовность к релизу.",
      mainLabel: "Текущий спринт",
      sideLabel: "Релиз",
      chips: ["Спринт", "API", "Тесты", "Релиз"],
      rows: [
        { label: "Спринт", value: "Разработка и полировка" },
        { label: "Backend", value: "API + база данных" },
        { label: "Тесты", value: "QA и проверка устройств" },
        { label: "Релиз", value: "Подготовка к стору" },
      ],
    },
    software: {
      title: "Панель разработки",
      subtitle: "Внедрение, интеграции и развёртывание.",
      mainLabel: "Текущая сборка",
      sideLabel: "Путь релиза",
      chips: ["Разработка", "Интеграции", "QA", "Deploy"],
      rows: [
        { label: "Сборка", value: "Основные функции и модули" },
        { label: "Интеграции", value: "API и внешние сервисы" },
        { label: "QA", value: "Тестирование и исправления" },
        { label: "Deploy", value: "Staging → production" },
      ],
    },
    branding: {
      title: "Панель брендинга",
      subtitle: "Концепции, визуальное направление и финальная передача бренда.",
      mainLabel: "Этап айдентики",
      sideLabel: "Материалы",
      chips: ["Концепт", "Логотип", "Гайдлайн", "Файлы"],
      rows: [
        { label: "Концепции", value: "Направление и moodboard" },
        { label: "Логотип", value: "Основной и вспомогательный знаки" },
        { label: "Гайдлайн", value: "Шрифты, цвета, правила" },
        { label: "Файлы", value: "Пакет экспорта и исходники" },
      ],
    },
  },
  az: {
    website: {
      title: "Vebsayt İdarəetmə Paneli",
      subtitle: "Səhifələr, təhvil hazırlığı və inkişafın cari vəziyyəti.",
      mainLabel: "Cari fokus",
      sideLabel: "Növbəti addım",
      chips: ["Səhifələr", "UX/UI", "QA", "Təhvil"],
      rows: [
        { label: "Səhifələr", value: "Ana səhifə, xidmətlər, əlaqə, hüquqi" },
        { label: "Mərhələ", value: "İnkişaf və düzəlişlər" },
        { label: "Yoxlama", value: "Desktop və mobil QA" },
        { label: "Təhvil", value: "Yayıma hazırdır" },
      ],
    },
    smm: {
      title: "SMM İdarəetmə Paneli",
      subtitle: "Aylıq məzmun planı, reels, stories və aktiv sosial platformalar.",
      mainLabel: "Məzmun planı",
      sideLabel: "İcra",
      chips: ["12 post", "Stories", "FB", "Instagram", "TikTok"],
      rows: [
        { label: "Postlar", value: "Ayda 12 xüsusi post" },
        { label: "Stories", value: "Həftədə 1–2 Instagram/Facebook story" },
        { label: "Platformalar", value: "Instagram, Facebook, TikTok" },
        { label: "Komanda işi", value: "DM-lər, şərhlər və həftəlik hesabat" },
      ],
    },
    app: {
      title: "Tətbiq İdarəetmə Paneli",
      subtitle: "Sprintlər, test və buraxılışa hazırlıq.",
      mainLabel: "Cari sprint",
      sideLabel: "Buraxılış",
      chips: ["Sprint", "API", "Test", "Buraxılış"],
      rows: [
        { label: "Sprint", value: "İnkişaf və cilalama" },
        { label: "Backend", value: "API + məlumat bazası" },
        { label: "Test", value: "QA və cihaz yoxlaması" },
        { label: "Buraxılış", value: "Store hazırlığı" },
      ],
    },
    software: {
      title: "Proqram Təminatı Paneli",
      subtitle: "İmplementasiya, inteqrasiya və yayıma çıxarma prosesi.",
      mainLabel: "Cari build",
      sideLabel: "Təhvil xətti",
      chips: ["Build", "İnteqrasiya", "QA", "Deploy"],
      rows: [
        { label: "Build", value: "Əsas funksiyalar və modullar" },
        { label: "İnteqrasiya", value: "API-lər və xarici alətlər" },
        { label: "QA", value: "Test və xətaların düzəldilməsi" },
        { label: "Deploy", value: "Staging-dən production-a" },
      ],
    },
    branding: {
      title: "Brend Paneli",
      subtitle: "Konsepsiyalar, vizual istiqamət və brendin təhvili.",
      mainLabel: "İdentiklik mərhələsi",
      sideLabel: "Aktivlər",
      chips: ["Konsept", "Loqo", "Qaydalar", "Fayllar"],
      rows: [
        { label: "Konseptlər", value: "İstiqamət və moodboard" },
        { label: "Loqo", value: "Əsas və köməkçi nişanlar" },
        { label: "Qaydalar", value: "Şriftlər, rənglər, istifadə" },
        { label: "Fayllar", value: "Export paketi və source fayllar" },
      ],
    },
  },
};

export default function PortalPage() {
  const { client, selectedProject, loading } = usePortal();
  const { language } = usePortalLanguage();
  const router = useRouter();
  const copy = overviewCopy[language];
  const shouldRedirectToSmm = selectedProject?.service === "smm";

  useEffect(() => {
    if (!loading && !client) {
      router.push("/login");
    }
  }, [loading, client, router]);

  useEffect(() => {
    if (!loading && client && shouldRedirectToSmm) {
      router.replace("/portal/smm");
    }
  }, [loading, client, shouldRedirectToSmm, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm uppercase tracking-[0.14em] text-white/35">{copy.loading}</p>
      </div>
    );
  }

  if (!client || !selectedProject) return null;
  if (shouldRedirectToSmm) return null;

  const unpaidCount = client.projects.reduce((count, project) => {
    return count + project.invoices.filter((i) => i.status !== "paid").length;
  }, 0);

  const nextDueInvoice = client.projects
    .flatMap((project) => project.invoices)
    .filter((invoice) => invoice.status !== "paid")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const nowHour = new Date().getHours();
  const isSupportOnline = nowHour >= 10 && nowHour < 22;

  const milestoneSteps = ["planning", "in_progress", "review", "delivered"];
  const currentMilestoneIndex = Math.max(milestoneSteps.indexOf(selectedProject.status), 0);

  const invoiceWeight = { paid: 1, partial: 0.5, unpaid: 0 } as const;
  const totalInvoiceWeight = selectedProject.invoices.reduce((sum, invoice) => sum + invoiceWeight[invoice.status], 0);
  const paymentCompletionPercent = selectedProject.invoices.length
    ? Math.round((totalInvoiceWeight / selectedProject.invoices.length) * 100)
    : 100;

  const latestDeliverables = [...selectedProject.deliverables]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const versionCounts = selectedProject.deliverables.reduce<Record<string, number>>((acc, item) => {
    const key = item.title.trim().toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const notifications = [
    nextDueInvoice ? copy.notificationInvoiceDue(nextDueInvoice.dueDate) : null,
    latestDeliverables[0] ? copy.notificationDeliverable(latestDeliverables[0].title) : null,
    copy.notificationProjectUpdate,
  ].filter(Boolean) as string[];

  const safeAzn = (amount: number | string) => formatAzn(amount).replace(/\$/g, "₼");
  const getProjectStatusLabel = (status: string) => {
    const labels = {
      planning: copy.projectStatusPlanning,
      in_progress: copy.projectStatusInProgress,
      review: copy.projectStatusReview,
      delivered: copy.projectStatusDelivered,
    } as const;

    return labels[status as keyof typeof labels] ?? status.replace("_", " ");
  };

  const serviceDashboard = serviceDashboardCopy[language][selectedProject.service] ?? serviceDashboardCopy[language].website;
  const isSmmProject = selectedProject.service === "smm";

  const smmSchedule = [
    { day: "Mon", time: "10:00", title: "Hero post · brand intro" },
    { day: "Tue", time: "18:30", title: "Story set · event reminder" },
    { day: "Wed", time: "12:00", title: "Reel · behind the scenes" },
    { day: "Fri", time: "17:00", title: "Post · offer / announcement" },
    { day: "Sat", time: "11:00", title: "Stories · community update" },
  ];
  const smmAllDone = selectedProject.status === "delivered" || selectedProject.progress >= 100;

  const getMilestoneLabel = (status: string) => {
    const labels = {
      planning: copy.milestonePlanning,
      in_progress: copy.milestoneInProgress,
      review: copy.milestoneReview,
      delivered: copy.milestoneDelivered,
    } as const;

    return labels[status as keyof typeof labels] ?? status.replace("_", " ");
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.overview}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {copy.welcome}, {client.brandName}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
          {copy.intro}
        </p>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.projectHero}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{selectedProject.name}</h2>
          <p className="mt-2 text-sm text-white/60">{copy.progressSummary(selectedProject.progress, selectedProject.status)}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.11em] text-white/70">
            <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1">{copy.status}: {getProjectStatusLabel(selectedProject.status)}</span>
            <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1">{copy.serviceType}: {selectedProject.service}</span>
            <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1">{copy.dueDate}: {selectedProject.deliveryDate}</span>
          </div>

          <p className="mt-5 text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.quickActions}</p>
          <div className="mt-2 flex flex-wrap gap-2.5">
            <Link
              href="/portal/deliverables"
              className="inline-flex h-10 items-center rounded-2xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              {copy.viewDeliverables}
            </Link>
            <Link
              href="/portal/invoices"
              className="inline-flex h-10 items-center rounded-2xl border border-white/15 bg-black/30 px-4 text-sm font-medium text-white/85 transition hover:border-white/25 hover:text-white"
            >
              {copy.openInvoicesAction}
            </Link>
            <span className={`inline-flex h-10 items-center rounded-2xl border px-4 text-sm font-medium ${
              isSupportOnline
                ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
                : "border-orange-300/30 bg-orange-400/10 text-orange-200"
            }`}>
              {isSupportOnline ? copy.supportOnline : copy.supportOffline} · {copy.supportHours}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.invoiceUrgency}</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-white">{unpaidCount > 0 ? copy.openInvoiceCount(unpaidCount) : copy.billingClear}</p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/70">
            <span className="text-white/45">{copy.nextDue}: </span>
            <span className="font-medium text-white">{nextDueInvoice ? nextDueInvoice.dueDate : copy.noPending}</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 text-white/75">
            <span>{copy.supportStatus}</span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
              isSupportOnline
                ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
                : "border-orange-300/30 bg-orange-400/10 text-orange-200"
            }`}>
              {isSupportOnline ? copy.supportOnline : copy.supportOffline}
            </span>
          </div>
          <p className="mt-2 text-xs text-white/45">{copy.supportHours}</p>
        </div>
      </div>

      {isSmmProject ? (
        <div className="mb-6 rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-fuchsia-100/90">
                {copy.smmBoardTab}
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.smmBoardTitle}</p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{copy.smmBoardSubtitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{copy.progress}</p>
                <p className="mt-1 text-lg font-semibold text-white">{selectedProject.progress}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{copy.smmBoardStatus}</p>
                <p className="mt-1 text-sm font-semibold text-white">{smmAllDone ? copy.smmBoardDone : copy.smmBoardQueued}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 sm:col-span-2">
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{copy.dueDate}</p>
                <p className="mt-1 text-sm font-semibold text-white">{selectedProject.deliveryDate}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.smmBoardTab}</p>
              <div className="mt-4 space-y-3">
                {smmSchedule.map((item, index) => {
                  const done = smmAllDone || index < 3;
                  return (
                    <div
                      key={`${item.day}-${item.time}`}
                      className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 transition hover:border-fuchsia-200/20 hover:bg-fuchsia-500/10"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{copy.smmBoardDay}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{item.day}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{copy.smmBoardTime}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{item.time}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-white/70">{item.title}</p>
                        <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          done
                            ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                            : "border-white/15 bg-white/5 text-white/70"
                        }`}>
                          {done ? copy.smmBoardDone : copy.smmBoardQueued}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{serviceDashboard.title}</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{serviceDashboard.subtitle}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {serviceDashboard.chips.map((chip) => (
                  <span key={chip} className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-white/70">
                    {chip}
                  </span>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {serviceDashboard.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                    <span className="text-sm text-white/60">{row.label}</span>
                    <span className="text-sm font-medium text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{serviceDashboard.title}</p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{serviceDashboard.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {serviceDashboard.chips.map((chip) => (
                <span key={chip} className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-white/70">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{serviceDashboard.mainLabel}</p>
              <div className="mt-3 space-y-3">
                {serviceDashboard.rows.slice(0, 2).map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                    <span className="text-sm text-white/60">{row.label}</span>
                    <span className="text-sm font-medium text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{serviceDashboard.sideLabel}</p>
              <div className="mt-3 space-y-3">
                {serviceDashboard.rows.slice(2).map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                    <span className="text-sm text-white/60">{row.label}</span>
                    <span className="text-sm font-medium text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.milestonesBilling}</p>
          <div className="mt-3 space-y-2">
            {milestoneSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${index <= currentMilestoneIndex ? "bg-white" : "bg-white/25"}`} />
                <span className={`text-sm ${index === currentMilestoneIndex ? "font-semibold text-white" : "text-white/55"}`}>
                  {getMilestoneLabel(step)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">{copy.paymentCompletion}</p>
            <p className="mt-2 text-xl font-semibold text-white">{paymentCompletionPercent}%</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.notificationsCenter}</p>
          <div className="mt-3 space-y-2.5 text-sm">
            {notifications.length === 0 ? (
              <p className="text-white/45">{copy.noNotifications}</p>
            ) : (
              notifications.slice(0, 3).map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white/80">
                  {item}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.versioning}</p>
          <div className="mt-3 space-y-2.5">
            {latestDeliverables.length === 0 ? (
              <p className="text-sm text-white/45">{copy.noFilesYet}</p>
            ) : (
              latestDeliverables.map((item) => {
                const count = versionCounts[item.title.trim().toLowerCase()] ?? 1;
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm">
                    <span title={item.title} className="max-w-[70%] truncate text-white/85">{item.title}</span>
                    <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white/70">{copy.versionTag(count)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">KPI</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs text-white/45">{copy.kpiPaymentCompletion}</p>
              <p className="mt-1 text-lg font-semibold text-white">{paymentCompletionPercent}%</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs text-white/45">{copy.kpiDeliverables}</p>
              <p className="mt-1 text-lg font-semibold text-white">{selectedProject.deliverables.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs text-white/45">{copy.kpiOpenInvoices}</p>
              <p className="mt-1 text-lg font-semibold text-white">{unpaidCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs text-white/45">{copy.kpiSupportWindow}</p>
              <p className="mt-1 text-sm font-semibold text-white">10:00 — 22:00</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.activeProjects}</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{client.projects.length}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.openInvoices}</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{unpaidCount}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.selectedService}</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{selectedProject.service.toUpperCase()}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.deliveryDate}</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{selectedProject.deliveryDate}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.currentProject}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{selectedProject.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{formatLatestUpdate(selectedProject.latestUpdate)}</p>

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-sm text-white/55">
              <span>{copy.progress}</span>
              <span>{selectedProject.progress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/10">
              <div
                className="h-2.5 rounded-full bg-blue-300 transition-all duration-500"
                style={{ width: `${selectedProject.progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <span>{copy.status}: {getProjectStatusLabel(selectedProject.status)}</span>
            <span>{copy.started}: {selectedProject.startDate}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.relatedInvoices}</p>
          <div className="mt-4 space-y-4">
            {selectedProject.invoices.length === 0 ? (
              <p className="text-sm text-white/30">{copy.noInvoices}</p>
            ) : (
              selectedProject.invoices.map((invoice) => (
                <div key={invoice.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 transition-colors duration-300 hover:border-blue-200/20 hover:bg-blue-500/10">
                  <p className="text-sm text-white/40">{invoice.invoiceNumber}</p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-white">
                    {safeAzn(invoice.amount)}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm text-white/50">
                    <span>{invoice.status}</span>
                    <span>{invoice.dueDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}