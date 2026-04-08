"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowsClockwise, CheckCircle, LockSimple, SignOut, WarningCircle } from "@phosphor-icons/react";
import { usePortalLanguage, type PortalLanguage } from "@/components/portal/portal-language";
import { usePortal } from "@/components/portal/portal-provider";
import { supabase } from "@/lib/supabase";

type ProfileValues = {
  brandName: string;
  username: string;
  whatsappNumber: string;
};

const settingsCopy: Record<PortalLanguage, Record<string, string>> = {
  en: {
    account: "Account",
    settings: "Settings",
    subtitle: "Manage profile details and security actions for your private client portal.",
    profilePreview: "Profile preview",
    readOnly: "Read-only",
    whatsapp: "WhatsApp",
    status: "Status",
    unsaved: "You have unsaved changes.",
    saved: "All changes are saved.",
    brandName: "Brand name",
    username: "Representative name",
    whatsappNumber: "WhatsApp number",
    example: "Example: +994 55 123 45 67",
    fillFields: "Fill all fields correctly to save changes.",
    logout: "Logout",
    reset: "Reset",
    resetting: "Resetting...",
    saveChanges: "Save changes",
    noChanges: "No changes",
    saving: "Saving...",
    saveError: "Could not save changes. Please try again.",
    saveSuccess: "Changes saved successfully.",
    confirmLogout: "Confirm logout",
    confirmText: "Are you sure you want to log out from your client portal?",
    cancel: "Cancel",
    yesLogout: "Yes, logout",
  },
  ru: {
    account: "Аккаунт",
    settings: "Настройки",
    subtitle: "Управляйте профилем и действиями безопасности в вашем клиентском портале.",
    profilePreview: "Предпросмотр профиля",
    readOnly: "Только чтение",
    whatsapp: "WhatsApp",
    status: "Статус",
    unsaved: "У вас есть несохранённые изменения.",
    saved: "Все изменения сохранены.",
    brandName: "Название бренда",
    username: "Имя представителя",
    whatsappNumber: "Номер WhatsApp",
    example: "Пример: +994 55 123 45 67",
    fillFields: "Заполните все поля корректно, чтобы сохранить изменения.",
    logout: "Выйти",
    reset: "Сброс",
    resetting: "Сброс...",
    saveChanges: "Сохранить изменения",
    noChanges: "Нет изменений",
    saving: "Сохранение...",
    saveError: "Не удалось сохранить изменения. Попробуйте снова.",
    saveSuccess: "Изменения успешно сохранены.",
    confirmLogout: "Подтверждение выхода",
    confirmText: "Вы уверены, что хотите выйти из клиентского портала?",
    cancel: "Отмена",
    yesLogout: "Да, выйти",
  },
  az: {
    account: "Hesab",
    settings: "Tənzimləmələr",
    subtitle: "Şəxsi müştəri portalınız üçün profil məlumatlarını və təhlükəsizlik əməliyyatlarını idarə edin.",
    profilePreview: "Profil önbaxışı",
    readOnly: "Yalnız oxunur",
    whatsapp: "WhatsApp",
    status: "Status",
    unsaved: "Yadda saxlanılmamış dəyişiklikləriniz var.",
    saved: "Bütün dəyişikliklər yadda saxlanılıb.",
    brandName: "Brend adı",
    username: "Şirkət nümayəndəsinin adı",
    whatsappNumber: "WhatsApp nömrəsi",
    example: "Nümunə: +994 55 123 45 67",
    fillFields: "Dəyişiklikləri saxlamaq üçün bütün xanaları düzgün doldurun.",
    logout: "Çıxış",
    reset: "Sıfırla",
    resetting: "Sıfırlanır...",
    saveChanges: "Dəyişiklikləri saxla",
    noChanges: "Dəyişiklik yoxdur",
    saving: "Yadda saxlanılır...",
    saveError: "Dəyişiklikləri saxlamaq mümkün olmadı. Yenidən cəhd edin.",
    saveSuccess: "Dəyişikliklər uğurla yadda saxlanıldı.",
    confirmLogout: "Çıxışı təsdiqlə",
    confirmText: "Müştəri portalından çıxmaq istədiyinizə əminsiniz?",
    cancel: "Ləğv et",
    yesLogout: "Bəli, çıxış et",
  },
};

function formatWhatsappForInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("994")) {
    const local = digits.slice(3, 12);
    const p1 = local.slice(0, 2);
    const p2 = local.slice(2, 5);
    const p3 = local.slice(5, 7);
    const p4 = local.slice(7, 9);
    return ["+994", p1, p2, p3, p4].filter(Boolean).join(" ");
  }

  if (digits.startsWith("0")) {
    const local = digits.slice(1, 10);
    const p1 = local.slice(0, 2);
    const p2 = local.slice(2, 5);
    const p3 = local.slice(5, 7);
    const p4 = local.slice(7, 9);
    return ["+994", p1, p2, p3, p4].filter(Boolean).join(" ");
  }

  const trimmed = digits.slice(0, 15);
  return `+${trimmed}`;
}

function normalizeWhatsappForStorage(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("994")) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith("0")) return `+994${digits.slice(1, 10)}`;
  return `+${digits.slice(0, 15)}`;
}

export default function SettingsPage() {
  const { client } = usePortal();
  const { language } = usePortalLanguage();
  const router = useRouter();
  const copy = settingsCopy[language];

  const [brandName, setBrandName] = useState("");
  const [username, setUsername] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [initialValues, setInitialValues] = useState<ProfileValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | null>(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  useEffect(() => {
    if (!client) return;
    const nextValues = {
      brandName: client.brandName ?? "",
      username: client.username ?? "",
      whatsappNumber: formatWhatsappForInput(client.whatsappNumber ?? ""),
    };

    setBrandName(nextValues.brandName);
    setUsername(nextValues.username);
    setWhatsappNumber(nextValues.whatsappNumber);
    setInitialValues(nextValues);
  }, [client]);

  const normalizedValues = useMemo(
    () => ({
      brandName: brandName.trim(),
      username: username.trim(),
      whatsappNumber: normalizeWhatsappForStorage(whatsappNumber),
    }),
    [brandName, username, whatsappNumber]
  );

  const normalizedInitialValues = useMemo(
    () =>
      initialValues
        ? {
            brandName: initialValues.brandName,
            username: initialValues.username,
            whatsappNumber: normalizeWhatsappForStorage(initialValues.whatsappNumber),
          }
        : null,
    [initialValues]
  );

  const hasChanges = useMemo(() => {
    if (!normalizedInitialValues) return false;
    return (
      normalizedValues.brandName !== normalizedInitialValues.brandName ||
      normalizedValues.username !== normalizedInitialValues.username ||
      normalizedValues.whatsappNumber !== normalizedInitialValues.whatsappNumber
    );
  }, [normalizedInitialValues, normalizedValues]);

  const isValid =
    normalizedValues.brandName.length >= 2 &&
    normalizedValues.username.length >= 2 &&
    normalizedValues.whatsappNumber.replace(/\D/g, "").length >= 10;

  const formattedWhatsapp = formatWhatsappForInput(whatsappNumber);
  const whatsappParts = formattedWhatsapp.split(" ").filter(Boolean);
  const profileInitials = (brandName || client?.brandName || "PC")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (!client) return null;

  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function handleSaveSettings() {
    const clientId = client?.id;
    if (!clientId || !hasChanges || !isValid) return;

    const startedAt = Date.now();
    setSaving(true);
    setFeedback(null);
    setFeedbackType(null);

    const { error } = await supabase
      .from("clients")
      .update({
        brand_name: normalizedValues.brandName,
        username: normalizedValues.username,
        whatsapp_number: normalizedValues.whatsappNumber,
      })
      .eq("id", clientId);

    if (error) {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 380) await wait(380 - elapsed);
      setFeedback(copy.saveError);
      setFeedbackType("error");
      setSaving(false);
      return;
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed < 380) await wait(380 - elapsed);

    setInitialValues({
      brandName: normalizedValues.brandName,
      username: normalizedValues.username,
      whatsappNumber: formatWhatsappForInput(normalizedValues.whatsappNumber),
    });
    setBrandName(normalizedValues.brandName);
    setUsername(normalizedValues.username);
    setWhatsappNumber(formatWhatsappForInput(normalizedValues.whatsappNumber));
    setFeedback(copy.saveSuccess);
    setFeedbackType("success");
    setSaving(false);
  }

  async function handleResetChanges() {
    if (!initialValues) return;

    setResetting(true);
    await wait(220);
    setBrandName(initialValues.brandName);
    setUsername(initialValues.username);
    setWhatsappNumber(initialValues.whatsappNumber);
    setFeedback(null);
    setFeedbackType(null);
    await wait(120);
    setResetting(false);
  }

  function handleLogout() {
    localStorage.removeItem("client_id");
    localStorage.removeItem("theme_mode");
    router.push("/login");
  }

  return (
    <>
      <div className="w-full max-w-7xl">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.account}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">{copy.settings}</h1>
        <p className="mt-3 max-w-2xl text-white/60">
          {copy.subtitle}
        </p>

        <div className="mt-8 grid gap-5 xl:grid-cols-[0.85fr_1.5fr]">
          <div className="rounded-3xl border border-white/12 bg-white/[0.03] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.015)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{copy.profilePreview}</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/55">
                <LockSimple className="h-3 w-3" weight="bold" />
                {copy.readOnly}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-black/35 text-base font-semibold tracking-wide text-white/90">
                {profileInitials || "PC"}
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-white">{brandName || "—"}</h3>
                <p className="mt-1 text-sm text-white/55">@{username || "username"}</p>
              </div>
            </div>

            <p className="mt-6 text-sm text-white/70">{copy.whatsapp}</p>
            <div className="mt-1 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2.5 text-base text-white/90">
              {formattedWhatsapp ? (
                <>
                  <span className="font-medium">{whatsappParts.slice(0, 3).join(" ")}</span>
                  {whatsappParts.length > 3 ? " " : ""}
                  <span className="font-semibold text-white">{whatsappParts.slice(3).join(" ")}</span>
                </>
              ) : (
                "—"
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/12 bg-black/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">{copy.status}</p>
              <p className="mt-2 text-sm text-white/75">
                {hasChanges ? copy.unsaved : copy.saved}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/12 bg-white/[0.03] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.015)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-[11px] uppercase tracking-[0.12em] text-white/45">{copy.brandName}</label>
                <input
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-white/15 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-white/30"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[0.12em] text-white/45">{copy.username}</label>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-white/15 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-white/30"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[0.12em] text-white/45">{copy.whatsappNumber}</label>
                <input
                  value={whatsappNumber}
                  onChange={(event) => setWhatsappNumber(formatWhatsappForInput(event.target.value))}
                  className="mt-2 h-11 w-full rounded-2xl border border-white/15 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-white/30"
                />
                <p className="mt-2 text-xs text-white/45">{copy.example}</p>
              </div>
            </div>

            {!isValid && (
              <p className="mt-4 flex items-center gap-2 text-sm text-amber-300/90">
                <WarningCircle className="h-4 w-4" weight="fill" />
                {copy.fillFields}
              </p>
            )}

            {feedback && (
              <p
                className={`mt-4 flex items-center gap-2 text-sm ${
                  feedbackType === "success" ? "text-emerald-300/90" : "text-red-300/90"
                }`}
              >
                {feedbackType === "success" ? (
                  <CheckCircle className="h-4 w-4" weight="fill" />
                ) : (
                  <WarningCircle className="h-4 w-4" weight="fill" />
                )}
                {feedback}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setConfirmLogoutOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-red-400/35 bg-red-500/15 px-4 text-sm font-semibold text-red-200 transition hover:bg-red-500/25"
              >
                <SignOut className="h-4 w-4" weight="bold" />
                {copy.logout}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetChanges}
                  disabled={!hasChanges || saving || resetting}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 bg-black/25 px-4 text-sm font-medium text-white/85 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ArrowsClockwise className={`h-4 w-4 ${resetting ? "animate-spin" : ""}`} />
                  {resetting ? copy.resetting : copy.reset}
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={saving || resetting || !hasChanges || !isValid}
                  className="inline-flex h-11 items-center rounded-2xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {saving ? copy.saving : hasChanges ? copy.saveChanges : copy.noChanges}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {confirmLogoutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setConfirmLogoutOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0e0e10] p-6"
            >
              <h4 className="text-xl font-semibold text-white">{copy.confirmLogout}</h4>
              <p className="mt-2 text-sm text-white/65">{copy.confirmText}</p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmLogoutOpen(false)}
                  className="inline-flex h-10 items-center rounded-2xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-white/85"
                >
                  {copy.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-10 items-center rounded-2xl border border-red-400/35 bg-red-500/15 px-4 text-sm font-semibold text-red-200"
                >
                  {copy.yesLogout}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
