"use client";

import { clientData } from "@/lib/data";
import { formatAzn } from "@/lib/currency";
import Link from "next/link";
import { PortalProvider } from "../components/portal/portal-provider";
import { usePortal } from "../components/portal/portal-provider";

export default function PortalPage() {
  return (
    <PortalProvider>
      <PortalHomeContent />
    </PortalProvider>
  );
}

function PortalHomeContent() {
  const { selectedProject } = usePortal();
  const getProjectStatusLabel = (status: string) => {
    const labels = {
      planning: "Planning",
      in_progress: "In progress",
      review: "Review",
      delivered: "Delivered",
    } as const;

    return labels[status as keyof typeof labels] ?? status.replace("_", " ");
  };

  const totalProjects = clientData.projects.length;
  const unpaidCount = clientData.projects.reduce((count, project) => {
    return (
      count +
      project.invoices.filter((invoice) => invoice.status !== "paid").length
    );
  }, 0);

  const nextDueInvoice = clientData.projects
    .flatMap((project) => project.invoices)
    .filter((invoice) => invoice.status !== "paid")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const primaryAction = unpaidCount > 0 ? "Review open invoices" : "Check latest deliverables";
  const primaryActionHref = unpaidCount > 0 ? "/portal/invoices" : "/portal/deliverables";
  const safeAzn = (amount: number | string) => formatAzn(amount).replace(/\$/g, "₼");

  if (!selectedProject) {
    return <div className="w-full max-w-7xl text-white">No project selected.</div>;
  }

  return (
    <div className="w-full max-w-7xl">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
          Workspace Overview
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back, {clientData.brandName}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
          This is your command center for deliverables, billing, and support. Start with the guided actions below.
        </p>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Recommended next step</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{primaryAction}</h2>
          <p className="mt-2 text-sm text-white/60">
            {unpaidCount > 0
              ? `You currently have ${unpaidCount} open invoice${unpaidCount > 1 ? "s" : ""}.`
              : "Your billing is clear. You can focus on reviewing recent project assets."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href={primaryActionHref}
              className="inline-flex h-10 items-center rounded-2xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Open now
            </Link>
            <Link
              href="/portal/contact"
              className="inline-flex h-10 items-center rounded-2xl border border-white/15 bg-black/30 px-4 text-sm font-medium text-white/85 transition hover:border-white/25 hover:text-white"
            >
              Open WhatsApp chat
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">How to use this portal</p>
          <ul className="mt-3 space-y-3 text-sm text-white/70">
            <li>• Review uploaded files in Deliverables.</li>
            <li>• Track payment status in Invoices.</li>
            <li>• Request help anytime in Contact.</li>
          </ul>
          <p className="mt-5 text-xs uppercase tracking-[0.12em] text-white/40">
            Next due: {nextDueInvoice ? nextDueInvoice.dueDate : "No pending invoices"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Active Projects
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{totalProjects}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Open Invoices
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{unpaidCount}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Selected Service
          </p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {selectedProject.service.toUpperCase()}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Delivery Date
          </p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {selectedProject.deliveryDate}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Current Project
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {selectedProject.name}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            {selectedProject.latestUpdate}
          </p>

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-sm text-white/55">
              <span>Progress</span>
              <span>{selectedProject.progress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/10">
              <div
                className="h-2.5 rounded-full bg-blue-300"
                style={{ width: `${selectedProject.progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <span>Status: {getProjectStatusLabel(selectedProject.status)}</span>
            <span>Started: {selectedProject.startDate}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
            Related Invoices · Home Snapshot
          </p>

          <div className="mt-4 space-y-4">
            {selectedProject.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-2xl border border-white/10 bg-black/30 p-4 transition-colors duration-300 hover:border-blue-200/20 hover:bg-blue-500/10"
              >
                <p className="text-sm text-white/40">{invoice.invoiceNumber}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-white">
                  {safeAzn(invoice.amount)}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm text-white/50">
                  <span>{invoice.status}</span>
                  <span>{invoice.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}