# Comprehensive Project Analysis: Bakhishov Portal

## 1. PROJECT OVERVIEW

**Type:** Full-stack SaaS platform with Admin Dashboard + Client Portal  
**Tech Stack:**
- Frontend: Next.js 14+ with React (TypeScript)
- UI Framework: Tailwind CSS + Framer Motion animations
- Database: Supabase (PostgreSQL)
- PDF Generation: jsPDF + autoTable
- Icons: Phosphor Icons
- State Management: React hooks (useState, useRef, useMemo, useEffect)

**Architecture:** Client-side rendered (marked with "use client") with multi-role authentication

---

## 2. DATABASE SCHEMA

### Core Tables

#### **clients** table
```
- id: UUID (primary key)
- brand_name: string
- username: string (portal login)
- password: string (portal login)
- whatsapp_number: string
- portal_enabled: boolean (optional)
- notes: string (optional)
- source: string (optional)
- preferred_language: "en" | "ru" | "az" (optional)
- preferred_currency: string (optional)
```
**Purpose:** Stores all client/company information  
**Data Storage:** Supabase PostgreSQL table

#### **projects** table
```
- id: UUID (primary key)
- client_id: UUID (foreign key → clients)
- name: string (project title/name)
- service: "website" | "app" | "software" | "smm" | "branding"
- status: "planning" | "in_progress" | "review" | "delivered"
- progress: integer (0-100 percentage)
- start_date: date (nullable)
- delivery_date: date (nullable)
- latest_update: string (nullable, can contain SMM structured data)
- created_at: timestamp
- updated_at: timestamp
```
**Purpose:** Tracks projects for each client  
**Data Storage:** Supabase PostgreSQL table

#### **invoices** table
```
- id: UUID (primary key)
- project_id: UUID (foreign key → projects)
- invoice_number: string (e.g., "BBK-000045")
- amount: decimal
- status: "paid" | "unpaid" | "partial"
- paid_amount: decimal (nullable)
- issue_date: date
- due_date: date
- metadata: JSONB
  {
    companyName: string
    serviceCategory: "website" | "app" | "software" | "smm" | "branding" | "misc"
    projectLabel: string (client-visible project title)
    domain: string (optional)
    note: string (optional)
    customerName: string
    customerEmail: string
    customerAddress: string
    discountType: "percent" | "fixed"
    discountValue: number
    taxType: "percent" | "fixed" | "none"
    taxValue: number
    items: InvoiceLineDraft[]
      {
        id: UUID
        description: string
        quantity: number
        rate: decimal
      }
  }
- created_at: timestamp
- updated_at: timestamp
```
**Purpose:** All billing records with flexible metadata  
**Data Storage:** Supabase PostgreSQL (metadata stored as JSONB for flexibility)

#### **deliverables** table
```
- id: UUID (primary key)
- project_id: UUID (foreign key → projects)
- title: string
- category: string
- created_at: timestamp
- url: string (nullable)
```
**Purpose:** Tracks deliverables for projects  
**Data Storage:** Supabase PostgreSQL table

#### **portal_sessions** table
```
- id: UUID (primary key)
- client_id: UUID (foreign key → clients)
- customer_name: string
- company_name: string
- device_label: string
- location_label: string
- user_agent: string
- last_seen_at: timestamp
- created_at: timestamp
```
**Purpose:** Security tracking - records client portal login sessions  
**Data Storage:** Supabase PostgreSQL table

#### **materials** bucket (Supabase Storage)
```
Type: File storage bucket
Structure: {client_id}/{project_id}/files
Usage: Stores client project materials and files
```

---

## 3. ADMIN DASHBOARD ARCHITECTURE

### File Location
`/src/app/owner/page.tsx` (7315 lines)

### Authentication
- **Entry Point:** `/owner/login` page
- **Session Storage:** `localStorage.getItem("owner_session")`
- **Session Keys:**
  - `owner_session`: "active" flag
  - `owner_selected_client_id`: last selected client
  - `owner_selected_project_id`: last selected project
  - `owner_invoice_labels_v1`: saved invoice line item templates
  - `owner_invoice_meta_{projectId}`: invoice metadata cache

### Main Tabs (OwnerTab type)
```typescript
"overview" | "status" | "invoices" | "materials" | "smm" | "profiles" | "labels" | "security" | "setup"
```

---

## 4. ADMIN DASHBOARD: TAB-BY-TAB ANALYSIS

### **4.1 OVERVIEW TAB**
**Purpose:** High-level metrics and client selection

**Components:**
- Client selector (SearchablePicker)
- Project selector (dropdown)
- General view toggle button
- Display modes: Scoped (single client) vs General (all data)

**Functions:**
- `toggleGeneralMode()` - Switch between general and scoped views
- `enterGeneralMode()` - Reset selections to show all clients
- Client/project selection auto-saves to localStorage

**Data Displayed:**
- Selected client branding
- Active project count
- Invoice metrics

---

### **4.2 STATUS TAB**
**Purpose:** Track project progress and delivery timeline

**State Variables:**
```typescript
const [projects, setProjects] = useState<ProjectOption[]>([])
const [selectedProjectId, setSelectedProjectId] = useState<string>("")
const [projectDraft, setProjectDraft] = useState<ProjectDraft>({
  name: string
  service: ServiceType
  status: ProjectStatus
  progress: number (0-100)
  startDate: string (YYYY-MM-DD)
  deliveryDate: string (YYYY-MM-DD)
  latestUpdate: string
})
```

**Features:**
- Real-time project progress display (percentage bar)
- Status badges (PLANNING, IN_PROGRESS, REVIEW, DELIVERED)
- Date tracking (start, delivery, last update)
- Latest update notes display

**Buttons & Actions:**
- **Edit Project** (blue button) → Opens Edit Project Modal
  - Modal Fields:
    - Project name (text input)
    - Service type (dropdown: website/app/software/smm/branding)
    - Status (dropdown: planning/in_progress/review/delivered)
    - Progress % (0-100 number input)
    - Start date (date picker)
    - Delivery date (date picker)
    - Latest update notes (textarea)
  - **Save Changes** button → calls `handleUpdateProject()`
  - **Cancel** button → closes modal

