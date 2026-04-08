export type ServiceType = "website" | "smm" | "software" | "app" | "branding";

export type ProjectStatus = "planning" | "in_progress" | "review" | "delivered";

export type Deliverable = {
  id: string;
  title: string;
  category: string;
  url: string;
  createdAt: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: "paid" | "unpaid" | "partial";
  paidAmount?: number;
  issueDate: string;
  dueDate: string;
  metadata?: {
    customerName?: string;
    customerEmail?: string;
    customerAddress?: string;
    discountType?: "percent" | "fixed";
    discountValue?: number;
    projectLabel?: string;
    companyName?: string;
    serviceCategory?: string;
    items?: Array<{ id: string; description: string; quantity: number; rate: number }>;
  } | null;
};

export type Project = {
  id: string;
  name: string;
  service: ServiceType;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  deliveryDate: string;
  latestUpdate: string;
  deliverables: Deliverable[];
  invoices: Invoice[];
};

export type Client = {
  id: string;
  brandName: string;
  username: string;
  password: string;
  whatsappNumber: string;
  projects: Project[];
};