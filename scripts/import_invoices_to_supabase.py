import csv
import json
import os
import re
import ssl
from pathlib import Path
from urllib import error, parse, request

ROOT = Path(__file__).resolve().parents[1]


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def api(base: str, key: str, method: str, table: str, params=None, body=None, prefer=None):
    query = ""
    if params:
        query = "?" + "&".join(
            f"{parse.quote(str(k), safe='')}={parse.quote(str(v), safe='(),.*')}" for k, v in params.items()
        )
    url = f"{base}/{table}{query}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = request.Request(url, data=data, method=method, headers=headers)
    try:
        with request.urlopen(req, context=ssl._create_unverified_context()) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw else None)
    except error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = raw
        raise RuntimeError(f"{method} {table} failed {exc.code}: {parsed}")


def clean_phone(*values):
    for value in values:
        if not value:
            continue
        text = str(value).replace("\u202a", "").replace("\u202c", "").replace("\xa0", " ").strip().strip("'").strip('"')
        text = re.sub(r"\s+", " ", text)
        if text:
            return text
    return ""


def classify_service(text: str) -> str:
    lowered = (text or "").lower()
    if any(k in lowered for k in ["smm", "reklam", "social", "sosial"]):
        return "smm"
    if any(k in lowered for k in ["app", "mobil", "ios", "android"]):
        return "app"
    if any(k in lowered for k in ["crm", "api", "backend", "software", "sistem"]):
        return "software"
    if any(k in lowered for k in ["brand", "brend"]):
        return "branding"
    return "website"


def map_status(raw: str, total: float, balance: float) -> str:
    status = (raw or "").strip().lower()
    paid = max(total - balance, 0)
    if status == "closed":
        if balance <= 0.01:
            return "paid"
        return "partial" if paid > 0 else "unpaid"
    if status == "overdue":
        return "partial" if paid > 0 else "unpaid"
    if status == "void":
        return "unpaid"
    if paid >= total - 0.01:
        return "paid"
    if paid > 0:
        return "partial"
    return "unpaid"


def parse_float(raw: str, default=0.0) -> float:
    if raw is None:
        return default
    txt = str(raw).replace(",", "").strip()
    if not txt:
        return default
    try:
        return float(txt)
    except Exception:
        return default


def norm(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip()).lower()