- **Delete Project** (red button) → Confirmation dialog
  - Confirmation text: "Delete project '{name}'? Invoices will be preserved."
  - **Confirm** → calls `handleDeleteProject()`
  - Invoices linked to deleted projects are NOT deleted (safe delete)

**Key Function: `handleUpdateProject()`**
```typescript
async function handleUpdateProject() {
  // 1. Validates selectedProjectId exists
  // 2. Updates projects table in Supabase with new data
  // 3. Calls loadLists() to refresh projects state
  // 4. Re-fetches and re-enriches invoices with updated project data
  // 5. Displays "Project updated" notice
  // 6. Closes edit modal
}
```

**Data Flow:**
```
User edits project → Modal captures changes → handleUpdateProject()
→ Supabase update → loadLists() refreshes projects
→ Invoices re-enriched with new project name → UI updates
```

---

### **4.3 INVOICES TAB**
**Purpose:** Complete invoice management system

**State Variables:**
```typescript
const [projectInvoices, setProjectInvoices] = useState<InvoiceRow[]>([])
const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft>({...})
const [isInvoiceEditable, setIsInvoiceEditable] = useState(false)
const [invoiceMetaMap, setInvoiceMetaMap] = useState<Record<string, InvoiceMeta>>({})
const [invoiceLabels, setInvoiceLabels] = useState<InvoiceLabel[]>([])
```

**Invoice Display Modes:**
1. **List View** (default)
   - Shows all invoices for selected project
   - Sortable columns: Invoice #, Date, Amount, Status, Paid Amount
   - Color-coded status badges (Green=Paid, Red=Unpaid, Yellow=Partial)

2. **Details Panel** (right sidebar)
   - Opens when invoice selected
   - Displays full invoice metadata
   - Shows line items with descriptions, quantities, rates
   - Displays calculations: Subtotal, Discount, Tax, Total, Paid, Balance

**Filter Buttons & Search:**

1. **Status Filter** (Dropdown)
   - All statuses
   - Paid (status = "paid")
   - Partial (status = "partial")
   - Unpaid (status = "unpaid")

2. **Service Filter** (Dropdown)
   - All services
   - WEBSITE (service = "website")
   - APP (service = "app")
   - SOFTWARE (service = "software")
   - SMM (service = "smm")
   - BRANDING (service = "branding")
   - MISC (serviceCategory in metadata = "misc")

3. **Search Bar**
   - Full-text search across:
     - Invoice number
     - Project name
     - Company name
     - Customer name
     - Service type

4. **Rows/Grid Toggle**
   - "Rows" button → Switches between table rows and compact cards

**Invoice Actions (Dropdown Menu):**

1. **Edit Invoice** → Sets `isInvoiceEditable = true`
   - Allows editing metadata fields
   - Edit linked project (SearchablePicker)
   - Edit line items (add/remove/modify)
   - Edit customer details, addresses, notes
   - Discount/tax configuration

2. **Record Payment** → Opens payment form modal
   - Customer name, payment number
   - Amount received, bank charges
   - Tax deducted option
   - Payment date, mode (Cash/Bank/Card/Online)
   - Updates invoice.paid_amount and status

3. **Download PDF** → Generates professional PDF
   - Invoice header with company logo
   - Client details, invoice dates
   - Formatted line items table
   - Totals, payment status
   - Digital signature

4. **Void Invoice** → Marks invoice as voided
   - Updates metadata.isVoided = true
   - Removes from active invoice list
   - Preserves data (soft delete)

5. **Mark as MISC** → Tags invoice as miscellaneous
   - Updates metadata.serviceCategory = "misc"
   - Allows filtering non-project invoices
   - Updates localStorage cache

6. **Delete Invoice** → Permanent deletion with confirmation

**Buttons in Invoice List:**

- **+ New Invoice** → Opens create invoice form
  - Modal for new invoice entry
  - Links to project
  - Sets default company/customer from project metadata

- **Search Bar** → Real-time filtering across multiple fields

**Key Functions:**

```typescript
async function handleCreateInvoice() {
  // Validates required fields
  // Inserts new invoice row in Supabase
  // Builds metadata payload with line items, tax, discount
  // Updates invoiceMetaMap in localStorage
  // Calls loadProjectResources() to refresh list
  // Displays success notice
}

async function handleUpdateInvoice() {
  // Updates invoice fields: amount, status, dates
  // Updates metadata JSONB with new line items, tax, discount
  // Re-saves metadata to localStorage
  // Refreshes invoice display
}

async function handleRecordPayment() {
  // Updates invoice.paid_amount
  // Calculates new status based on amount vs total
  // Records payment details in metadata
  // Triggers status change notifications
}

async function handleVoidInvoice() {
  // Marks invoice as voided (soft delete)
  // Updates metadata.isVoided = true
  // Hides from active list but preserves data
}

async function handleDownloadInvoicePdf() {
  // Generates PDF using jsPDF + autoTable
  // Includes company logo, signature
  // Formats all invoice details professionally
  // Browser downloads generated file
}
```

**Data Storage for Invoices:**
- **Persistent:** Supabase invoices table
- **Cached:** localStorage invoiceMetaMap (for quick access to metadata)
- **Cache Key:** `owner_invoice_meta_{projectId}`

---

### **4.4 MATERIALS TAB**
**Purpose:** File management and deliverables tracking

**State Variables:**
```typescript
const [projectDeliverables, setProjectDeliverables] = useState<DeliverableRow[]>([])
const [materialsLoading, setMaterialsLoading] = useState(false)
const [materialsError, setMaterialsError] = useState<string | null>(null)
```

**Features:**

1. **Deliverables List**
   - Shows all deliverables for selected project
   - Category grouping (Website, App, Design, Documentation, etc.)
   - Created date, linked URLs
   - Delete button for each deliverable

2. **Materials Bucket Browser**
   - File manager for Supabase Storage
   - Browse by project → by category
   - Upload new files
   - Download/preview files
   - Delete files

3. **Diagnostics Button**
   - Scans materials bucket for consistency
   - Reports missing deliverable records
   - Offers auto-creation of records for found files

**Key Functions:**

