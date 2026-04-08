"use client";

import { usePortal } from "@/components/portal/portal-provider";
import { usePortalLanguage, type PortalLanguage } from "@/components/portal/portal-language";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";

type SectionKey = "calendar" | "posts";
type PostStatus = "done" | "review" | "scheduled" | "planned";

type TrackerPost = {
  day: string;
  title: string;
  time: string;
  status: PostStatus;
  channel: string;
  note: string;
  mediaUrl?: string;
};

type SmmScheduleStatus = "done" | "review" | "scheduled" | "planned";

type SmmScheduleItem = {
  id: string;
  day: string;
  time: string;
  content: string;
  status: SmmScheduleStatus;
  mediaUrl?: string;
};

type SmmAdminPayload = {
  heroTitle?: string;
  heroSubtitle?: string;
  summaryTitle?: string;
  summaryText?: string;
  calendarTitle?: string;
  calendarText?: string;
  postsTitle?: string;
  postsText?: string;
  reportingTitle?: string;
  reportingText?: string;
  heroImageUrl?: string;
  cadence: string;
  nextPostTime: string;
  focus: string;
  managerNote: string;
  postsPerWeek: number;
  schedule: SmmScheduleItem[];
};

const copy: Record<PortalLanguage, {
  loading: string;
  title: string;
  subtitle: string;
  switchProject: string;
  emptyTitle: string;
  emptyText: string;
  status: string;
  statusLegend: Record<PostStatus, string>;
  summaryTitle: string;
  summaryText: string;
  currentWeek: string;
  nextPost: string;
  cadence: string;
  calendarTitle: string;
  calendarText: string;
  postsTitle: string;
  postsText: string;
  reportingTitle: string;
  reportingText: string;
  slotsLabel: (count: number) => string;
  statusSummary: (done: number, scheduled: number) => string;
  contentPlan: string;
  managedFromAdmin: string;
  postsPerWeekLabel: string;
  plannedSlotsFromAdmin: (count: number) => string;
  defaultCadenceNote: string;
  whatClientSees: string;
  currentDelivery: string;
  currentDeliveryText: string;
  nextActions: string;
  nextActionsText: string;
  progressNotes: string;
  publishedLegend: string;
  reviewLegend: string;
  scheduledLegend: string;
  plannedLegend: string;
  tabs: Record<SectionKey, string>;
}> = {
  en: {
    loading: "Loading...",
    title: "SMM Delivery Tracker",
    subtitle: "A client-ready view of the content calendar, post status, publishing times, and weekly delivery progress.",
    switchProject: "Switch to your SMM project",
    emptyTitle: "No SMM project selected",
    emptyText: "Choose the SMM project from the project switcher to see the delivery tracker here.",
    status: "Status",
    statusLegend: {
      done: "Done",
      review: "In review",
      scheduled: "Scheduled",
      planned: "Planned",
    },
    summaryTitle: "Weekly delivery snapshot",
    summaryText: "This is the live view clients can use to follow what is published, what is scheduled, and what is still being prepared.",
    currentWeek: "Current week",
    nextPost: "Next post",
    cadence: "Cadence",
    calendarTitle: "Publishing calendar",
    calendarText: "Posts are mapped out across the week so clients can see exactly how often content goes out and at what time.",
    postsTitle: "Post-by-post status",
    postsText: "Every planned post is shown with its channel, time, status, and a short note so progress is easy to follow.",
    reportingTitle: "Reporting rhythm",
    reportingText: "We update weekly delivery, engagement, and results so the client always knows what changed and what comes next.",
    slotsLabel: (count) => `${count} ${count === 1 ? "slot" : "slots"}`,
    statusSummary: (done, scheduled) => `${done} done · ${scheduled} scheduled`,
    contentPlan: "Content plan",
    managedFromAdmin: "Managed from admin calendar.",
    postsPerWeekLabel: "posts / week",
    plannedSlotsFromAdmin: (count) => `${count} planned slots from admin calendar`,
    defaultCadenceNote: "3 posts · 2 stories from Monday to Saturday",
    whatClientSees: "What the client sees",
    currentDelivery: "Current delivery",
    currentDeliveryText: "Weekly posts, stories, and video releases are updated as they move from planned to done.",
    nextActions: "Next actions",
    nextActionsText: "We note what is scheduled, what is in review, and what will be published next.",
    progressNotes: "Progress notes",
    publishedLegend: "published",
    reviewLegend: "waiting approval",
    scheduledLegend: "on the calendar",
    plannedLegend: "in production",
    tabs: {
      calendar: "Calendar",
      posts: "Posts",
    },
  },
  ru: {
    loading: "Загрузка...",
    title: "Трекер SMM-работ",
    subtitle: "Понятный кабинет для клиента: календарь публикаций, статус постов, время выхода и прогресс по неделе.",
    switchProject: "Переключиться на SMM-проект",
    emptyTitle: "SMM-проект не выбран",
    emptyText: "Выберите SMM-проект в переключателе проектов, чтобы увидеть здесь трекер работ.",
    status: "Статус",
    statusLegend: {
      done: "Готово",
      review: "На проверке",
      scheduled: "Запланировано",
      planned: "В плане",
    },
    summaryTitle: "Сводка по неделе",
    summaryText: "Здесь клиент видит, что уже опубликовано, что стоит в очереди и что ещё готовится.",
    currentWeek: "Текущая неделя",
    nextPost: "Следующий пост",
    cadence: "Частота",
    calendarTitle: "Календарь публикаций",
    calendarText: "Посты распределены по дням недели, чтобы было видно частоту и точное время выхода.",
    postsTitle: "Статус по каждому посту",
    postsText: "Каждая публикация показана с каналом, временем, статусом и короткой заметкой.",
    reportingTitle: "Ритм отчётности",
    reportingText: "Мы показываем еженедельные обновления по публикациям, вовлечению и результатам.",
    slotsLabel: (count) => `${count} ${count === 1 ? "слот" : "слота"}`,
    statusSummary: (done, scheduled) => `${done} готово · ${scheduled} запланировано`,
    contentPlan: "Контент-план",
    managedFromAdmin: "Управляется из админ-календаря.",
    postsPerWeekLabel: "постов / неделя",
    plannedSlotsFromAdmin: (count) => `${count} слотов запланировано в админ-календаре`,
    defaultCadenceNote: "3 поста · 2 stories с понедельника по субботу",
    whatClientSees: "Что видит клиент",
    currentDelivery: "Текущая выдача",
    currentDeliveryText: "Еженедельные посты, stories и видео обновляются по мере перехода из планирования в готово.",
    nextActions: "Следующие действия",
    nextActionsText: "Показываем, что запланировано, что на проверке и что выйдет следующим.",
    progressNotes: "Заметки по прогрессу",
    publishedLegend: "опубликовано",
    reviewLegend: "ожидает согласования",
    scheduledLegend: "в календаре",
    plannedLegend: "в производстве",
    tabs: {
      calendar: "Календарь",
      posts: "Посты",
    },
  },
  az: {
    loading: "Yüklənir...",
    title: "SMM İcra İzləyicisi",
    subtitle: "Müştəri üçün aydın panel: paylaşım təqvimi, post statusu, çıxış vaxtı və həftəlik irəliləyiş.",
    switchProject: "SMM layihəsinə keç",
    emptyTitle: "SMM layihəsi seçilməyib",
    emptyText: "Burada icra izləyicisini görmək üçün layihə seçicisindən SMM layihəsini seçin.",
    status: "Status",
    statusLegend: {
      done: "Hazırdır",
      review: "Yoxlanışda",
      scheduled: "Planlanıb",
      planned: "Plandadır",
    },
    summaryTitle: "Həftəlik icra xülasəsi",
    summaryText: "Müştəri burada nəyin paylaşıldığını, nəyin planlandığını və nəyin hazırlandığını izləyə bilir.",
    currentWeek: "Cari həftə",
    nextPost: "Növbəti post",
    cadence: "Tezlik",
    calendarTitle: "Paylaşım təqvimi",
    calendarText: "Postlar həftə üzrə bölünüb ki, nə qədər tez-tez və hansı saatda çıxdığı aydın görünsün.",
    postsTitle: "Post üzrə status",
    postsText: "Hər paylaşım kanal, saat, status və qısa qeyd ilə göstərilir.",
    reportingTitle: "Hesabat ritmi",
    reportingText: "Həftəlik yenilənmələr sayəsində müştəri nəticələri və növbəti addımları görür.",
    slotsLabel: (count) => `${count} slot`,
    statusSummary: (done, scheduled) => `${done} hazır · ${scheduled} planlanıb`,
    contentPlan: "Məzmun planı",
    managedFromAdmin: "Admin təqvimindən idarə olunur.",
    postsPerWeekLabel: "post / həftə",
    plannedSlotsFromAdmin: (count) => `Admin təqvimindən ${count} planlanmış slot`,
    defaultCadenceNote: "Bazar ertəsindən şənbəyə 3 post · 2 story",
    whatClientSees: "Müştərinin gördüyü",
    currentDelivery: "Cari icra",
    currentDeliveryText: "Həftəlik postlar, stories və video paylaşımlar planlanmışdan hazır statusuna keçdikcə yenilənir.",
    nextActions: "Növbəti addımlar",
    nextActionsText: "Nəyin planlandığını, nəyin yoxlamada olduğunu və növbəti nə paylaşılacağını göstəririk.",
    progressNotes: "İrəliləyiş qeydləri",
    publishedLegend: "paylaşılıb",
    reviewLegend: "təsdiq gözləyir",
    scheduledLegend: "təqvimdədir",
    plannedLegend: "hazırlanır",
    tabs: {
      calendar: "Təqvim",
      posts: "Postlar",
    },
  },
};

