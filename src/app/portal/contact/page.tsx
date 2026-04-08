"use client";

import { usePortalLanguage, type PortalLanguage } from "@/components/portal/portal-language";

const supportWhatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "994501234567";
const whatsappUrl = `https://wa.me/${supportWhatsapp}`;

const contactCopy: Record<PortalLanguage, Record<string, string>> = {
  en: {
    title: "Contact",
    heading: "WhatsApp Support Desk",
    intro: "You can message us directly on WhatsApp for revisions, approvals, delivery feedback, and billing questions.",
    channel: "Primary channel",
    channelValue: "Direct WhatsApp Chat",
    text: "Send your request in one message and we will continue support in your active WhatsApp thread.",
    cta: "Open WhatsApp Chat",
  },
  ru: {
    title: "Контакты",
    heading: "Поддержка через WhatsApp",
    intro: "Пишите нам напрямую в WhatsApp по правкам, согласованиям, материалам и вопросам по оплате.",
    channel: "Основной канал",
    channelValue: "Прямой WhatsApp",
    text: "Отправьте запрос одним сообщением — дальнейшая коммуникация продолжится в этом чате.",
    cta: "Открыть чат WhatsApp",
  },
  az: {
    title: "Əlaqə",
    heading: "WhatsApp Dəstək Xətti",
    intro: "Düzəlişlər, təsdiqlər, təhvil və ödəniş sualları üçün bizimlə birbaşa WhatsApp-da yazışın.",
    channel: "Əsas kanal",
    channelValue: "Birbaşa WhatsApp",
    text: "Sorğunuzu bir mesajda göndərin, dəstək prosesi bu söhbətdə davam edəcək.",
    cta: "WhatsApp çatını aç",
  },
};

export default function ContactPage() {
  const { language } = usePortalLanguage();
  const copy = contactCopy[language];

  return (
    <div className="w-full max-w-7xl">
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
        {copy.title}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {copy.heading}
      </h1>
      <p className="mt-3 max-w-2xl text-white/60">
        {copy.intro}
      </p>

      <div className="mt-8 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] sm:p-7">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.channel}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{copy.channelValue}</p>
        <p className="mt-3 text-sm leading-6 text-white/60">
          {copy.text}
        </p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-11 items-center rounded-2xl border border-blue-200/20 bg-blue-500/12 px-5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200/35 hover:bg-blue-500/20"
        >
          {copy.cta}
        </a>
      </div>
    </div>
  );
}