```typescript
async function handleCreateDeliverable() {
  // Creates new deliverable record
  // Links to selected project
  // Sets category and title
  // Optional URL field for external links
  // Updates projectDeliverables state
}

async function handleDeleteDeliverable(id: string) {
  // Soft delete (marks as inactive)
  // Preserves metadata
  // Removes from active list
}

async function handleRunMaterialsDiagnostics() {
  // Lists all files in materials bucket for project
  // Compares against deliverables table
  // Reports orphaned files
  // Offers batch creation for missing records
}

async function resolveMaterialsBucket() {
  // Connects to Supabase Storage
  // Lists files by project structure
  // Returns folder hierarchy
}
```

---

### **4.5 SMM TAB**
**Purpose:** Social Media Management project-specific content management

**State Variables:**
```typescript
const [smmHeroTitle, setSmmHeroTitle] = useState("")
const [smmHeroSubtitle, setSmmHeroSubtitle] = useState("")
const [smmSummaryTitle, setSmmSummaryTitle] = useState("")
const [smmSummaryText, setSmmSummaryText] = useState("")
const [smmCalendarTitle, setSmmCalendarTitle] = useState("")
const [smmCalendarText, setSmmCalendarText] = useState("")
const [smmPostsTitle, setSmmPostsTitle] = useState("")
const [smmPostsText, setSmmPostsText] = useState("")
const [smmReportingTitle, setSmmReportingTitle] = useState("")
const [smmReportingText, setSmmReportingText] = useState("")
const [smmHeroImageUrl, setSmmHeroImageUrl] = useState("")
const [smmCadence, setSmmCadence] = useState("")
const [smmNextPostTime, setSmmNextPostTime] = useState("")
const [smmFocus, setSmmFocus] = useState("")
const [smmManagerNote, setSmmManagerNote] = useState("")
const [smmPostsPerWeek, setSmmPostsPerWeek] = useState(3)
const [smmSchedule, setSmmSchedule] = useState<SmmScheduleItem[]>([])
```

**Features (Only visible if selected project.service === "smm"):**

1. **Hero Section Configuration**
   - Title field
   - Subtitle field
   - Hero image URL field

2. **Summary Section Configuration**
   - Title field
   - Text content

3. **Calendar Section Configuration**
   - Title field
   - Calendar description text

4. **Posts Section Configuration**
   - Title field
   - Posts description text

5. **Reporting Section Configuration**
   - Title field
   - Reporting description text

6. **SMM Schedule Calendar**
   - Grid showing posts schedule
   - Days of week, time slots
   - Post status: Planned, Scheduled, Review, Done
   - Content preview, media URLs
   - Edit individual posts

7. **Configuration Fields**
   - Cadence (posting frequency)
   - Next post time
   - Focus areas
   - Manager notes
   - Posts per week counter

**Data Storage:**
- Stored as serialized JSON in `projects.latest_update` column
- Format: SmmAdminPayload object
- Parsed on load, serialized on save
- Structured data for calendar and post tracking

**Key Functions:**

```typescript
async function handleSaveSmmUpdate() {
  // Serializes all SMM fields into SmmAdminPayload
  // Stores as JSON string in projects.latest_update
  // Updates projects table in Supabase
  // Displays save success notice
}

function parseSmmAdminPayload(payload: string): SmmAdminPayload | null {
  // Parses JSON from projects.latest_update
  // Hydrates all SMM state variables
  // Returns structured object or null if invalid
}

function formatSmmReadableUpdate(payload: SmmAdminPayload): string {
  // Converts SMM payload to human-readable text
  // For display in project latest_update field
}
```

---

### **4.6 PROFILES TAB**
**Purpose:** Client profile management and project association

**State Variables:**
```typescript
const [clients, setClients] = useState<ClientOption[]>([])
const [isClientProfileOpen, setIsClientProfileOpen] = useState(false)
const [profileClientId, setProfileClientId] = useState("")
const [clientProfileDraft, setClientProfileDraft] = useState<ClientOption>({...})
const [isClientProjectsModalOpen, setIsClientProjectsModalOpen] = useState(false)
const [profileProjects, setProfileProjects] = useState<ProjectOption[]>([])
const [newProjectForm, setNewProjectForm] = useState<ProjectDraft>({...})
const [isEditingProject, setIsEditingProject] = useState(false)
```

**Features:**

#### **4.6.1 Client Profile Panel**

**Opening Profile:**
- Click on client row → calls `openClientProfile(client)`
- Right-side panel slides in with full profile details
- Prefills `clientProfileDraft` with current client data

**Profile Fields (Editable):**
1. **Basic Information**
   - Company name (text input)
   - Representative name (text input)
   - WhatsApp number (phone input)
   - Notes (textarea, optional)
   - Source (text, optional)
   - Preferred language (dropdown: en/ru/az)
   - Preferred currency (text)

2. **Portal Access Section**
   - Status display ("Enabled and ready for login" or "Disabled")
   - **Toggle Portal Access** button
     - Enables/disables client portal login
     - Updates clients.portal_enabled flag
   - Portal username (text, read-only)
   - **Generate** button → creates random username
   - Portal password (text, read-only, obscured)
   - **Generate** button → creates strong random password

3. **Projects & Details Section**
   - Shows count of associated projects
   - **Manage Projects & Details** button → Opens projects modal

**Profile Actions:**
- **Save Profile** button → calls `handleSaveClientProfile()`
  - Updates all edited fields in Supabase
  - Shows success/error notice
  - Closes panel

- **Delete** button (red, on profile header)
  - Confirmation dialog: "Delete client '{name}'?"
  - Calls `handleDeleteClientProfile()`
  - Soft delete (data preserved in archive)
  - Refreshes client list

- **Cancel** button → Discards changes, closes panel

#### **4.6.2 Manage Projects Modal**

**Opens when:** User clicks "Manage Projects & Details" button

**Modal Structure:**
1. **Header**
   - Title: "MANAGE PROJECTS"
   - Subtitle: Client name with project count

