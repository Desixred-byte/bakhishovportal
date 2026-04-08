import { Client } from "@/lib/types";

export const clientData: Client = {
  id: "client_1",
  brandName: "Bakhishov Client",
  username: "clientelite",
  password: "123456",
  whatsappNumber: "994501234567",
  projects: [
    {
      id: "proj_website",
      name: "Corporate Website",
      service: "website",
      status: "in_progress",
      progress: 72,
      startDate: "2026-04-01",
      deliveryDate: "2026-05-10",
      latestUpdate: "Homepage and service pages are in development.",
      deliverables: [],
      invoices: [
        {
          id: "i1",
          invoiceNumber: "INV-001",
          amount: 1200,
          status: "partial",
          issueDate: "2026-04-01",
          dueDate: "2026-04-10",
        },
      ],
    },
    {
      id: "proj_smm",
      name: "SMM Growth Package",
      service: "smm",
      status: "in_progress",
      progress: 45,
      startDate: "2026-04-01",
      deliveryDate: "2026-04-30",
      latestUpdate: "Week 2 content batch prepared.",
      deliverables: [],
      invoices: [
        {
          id: "i2",
          invoiceNumber: "INV-002",
          amount: 800,
          status: "unpaid",
          issueDate: "2026-04-01",
          dueDate: "2026-04-07",
        },
      ],
    },
    {
      id: "proj_app",
      name: "Client Mobile App",
      service: "app",
      status: "planning",
      progress: 20,
      startDate: "2026-04-03",
      deliveryDate: "2026-06-15",
      latestUpdate: "Product structure and app flows are being defined.",
      deliverables: [],
      invoices: [
        {
          id: "i3",
          invoiceNumber: "INV-003",
          amount: 2500,
          status: "paid",
          issueDate: "2026-04-03",
          dueDate: "2026-04-10",
        },
      ],
    },
  ],
};