const trackerData: Record<PortalLanguage, {
  metrics: Array<{ label: string; value: string; note: string }>;
  calendar: Array<{
    day: string;
    date: string;
    count: string;
    entries: Array<{ time: string; title: string; status: PostStatus; mediaUrl?: string }>;
  }>;
  posts: TrackerPost[];
  reporting: Array<{ label: string; value: string; note: string }>;
}> = {
  en: {
    metrics: [
      { label: "Posts this week", value: "5", note: "3 done · 2 scheduled" },
      { label: "Stories this week", value: "3", note: "Posted across the week" },
      { label: "Next publish", value: "Thu · 19:00", note: "AI video for Reels and TikTok" },
    ],
    calendar: [
      { day: "Mon", date: "Apr 7", count: "2 posts", entries: [{ time: "11:00", title: "Problem / solution post", status: "done" }, { time: "18:30", title: "Story sequence", status: "review" }] },
      { day: "Tue", date: "Apr 8", count: "1 post", entries: [{ time: "15:00", title: "Product explanation reel", status: "scheduled" }] },
      { day: "Wed", date: "Apr 9", count: "1 post", entries: [{ time: "12:30", title: "Installation visual", status: "planned" }] },
      { day: "Thu", date: "Apr 10", count: "2 posts", entries: [{ time: "10:30", title: "AI video for ads", status: "scheduled" }, { time: "19:00", title: "Story reminder", status: "planned" }] },
      { day: "Fri", date: "Apr 11", count: "1 post", entries: [{ time: "13:00", title: "Trust-building case post", status: "planned" }] },
      { day: "Sat", date: "Apr 12", count: "1 story", entries: [{ time: "17:00", title: "Weekend story check-in", status: "planned" }] },
      { day: "Sun", date: "Apr 13", count: "Review", entries: [{ time: "—", title: "Weekly review and next plan", status: "planned" }] },
    ],
    posts: [
      { day: "Mon", title: "Problem / solution post", time: "11:00", status: "done", channel: "Instagram · Facebook", note: "Published and approved.", mediaUrl: "" },
      { day: "Mon", title: "Story sequence", time: "18:30", status: "review", channel: "Instagram Stories", note: "Waiting for final sign-off.", mediaUrl: "" },
      { day: "Tue", title: "Product explanation reel", time: "15:00", status: "scheduled", channel: "Reels · TikTok", note: "Ready for scheduled release.", mediaUrl: "" },
      { day: "Wed", title: "Installation visual", time: "12:30", status: "planned", channel: "Instagram", note: "Creative is in prep.", mediaUrl: "" },
      { day: "Thu", title: "AI video for ads", time: "10:30", status: "scheduled", channel: "Reels · Ads", note: "Built for paid traffic.", mediaUrl: "" },
      { day: "Fri", title: "Trust-building case post", time: "13:00", status: "planned", channel: "Facebook · Instagram", note: "To be designed after review.", mediaUrl: "" },
      { day: "Sat", title: "Weekend story check-in", time: "17:00", status: "planned", channel: "Instagram Stories", note: "Short update and CTA.", mediaUrl: "" },
    ],
    reporting: [
      { label: "Weekly update", value: "Every Friday", note: "Delivered with post status and next steps." },
      { label: "Monthly report", value: "1 full report", note: "Shows reach, engagement, leads, and improvements." },
      { label: "Action changes", value: "As needed", note: "We adjust timing, format, or copy based on results." },
    ],
  },
  ru: {
    metrics: [
      { label: "Постов за неделю", value: "5", note: "3 готовы · 2 запланированы" },
      { label: "Stories за неделю", value: "3", note: "Публикации распределены по неделе" },
      { label: "Следующий выход", value: "Чт · 19:00", note: "AI-видео для Reels и TikTok" },
    ],
    calendar: [
      { day: "Пн", date: "7 апр", count: "2 поста", entries: [{ time: "11:00", title: "Пост проблема / решение", status: "done" }, { time: "18:30", title: "Серия stories", status: "review" }] },
      { day: "Вт", date: "8 апр", count: "1 пост", entries: [{ time: "15:00", title: "Reel с объяснением продукта", status: "scheduled" }] },
      { day: "Ср", date: "9 апр", count: "1 пост", entries: [{ time: "12:30", title: "Визуал установки", status: "planned" }] },
      { day: "Чт", date: "10 апр", count: "2 поста", entries: [{ time: "10:30", title: "AI-видео для рекламы", status: "scheduled" }, { time: "19:00", title: "Story-напоминание", status: "planned" }] },
      { day: "Пт", date: "11 апр", count: "1 пост", entries: [{ time: "13:00", title: "Кейс для доверия", status: "planned" }] },
      { day: "Сб", date: "12 апр", count: "1 story", entries: [{ time: "17:00", title: "Выходной story check-in", status: "planned" }] },
      { day: "Вс", date: "13 апр", count: "Проверка", entries: [{ time: "—", title: "Еженедельный обзор и план", status: "planned" }] },
    ],
    posts: [
      { day: "Пн", title: "Пост проблема / решение", time: "11:00", status: "done", channel: "Instagram · Facebook", note: "Опубликован и согласован.", mediaUrl: "" },
      { day: "Пн", title: "Серия stories", time: "18:30", status: "review", channel: "Instagram Stories", note: "Ждёт финального подтверждения.", mediaUrl: "" },
      { day: "Вт", title: "Reel с объяснением продукта", time: "15:00", status: "scheduled", channel: "Reels · TikTok", note: "Готов к публикации по плану.", mediaUrl: "" },
      { day: "Ср", title: "Визуал установки", time: "12:30", status: "planned", channel: "Instagram", note: "Креатив ещё в подготовке.", mediaUrl: "" },
      { day: "Чт", title: "AI-видео для рекламы", time: "10:30", status: "scheduled", channel: "Reels · Ads", note: "Сделано под рекламный трафик.", mediaUrl: "" },
      { day: "Пт", title: "Кейс для доверия", time: "13:00", status: "planned", channel: "Facebook · Instagram", note: "Будет доработан после проверки.", mediaUrl: "" },
      { day: "Сб", title: "Выходной story check-in", time: "17:00", status: "planned", channel: "Instagram Stories", note: "Короткий апдейт и CTA.", mediaUrl: "" },
    ],
    reporting: [
      { label: "Еженедельный апдейт", value: "Каждую пятницу", note: "Показываем статус постов и следующие шаги." },
      { label: "Месячный отчёт", value: "1 полный отчёт", note: "Охват, вовлечение, лиды и улучшения." },
      { label: "Изменения по ходу", value: "По необходимости", note: "Меняем время, формат или текст, если видим пользу." },
    ],
  },
  az: {
    metrics: [
      { label: "Həftəlik post", value: "5", note: "3 hazır · 2 planlanıb" },
      { label: "Həftəlik stories", value: "3", note: "Həftə boyunca paylanır" },
      { label: "Növbəti çıxış", value: "Çt · 19:00", note: "Reels və TikTok üçün AI video" },
    ],
    calendar: [
      { day: "B.e", date: "7 apr", count: "2 post", entries: [{ time: "11:00", title: "Problem / həll postu", status: "done" }, { time: "18:30", title: "Stories seriyası", status: "review" }] },
      { day: "Ç.a", date: "8 apr", count: "1 post", entries: [{ time: "15:00", title: "Məhsul izahı reel", status: "scheduled" }] },
      { day: "Ç", date: "9 apr", count: "1 post", entries: [{ time: "12:30", title: "Quraşdırma vizualı", status: "planned" }] },
      { day: "C.a", date: "10 apr", count: "2 post", entries: [{ time: "10:30", title: "Reklam üçün AI video", status: "scheduled" }, { time: "19:00", title: "Story xatırlatma", status: "planned" }] },
      { day: "C", date: "11 apr", count: "1 post", entries: [{ time: "13:00", title: "Etibar yaradan case postu", status: "planned" }] },
      { day: "Ş", date: "12 apr", count: "1 story", entries: [{ time: "17:00", title: "Həftəsonu story check-in", status: "planned" }] },
      { day: "B", date: "13 apr", count: "Yoxlama", entries: [{ time: "—", title: "Həftəlik icmal və növbəti plan", status: "planned" }] },
    ],
    posts: [
      { day: "B.e", title: "Problem / həll postu", time: "11:00", status: "done", channel: "Instagram · Facebook", note: "Paylaşılıb və təsdiqlənib.", mediaUrl: "" },
      { day: "B.e", title: "Stories seriyası", time: "18:30", status: "review", channel: "Instagram Stories", note: "Son təsdiqi gözləyir.", mediaUrl: "" },
      { day: "Ç.a", title: "Məhsul izahı reel", time: "15:00", status: "scheduled", channel: "Reels · TikTok", note: "Plan üzrə çıxmağa hazırdır.", mediaUrl: "" },
      { day: "Ç", title: "Quraşdırma vizualı", time: "12:30", status: "planned", channel: "Instagram", note: "Kreaktiv hazırlıq mərhələsindədir.", mediaUrl: "" },
      { day: "C.a", title: "Reklam üçün AI video", time: "10:30", status: "scheduled", channel: "Reels · Ads", note: "Ödənişli trafik üçün hazırlanıb.", mediaUrl: "" },
      { day: "C", title: "Etibar yaradan case postu", time: "13:00", status: "planned", channel: "Facebook · Instagram", note: "Yoxlamadan sonra tamamlanacaq.", mediaUrl: "" },
      { day: "Ş", title: "Həftəsonu story check-in", time: "17:00", status: "planned", channel: "Instagram Stories", note: "Qısa yenilənmə və CTA.", mediaUrl: "" },
    ],
    reporting: [
      { label: "Həftəlik yenilənmə", value: "Hər cümə", note: "Post statusu və növbəti addımlar göstərilir." },
      { label: "Aylıq hesabat", value: "1 tam hesabat", note: "Reach, engagement, lead və düzəlişləri göstərir." },
      { label: "Yenilənən dəyişikliklər", value: "Lazım olduqda", note: "Saatı, formatı və ya mətni nəticəyə görə dəyişirik." },
    ],
  },
};

