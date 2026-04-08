"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, X } from "@phosphor-icons/react";

const ownerUsername = process.env.NEXT_PUBLIC_OWNER_USERNAME ?? "owner";
const ownerPassword = process.env.NEXT_PUBLIC_OWNER_PASSWORD ?? "bakhishovadmin";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ownerSession = localStorage.getItem("owner_session");
    if (ownerSession === "active") {
      router.replace("/owner");
    }
  }, [router]);

  function handleLogin() {
    setLoading(true);
    setError("");

    const ok = username.trim() === ownerUsername && password === ownerPassword;
    if (!ok) {
      setError("Invalid owner credentials.");
      setLoading(false);
      return;
    }

    localStorage.setItem("owner_session", "active");
    router.replace("/owner");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_48%)]" />

      <div className="relative w-full max-w-lg rounded-[28px] border border-white/15 bg-black/55 p-2 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="rounded-[22px] border border-white/10 bg-[#080808]/95 p-7 sm:p-9">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Bakhishov Brands</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Owner Console</h1>
              <p className="mt-2 text-sm text-white/55">Restricted access for brand operations.</p>
            </div>

            <Link
              href="/login"
              aria-label="Close"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] text-white/70 transition hover:border-white/25 hover:text-white"
            >
              <X className="h-4 w-4" weight="bold" />
            </Link>
          </div>

          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200">
            <ShieldCheck className="h-4 w-4" weight="duotone" />
            Secure authentication required
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.16em] text-white/45">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none placeholder:text-white/20 transition-all duration-300 focus:border-white/35"
                placeholder="owner username"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.16em] text-white/45">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-black/40 px-4 text-sm text-white outline-none placeholder:text-white/20 transition-all duration-300 focus:border-white/35"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="h-12 w-full rounded-xl border border-white/22 bg-white/10 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/15 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Enter Owner Console"}
            </button>

            <Link
              href="/login"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 text-sm font-medium text-white/75 transition hover:border-white/25 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" weight="bold" />
              Back to client login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
