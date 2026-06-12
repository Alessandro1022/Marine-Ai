import type { Role } from "./types";

/**
 * Enterprise RBAC — single source of truth for permissions.
 * Backend validation: every server action calls requirePermission().
 * Database validation: mirrored by Postgres RLS policies.
 */
export const PERMISSIONS = [
  // company
  "company.settings.manage",
  "company.subscription.manage",
  "company.data.export",
  "company.audit.read",
  // users
  "users.read.all",
  "users.create.admin",
  "users.create.economy",
  "users.create.worker",
  "users.create.intern",
  "users.edit",
  "users.suspend",
  "users.delete",
  "users.role.change",
  // projects
  "projects.read.all",
  "projects.read.assigned",
  "projects.create",
  "projects.edit",
  "projects.archive",
  "projects.budget.manage",
  // work orders
  "orders.create",
  "orders.assign",
  "orders.read.all",
  "orders.read.assigned",
  "orders.update.own",
  // time
  "time.report.own",
  "time.read.all",
  "time.approve",
  // material
  "material.report.own",
  "material.read.all",
  "material.approve",
  // finance
  "finance.read",
  "finance.export",
  "leaks.read",
  "reports.read",
  // notifications
  "notifications.read.own",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const BEYER_BEY: Permission[] = [...PERMISSIONS];

const ADMIN: Permission[] = [
  "users.read.all",
  "users.create.economy",
  "users.create.worker",
  "users.create.intern",
  "users.edit",
  "users.suspend",
  "projects.read.all",
  "projects.create",
  "projects.edit",
  "projects.archive",
  "projects.budget.manage",
  "orders.create",
  "orders.assign",
  "orders.read.all",
  "time.read.all",
  "time.approve",
  "time.report.own",
  "material.read.all",
  "material.approve",
  "material.report.own",
  "finance.read",
  "leaks.read",
  "reports.read",
  "notifications.read.own",
];

const ECONOMY: Permission[] = [
  "projects.read.all",
  "orders.read.all",
  "time.read.all",
  "material.read.all",
  "finance.read",
  "finance.export",
  "leaks.read",
  "reports.read",
  "notifications.read.own",
];

const WORKER: Permission[] = [
  "projects.read.assigned",
  "orders.read.assigned",
  "orders.update.own",
  "time.report.own",
  "material.report.own",
  "notifications.read.own",
];

const INTERN: Permission[] = [
  "projects.read.assigned",
  "orders.read.assigned",
  "orders.update.own",
  "time.report.own",
  "notifications.read.own",
];

export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  beyer_bey: new Set(BEYER_BEY),
  admin: new Set(ADMIN),
  economy: new Set(ECONOMY),
  worker: new Set(WORKER),
  intern: new Set(INTERN),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export const ROLE_ORDER: Role[] = ["beyer_bey", "admin", "economy", "worker", "intern"];

/** Which roles a given role is allowed to create */
export function creatableRoles(role: Role): Role[] {
  if (role === "beyer_bey") return ["admin", "economy", "worker", "intern"];
  if (role === "admin") return ["economy", "worker", "intern"];
  return [];
}
