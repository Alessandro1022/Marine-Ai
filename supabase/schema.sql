-- ============================================================
-- AETOS BUILD AI — Database Schema (Supabase / PostgreSQL)
-- Multi-tenant, strict RBAC, RLS on every table.
-- Paste this whole file into the Supabase SQL Editor and run.
-- ============================================================

-- ---------- ENUMS ----------
create type user_role as enum ('beyer_bey', 'admin', 'economy', 'worker', 'intern');
create type user_status as enum ('active', 'suspended', 'deleted');
create type project_status as enum ('planned', 'active', 'completed');
create type order_status as enum ('not_started', 'in_progress', 'done');
create type order_priority as enum ('low', 'medium', 'high');
create type report_status as enum ('pending', 'approved', 'rejected');
create type notification_type as enum ('time_reminder', 'new_order', 'project_update', 'leak_alert', 'system');

-- ---------- TENANTS ----------
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_number text,
  default_hourly_cost numeric not null default 450,   -- internal cost / hour (SEK)
  default_billing_rate numeric not null default 750,  -- invoiced / hour (SEK)
  created_at timestamptz not null default now()
);

-- ---------- USERS ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'worker',
  status user_status not null default 'active',
  hourly_cost numeric,           -- overrides company default if set
  created_at timestamptz not null default now()
);
create index profiles_company_idx on profiles(company_id);

-- ---------- PROJECTS ----------
create table projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  customer text,
  address text,
  start_date date,
  end_date date,
  budget numeric not null default 0,
  status project_status not null default 'planned',
  archived boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index projects_company_idx on projects(company_id);

-- Workers/interns are assigned to projects through membership
create table project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (project_id, user_id)
);

-- ---------- WORK ORDERS ----------
create table work_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  priority order_priority not null default 'medium',
  assignee_id uuid references profiles(id),
  status order_status not null default 'not_started',
  due_date date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index work_orders_company_idx on work_orders(company_id);
create index work_orders_assignee_idx on work_orders(assignee_id);

-- ---------- TIME ENTRIES ----------
create table time_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,                 -- null = currently clocked in
  break_minutes int not null default 0,
  overtime_minutes int not null default 0,
  comment text,
  status report_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index time_entries_company_idx on time_entries(company_id);
create index time_entries_user_idx on time_entries(user_id);
create index time_entries_started_idx on time_entries(started_at);

-- ---------- MATERIAL REPORTS ----------
create table material_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  quantity numeric not null default 1,
  unit_cost numeric not null default 0,
  comment text,
  status report_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index material_reports_company_idx on material_reports(company_id);

-- ---------- NOTIFICATIONS ----------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null default 'system',
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications(user_id, read);

-- ---------- AUDIT LOG ----------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,
  target text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_company_idx on audit_logs(company_id);

-- ============================================================
-- RBAC HELPERS (security definer so RLS can call them safely)
-- ============================================================
create or replace function current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from profiles where id = auth.uid()
$$;

create or replace function current_user_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and status = 'active'
$$;

create or replace function is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select current_user_role() in ('beyer_bey', 'admin')
$$;

create or replace function can_view_finance()
returns boolean language sql stable security definer set search_path = public as $$
  select current_user_role() in ('beyer_bey', 'admin', 'economy')
$$;

-- ============================================================
-- ROW LEVEL SECURITY — complete tenant isolation + role rules
-- ============================================================
alter table companies enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table work_orders enable row level security;
alter table time_entries enable row level security;
alter table material_reports enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- COMPANIES
create policy "company: members read" on companies
  for select using (id = current_company_id());
create policy "company: owner update" on companies
  for update using (id = current_company_id() and current_user_role() = 'beyer_bey');

-- PROFILES
-- Everyone can read their own profile; managers + economy can read all in company.
create policy "profiles: self read" on profiles
  for select using (id = auth.uid());
create policy "profiles: staff read" on profiles
  for select using (
    company_id = current_company_id()
    and current_user_role() in ('beyer_bey', 'admin', 'economy')
  );
create policy "profiles: self update name" on profiles
  for update using (id = auth.uid());
create policy "profiles: managers manage" on profiles
  for all using (company_id = current_company_id() and is_manager());
