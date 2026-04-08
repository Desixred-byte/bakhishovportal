import type { ReactNode } from "react";
import { Sidebar } from "@/components/portal/sidebar";
import { PortalProvider } from "../../components/portal/portal-provider";
import { PortalLanguageProvider } from "@/components/portal/portal-language";

export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PortalLanguageProvider>
      <PortalProvider>
        <div className="portal-theme min-h-screen bg-black text-white">
          <div className="flex min-h-screen flex-col lg:flex-row">
            <Sidebar />

            <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden px-3 py-5 sm:px-4 sm:py-7 lg:py-8 [&>*]:mx-0 [&>*]:max-w-none">{children}</main>
          </div>
        </div>
      </PortalProvider>
    </PortalLanguageProvider>
  );
}