2. **Existing Projects Section**
   - List of all projects for this client
   - Each project card shows:
     - Project name
     - Service badge (WEBSITE/APP/SOFTWARE/SMM/BRANDING)
     - Status badge (color-coded)
     - Progress bar (if > 0%)
     - Start date (if set)
     - Delivery date (if set)
     - Last update date
     - **Edit** button (blue) → Opens Edit Project Modal
     - **Delete** button (red) → Confirmation dialog

3. **Add New Project Section**
   - Project name (text input)
   - Service type (dropdown)
   - Status (dropdown)
   - Form submission: **+ Add project** button
   - Calls `handleCreateProject()`

**What is a Project Title?**
- **Project.name** in database (displayed in projects list)
- What admin sets in "Manage Projects" modal
- Used in Status tab for progress tracking
- **NOT the same as** invoice metadata.projectLabel (client-visible invoice label)

#### **4.6.3 Edit Project Modal**

**Opens when:** User clicks blue "Edit" button on project card

**Modal Fields:**
- Project name (text)
- Service type (dropdown)
- Status (dropdown)
- Progress % (0-100 number)
- Start date (date picker)
- Delivery date (date picker)
- Latest update/notes (textarea)

**Modal Buttons:**
- **Cancel** → Closes modal without saving
- **Save Changes** → Calls `handleUpdateProject()`
  - Updates Supabase projects table
  - Refreshes projects list
  - Re-enriches invoices with new project name
  - Auto-closes modal
  - Displays success notice

**Project Data Flow:**
```
Edit modal → projectDraft state → handleUpdateProject()
→ Supabase projects table update
→ loadLists() refreshes projects state
→ Re-fetch invoices with updated project names
→ Display updates everywhere (Status tab, invoices)
```

**Key Functions:**

```typescript
function openClientProfile(client: ClientOption) {
  // Sets profileClientId
  // Prefills clientProfileDraft with client data
  // Opens profile panel
  // Loads client's projects into profileProjects
}

async function handleSaveClientProfile() {
  // Validates required fields
  // Updates clients table in Supabase
  // Calls loadLists() to refresh
  // Closes profile panel
}

async function handleCreateProject() {
  // Validates project name
  // Inserts into projects table
  // Links to profileClientId
  // Calls loadLists() to refresh
  // Closes modal
}

async function handleUpdateProject() {
  // Updates projects table with edited data
  // Calls loadLists() to refresh projects
  // Re-fetches and re-enriches invoices
  // Updates all connected displays
  // Closes edit modal
}

async function handleDeleteProjectProfile(projectId: string) {
  // Safe delete - only deletes project row
  // Preserves all invoices linked to project
  // Calls loadLists() to refresh
  // Shows success notice
}
```

---

### **4.7 SECURITY TAB**
**Purpose:** Monitor client portal login sessions

**State Variables:**
```typescript
const [securitySessions, setSecuritySessions] = useState<SessionRow[]>([])
const [securityLoading, setSecurityLoading] = useState(false)
```

**Display:**
- Table of portal_sessions records
- Columns: Device, Location, Last seen, Created date, User agent
- Sorted by last_seen_at (newest first)
- Limited to 200 most recent sessions

**Features:**
- View device information
- Track login locations
- Monitor session activity
- Identify suspicious access

**Data Source:**
- Reads from `portal_sessions` table
- Populated when clients log into `/portal` pages
- Tracks all portal access

---

### **4.8 LABELS TAB**
**Purpose:** Create and manage reusable invoice line items

**State Variables:**
```typescript
const [invoiceLabels, setInvoiceLabels] = useState<InvoiceLabel[]>([])
const [lastAddedLabelId, setLastAddedLabelId] = useState<string | null>(null)
```

**Features:**

1. **Add Invoice Label Section**
   - Title input (description of service/product)
   - Rate input (price in AZN)
   - **Add** button → Calls `handleCreateInvoiceLabel()`
   - Creates new label with auto-generated UUID

2. **Saved Labels List**
   - Shows all created labels
   - Each label displays: Title, Rate
   - **Delete** button (trash icon)
   - Calls `handleDeleteInvoiceLabel()`

3. **Label Usage in Invoices**
   - In invoice editor, dropdown to select saved labels
   - **Add existing** button populates line item
   - Saves time on recurring invoice items

**Data Storage:**
- Stored in `localStorage`
- Key: `owner_invoice_labels_v1`
- Format: `InvoiceLabel[]` (array of objects with id, title, rate)
- Persists across sessions

**Key Functions:**

```typescript
function handleCreateInvoiceLabel() {
  // Generates UUID for new label
  // Adds to invoiceLabels state
  // Saves to localStorage
  // Auto-clears input fields
}

function handleDeleteInvoiceLabel(id: string) {
  // Removes label from invoiceLabels array
  // Updates localStorage
  // UI refreshes immediately
}
```

---

### **4.9 SETUP TAB**
**Purpose:** System configuration and documentation

**Displays:**
- API endpoint information
- Supabase connection status
- Environment variable requirements
- Integration setup instructions

---

## 5. CLIENT PORTAL ARCHITECTURE

### File Location
`/src/app/portal/invoices/page.tsx` (1718 lines)

### Authentication
- **Entry Point:** `/portal` requires portal login via `/owner/login` with portal credentials
- **Session Storage:** Uses Supabase auth session
- **Portal Access Control:** Requires `clients.portal_enabled = true`

### Main Features

#### **5.1 Invoice List View**

**Display Elements:**
1. **Header Metrics**
   - Total visible invoices count
   - Open balance (sum of all unpaid/partial)
   - Paid total (sum of all paid invoices)
   - Overdue invoices count (due_date < today)

2. **Filters (Horizontal Bar)**
   - **Status Filter** (button group)
     - All statuses, Paid, Partial, Unpaid
   - **Service Filter** (button group)
     - All services, Website, App, Software, SMM, Branding, MISC
   - **Date Range Filter**
     - "Issue date range" modal
     - From date (date picker), To date (date picker)
     - Clear dates button
   - **Search Bar**
     - Placeholder: "Search invoice, project or service"
     - Real-time filtering

3. **View Toggle**
   - "Rows" button → switches between table and card layout

4. **Action Buttons**
   - **Export PDF** → Generates Excel/PDF with filtered results
   - **Reset** → Clears all filters

