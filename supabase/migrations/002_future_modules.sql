-- ============================================================
-- MIGRATION 002 — Future modules (run AFTER schema.sql)
-- Prepares: feature flags, GPS check-in, invoices, payroll,
-- customer portal, documents. All inert until modules ship.
-- ============================================================

-- ---------- FEATURE FLAGS (per-company module toggles) ----------
create table if not exists feature_flags (
  company_id uuid not null references companies(id) on delete cascade,
  module_id text not null,
  enabled boolean not null default false,
  enabled_at timestamptz,
  primary key (company_id, module_id)
);
alter table feature_flags enable row level security;
create policy "flags: company read" on feature_flags
  for select using (company_id = current_company_id());
create policy "flags: owner manage" on feature_flags
  for all using (company_id = current_company_id() and current_user_role() = 'beyer_bey');

-- ---------- GPS CHECK-IN (extends time_entries, zero behavior change) ----------
alter table time_entries
  add column if not exists checkin_lat double precision,
  add column if not exists checkin_lng double precision,
  add column if not exists checkout_lat double precision,
  add column if not exists checkout_lng double precision,
  add column if not exists geo_verified boolean not null default false;

alter table projects
  add column if not exists site_lat double precision,
  add column if not exists site_lng double precision,
  add column if not exists geofence_radius_m int not null default 250;

-- ---------- INVOICES (AI invoicing + invoice management) ----------
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  invoice_number text not null,
  customer text,
  status invoice_status not null default 'draft',
  issue_date date,
  due_date date,
  total numeric not null default 0,
  ai_generated boolean not null default false,
  pdf_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists invoices_company_idx on invoices(company_id);

create table if not exists invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric not null default 0
);

alter table invoices enable row level security;
alter table invoice_lines enable row level security;
create policy "invoices: finance read" on invoices
  for select using (company_id = current_company_id() and can_view_finance());
create policy "invoices: managers manage" on invoices
  for all using (company_id = current_company_id() and is_manager());
create policy "invoice_lines: via invoice" on invoice_lines
  for all using (exists (
    select 1 from invoices i where i.id = invoice_lines.invoice_id
      and i.company_id = current_company_id() and can_view_finance()
  ));

-- ---------- PAYROLL ----------
create table if not exists payroll_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  locked boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists payroll_items (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references payroll_periods(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  regular_minutes int not null default 0,
  overtime_minutes int not null default 0,
  gross_amount numeric not null default 0,
  note text
);
alter table payroll_periods enable row level security;
alter table payroll_items enable row level security;
create policy "payroll: finance read" on payroll_periods
  for select using (company_id = current_company_id() and can_view_finance());
create policy "payroll: owner manage" on payroll_periods
  for all using (company_id = current_company_id() and current_user_role() = 'beyer_bey');
create policy "payroll_items: via period" on payroll_items
  for all using (exists (
    select 1 from payroll_periods pp where pp.id = payroll_items.period_id
      and pp.company_id = current_company_id() and can_view_finance()
  ));
-- Workers may read their own payroll items
create policy "payroll_items: own read" on payroll_items
  for select using (user_id = auth.uid());

-- ---------- CUSTOMER PORTAL (token-based external access) ----------
create table if not exists portal_access (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  customer_email text,
  can_view_progress boolean not null default true,
  can_view_photos boolean not null default true,
  can_view_invoices boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table portal_access enable row level security;
create policy "portal: managers manage" on portal_access
  for all using (company_id = current_company_id() and is_manager());

-- ---------- DOCUMENTS / SITE PHOTOS ----------
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  uploaded_by uuid references profiles(id),
  kind text not null default 'photo', -- photo | drawing | contract | other
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);
alter table documents enable row level security;
create policy "docs: company read" on documents
  for select using (company_id = current_company_id());
create policy "docs: own insert" on documents
  for insert with check (company_id = current_company_id() and uploaded_by = auth.uid());
create policy "docs: managers manage" on documents
  for all using (company_id = current_company_id() and is_manager());

-- ---------- AI AUDIT (log every AI call for trust + billing) ----------
create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid references profiles(id),
  module_id text not null,
  input_summary text,
  status text not null default 'ok',
  latency_ms int,
  created_at timestamptz not null default now()
);
alter table ai_runs enable row level security;
create policy "ai_runs: owner read" on ai_runs
  for select using (company_id = current_company_id() and current_user_role() = 'beyer_bey');
create policy "ai_runs: company insert" on ai_runs
  for insert with check (company_id = current_company_id());
