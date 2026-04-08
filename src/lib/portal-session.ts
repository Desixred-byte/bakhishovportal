import { supabase } from "@/lib/supabase";

type SessionPayload = {
  clientId: string;
  customerName?: string | null;
  companyName?: string | null;
};

const SESSION_STORAGE_KEY = "portal_session_id";

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";

  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const next = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

function getDeviceLabel() {
  if (typeof navigator === "undefined") return "Unknown";

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("iphone")) return "iPhone";
  if (ua.includes("ipad")) return "iPad";
  if (ua.includes("android")) return "Android";
  if (ua.includes("mac os")) return "Mac";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("linux")) return "Linux";
  return "Desktop";
}

async function getLocationLabel() {
  if (typeof window === "undefined") return "Unknown";

  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) return "Unknown";
    const data = (await response.json()) as { city?: string; country_name?: string };

    if (data.city && data.country_name) return `${data.city}, ${data.country_name}`;
    return data.country_name ?? "Unknown";
  } catch {
    return "Unknown";
  }
}

export async function reportPortalSessionActivity(payload: SessionPayload) {
  if (!payload.clientId) return;

  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;

  const locationLabel = await getLocationLabel();
  const deviceLabel = getDeviceLabel();

  await supabase.from("portal_sessions").upsert(
    {
      id: sessionId,
      client_id: payload.clientId,
      customer_name: payload.customerName ?? null,
      company_name: payload.companyName ?? null,
      device_label: deviceLabel,
      location_label: locationLabel,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}