**Invoice List Columns (Table View):**
- Invoice Number (clickable → opens details)
- Date (issue_date)
- Service (from metadata.serviceCategory)
- Project (from metadata.projectLabel)
- Amount (total in AZN)
- Status (badge: Paid/Partial/Unpaid)

**Invoice Cards (Card View):**
- Compact display with key info
- Tap to open details

#### **5.2 Invoice Details Panel**

**Opens when:** Client clicks on invoice in list

**Sections:**

1. **Invoice Header**
   - Status badge (Paid/Partial/Unpaid)
   - Due date
   - Back button to close panel

2. **Invoice Metadata**
   - Invoice number (readonly)
   - Issue date
   - Due date
   - Client information:
     - Company: (from metadata.companyName)
     - Representative: (from metadata.customerName)
     - WhatsApp: (from client.whatsapp_number)

3. **Client-Visible Invoice Labels**
   - Project title: (from metadata.projectLabel)
   - Service type: (from metadata.serviceCategory)

4. **Line Items Table**
   - Columns: Description, Qty, Rate, Amount
   - Shows all items from metadata.items[]
   - Properly formatted with currency

5. **Invoice Summary**
   - Subtotal: (sum of items)
   - Discount: (if applied, - amount)
   - Tax: (if applied, + amount)
   - **Invoice total:** (final amount)
   - **Paid amount:** (amount paid so far)
   - **Balance due:** (remaining)

6. **Timeline**
   - Delivery date (from project.delivery_date)
   - Project timeline visualization

7. **Actions**
   - **Download PDF** button → Generates professional PDF
   - **Back** button → Returns to list

**PDF Generation:**
- Uses jsPDF + autoTable
- Professional layout with:
  - Company logo (from public/company-logo.png)
  - Digital signature (from public/signature.png)
  - Formatted dates and amounts
  - Table with line items
  - Payment summary
  - Footer with company info

#### **5.3 Client Portal Features**

**Navigation:**
- Portal language selector (EN/RU/AZ)
- Project switcher (if client has multiple projects)
- Sidebar with navigation

**Additional Pages:**
- Contact page (contact form submission)
- Deliverables page (download project materials)
- Settings page (language/currency preferences)

---

## 6. KEY FUNCTIONS REFERENCE

### Admin Functions

#### **Data Loading**

```typescript
async function loadLists(
  preferredClientId?: string,
  preferredProjectId?: string
) {
  // Core data loading function
  // 1. Fetches all clients from Supabase
  // 2. Fetches all projects, links to clients
  // 3. Handles schema compatibility (checks for optional columns)
  // 4. Special normalization for Javar client (merges duplicates)
  // 5. Normalizes Javar projects (ensures website + app projects exist)
  // 6. Tags Javar invoice BBK-000045 correctly
  // 7. Updates clients, projects states
  // 8. Sets preferred client/project if provided
  // 9. Calls loadSecuritySessions()
  // Returns: void (state updates trigger re-renders)
}

async function loadProjectResources(projectId: string) {
  // Loads all resources for a specific project
  // 1. Filters invoices by project_id
  // 2. Enriches invoices with project_name, project_service
  // 3. Filters deliverables by project_id
  // 4. Updates projectInvoices, projectDeliverables states
  // Returns: void (state updates trigger re-renders)
}

async function loadSecuritySessions(clientId?: string) {
  // Loads portal sessions for specific client
  // 1. Queries portal_sessions table
  // 2. Filters by clientId if provided
  // 3. Orders by last_seen_at DESC
  // 4. Limits to 200 most recent
  // 5. Updates securitySessions state
  // Returns: void
}
```

#### **Client Management**

```typescript
async function handleCreateClient() {
  // Creates new client record
  // Input: clientProfileDraft
  // 1. Validates company_name, username required
  // 2. Generates portal password
  // 3. Inserts into clients table
  // 4. Updates clients state
  // 5. Auto-selects new client
  // 6. Calls loadLists() to refresh
}

async function handleSaveClientProfile() {
  // Updates existing client record
  // Input: clientProfileDraft
  // 1. Validates required fields
  // 2. Updates clients table row
  // 3. Calls loadLists() to refresh
  // 4. Shows success notice
  // 5. Closes profile panel
}

async function handleDeleteClientProfile(clientId: string) {
  // Soft delete of client
  // 1. Confirmation dialog
  // 2. Updates clients table (marks as archived)
  // 3. Calls loadLists() to refresh
  // 4. Clears selection if deleted client was active
}

function handleTogglePortalAccess() {
  // Toggles clients.portal_enabled flag
  // 1. Flips boolean value
  // 2. Disables/enables client portal login
  // 3. Updates UI feedback
}
```

#### **Project Management**

```typescript
async function handleCreateProject() {
  // Creates new project for selected client
  // Input: newProjectForm
  // 1. Validates project name required
  // 2. Inserts into projects table
  // 3. Links to selectedClientId
  // 4. Sets defaults: status="planning", progress=0
  // 5. Calls loadLists() to refresh
  // 6. Resets form fields
}

async function handleUpdateProject() {
  // Updates project details
  // Input: projectDraft
  // 1. Validates selectedProjectId set
  // 2. Updates projects table row
  // 3. Calls loadLists() to refresh projects state
  // 4. Re-fetches and re-enriches invoices
  // 5. Updates all display elements
  // 6. Closes edit modal
}

async function handleDeleteProject(projectId: string) {
  // Safe delete - removes project only
  // 1. Confirmation dialog with invoice preservation message
  // 2. Deletes from projects table ONLY
  // 3. All linked invoices remain intact
  // 4. If deleted project was selected, clears selection
  // 5. Calls loadLists() to refresh
}
```

#### **Invoice Management**

