"use client";

import { useState, useTransition } from "react";
import { updateStatus } from "@/app/actions";
import { STATUSES, STATUS_LABEL, type Status } from "@/lib/format";

export default function StatusBar({ leadId, status, readOnly }: { leadId: string; status: Status; readOnly: boolean }) {
  const [current, setCurrent] = useState<Status>(status);
  const [error, setError] = useState("");
  const [askLost, setAskLost] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  function set(next: Status, lostReason?: string) {
    if (next === current && next !== "lost") return;
    setError("");
    const before = current;
    setCurrent(next);
    start(async () => {
      const res = await updateStatus(leadId, next, lostReason);
      if (res?.error) {
        setCurrent(before);
        setError(res.error);
      } else {
        setAskLost(false);
        setReason("");
      }
    });
  }

  return (
    <section className="card statusbar" aria-label="Lead status">
      <span style={{ fontSize: 14, fontWeight: 600, marginRight: 6 }}>Status</span>
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          className={`st-btn ${s}${current === s ? " on" : ""}`}
          aria-pressed={current === s}
          disabled={readOnly || pending}
          onClick={() => (s === "lost" ? setAskLost(true) : set(s))}
        >
          {STATUS_LABEL[s]}
        </button>
      ))}
      <span className="st-hint">{readOnly ? "Status is managed in your CRM" : pending ? "Saving…" : "Every change is saved to the lead's timeline"}</span>
      {askLost && !readOnly ? (
        <form
          style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}
          onSubmit={(e) => {
            e.preventDefault();
            set("lost", reason);
          }}
        >
          <label htmlFor="lost-reason" style={{ position: "absolute", left: -9999 }}>Reason (optional)</label>
          <input
            id="lost-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason, e.g. went with another consultant (optional)"
            maxLength={200}
            style={{ flex: "1 1 280px", border: "1px solid #dad7cf", borderRadius: 8, padding: "10px 12px", fontSize: 14 }}
          />
          <button type="submit" className="st-btn on lost">Mark as lost</button>
          <button type="button" className="st-btn" onClick={() => setAskLost(false)}>Cancel</button>
        </form>
      ) : null}
      {error ? <p className="st-err" role="alert">{error}</p> : null}
    </section>
  );
}
