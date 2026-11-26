import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/context";
import { parseRange, rangeBounds, timeAgo } from "@/lib/format";
import { ScorePill, StatusPill } from "@/components/Pills";
import type { Lead, ServiceDetail } from "@/lib/types";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function ServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const range = parseRange((await searchParams).range);
  const { from, to } = rangeBounds(range);
  const { supabase, client } = await requireClient();

  const { data: svc } = await supabase.from("services").select("id, name").eq("id", id).eq("client_id", client.id).maybeSingle<{ id: string; name: string }>();
  if (!svc) notFound();

  const [{ data: detail }, { data: leads }] = await Promise.all([
    supabase.rpc("service_detail", { p_service_id: id, p_from: from.toISOString(), p_to: to.toISOString() }),
    supabase
      .from("leads")
      .select("id, name, country, score, status, last_activity_at")
      .eq("client_id", client.id)
      .eq("service_id", id)
      .order("last_activity_at", { ascending: false })
      .limit(20)
      .returns<Pick<Lead, "id" | "name" | "country" | "score" | "status" | "last_activity_at">[]>(),
  ]);
  const d = (detail ?? { totals: { leads: 0, hot: 0, warm: 0, cold: 0, booked: 0 }, countries: [], breakdowns: [] }) as ServiceDetail;
  const t = d.totals;
  const tiles = [
    { label: "Qualified leads", value: t.leads, color: "var(--ink)" },
    { label: "Hot", value: t.hot, color: "var(--hot)" },
    { label: "Warm", value: t.warm, color: "var(--warm)" },
    { label: "Cold", value: t.cold, color: "var(--cold)" },
    { label: "Booked", value: t.booked, color: "var(--booked)" },
    { label: "Booking rate", value: t.leads ? `${Math.round((t.booked / t.leads) * 100)}%` : "–", color: "var(--ink)" },
  ];
  const cMax = Math.max(1, ...d.countries.map((c) => c.leads));

  return (
    <>
      <Link href={`/?range=${range}`} className="back">← Overview</Link>
      <header className="head">
        <div>
          <h1>{svc.name}</h1>
          <p className="sub">Last {range} days · from the bot&apos;s WhatsApp conversations</p>
        </div>
        <div className="seg" role="group" aria-label="Period">
          <Link href={`/services/${id}?range=7`} className={range === "7" ? "on" : undefined}>7 days</Link>
          <Link href={`/services/${id}?range=30`} className={range === "30" ? "on" : undefined}>30 days</Link>
        </div>
      </header>

      <div className="tiles">
        {tiles.map((x) => (
          <div className="tile" key={x.label}>
            <div className="label">{x.label}</div>
            <div className="value" style={{ color: x.color }}>{x.value}</div>
          </div>
        ))}
      </div>

      <section className="card">
        <h2>Countries asked for</h2>
        {d.countries.length ? (
          <div className="tbl-wrap">
            <table style={{ minWidth: 420 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 0 }}>Country</th>
                  <th style={{ width: "45%" }}>Leads</th>
                  <th>Hot</th>
                  <th style={{ paddingRight: 0 }}>Booked</th>
                </tr>
              </thead>
              <tbody>
                {d.countries.map((c) => (
                  <tr key={c.name}>
                    <td className="strong" style={{ paddingLeft: 0 }}>{c.name}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="bar" style={{ flex: 1, height: 8 }}><span style={{ width: `${Math.round((c.leads / cMax) * 100)}%` }} /></div>
                        <span style={{ width: 24, textAlign: "right" }}>{c.leads}</span>
                      </div>
                    </td>
                    <td className="hotnum">{c.hot}</td>
                    <td style={{ paddingRight: 0 }}>{c.booked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No leads qualified for this service in this period yet.</p>
        )}
      </section>

      {d.breakdowns.length ? (
        <div className="bd-grid">
          {d.breakdowns.map((b) => {
            const max = Math.max(1, ...b.items.map((i) => i.n));
            return (
              <section className="card" key={b.title} style={{ gap: 12 }}>
                <h2 style={{ fontSize: 15 }}>{b.title}</h2>
                {b.items.map((i) => (
                  <div className="bar-item" key={i.label}>
                    <div className="top"><span>{i.label}</span><strong>{i.n}</strong></div>
                    <div className="bar"><span style={{ width: `${Math.round((i.n / max) * 100)}%` }} /></div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      ) : null}

      <section className="card" style={{ gap: 8 }}>
        <h2>Recent leads for this service</h2>
        {leads && leads.length ? (
          <div className="att">
            {leads.map((l) => (
              <Link key={l.id} href={`/leads/${l.id}`} style={{ flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, flex: "1 1 160px" }}>{l.name || "Unknown"}</span>
                <span style={{ color: "var(--muted)", flex: "1 1 120px" }}>{l.country || "–"}</span>
                <ScorePill score={l.score} />
                <StatusPill status={l.status} />
                <span style={{ color: "var(--muted)", fontSize: 13, minWidth: 70, textAlign: "right" }}>{timeAgo(l.last_activity_at)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty">No leads are currently on this service.</p>
        )}
      </section>
    </>
  );
}