```typescript
async function handleCreateInvoice() {
  // Creates new invoice
  // Input: invoiceDraft
  // 1. Validates required fields (number, amount, etc.)
  // 2. Builds metadata payload with line items, tax, discount
  // 3. Inserts into invoices table
  // 4. Links to invoiceTargetProjectId
  // 5. Updates invoiceMetaMap in localStorage
  // 6. Calls loadProjectResources() to refresh
}

async function handleUpdateInvoice() {
  // Updates existing invoice
  // Input: invoiceDraft with selectedInvoiceId
  // 1. Updates invoice row in Supabase
  // 2. Recalculates totals (subtotal, tax, discount, total)
  // 3. Updates metadata JSONB
  // 4. Syncs to localStorage invoiceMetaMap
  // 5. Refreshes invoice display
}

async function handleRecordPayment() {
  // Records payment received
  // Input: PaymentForm
  // 1. Updates invoice.paid_amount
  // 2. Recalculates status: "paid" if paid_amount >= amount, else "partial"
  // 3. Records payment details in metadata
  // 4. Updates payment timeline
  // 5. Triggers email notification (optional)
}

async function handleVoidInvoice() {
  // Marks invoice as voided
  // 1. Updates metadata.isVoided = true
  // 2. Soft delete (data preserved)
  // 3. Hides from active list
  // 4. Can be restored if needed
}

async function handleDownloadInvoicePdf() {
  // Generates PDF download
  // 1. Gathers invoice data
  // 2. Uses jsPDF + autoTable library
  // 3. Creates professional PDF layout
  // 4. Includes logo, signature, formatted data
  // 5. Browser downloads file
  // 6. Filename: `Invoice-{invoiceNumber}.pdf`
}

function handleMarkInvoiceAsMisc(invoiceId: string) {
  // Tags invoice as miscellaneous
  // 1. Updates metadata.serviceCategory = "misc"
  // 2. Updates localStorage invoiceMetaMap
  // 3. Closes invoice actions menu
  // 4. Invoice appears in MISC filter
  // 5. Shows success notice
}
```

#### **Other Management Functions**

```typescript
async function handleCreateDeliverable() {
  // Creates project deliverable record
  // Input: title, category, url
  // 1. Inserts into deliverables table
  // 2. Links to selectedProjectId
  // 3. Calls loadProjectResources() to refresh
}

async function handleDeleteDeliverable(id: string) {
  // Deletes deliverable record
  // 1. Soft delete from deliverables table
  // 2. Calls loadProjectResources() to refresh
}

async function handleRunMaterialsDiagnostics() {
  // Scans materials bucket for consistency
  // 1. Lists all files in Supabase Storage
  // 2. Compares against deliverables table
  // 3. Reports orphaned files and missing records
  // 4. Can auto-create records for found files
}

async function handleSaveSmmUpdate() {
  // Saves SMM project configuration
  // 1. Serializes all SMM state into SmmAdminPayload
  // 2. Stores as JSON in projects.latest_update
  // 3. Updates projects table
  // 4. Shows save confirmation
}

function handleCreateInvoiceLabel() {
  // Creates reusable invoice line item template
  // Input: title, rate
  // 1. Generates UUID
  // 2. Adds to invoiceLabels state
  // 3. Saves to localStorage invoiceLabels_v1
  // 4. Used in invoice "Add existing" functionality
}

function handleDeleteInvoiceLabel(id: string) {
  // Removes invoice label template
  // 1. Filters from invoiceLabels array
  // 2. Updates localStorage
  // 3. UI refreshes immediately
}
```

---

## 7. VISUAL DESIGN & UX