-- Allow first profile insert during signup (user inserts own row)
create policy "profiles: insert self" on profiles
  for insert with check (id = auth.uid());

-- PROJECTS
create policy "projects: managers all" on projects
  for all using (company_id = current_company_id() and is_manager());
create policy "projects: economy read" on projects
  for select using (company_id = current_company_id() and current_user_role() = 'economy');
create policy "projects: members read assigned" on projects
  for select using (
    company_id = current_company_id()
    and (
      exists (select 1 from project_members pm where pm.project_id = projects.id and pm.user_id = auth.uid())
      or exists (select 1 from work_orders w where w.project_id = projects.id and w.assignee_id = auth.uid())
    )
  );

-- PROJECT MEMBERS
create policy "members: managers manage" on project_members
  for all using (exists (
    select 1 from projects p
    where p.id = project_members.project_id
      and p.company_id = current_company_id() and is_manager()
  ));
create policy "members: self read" on project_members
  for select using (user_id = auth.uid());

-- WORK ORDERS
create policy "orders: managers all" on work_orders
  for all using (company_id = current_company_id() and is_manager());
create policy "orders: economy read" on work_orders
  for select using (company_id = current_company_id() and current_user_role() = 'economy');
create policy "orders: assignee read" on work_orders
  for select using (company_id = current_company_id() and assignee_id = auth.uid());
create policy "orders: assignee update status" on work_orders
  for update using (company_id = current_company_id() and assignee_id = auth.uid());

-- TIME ENTRIES
create policy "time: own all" on time_entries
  for all using (company_id = current_company_id() and user_id = auth.uid());
create policy "time: managers all" on time_entries
  for all using (company_id = current_company_id() and is_manager());
create policy "time: economy read" on time_entries
  for select using (company_id = current_company_id() and current_user_role() = 'economy');

-- MATERIAL REPORTS
create policy "material: own all" on material_reports
  for all using (company_id = current_company_id() and user_id = auth.uid());
create policy "material: managers all" on material_reports
  for all using (company_id = current_company_id() and is_manager());
create policy "material: economy read" on material_reports
  for select using (company_id = current_company_id() and current_user_role() = 'economy');

-- NOTIFICATIONS
create policy "notif: own read/update" on notifications
  for select using (user_id = auth.uid());
create policy "notif: own mark read" on notifications
  for update using (user_id = auth.uid());
create policy "notif: company insert" on notifications
  for insert with check (company_id = current_company_id());

-- AUDIT LOGS
create policy "audit: owner read" on audit_logs
  for select using (company_id = current_company_id() and current_user_role() = 'beyer_bey');
create policy "audit: company insert" on audit_logs
  for insert with check (company_id = current_company_id());

-- ============================================================
-- SIGNUP RPC — creates company + Beyer Bey profile atomically
-- ============================================================
create or replace function register_company(company_name text, owner_name text, owner_email text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_company uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'Profile already exists';
  end if;

  insert into companies (name) values (company_name) returning id into new_company;

  insert into profiles (id, company_id, full_name, email, role)
  values (auth.uid(), new_company, owner_name, owner_email, 'beyer_bey');

  return new_company;
end;
$$;

-- ============================================================
-- INVITE RPC — managers create accounts for existing auth users
-- (The app creates the auth user via signUp, then calls this.)
-- ============================================================
create or replace function attach_profile(
  target_user uuid, target_name text, target_email text, target_role user_role
) returns void language plpgsql security definer set search_path = public as $$
declare
  caller_role user_role := current_user_role();
begin
  if caller_role is null then raise exception 'Not authenticated'; end if;
  if target_role = 'beyer_bey' then raise exception 'Cannot create Beyer Bey accounts'; end if;
  if caller_role = 'admin' and target_role not in ('economy','worker','intern') then
    raise exception 'Admin can only create Economy, Worker and Intern accounts';
  end if;
  if caller_role not in ('beyer_bey','admin') then
    raise exception 'Permission denied';
  end if;

  insert into profiles (id, company_id, full_name, email, role)
  values (target_user, current_company_id(), target_name, target_email, target_role);
end;
$$;