const statusTone: Record<PostStatus, string> = {
  done: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  review: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  scheduled: "border-sky-300/20 bg-sky-400/10 text-sky-100",
  planned: "border-white/10 bg-white/[0.05] text-white/75",
};

const SMM_ADMIN_PREFIX = "SMM_ADMIN::";
const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_EN_FOCUS = "Weekly delivery and publication timing";
const dayLabels: Record<PortalLanguage, Record<string, string>> = {
  en: { Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun" },
  ru: { Mon: "Пн", Tue: "Вт", Wed: "Ср", Thu: "Чт", Fri: "Пт", Sat: "Сб", Sun: "Вс" },
  az: { Mon: "B.e", Tue: "Ç.a", Wed: "Ç", Thu: "C.a", Fri: "C", Sat: "Ş", Sun: "B" },
};

function normalizeDay(day: string) {
  const key = day.trim().slice(0, 3).toLowerCase();
  const map: Record<string, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };
  return map[key] ?? day;
}

function parseTimeToMinutes(time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function getNextPostFromSchedule(schedule: SmmScheduleItem[], language: PortalLanguage) {
  if (!schedule.length) return "—";

  const now = new Date();
  const todayIndex = (now.getDay() + 6) % 7;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const candidates = schedule
    .map((item) => {
      const normalizedDay = normalizeDay(item.day);
      const dayIndex = dayOrder.indexOf(normalizedDay);
      const timeMinutes = parseTimeToMinutes(item.time || "");
      return {
        day: normalizedDay,
        dayIndex,
        time: item.time?.trim() || "",
        timeMinutes,
      };
    })
    .filter((item) => item.dayIndex >= 0)
    .sort((a, b) => {
      if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
      return (a.timeMinutes ?? Number.MAX_SAFE_INTEGER) - (b.timeMinutes ?? Number.MAX_SAFE_INTEGER);
    });

  if (!candidates.length) return "—";

  const next =
    candidates.find((item) => item.dayIndex > todayIndex || (item.dayIndex === todayIndex && (item.timeMinutes === null || item.timeMinutes >= nowMinutes))) ??
    candidates[0];

  const label = dayLabels[language][next.day] ?? next.day;
  const hasTime = next.time && next.time !== "—";
  return hasTime ? `${label} · ${next.time}` : label;
}

function resolveLocalizedAdminText(params: {
  value: string | undefined;
  localizedDefault: string;
  englishDefault: string;
}) {
  const trimmed = params.value?.trim() ?? "";
  if (!trimmed || trimmed === params.englishDefault) return params.localizedDefault;
  return trimmed;
}

function parseSmmAdminPayload(update: string | null | undefined): SmmAdminPayload | null {
  if (!update || !update.startsWith(SMM_ADMIN_PREFIX)) return null;

  try {
    const payload = JSON.parse(update.slice(SMM_ADMIN_PREFIX.length)) as Partial<SmmAdminPayload>;
    if (!Array.isArray(payload.schedule)) return null;

    return {
      heroTitle: payload.heroTitle ?? "",
      heroSubtitle: payload.heroSubtitle ?? "",
      summaryTitle: payload.summaryTitle ?? "",
      summaryText: payload.summaryText ?? "",
      calendarTitle: payload.calendarTitle ?? "",
      calendarText: payload.calendarText ?? "",
      postsTitle: payload.postsTitle ?? "",
      postsText: payload.postsText ?? "",
      reportingTitle: payload.reportingTitle ?? "",
      reportingText: payload.reportingText ?? "",
      heroImageUrl: payload.heroImageUrl ?? "",
      cadence: payload.cadence ?? "",
      nextPostTime: payload.nextPostTime ?? "",
      focus: payload.focus ?? "",
      managerNote: payload.managerNote ?? "",
      postsPerWeek: Number(payload.postsPerWeek) || payload.schedule.length || 0,
      schedule: payload.schedule.map((item, index) => ({
        id: item.id ?? String(index + 1),
        day: item.day ?? "Mon",
        time: item.time ?? "—",
        content: item.content ?? "Post",
        status: (item.status ?? "planned") as SmmScheduleStatus,
        mediaUrl: item.mediaUrl ?? "",
      })),
    };
  } catch {
    return null;
  }
}

export default function SmmPage() {
  const { selectedProject, loading } = usePortal();
  const { language } = usePortalLanguage();
  const [activeTab, setActiveTab] = useState<SectionKey>("calendar");
  const t = copy[language];
  const fallbackTracker = trackerData[language];

  const isSmmProject = selectedProject?.service === "smm";
  const allDone = selectedProject ? selectedProject.status === "delivered" || selectedProject.progress >= 100 : false;
  const adminPayload = isSmmProject ? parseSmmAdminPayload(selectedProject?.latestUpdate) : null;

  const tracker = useMemo(() => {
    if (!adminPayload || adminPayload.schedule.length === 0) return fallbackTracker;

    const grouped = new Map<string, Array<{ time: string; title: string; status: PostStatus; mediaUrl?: string }>>();
    adminPayload.schedule.forEach((item) => {
      const list = grouped.get(item.day) ?? [];
      list.push({ time: item.time || "—", title: item.content || "Post", status: item.status, mediaUrl: item.mediaUrl || undefined });
      grouped.set(item.day, list);
    });

    const calendar = dayOrder
      .filter((day) => grouped.has(day))
      .map((day) => {
        const entries = grouped.get(day) ?? [];
        return {
          day,
          date: "—",
          count: t.slotsLabel(entries.length),
          entries,
        };
      });

    const posts: TrackerPost[] = adminPayload.schedule.map((item) => ({
      day: item.day,
      title: item.content || "Post",
      time: item.time || "—",
      status: item.status,
      channel: t.contentPlan,
      note: t.managedFromAdmin,
      mediaUrl: item.mediaUrl || undefined,
    }));

    const doneCount = posts.filter((item) => item.status === "done").length;
    const scheduledCount = posts.filter((item) => item.status === "scheduled").length;

    return {
      metrics: [
        {
          label: fallbackTracker.metrics[0]?.label ?? "Posts this week",
          value: String(adminPayload.postsPerWeek || posts.length),
          note: t.statusSummary(doneCount, scheduledCount),
        },
        fallbackTracker.metrics[1] ?? { label: "Stories this week", value: "0", note: "—" },
        {
          label: fallbackTracker.metrics[2]?.label ?? "Next publish",
          value: getNextPostFromSchedule(adminPayload.schedule, language) || adminPayload.nextPostTime,
          note:
            resolveLocalizedAdminText({
              value: adminPayload.focus,
              localizedDefault: t.defaultCadenceNote,
              englishDefault: DEFAULT_EN_FOCUS,
            }) || fallbackTracker.metrics[2]?.note || "—",
        },
      ],
      calendar,
      posts,
      reporting: fallbackTracker.reporting,
    };
  }, [adminPayload, fallbackTracker, language, t]);

  const overviewNextPost =
    (adminPayload ? getNextPostFromSchedule(adminPayload.schedule, language) || adminPayload.nextPostTime : tracker.metrics[2]?.value || "—");
  const overviewCadence = adminPayload?.cadence || `${adminPayload?.postsPerWeek || tracker.posts.length} ${t.postsPerWeekLabel}`;
  const overviewCadenceNote = adminPayload ? t.plannedSlotsFromAdmin(adminPayload.postsPerWeek) : t.defaultCadenceNote;
  const localizedFocus = resolveLocalizedAdminText({
    value: adminPayload?.focus,
    localizedDefault: t.defaultCadenceNote,
    englishDefault: DEFAULT_EN_FOCUS,
  });
  const displayCopy = {
    subtitle: resolveLocalizedAdminText({
      value: adminPayload?.heroSubtitle,
      localizedDefault: t.subtitle,
      englishDefault: copy.en.subtitle,
    }),
    summaryTitle: resolveLocalizedAdminText({
      value: adminPayload?.summaryTitle,
      localizedDefault: t.summaryTitle,
      englishDefault: copy.en.summaryTitle,
    }),
    summaryText: resolveLocalizedAdminText({
      value: adminPayload?.summaryText,
      localizedDefault: t.summaryText,
      englishDefault: copy.en.summaryText,
    }),
    calendarTitle: resolveLocalizedAdminText({
      value: adminPayload?.calendarTitle,
      localizedDefault: t.calendarTitle,
      englishDefault: copy.en.calendarTitle,
    }),
    calendarText: resolveLocalizedAdminText({
      value: adminPayload?.calendarText,
      localizedDefault: t.calendarText,
      englishDefault: copy.en.calendarText,
    }),
    postsTitle: resolveLocalizedAdminText({
      value: adminPayload?.postsTitle,
      localizedDefault: t.postsTitle,
      englishDefault: copy.en.postsTitle,
    }),
    postsText: resolveLocalizedAdminText({
      value: adminPayload?.postsText,
      localizedDefault: t.postsText,
      englishDefault: copy.en.postsText,
    }),
    reportingTitle: resolveLocalizedAdminText({
      value: adminPayload?.reportingTitle,
      localizedDefault: t.reportingTitle,
      englishDefault: copy.en.reportingTitle,
    }),
    reportingText: resolveLocalizedAdminText({
      value: adminPayload?.reportingText,
      localizedDefault: t.reportingText,
      englishDefault: copy.en.reportingText,
    }),
    heroImageUrl: adminPayload?.heroImageUrl || "",
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm uppercase tracking-[0.14em] text-white/45">{t.loading}</div>;
  }

  if (!selectedProject) return null;

  return (
    <div className="w-full">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{t.title}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{selectedProject.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{displayCopy.subtitle}</p>
      </div>

      {!isSmmProject ? (
        <div className="rounded-3xl border border-white/10 bg-black/80 p-6 shadow-[0_22px_60px_rgba(0,0,0,0.45)]">
          <h2 className="text-xl font-semibold text-white">{t.emptyTitle}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{t.emptyText}</p>
          <Link href="/portal" className="mt-5 inline-flex h-11 items-center rounded-2xl border border-white/15 bg-black/35 px-4 text-sm font-medium text-white/90 transition hover:border-white/25 hover:bg-black/55">
            {t.switchProject}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-black/90 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.48)] sm:p-6">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(t.tabs) as SectionKey[]).map((key) => {
                const active = activeTab === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "border-white bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.12)]"
                        : "border-white/12 bg-black/35 text-white/70 hover:border-white/25 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {t.tabs[key]}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/75 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-100/90">
                    {displayCopy.calendarTitle}
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{displayCopy.calendarTitle}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{displayCopy.calendarText}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-right">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{t.status}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{allDone ? t.statusLegend.done : t.statusLegend.scheduled}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 xl:grid-cols-3">
                {tracker.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/70 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{metric.value}</p>
                    <p className="mt-1 text-sm text-white/60">{metric.note}</p>
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {activeTab === "calendar" && (
                  <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, ease: "easeOut" }} className="mt-5">
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{displayCopy.calendarTitle}</p>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{displayCopy.calendarText}</p>
                      </div>
                      <div className="hidden rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/60 md:block">
                        {t.statusLegend.done} · {t.statusLegend.review} · {t.statusLegend.scheduled} · {t.statusLegend.planned}
                      </div>
                    </div>

                    <div className="w-full max-w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/65 p-3">
                      <div className="overflow-x-auto overflow-y-hidden pb-2">
                        <div className="flex w-max gap-3">
                          {tracker.calendar.map((day) => (
                            <div key={`${day.day}-${day.date}`} className="w-[168px] shrink-0 rounded-2xl border border-white/10 bg-black/75 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-white">{day.day}</p>
                                  <p className="mt-1 text-xs text-white/50">{day.date}</p>
                                </div>
                                <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/60">{day.count}</span>
                              </div>

                              <div className="mt-4 space-y-2">
                                {day.entries.map((entry) => (
                                  <div key={`${day.day}-${entry.time}-${entry.title}`} className="rounded-2xl border border-white/10 bg-black/85 p-3">
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-sm font-medium text-white">{entry.title}</p>
                                        <p className="mt-1 text-xs text-white/50">{entry.time}</p>
                                      </div>
                                      {entry.mediaUrl ? <img src={entry.mediaUrl} alt={entry.title} className="h-20 w-full rounded-xl border border-white/10 object-cover" /> : null}
                                      <span className={`inline-flex max-w-full self-start items-center rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${statusTone[entry.status]}`}>
                                        <span title={t.statusLegend[entry.status]} className="block max-w-[102px] truncate">{t.statusLegend[entry.status]}</span>
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "posts" && (
                  <motion.div key="posts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, ease: "easeOut" }} className="mt-5">
                    <div className="mb-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{displayCopy.postsTitle}</p>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">{displayCopy.postsText}</p>
                    </div>

                    <div className="space-y-3">
                      {tracker.posts.map((post) => (
                        <div key={`${post.day}-${post.time}-${post.title}`} className="rounded-2xl border border-white/10 bg-black/75 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/40">
                                <span>{post.day}</span>
                                <span>•</span>
                                <span>{post.channel}</span>
                              </div>
                              <h3 className="mt-2 text-base font-semibold text-white">{post.title}</h3>
                              <p className="mt-1 text-sm text-white/55">{post.note}</p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {post.mediaUrl ? <img src={post.mediaUrl} alt={post.title} className="h-14 w-14 rounded-xl border border-white/10 object-cover" /> : null}
                              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-sm text-white/75">{post.time}</span>
                              <span className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${statusTone[post.status]}`}>
                                <span title={t.statusLegend[post.status]} className="block max-w-[130px] truncate">{t.statusLegend[post.status]}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{t.progressNotes}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[11px] text-white/75">{t.statusLegend.done} = {t.publishedLegend}</span>
                  <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[11px] text-white/75">{t.statusLegend.review} = {t.reviewLegend}</span>
                  <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[11px] text-white/75">{t.statusLegend.scheduled} = {t.scheduledLegend}</span>
                  <span className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[11px] text-white/75">{t.statusLegend.planned} = {t.plannedLegend}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
