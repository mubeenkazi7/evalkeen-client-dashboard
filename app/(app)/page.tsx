import Link from "next/link";
import { requireClient } from "@/lib/context";
import { delta, formatDay, parseRange, rangeBounds, timeAgo } from "@/lib/format";
import type { Lead, Summary } from "@/lib/types";

export default async function Overview({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { supabase, client } = await requireClient();
  const range = parseRange((await searchParams).range);
  const { from, to } = rangeBounds(range);

  const [{ data: summary, error }, { data: waiting }] = await Promise.all([
    supabase.rpc("dashboard_summary", { p_from: from.toISOString(), p_to: to.toISOString(), p_client: client.id }),
    supabase
      .from("leads")
      .select("id, name, wa_phone, service_name, country, score, last_activity_at")
      .eq("client_id", client.id)
      .eq("status", "new")
      .in("score", ["hot", "warm"])
      .order("score", { ascending: true }) // "hot" sorts before "warm"
      .order("last_activity_at", { ascending: false })
      .limit(8)
      .returns<Pick<Lead, "id" | "name" | "wa_phone" | "service_name" | "country" | "score" | "last_activity_at">[]>(),
  ]);

  if (error || !summary) {
    return <div className="card"><p className="empty">Couldn&apos;t load the dashboard. Refresh to try again.</p></div>;
  }
  const s = summary as Summary;
  const cur = s.kpis.cur;
  const prev = s.kpis.prev;
  const kpis = [
    { label: "New leads", value: cur.new_leads, d: delta(cur.new_leads, prev.new_leads) },
    { label: "Hot leads", value: cur.hot, d: delta(cur.hot, prev.hot) },
    { label: "Consultations booked", value: cur.booked, d: delta(cur.booked, prev.booked) },
    {
      label: "Handled after hours",
      value: cur.after_hours,
      d: { text: cur.new_leads ? `${Math.round((cur.after_hours / cur.new_leads) * 100)}% of new leads` : "No new leads yet", tone: "muted" as const },
    },
  ];

  return (
    <>
      <header className="head">
        <div>
          <h1>Overview</h1>
          <p className="sub">
            Last {range} days · {formatDay(from, client.timezone)} – {formatDay(to, client.timezone)}, compared with the {range} days before
          </p>
        </div>
        <div className="seg" role="group" aria-label="Period">
          <Link href="/?range=7" className={range === "7" ? "on" : undefined}>7 days</Link>
          <Link href="/?range=30" className={range === "30" ? "on" : undefined}>30 days</Link>
        </div>
      </header>

      <div className="grid-kpi">
        {kpis.map((k) => (
          <div key={k.label} className="card kpi" style={{ gap: 8 }}>
            <div className="label">{k.label}</div>
            <div className="value">{k.value}</div>
            <div className={`delta ${k.d.tone}`}>{k.d.text}</div>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="head" style={{ alignItems: "center" }}>
          <h2>Needs your attention</h2>
          <span className="count">{waiting?.length ?? 0} waiting</span>
        </div>
        {waiting && waiting.length ? (
          <div className="att">
            {waiting.map((l) => (
              <Link key={l.id} href={`/leads/${l.id}`}>
                <span className={`dot ${l.score}`} />
                <span style={{ minWidth: 0 }}>
                  <span className="t" style={{ display: "block" }}>
                    {l.score === "hot" ? "Hot" : "Warm"} lead not contacted: {l.name || "Unknown"}
                  </span>
                  <span className="s" style={{ display: "block" }}>
                    {[l.service_name, l.country].filter(Boolean).join(" · ")} · last message {timeAgo(l.last_activity_at)}
                  </span>
                </span>
                <span className="open">Open →</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty">Nothing waiting. Every hot and warm lead has been contacted.</p>
        )}
      </section>

      <section className="card">
        <div className="head" style={{ alignItems: "baseline" }}>
          <h2>Enquiries by service</h2>
          <span className="note">Click a service to see what leads are asking for</span>
        </div>
        <div className="tbl-wrap">
          <table style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 0 }}>Service</th>
                <th>Leads</th>
                <th>Hot</th>
                <th>Warm</th>
                <th>Cold</th>
                <th>Hot, not contacted</th>
                <th>Booked</th>
                <th style={{ paddingRight: 0 }}>Booking rate</th>
              </tr>
            </thead>
            <tbody>
              {s.services.map((v) => (
                <tr key={v.id}>
                  <td style={{ paddingLeft: 0 }}>
                    <Link className="rowlink" href={`/services/${v.id}?range=${range}`}>{v.name}</Link>
                  </td>
                  <td className="strong">{v.leads}</td>
                  <td className="hotnum">{v.hot}</td>
                  <td>{v.warm}</td>
                  <td>{v.cold}</td>
                  <td className={v.hot_not_contacted > 0 ? "alert" : undefined}>{v.hot_not_contacted}</td>
                  <td>{v.booked}</td>
                  <td className="strong" style={{ paddingRight: 0 }}>{v.leads ? `${Math.round((v.booked / v.leads) * 100)}%` : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