def main():
    load_env_file(ROOT / ".env.local")

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not url or not key:
        raise SystemExit("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")

    base = f"{url}/rest/v1"
    exclude_customer_ids = {"6043772000000506001"}
    exclude_company_names = {"muwafaq events", "muwafaq"}
    csv_files = [
        ROOT / "public" / "Invoice-2.csv",
        ROOT / "public" / "Invoice-3.csv",
        ROOT / "public" / "Invoice-4.csv",
    ]

    invoices = {}
    customers = {}

    for file_path in csv_files:
        with file_path.open(newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                source_customer_id = (row.get("Customer ID") or "").strip()
                if source_customer_id in exclude_customer_ids:
                    continue
                invoice_id = (row.get("Invoice ID") or "").strip()
                invoice_number = (row.get("Invoice Number") or "").strip()
                if not invoice_id or not invoice_number:
                    continue

                customer_name = (row.get("Customer Name") or "").strip()
                company_name = (row.get("Company Name") or "").strip() or customer_name or "Unknown"
                if norm(company_name) in exclude_company_names:
                    continue
                phone = clean_phone(row.get("Primary Contact Mobile"), row.get("Billing Phone"), row.get("Shipping Phone Number"))

                customer_key = f"{norm(company_name)}|{source_customer_id or 'no-id'}"
                if customer_key not in customers:
                    customers[customer_key] = {
                        "company_name": company_name,
                        "customer_name": customer_name or company_name,
                        "phone": phone,
                    }
                elif phone and not customers[customer_key]["phone"]:
                    customers[customer_key]["phone"] = phone

                total = parse_float(row.get("Total"))
                balance = parse_float(row.get("Balance"))
                issue_date = (row.get("Issued Date") or row.get("Invoice Date") or "").strip()[:10] or None
                due_date = (row.get("Due Date") or "").strip()[:10] or issue_date
                item_name = (row.get("Item Name") or "").strip()
                quantity = parse_float(row.get("Quantity"), 1.0)
                item_price = parse_float(row.get("Item Price"))
                project_name = (row.get("Project Name") or "").strip() or company_name
                service = classify_service(f"{item_name} {project_name}")

                invoice = invoices.setdefault(
                    invoice_id,
                    {
                        "invoice_number": invoice_number,
                        "customer_key": customer_key,
                        "customer_name": customer_name or company_name,
                        "company_name": company_name,
                        "customer_phone": phone,
                        "issue_date": issue_date,
                        "due_date": due_date,
                        "status_raw": (row.get("Invoice Status") or "").strip(),
                        "total": total,
                        "balance": balance,
                        "project_name": project_name,
                        "service": service,
                        "items": [],
                    },
                )
                invoice["items"].append(
                    {
                        "id": str(len(invoice["items"]) + 1),
                        "description": item_name or "Service item",
                        "quantity": quantity if quantity > 0 else 1,
                        "rate": item_price,
                    }
                )

    _, existing_clients = api(base, key, "GET", "clients", params={"select": "id,brand_name,username,password,whatsapp_number"})
    by_brand = {norm(row.get("brand_name") or ""): row for row in (existing_clients or [])}

    customer_to_client_id = {}
    new_clients_payload = []
    for customer_key, seed in customers.items():
        existing = by_brand.get(norm(seed["company_name"]))
        if existing:
            customer_to_client_id[customer_key] = existing["id"]
            continue
        new_clients_payload.append(
            {
                "brand_name": seed["company_name"],
                "username": seed["customer_name"],
                "password": f"DISABLED::imported-{abs(hash(seed['company_name'])) % 1000000:06d}",
                "whatsapp_number": seed["phone"],
            }
        )

    if new_clients_payload:
        _, created_clients = api(base, key, "POST", "clients", body=new_clients_payload, prefer="return=representation")
        for row in created_clients or []:
            by_brand[norm(row.get("brand_name") or "")] = row

    for customer_key, seed in customers.items():
        client = by_brand.get(norm(seed["company_name"]))
        if not client:
            raise RuntimeError(f"Client not found/created for {seed['company_name']}")
        customer_to_client_id[customer_key] = client["id"]

    # Enforce non-portal state for imported non-Muwafaq clients.
    for customer_key, client_id in customer_to_client_id.items():
        company_name = customers[customer_key]["company_name"]
        if norm(company_name) in exclude_company_names:
            continue
        disabled_password = f"DISABLED::legacy-import-{abs(hash(company_name)) % 1000000:06d}"
        api(base, key, "PATCH", "clients", params={"id": f"eq.{client_id}"}, body={"password": disabled_password})

    client_ids = sorted(set(customer_to_client_id.values()))
    in_clause = "(" + ",".join(client_ids) + ")"
    _, existing_projects = api(base, key, "GET", "projects", params={"select": "id,client_id,name,service", "client_id": f"in.{in_clause}"})
    project_map = {
        (proj["client_id"], norm(proj.get("name") or ""), proj.get("service") or "website"): proj["id"]
        for proj in (existing_projects or [])
    }

    for invoice in invoices.values():
        client_id = customer_to_client_id[invoice["customer_key"]]
        project_key = (client_id, norm(invoice["project_name"]), invoice["service"])
        if project_key in project_map:
            invoice["project_id"] = project_map[project_key]
            continue
        payload = {
            "client_id": client_id,
            "name": invoice["project_name"][:120],
            "service": invoice["service"],
            "status": "delivered",
            "progress": 100,
            "start_date": invoice["issue_date"],
            "delivery_date": invoice["due_date"] or invoice["issue_date"],
            "latest_update": "Imported from legacy invoice CSV.",
        }
        _, created = api(base, key, "POST", "projects", body=payload, prefer="return=representation")
        invoice["project_id"] = created[0]["id"]
        project_map[project_key] = created[0]["id"]

    invoice_rows = []
    for invoice in invoices.values():
        total = invoice["total"]
        balance = invoice["balance"]
        metadata = {
            "projectLabel": invoice["project_name"],
            "companyName": invoice["company_name"],
            "serviceCategory": invoice["service"],
            "customerName": invoice["customer_name"],
            "customerPhone": invoice["customer_phone"],
            "customerAddress": invoice["company_name"],
            "items": invoice["items"],
        }
        if invoice["status_raw"].strip().lower() == "void":
            metadata["isVoided"] = True
        invoice_rows.append(
            {
                "project_id": invoice["project_id"],
                "invoice_number": invoice["invoice_number"],
                "amount": total,
                "status": map_status(invoice["status_raw"], total, balance),
                "paid_amount": max(total - balance, 0),
                "issue_date": invoice["issue_date"],
                "due_date": invoice["due_date"],
                "metadata": metadata,
            }
        )

    if invoice_rows:
        _, existing_invoice_rows = api(base, key, "GET", "invoices", params={"select": "invoice_number"})
        existing_numbers = {row.get("invoice_number") for row in (existing_invoice_rows or [])}
        rows_to_insert = [row for row in invoice_rows if row.get("invoice_number") not in existing_numbers]
        if rows_to_insert:
            api(base, key, "POST", "invoices", body=rows_to_insert, prefer="return=representation")

    print(f"Imported/updated clients (excluding Muwafaq): {len(customer_to_client_id)}")
    print(f"Imported invoices: {len(rows_to_insert) if invoice_rows else 0}")


if __name__ == "__main__":
    main()
