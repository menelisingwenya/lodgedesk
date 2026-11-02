import type { EnquiryStatus } from "./data";
import { STATUS_META } from "./data";

export function StatusPill({ status }: { status: EnquiryStatus }) {
  const meta = STATUS_META[status];
  return <span className={`ld-status tone-${meta.tone}`}>{meta.label}</span>;
}
