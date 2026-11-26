import Link from "next/link";
import { requireClient } from "@/lib/context";
import { formatPhone, timeAgo } from "@/lib/format";
import { ScorePill, StatusPill } from "@/components/Pills";
import type { Lead } from "@/lib/types";

const SCORES = [
  { key: "all", label: "All" },
  { key: "hot", label: "Hot" },
  { key: "warm", label: "Warm" },
  { key: "cold", label: "Cold" },
  { key: "progress", label: "In progress" },
];

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ score?: string; q?: string }> }) {
  const { supabase, client } = await requireClient();
  const sp = await searchParams;
  const score = SCORES.some((s) => s.key === sp.score) ? sp.score! : "all";
  const q = (sp.q ?? "").trim().slice(0, 60);

  let query = supabase
    .from("leads")
    .select("id, name, wa_phone, service_name, country, score, status, last_activity_at")
    .eq("client_id", client.id)
    .order("last_activity_at", { ascending: false })
    .limit(200);
  if (score === "progress") query = query.is("score", null);
  else if (score !== "all") query = query.eq("score", score);
  if (q) {
    const safe = q.replace(/[%,()*]/g, " ");
    const digits = safe.replace(/\D/g, "");
    query = digits.length >= 4 ? query.ilike("wa_phone", `%${digits}%`) : query.ilike("name", `%${safe}%`);
  }
  const { data: leads, error } = await query.returns<Pick<Lead, "id" | "name" | "wa_phone" | "service_name" | "country" | "score" | "status" | "last_activity_at">[]>();

  const href = (s: string) => {
    const p = new URLSearchParams();
    if (s !== "all") p.set("score", s);
    if (q) p.set("q", q);
    const qs = p.toString();
    return qs ? `/leads?${qs}` : "/leads";
  };

  return (
    <>
      <header>
        <h1>Leads</h1>
        <p className="sub">Every WhatsApp enquiry, scored by the bot. Open a lead to see the chat and update its status.</p>
      </header>

      <div className="filters">
        {SCORES.map((s) => (
          <Link key={s.key} href={href(s.key)} className={`chip${score === s.key ? " on" : ""}`}>{s.label}</Link>
        ))}
        <form className="search" action="/leads" role="search">
          {score !== "all" ? <input type="hidden" name="score" value={score} /> : null}
          <label htmlFor="q" style={{ position: "absolute", left: -9999 }}>Search leads</label>
          <input id="q" name="q" type="search" placeholder="Name or phone" defaultValue={q} />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="tbl-card">
        <table style={{ minWidth: 680 }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: 16 }}>Lead</th>
              <th>Looking for</th>
              <th>Score</th>
              <th>Status</th>
              <th style={{ paddingRight: 16 }}>Last activity</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr><td colSpan={5} className="empty" style={{ paddingLeft: 16 }}>Couldn&apos;t load leads. Refresh to try again.</td></tr>
            ) : leads && leads.length ? (
              leads.map((l) => (
                <tr key={l.id}>
                  <td className="lead-cell" style={{ paddingLeft: 16 }}>
                    <Link href={`/leads/${l.id}`}>
                      <span className="nm">{l.name || "Unknown"}</span>
                      <span className="ph">{formatPhone(l.wa_phone)}</span>
                    </Link>
                  </td>
                  <td>{[l.service_name, l.country].filter(Boolean).join(" · ") || "–"}</td>
                  <td><ScorePill score={l.score} /></td>
                  <td><StatusPill status={l.status} /></td>
                  <td style={{ paddingRight: 16, color: "var(--muted)" }}>{timeAgo(l.last_activity_at)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="empty" style={{ paddingLeft: 16 }}>No leads match this filter yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
