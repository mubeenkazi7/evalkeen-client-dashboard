export const STATUSES = ["new", "contacted", "booked", "consulted", "lost"] as const;
export type Status = (typeof STATUSES)[number];
export type Score = "hot" | "warm" | "cold";

export const STATUS_LABEL: Record<Status, string> = {
  new: "New",
  contacted: "Contacted",
  booked: "Booked",
  consulted: "Consulted",
  lost: "Lost",
};

export function scoreLabel(score: string | null | undefined) {
  if (!score) return "In progress";
  return score.charAt(0).toUpperCase() + score.slice(1);
}

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function formatDateTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDay(d: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone, day: "numeric", month: "short" }).format(d);
}

// Full number: the team needs it to call the lead.
export function formatPhone(phone: string) {
  const p = phone.replace(/\D/g, "");
  if (p.startsWith("91") && p.length === 12) return `+91 ${p.slice(2, 7)} ${p.slice(7)}`;
  return "+" + p;
}

export function waLink(phone: string) {
  return "https://wa.me/" + phone.replace(/\D/g, "");
}

export type Range = "7" | "30";
export function parseRange(v: string | string[] | undefined): Range {
  return v === "30" ? "30" : "7";
}
export function rangeBounds(range: Range) {
  const to = new Date();
  const from = new Date(to.getTime() - Number(range) * 24 * 3600 * 1000);
  return { from, to };
}

export function delta(cur: number, prev: number) {
  const d = cur - prev;
  if (d === 0) return { text: "Same as previous period", tone: "muted" as const };
  return { text: `${d > 0 ? "↑" : "↓"} ${Math.abs(d)} vs previous period`, tone: d > 0 ? ("up" as const) : ("down" as const) };
}
