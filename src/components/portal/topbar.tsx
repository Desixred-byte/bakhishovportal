"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { ProjectSwitcher } from "./project-switcher";

export function Topbar() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("theme_mode");
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  function handleLogout() {
    localStorage.removeItem("client_id");
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/75 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl border border-white/10 bg-black/30 px-2.5 py-1.5">
            <Image
              src="/BAKHISHOV.png"
              alt="Bakhishov"
              width={104}
              height={22}
              className="h-4 w-auto object-contain"
              unoptimized
              priority
            />
          </div>
          <p className="text-sm font-semibold tracking-tight text-white/90">Private Client Portal</p>
        </div>

        <div className="relative flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:max-w-xl">
          <span className="pointer-events-none absolute -right-6 top-1/2 hidden h-24 w-40 -translate-y-1/2 rounded-full bg-gradient-to-l from-white/15 via-white/8 to-transparent blur-2xl sm:block" />

          <div className="w-full sm:max-w-sm">
            <ProjectSwitcher />
          </div>

          <motion.button
            type="button"
            onClick={handleLogout}
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 24 }}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-[#121212] px-5 text-sm font-medium text-white transition-colors duration-200 hover:border-white/25 hover:bg-[#1b1b1b]"
          >
            <SignOut className="h-4 w-4" weight="bold" />
            Logout
          </motion.button>
        </div>
      </div>
    </header>
  );
}
