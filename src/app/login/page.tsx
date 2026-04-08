"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKey, ShieldCheck, User } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [portalUnavailable, setPortalUnavailable] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    setPortalUnavailable(false);

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error || !data) {
      setError("Invalid username or password.");
      setLoading(false);
      return;
    }

    const savedPassword = typeof data.password === "string" ? data.password : "";
    const portalIsDisabled = savedPassword.length === 0 || savedPassword.startsWith("DISABLED::") || ("portal_enabled" in data && data.portal_enabled === false);

    if (portalIsDisabled) {
      setPortalUnavailable(true);
      setError("This portal is currently not available. Please contact support.");
      setLoading(false);
      return;
    }

    if (savedPassword !== password) {
      setError("Invalid username or password.");
      setLoading(false);
      return;
    }

    localStorage.setItem("client_id", data.id);
    router.push("/portal");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-24 top-[-120px] h-72 w-72 rounded-full bg-blue-500/15 blur-3xl"
          animate={{ x: [0, 36, -18, 0], y: [0, 22, -14, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 bottom-[-120px] h-80 w-80 rounded-full bg-indigo-500/12 blur-3xl"
          animate={{ x: [0, -28, 18, 0], y: [0, -24, 10, 0], scale: [1, 0.94, 1.06, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/8 blur-3xl"
          animate={{ x: [0, -16, 24, 0], y: [0, 14, -18, 0], opacity: [0.35, 0.6, 0.4, 0.35] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative w-full max-w-md rounded-[30px] border border-white/12 bg-[#0a0a0c]/95 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_80px_rgba(0,0,0,0.58)] backdrop-blur-xl sm:p-9">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
          <ShieldCheck className="h-3.5 w-3.5" weight="fill" />
          Secure Access
        </div>

        <div className="mt-4 inline-flex rounded-xl border border-white/12 bg-black/35 px-3 py-2">
          <Image
            src="/BAKHISHOV.png"
            alt="Bakhishov"
            width={120}
            height={26}
            className="h-5 w-auto object-contain"
            unoptimized
            priority
          />
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Private Client Portal</h1>
        <p className="mt-2 text-sm leading-6 text-white/58">
          Enter your credentials to access your private workspace and latest project updates.
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-[0.16em] text-white/45">Username</label>
            <div className="relative mt-2">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 transition-all duration-300 focus:border-white/35 focus:bg-white/[0.07]"
                placeholder="your username"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.16em] text-white/45">Password</label>
            <div className="relative mt-2">
              <LockKey className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="h-12 w-full rounded-2xl border border-white/15 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 transition-all duration-300 focus:border-white/35 focus:bg-white/[0.07]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key={portalUnavailable ? "portal-unavailable" : "login-error"}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`rounded-2xl border px-4 py-3 text-sm ${portalUnavailable ? "border-amber-400/30 bg-amber-400/10 text-amber-100" : "border-red-400/25 bg-red-400/10 text-red-200"}`}
              >
                <p className="font-medium">{error}</p>
                {portalUnavailable && <p className="mt-1 text-xs text-amber-100/70">If you believe this is a mistake, contact support and we’ll reactivate your access.</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Enter Portal"}
            {!loading && <ArrowRight className="h-4 w-4" weight="bold" />}
          </button>

          <Link
            href="/owner/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/15 bg-black/35 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            Open Owner Console
          </Link>
        </div>
      </div>
    </div>
  );
}