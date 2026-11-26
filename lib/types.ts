import type { Score, Status } from "@/lib/format";

export type Kpis = { new_leads: number; hot: number; warm: number; cold: number; booked: number; after_hours: number };

export type ServiceRow = {
  id: string;
  name: string;
  slug: string;
  leads: number;
  hot: number;
  warm: number;
  cold: number;
  hot_not_contacted: number;
  booked: number;
};

export type Summary = { kpis: { cur: Kpis; prev: Kpis }; services: ServiceRow[] };

export type ServiceDetail = {
  service: { id: string; name: string } | null;
  totals: { leads: number; hot: number; warm: number; cold: number; booked: number };
  countries: { name: string; leads: number; hot: number; booked: number }[];
  breakdowns: { title: string; items: { label: string; n: number }[] }[];
};

export type Lead = {
  id: string;
  wa_phone: string;
  name: string | null;
  service_name: string | null;
  service_id: string | null;
  country: string | null;
  score: Score | null;
  score_points: number | null;
  score_reason: string | null;
  status: Status;
  lost_reason: string | null;
  bot_state: "in_progress" | "done";
  answers: Record<string, string>;
  is_after_hours: boolean;
  first_message_at: string;
  last_activity_at: string;
};

export type LeadEvent = {
  id: number;
  type: string;
  actor: string;
  data: Record<string, unknown>;
  created_at: string;
};
