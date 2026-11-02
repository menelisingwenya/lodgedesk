import { Icon } from "./Icons";
import type { Enquiry } from "./data";
import { money } from "./utils";
import { StatusPill } from "./ui";

interface EnquiryTableProps {
  rows: Enquiry[];
  selectedId?: string | null;
  onOpen: (id: string) => void;
}

export default function EnquiryTable({ rows, selectedId, onOpen }: EnquiryTableProps) {
  return (
    <div className="ld-table">
      <div className="ld-thead" aria-hidden="true">
        <span>Guest</span>
        <span>Enquiry</span>
        <span>Arrival</span>
        <span>Value</span>
        <span>Status</span>
        <span style={{ textAlign: "right" }}>Updated</span>
      </div>

      {rows.map((enquiry) => {
        const price = enquiry.total === null ? "Price to confirm" : money(enquiry.total);
        const handoffNote =
          enquiry.status === "handoff" && enquiry.handoffReason
            ? `. Handoff reason: ${enquiry.handoffReason}`
            : "";

        return (
          <button
            key={enquiry.id}
            type="button"
            className={`ld-row ${selectedId === enquiry.id ? "is-open" : ""} ${
              enquiry.unread ? "is-unread" : ""
            }`}
            onClick={() => onOpen(enquiry.id)}
            aria-label={`${enquiry.guest}, ${enquiry.room} at ${enquiry.branch}. ${enquiry.preview}. ${price}${handoffNote}`}
          >
            <span className="ld-guest">
              <span className="ld-avatar" aria-hidden="true">
                {enquiry.initials}
              </span>
              <span className="ld-guest-text">
                <span className="ld-guest-name">{enquiry.guest}</span>
                <span className="ld-guest-meta">
                  {enquiry.channel}
                  <Icon name="external" size={10} />
                </span>
              </span>
            </span>

            <span className="ld-preview">
              <span className="ld-preview-text">{enquiry.preview}</span>
              <span className="ld-preview-sub">
                <span>{enquiry.branch}</span>
                <span>{enquiry.room}</span>
                <span>
                  {enquiry.nights} night{enquiry.nights > 1 ? "s" : ""}
                </span>
              </span>
              <span className="ld-price-inline">{price}</span>
            </span>

            <span className="ld-cell">
              {enquiry.arrival}
              <small>{enquiry.departure}</small>
            </span>

            <span className={`ld-cell ld-money ${enquiry.total === null ? "is-pending" : ""}`}>
              {price}
              {enquiry.rate !== null && <small>{money(enquiry.rate)} / night</small>}
            </span>

            <span className="ld-status-cell">
              <StatusPill status={enquiry.status} />
              {enquiry.status === "handoff" && enquiry.handoffReason && (
                <small className="ld-handoff-reason">{enquiry.handoffReason}</small>
              )}
            </span>

            <span className="ld-time">{enquiry.updated}</span>
          </button>
        );
      })}
    </div>
  );
}
