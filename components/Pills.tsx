import { STATUS_LABEL, scoreLabel, type Status } from "@/lib/format";

export function ScorePill({ score }: { score: string | null }) {
  return <span className={`pill ${score ?? "none"}`}>{scoreLabel(score)}</span>;
}

export function StatusPill({ status }: { status: Status }) {
  return <span className={`pill ${status}`}>{STATUS_LABEL[status] ?? status}</span>;
}
