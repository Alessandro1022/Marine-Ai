export type Role = "beyer_bey" | "admin" | "economy" | "worker" | "intern";
export type UserStatus = "active" | "suspended" | "deleted";
export type ProjectStatus = "planned" | "active" | "completed";
export type OrderStatus = "not_started" | "in_progress" | "done";
export type OrderPriority = "low" | "medium" | "high";
export type ReportStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  company_id: string;
  full_name: string;
  email: string;
  role: Role;
  status: UserStatus;
  hourly_cost: number | null;
}

export interface Company {
  id: string;
  name: string;
  org_number: string | null;
  default_hourly_cost: number;
  default_billing_rate: number;
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  customer: string | null;
  address: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  status: ProjectStatus;
  archived: boolean;
}

export interface WorkOrder {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: OrderPriority;
  assignee_id: string | null;
  status: OrderStatus;
  due_date: string | null;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  started_at: string;
  ended_at: string | null;
  break_minutes: number;
  overtime_minutes: number;
  comment: string | null;
  status: ReportStatus;
}

export interface MaterialReport {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit_cost: number;
  comment: string | null;
  status: ReportStatus;
}