### Color Scheme
- **Background:** Dark theme - black (#0d0d0d)
- **Borders:** White with low opacity (#ffffff12 to #ffffff20)
- **Text:** White base (#ffffff) with opacity variants
- **Accents:**
  - Primary: Blue (#3b82f6)
  - Success: Green (#10b981)
  - Warning: Yellow (#f59e0b)
  - Danger: Red (#ef4444)
  - Info: Cyan (#06b6d4)

### Component Library
- **Tailwind CSS:** Utility-first styling
- **Framer Motion:** Smooth animations
  - Modal enter/exit animations
  - Hover scale effects (1.02x, 1.05x)
  - Tap effects (0.95x, 0.98x)
  - Slide-in animations for panels
  - Staggered list animations

### Modal Styling
- **Background:** Solid black (#0d0d0d) with border-white/15
- **Shadow:** Large drop shadow with 0.55 opacity
- **Border-radius:** Rounded-[28px] for premium appearance
- **Animation:** Spring animation with damping=24, stiffness=280

### Typography
- **Sizes:**
  - Text-xs: 10px (labels)
  - Text-sm: 12px (descriptions)
  - Text-base: 14px (body)
  - Text-lg: 18px (headings)
  - Text-xl: 20px (large headings)
- **Weights:** Regular, Semibold, Bold
- **Spacing:** Tracking-wider for all-caps labels

### Button Styles

**Primary Button (Blue)**
```css
border-white/20 bg-white/10 hover:bg-white/15
text-white font-semibold text-sm
rounded-lg padding-3 py-2.5
transition on hover
```

**Secondary Button (White/Muted)**
```css
border-white/15 bg-white/5 hover:bg-white/10
text-white/80 font-semibold text-sm
rounded-lg padding-3 py-2.5
```

**Danger Button (Red)**
```css
border-red-300/30 bg-red-500/15 hover:bg-red-500/25
text-red-100 font-semibold text-xs
rounded-lg padding-3 py-2
```

**Success Button (Green)**
```css
border-emerald-400/30 bg-emerald-500/15 hover:bg-emerald-500/25
text-emerald-100 font-semibold text-xs
```

### Input Fields
```css
border-white/12 bg-black/40 hover:border-white/20 focus:border-white/30
text-white placeholder-white/40
rounded-lg padding-3 height-11
transition on focus
color-scheme: dark (for date/file inputs)
```

### Status Badges
- **Paid:** `bg-emerald-400/20 text-emerald-200`
- **Unpaid:** `bg-red-400/20 text-red-400`
- **Partial:** `bg-yellow-400/20 text-yellow-200`
- **Delivered:** `bg-emerald-400/20 text-emerald-200`
- **In Progress:** `bg-blue-400/20 text-blue-200`
- **Planning:** `bg-white/10 text-white/60`
- **Review:** `bg-yellow-400/20 text-yellow-200`

### Responsive Design
- **Mobile:** Single column, full-width inputs
- **Tablet:** 2-column grids (sm:grid-cols-2)
- **Desktop:** 3-4 column grids, full sidebar layouts
- **Hidden on Mobile:** Some table columns (sm:block)

---

## 8. STATE MANAGEMENT PATTERNS

### Global Admin States
```typescript
// Client management
const [clients, setClients] = useState<ClientOption[]>([])
const [selectedClientId, setSelectedClientId] = useState<string>("")

// Project management
const [projects, setProjects] = useState<ProjectOption[]>([])
const [selectedProjectId, setSelectedProjectId] = useState<string>("")
const [projectDraft, setProjectDraft] = useState<ProjectDraft>({...})

// Invoice management
const [projectInvoices, setProjectInvoices] = useState<InvoiceRow[]>([])
const [invoiceDraft, setInvoiceDraft] = useState<InvoiceDraft>({...})
const [invoiceMetaMap, setInvoiceMetaMap] = useState<Record<string, InvoiceMeta>>({})

// UI State
const [activeTab, setActiveTab] = useState<OwnerTab>("overview")
const [isGeneralMode, setIsGeneralMode] = useState(false)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [notice, setNotice] = useState<string | null>(null)
```

### LocalStorage Persistence
```typescript
const ownerSelectionStorageKeys = {
  client: "owner_selected_client_id",
  project: "owner_selected_project_id",
}

// Auto-persist on state change
useEffect(() => {
  persistOwnerSelection(selectedClientId, selectedProjectId)
}, [selectedClientId, selectedProjectId])
```

### Cache Patterns
```typescript
// Metadata cache for quick invoice access
const invoiceMetaMap: Record<string, InvoiceMeta> = {...}
// Key: invoice.id
// Value: {
//   projectLabel, companyName, serviceCategory, 
//   customerName, customerEmail, customerAddress,
//   discountType, discountValue, taxType, taxValue, items, isVoided
// }

// Stored in localStorage under: owner_invoice_meta_{projectId}
```

---

## 9. FILTER MECHANICS

### Invoice Filters

**Status Filter:**
```typescript
type InvoiceStatus = "paid" | "unpaid" | "partial"

const statusOptions = ["all", "paid", "partial", "unpaid"]

// Applied as: invoice.status === selectedStatus || selectedStatus === "all"
```

**Service Filter:**
```typescript
type ServiceType = "website" | "app" | "software" | "smm" | "branding" | "misc"

const serviceOptions = ["all", "website", "app", "software", "smm", "branding", "misc"]

// Applied as:
// For "misc": invoice.metadata?.serviceCategory === "misc"
// Others: invoice.project_service === selectedService
```

**Search Filter:**
```typescript
// Full-text search across multiple fields:
const matchesSearch = (invoice) => {
  const search = searchTerm.toLowerCase()
  return (
    invoice.invoice_number?.toLowerCase().includes(search) ||
    invoice.project_name?.toLowerCase().includes(search) ||
    invoice.metadata?.companyName?.toLowerCase().includes(search) ||
    invoice.metadata?.customerName?.toLowerCase().includes(search) ||
    invoice.project_service?.toLowerCase().includes(search)
  )
}
```

**Date Range Filter:**
```typescript
// Issue date range: filter by issue_date between fromDate and toDate
const matchesDateRange = (invoice) => {
  if (!fromDate && !toDate) return true
  const issueDate = new Date(invoice.issue_date)
  if (fromDate && issueDate < new Date(fromDate)) return false
  if (toDate && issueDate > new Date(toDate)) return false
  return true
}
```

**Combined Filter Application:**
```typescript
const filteredInvoices = projectInvoices
  .filter(inv => matchesSearch(inv))
  .filter(inv => matchesStatus(inv))
  .filter(inv => matchesService(inv))
  .filter(inv => matchesDateRange(inv))
  .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
```

---

## 10. MECHANICAL FLOW DIAGRAMS

### Invoice Creation Flow
```
Admin clicks "+ New Invoice"
  ↓
Modal opens with invoiceDraft form
  ↓
Admin selects linked project (auto-fills company name)
  ↓
Admin adds line items (manual or from saved labels)
  ↓
Auto-calculates: Subtotal → Apply Discount → Apply Tax → Total
  ↓
Admin clicks "Create Invoice"
  ↓
handleCreateInvoice() validates required fields
  ↓
Builds metadata payload with all line items, tax, discount details
  ↓
Inserts into invoices table with:
  - invoice_number (unique)
  - project_id (linked project)
  - amount (calculated total)
  - status ("unpaid" default)
  - issue_date, due_date
  - metadata JSONB (everything else)
  ↓
Updates invoiceMetaMap in localStorage
  ↓
Calls loadProjectResources() to refresh invoice list
  ↓
Shows success notice + closes modal
```

### Project Update Flow
```
Admin opens Manage Projects modal
  ↓
Admin clicks blue "Edit" button on project
  ↓
Edit Project modal opens with projectDraft pre-filled
  ↓
Admin modifies: name, service, status, progress, dates, notes
  ↓
Admin clicks "Save Changes"
  ↓
handleUpdateProject() validates selectedProjectId
  ↓
Updates projects table with new data:
  - name, service, status, progress
  - start_date, delivery_date, latest_update
  ↓
Calls loadLists() to refresh projects state
  ↓
Re-fetches all invoices for this client's projects
  ↓
Re-enriches invoices with new project_name from updated projects
  ↓
Updates setProjectInvoices with enriched data
  ↓
All invoice displays update to show new project name
  ↓
Shows success notice + closes edit modal
```

### Invoice Payment Recording Flow
```
Admin clicks "Record Payment" on invoice
  ↓
Payment form modal opens
  ↓
Admin enters:
  - Customer name, payment number
  - Amount received, bank charges
  - Tax deducted (TDS or none)
  - Payment date, payment received on
  - Payment mode (Cash/Bank/Card/Online)
  - Reference, notes
  ↓
Admin clicks "Record Payment"
  ↓
handleRecordPayment() updates invoice:
  - paid_amount += amountReceived - bankCharges
  - Recalculates status based on (paid_amount vs. total amount):
    - If paid_amount >= amount: status = "paid"
    - Else if paid_amount > 0: status = "partial"
    - Else: status = "unpaid"
  - Stores payment details in metadata
  ↓
Updates invoices table
  ↓
Calls loadProjectResources() to refresh display
  ↓
Shows success notice + closes modal
  ↓
Invoice status badge updates immediately
```

### Client Portal Login & Invoice View Flow
```
Client navigates to /portal
  ↓
Portal requires authentication
  ↓
Client enters username (from clients.username) + password
  ↓
Supabase validates credentials (via portal_sessions table)
  ↓
Portal loads client's projects
  ↓
Client selects project (or defaults to first)
  ↓
Portal loads invoices for selected project
  ↓
Client sees:
  - Invoice list with status badges
  - Filters: status, service, date range, search
  - All client-visible data from metadata:
    - Project title (metadata.projectLabel)
    - Service (metadata.serviceCategory)
    - Company name (metadata.companyName)
    - Customer details (metadata.customerName, email, address)
    - Line items (metadata.items[])
    - Discount/tax applied (metadata.discountValue, taxValue)
  ↓
Client clicks invoice → Details panel opens
  ↓
Shows full invoice breakdown:
  - Client information
  - Line items table
  - Calculations: Subtotal, Discount, Tax, Total, Paid, Balance Due
  ↓
Client can download PDF
  ↓
Client returns to list and filters by status/service
```

---

## 11. KEY DATA CONCEPTS

### Project Title Definition
**"Project Title" = `projects.name` field**

- Set by admin in Manage Projects modal
- Examples: "Javar.az", "Javarski update", "Website redesign"
- Displayed in:
  - Status tab (project list)
  - Invoice enrichment as `project_name`
  - Client cannot see this directly

### Invoice Project Label Definition
**"Project Title" (client-visible) = `invoices.metadata.projectLabel` field**

- Can differ from actual project name
- Set by admin in invoice edit modal
- Client sees this in invoice details
- Example: project might be "Javarski update" but invoice shows "Javarski update - Phase 2"
- Allows flexibility in billing presentation

### What Counts as "Miscellaneous"
**Invoice tagged with: `metadata.serviceCategory = "misc"`**

- Appears in MISC service filter
- Not linked to any specific project
- Admin can manually tag any invoice as MISC
- Used for non-project related billing (consultation, support, etc.)

### Status Categories

**Project Status:**
- planning: Not started
- in_progress: Active work
- review: Awaiting approval
- delivered: Completed

**Invoice Status:**
- unpaid: Amount due = total amount
- partial: Amount due < total (some paid)
- paid: Amount due = 0 (fully paid)

**SMM Schedule Status:**
- planned: Scheduled for future
- scheduled: Ready to post
- review: Awaiting approval
- done: Published

---

## 12. TECHNICAL IMPLEMENTATION DETAILS

### Error Handling Pattern
```typescript
try {
  setError(null)
  setNotice(null)
  
  // Perform operation
  const { error: supabaseError } = await supabase...
  
  if (supabaseError) {
    setError(withErrorDetails("User-friendly message", supabaseError))
    return
  }
  
  setNotice("Success message")
} catch (err) {
  setError(withErrorDetails("Failed message", err))
}
```

### Auto-Clear Notifications
```typescript
useEffect(() => {
  if (!notice && !error) return
  const timeoutId = window.setTimeout(() => {
    setNotice(null)
    setError(null)
  }, 4200) // 4.2 second display time
  
  return () => window.clearTimeout(timeoutId)
}, [notice, error])
```

### Responsive Grid Pattern
```tsx
// 1 column on mobile, 2 on tablet, auto on desktop
<div className="grid gap-3 sm:grid-cols-2">
  {/* Items */}
</div>
```

### Animation Pattern
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="..."
>
  Click me
</motion.button>
```

### Search Filter Pattern
```typescript
const deferredSearchTerm = useDeferredValue(searchTerm)

const filteredResults = useMemo(() => {
  return items.filter(item =>
    item.name.toLowerCase().includes(deferredSearchTerm.toLowerCase())
  )
}, [deferredSearchTerm])
```

---

## 13. SUPABASE INTEGRATION

### Connection
```typescript
import { supabase } from "@/lib/supabase"

// All database operations use:
await supabase.from("table_name").select(...).filter(...)
```

### Query Patterns

**Fetch all clients:**
```typescript
supabase.from("clients")
  .select("id, brand_name, username, password, whatsapp_number, portal_enabled, ...")
  .order("brand_name", { ascending: true })
```

**Fetch projects for client:**
```typescript
supabase.from("projects")
  .select("id, client_id, name, service, status, progress, ...")
  .eq("client_id", clientId)
```

**Fetch invoices for projects:**
```typescript
supabase.from("invoices")
  .select("id, project_id, invoice_number, amount, status, metadata, ...")
  .in("project_id", projectIds)
  .order("issue_date", { ascending: false })
```

**Update with batch:**
```typescript
supabase.from("projects")
  .update({ client_id: newClientId })
  .eq("client_id", oldClientId)
```

---

## 14. MISSING/TODO FEATURES

Based on code review:
1. Email notifications on payment recording
2. Invoice payment reminders/auto-send
3. Advanced reporting/analytics dashboard
4. Multi-currency support (partially implemented)
5. Invoice templates
6. Batch invoice operations
7. Client document upload/sharing
8. Automated invoicing schedule
9. Integration with payment gateways
10. Client expense tracking

---

## SUMMARY

This is a sophisticated **multi-tenant invoice management and project tracking system** with:

**For Admins:**
- Complete client lifecycle management (create, edit, delete)
- Multi-project support per client with detailed status tracking
- Advanced invoice system with flexible metadata, line items, tax/discount
- Project materials/deliverables management
- SMM content management for social media projects
- Security session monitoring
- Portal access control per client

**For Clients:**
- View invoices filtered by status, service, date range
- Download professional PDFs
- View project timelines and delivery dates
- Multi-language support (EN, RU, AZ)
- Project switching/multi-project support

**Technical Highlights:**
- Real-time state management with React hooks
- Supabase PostgreSQL backend with JSONB metadata
- Professional dark-themed UI with Framer Motion animations
- LocalStorage persistence for metadata and user preferences
- Safe database operations (no cascade deletes)
- PDF generation with professional formatting
- Responsive design (mobile to desktop)
- Multi-language support infrastructure

