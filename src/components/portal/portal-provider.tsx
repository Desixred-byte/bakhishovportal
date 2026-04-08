"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Client, Project, Invoice, Deliverable } from "@/lib/types";
import { reportPortalSessionActivity } from "@/lib/portal-session";

type PortalContextValue = {
  client: Client | null;
  selectedProject: Project | null;
  selectedProjectId: string;
  setSelectedProjectId: (projectId: string) => void;
  loading: boolean;
};

const PortalContext = createContext<PortalContextValue | undefined>(undefined);

function getSelectedProjectStorageKey(clientId: string) {
  return `portal_selected_project_id_${clientId}`;
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClient() {
      const clientId = localStorage.getItem("client_id");
      if (!clientId) {
        setLoading(false);
        return;
      }

      // Load client
      const { data: clientRow, error: clientErr } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (clientErr) {
        // Keep existing local session on transient errors (network/deploy refresh).
        setLoading(false);
        return;
      }

      if (!clientRow) {
        localStorage.removeItem("client_id");
        setLoading(false);
        return;
      }

      const savedPassword = typeof clientRow?.password === "string" ? clientRow.password : "";
      const portalIsDisabled = savedPassword.length === 0 || savedPassword.startsWith("DISABLED::") || ("portal_enabled" in clientRow && clientRow.portal_enabled === false);

      if (portalIsDisabled) {
        localStorage.removeItem("client_id");
        setLoading(false);
        return;
      }

      // Load projects
      const { data: projectRows } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientId);

      const projects: Project[] = await Promise.all(
        (projectRows ?? []).map(async (p) => {
          const { data: invoiceRows } = await supabase
            .from("invoices")
            .select("*")
            .eq("project_id", p.id);

          const { data: deliverableRows } = await supabase
            .from("deliverables")
            .select("*")
            .eq("project_id", p.id);

          return {
            id: p.id,
            name: p.name,
            service: p.service,
            status: p.status,
            progress: p.progress,
            startDate: p.start_date,
            deliveryDate: p.delivery_date,
            latestUpdate: p.latest_update,
            invoices: (invoiceRows ?? []).map((i): Invoice => ({
              id: i.id,
              invoiceNumber: i.invoice_number,
              amount: i.amount,
              status: i.status,
              paidAmount: i.paid_amount ?? (i.status === "paid" ? i.amount : 0),
              issueDate: i.issue_date,
              dueDate: i.due_date,
              metadata: i.metadata ?? null,
            })),
            deliverables: (deliverableRows ?? []).map((d): Deliverable => ({
              id: d.id,
              title: d.title,
              category: d.category,
              url: d.url,
              createdAt: d.created_at,
            })),
          };
        })
      );

      const builtClient: Client = {
        id: clientRow.id,
        brandName: clientRow.brand_name,
        username: clientRow.username,
        password: clientRow.password,
        whatsappNumber: clientRow.whatsapp_number,
        projects,
      };

      const persistedProjectId = localStorage.getItem(getSelectedProjectStorageKey(clientId)) ?? "";
      const nextProjectId = projects.some((project) => project.id === persistedProjectId)
        ? persistedProjectId
        : projects[0]?.id ?? "";

      setClient(builtClient);
      setSelectedProjectId(nextProjectId);
      if (nextProjectId) {
        localStorage.setItem(getSelectedProjectStorageKey(clientId), nextProjectId);
      }
      setLoading(false);
    }

    loadClient();

    const intervalId = window.setInterval(() => {
      loadClient();
    }, 15000);

    const handleFocus = () => {
      loadClient();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const selectedProject = useMemo(
    () => client?.projects.find((p) => p.id === selectedProjectId) ?? null,
    [client, selectedProjectId]
  );

  useEffect(() => {
    const clientId = client?.id;
    if (!clientId || !selectedProjectId) return;
    localStorage.setItem(getSelectedProjectStorageKey(clientId), selectedProjectId);
  }, [client?.id, selectedProjectId]);

  useEffect(() => {
    if (!client?.id) return;

    const sendHeartbeat = () => {
      void reportPortalSessionActivity({
        clientId: client.id,
        customerName: client.username,
        companyName: client.brandName,
      });
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, 45000);
    return () => window.clearInterval(intervalId);
  }, [client?.id, client?.username, client?.brandName]);

  const value = useMemo(
    () => ({ client, selectedProject, selectedProjectId, setSelectedProjectId, loading }),
    [client, selectedProject, selectedProjectId, loading]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error("usePortal must be used within PortalProvider");
  return context;
}