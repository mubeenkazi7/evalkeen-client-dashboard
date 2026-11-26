import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/context";
import { formatDateTime, formatPhone, STATUS_LABEL, waLink, type Status } from "@/lib/format";
import { ScorePill } from "@/components/Pills";
import StatusBar from "@/components/StatusBar";
import type { Lead, LeadEvent } from "@/lib/types";

const UUID = /^[0-9a-f-]{36}$/i;

function eventLabel(e: LeadEvent): string | null {
  const d = e.data as Record<string, string | undefined>;
  switch (e.type) {
    case "qualified":
      return `Qualified as ${d.score ?? "?"}${d.service ? ` for ${d.service}` : ""} by the bot`;
    case "owner_alerted":
      return "Owner alerted on WhatsApp";
    case "status_changed": {
      const to = STATUS_LABEL[d.to as Status] ?? d.to;
      return `Status changed to ${to}${d.lost_reason ? ` (${d.lost_reason})` : ""}`;
    }
    case "followup_sent":
      return "Follow-up sent";
    case "followup_replied":
      return "Lead replied to a follow-up";
    case "booked":
      return "Consultation booked";
    case "note":
      return String(d.text ?? "Note");
    default:
      return null;
  }
}

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, client } = await requireClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("id, wa_phone, name, service_name, service_id, country, score, score_points, score_reason, status, lost_reason, bot_state, answers, is_after_hours, first_message_at, last_activity_at")
    .eq("id", id)
    .eq("client_id", client.id)
    .maybeSingle<Lead>();
  if (!lead) notFound();

  const [{ data: events }, { data: labels }] = await Promise.all([
    supabase.from("lead_events").select("id, type, actor, data, created_at").eq("lead_id", id).order("id", { ascending: true }).limit(500).returns<LeadEvent[]>(),
    lead.service_id
      ? supabase.from("service_questions").select("key, label, sort_order").eq("service_id", lead.service_id).order("sort_order").returns<{ key: string; label: string; sort_order: number }[]>()
      : Promise.resolve({ data: [] as { key: string; label: string; sort_order: number }[] }),
  ]);

  const tz = client.timezone;
  const labelOf = new Map((labels ?? []).map((l) => [l.key, l.label]));
  const order = new Map((labels ?? []).map((l) => [l.key, l.sort_order]));
  const answers = [
    ...(lead.service_name ? [{ k: "Service", v: lead.service_name }] : []),
    ...(lead.country ? [{ k: "Country", v: lead.country }] : []),
    ...Object.entries(lead.answers ?? {})
      .sort((a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99))
      .map(([key, v]) => ({ k: labelOf.get(key) ?? key, v })),
  ];
  const chat = (events ?? []).filter((e) => e.type === "message_in" || e.type === "message_out");
  const timeline = [
    { id: 0, label: "First WhatsApp message", when: lead.first_message_at },
    ...(events ?? []).map((e) => ({ id: e.id, label: eventLabel(e), when: e.created_at })).filter((t) => t.label),
  ];

  return (
    <>
      <Link href="/leads" className="back">← All leads</Link>
      <header className="head" style={{ alignItems: "flex-start" }}>
        <div>
          <h1>{lead.name || "Unknown"}</h1>
          <div className="meta">
            <ScorePill score={lead.score} />
            {lead.service_name ? <span>{[lead.service_name, lead.country].filter(Boolean).join(" · ")}</span> : null}
            <span>·</span>
            <span>{formatPhone(lead.wa_phone)}</span>
            {lead.is_after_hours ? <><span>·</span><span>Came in after hours</span></> : null}
          </div>
        </div>
        <a className="wa" href={waLink(lead.wa_phone)} target="_blank" rel="noopener noreferrer">Open in WhatsApp</a>
      </header>

      <StatusBar leadId={lead.id} status={lead.status} readOnly={client.status_owner === "crm"} />

      <div className="row" style={{ alignItems: "flex-start" }}>
        <section className="card" style={{ flex: "3 1 400px" }}>
          <h2>Qualification answers</h2>
          {answers.length ? (
            <div className="answers">
              {answers.map((a) => (
                <div key={a.k}>
                  <div className="k">{a.k}</div>
                  <div className="v">{a.v}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">The lead hasn&apos;t answered any questions yet.</p>
          )}
          {lead.score_reason ? (
            <div className="reason">
              <strong>Why {lead.score}:</strong> {lead.score_reason}
            </div>
          ) : lead.bot_state === "in_progress" ? (
            <p className="note">The bot is still collecting answers from this lead.</p>
          ) : null}
        </section>

        <section className="card" style={{ flex: "2 1 260px" }}>
          <h2>Timeline</h2>
          <div className="timeline">
            {timeline.map((t) => (
              <div className="tl" key={t.id}>
                <span className="dot" />
                <div>
                  <div className="l">{t.label}</div>
                  <div className="w">{formatDateTime(t.when, tz)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <h2>WhatsApp conversation</h2>
        {chat.length ? (
          <div className="chat">
            {chat.map((m) => (
              <div key={m.id} className={`bub ${m.type === "message_in" ? "in" : "out"}`}>
                {String((m.data as { text?: string }).text ?? "")}
                <span className="when">{formatDateTime(m.created_at, tz)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">No messages recorded yet.</p>
        )}
      </section>
    </>
  );
}
