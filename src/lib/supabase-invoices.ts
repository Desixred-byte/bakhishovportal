import { supabase } from "./supabase";

/**
 * Fetch invoices from Supabase with customer details
 * 
 * Example usage:
 * const invoices = await fetchInvoicesWithCustomers('proj_123');
 */
export async function fetchInvoicesWithCustomers(projectId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select(
      `
      id,
      invoice_number,
      amount,
      status,
      paid_amount,
      issue_date,
      due_date,
      metadata,
      project:projects(id, name, service, delivery_date),
      client:projects(client_id)
    `
    )
    .eq("project_id", projectId)
    .order("issue_date", { ascending: false });

  if (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }

  return data;
}

/**
 * Fetch client details by ID (includes phone number from whatsapp_number field)
 * 
 * Example usage:
 * const client = await fetchClientDetails('client_123');
 */
export async function fetchClientDetails(clientId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      id,
      brand_name,
      username,
      whatsapp_number
    `
    )
    .eq("id", clientId)
    .single();

  if (error) {
    console.error("Error fetching client:", error);
    return null;
  }

  return {
    customerName: data?.username || "",
    companyName: data?.brand_name || "",
    customerPhone: data?.whatsapp_number || "",
  };
}

/**
 * Update invoice metadata with customer details
 * 
 * Example usage:
 * await updateInvoiceCustomerInfo('invoice_123', {
 *   customerName: 'Ilgar Hasanli',
 *   customerPhone: '+994701234567',
 *   companyName: 'Muwafaq Events'
 * });
 */
export async function updateInvoiceCustomerInfo(
  invoiceId: string,
  customerInfo: {
    customerName?: string;
    customerPhone?: string;
    companyName?: string;
    customerAddress?: string;
  }
) {
  const { data, error } = await supabase
    .from("invoices")
    .update({
      metadata: customerInfo,
    })
    .eq("id", invoiceId)
    .select();

  if (error) {
    console.error("Error updating invoice:", error);
    return null;
  }

  return data;
}

/**
 * SQL schema for invoices table (reference)
 * 
 * create table invoices (
 *   id uuid primary key default uuid_generate_v4(),
 *   invoice_number text unique not null,
 *   project_id uuid not null references projects(id),
 *   amount decimal(10, 2) not null,
 *   status text check (status in ('paid', 'unpaid', 'partial')) default 'unpaid',
 *   paid_amount decimal(10, 2),
 *   issue_date date not null,
 *   due_date date not null,
 *   metadata jsonb,
 *   created_at timestamp default now(),
 *   updated_at timestamp default now()
 * );
 * 
 * The metadata field should contain:
 * {
 *   "customerName": "string",
 *   "customerPhone": "string",
 *   "companyName": "string",
 *   "customerAddress": "string",
 *   "discountType": "percent" | "fixed",
 *   "discountValue": number,
 *   "projectLabel": "string",
 *   "serviceCategory": "string",
 *   "items": [...],
 *   ...
 * }
 */
