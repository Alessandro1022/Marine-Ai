export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatSEK(n: number) {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(n) + " kr";
}

export function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function entryMinutes(startedAt: string, endedAt: string | null, breakMin: number) {
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const raw = Math.max(0, (end - new Date(startedAt).getTime()) / 60000);
  return Math.max(0, raw - breakMin);
}

export function startOfDayISO(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export function daysAgoISO(days: number) {
  const x = new Date();
  x.setDate(x.getDate() - days);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
