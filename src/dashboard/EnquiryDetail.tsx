import { useState } from "react";
import { Icon } from "./Icons";
import type { Enquiry } from "./data";
import type { StaffUser } from "./auth";
import { money } from "./utils";
import { StatusPill } from "./ui";

interface EnquiryDetailProps {
  enquiry: Enquiry;
  staff: StaffUser;
  backLabel: string;
  onBack: () => void;
  onReply: (id: string, text: string) => void;
  onContact: (id: string) => void;
  onClose: (id: string) => void;
  onNotice: (message: string) => void;
}

const firstName = (name: string) => name.split(" ")[0];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export default function EnquiryDetail({
  enquiry,
  staff,
  backLabel,
  onBack,
  onReply,
  onContact,
  onClose,
  onNotice,
}: EnquiryDetailProps) {
  const [draft, setDraft] = useState("");

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onReply(enquiry.id, text);
    setDraft("");
  };

  const suggest = () => {
    const room = enquiry.room.toLowerCase();
    const availability =
      enquiry.rate === null
        ? `I don't have a confirmed rate for the ${room} yet, so I've asked our ${enquiry.branch} team to confirm it for you`
        : `the ${room} is available for ${enquiry.arrival}–${enquiry.departure} at ${money(
            enquiry.rate,
          )} per night`;

    const reply =
      enquiry.status === "handoff"
        ? `Hi ${firstName(enquiry.guest)}, thank you for your patience — I'm taking over from LodgeDesk. I'll confirm the ${room} at ${enquiry.branch} for ${enquiry.arrival}–${enquiry.departure} and call you before the end of the day.`
        : `Hi ${firstName(enquiry.guest)}, thank you for your message. ${availability}. I can hold it for you until 5pm today — just reply here to confirm.`;

    setDraft(reply);
    onNotice("Draft ready — review before sending.");
  };

  const summaryState =
    enquiry.status === "handoff" ? "paused" : enquiry.status === "closed" ? "closed" : "live";

  return (
    <div className="ld-detail">
      <button type="button" className="ld-back" onClick={onBack}>
        <Icon name="arrow-left" size={15} />
        {backLabel}
      </button>

      <div className="ld-detail-head">
        <span className="ld-avatar" aria-hidden="true">
          {enquiry.initials}
        </span>
        <div className="ld-detail-title">
          <h1>
            {enquiry.guest}
            <StatusPill status={enquiry.status} />
          </h1>
          <p>
            {enquiry.ref} · {enquiry.channel} · {enquiry.room} at {enquiry.branch}
          </p>
        </div>
        <div className="ld-detail-actions">
          {(enquiry.status === "new" || enquiry.status === "handoff") && (
            <button type="button" className="ld-btn ghost" onClick={() => onContact(enquiry.id)}>
              <Icon name="user" size={14} />
              {enquiry.status === "handoff" ? "Take over" : "Mark contacted"}
            </button>
          )}
          <button
            type="button"
            className="ld-btn solid"
            onClick={() => onClose(enquiry.id)}
            disabled={enquiry.status === "closed"}
          >
            <Icon name="check" size={14} />
            {enquiry.status === "closed" ? "Closed" : "Close enquiry"}
          </button>
        </div>
      </div>

      <div className="ld-meta">
        <div className="ld-meta-item">
          <span>
            <Icon name="calendar" size={11} />
            Arrival
          </span>
          <strong>{enquiry.arrival}</strong>
          <small>Departure {enquiry.departure}</small>
        </div>
        <div className="ld-meta-item">
          <span>
            <Icon name="bed" size={11} />
            Room
          </span>
          <strong>{enquiry.room}</strong>
          <small>{enquiry.branch}</small>
        </div>
        <div className="ld-meta-item">
          <span>
            <Icon name="users" size={11} />
            Guests
          </span>
          <strong>
            {enquiry.guests} {enquiry.guests === 1 ? "guest" : "guests"}
          </strong>
          <small>
            {enquiry.nights} night{enquiry.nights > 1 ? "s" : ""}
          </small>
        </div>
        <div className="ld-meta-item">
          <span>
            <Icon name="dollar" size={11} />
            Quote
          </span>
          <strong>{enquiry.total === null ? "Price to confirm" : money(enquiry.total)}</strong>
          <small>
            {enquiry.rate === null ? "Rate not confirmed" : `${money(enquiry.rate)} per night`}
          </small>
        </div>
      </div>

      <div className="ld-summary">
        <Icon name="spark" size={16} className="ld-summary-icon" />
        <div>
          <div className="ld-summary-label">
            AI summary
            <em>{summaryState}</em>
          </div>
          <p>{enquiry.summary}</p>
        </div>
      </div>

      {enquiry.status === "handoff" && (
        <div className="ld-handoff">
          <Icon name="user" size={15} />
          <span>
            {firstName(enquiry.guest)} asked for a person
            {enquiry.handoffReason ? ` (${enquiry.handoffReason.toLowerCase()})` : ""}. LodgeDesk has
            paused replies to this conversation — reply below or take it over.
          </span>
        </div>
      )}

      <div className="ld-thread">
        {enquiry.messages.map((message) => {
          const mine = message.role !== "guest";
          const staffName = message.author ?? staff.displayName;
          return (
            <div key={message.id} className={`ld-msg ${message.role} ${mine ? "mine" : ""}`}>
              <span className="ld-msg-avatar" aria-hidden="true">
                {message.role === "guest" ? (
                  enquiry.initials
                ) : message.role === "assistant" ? (
                  <Icon name="spark" size={13} />
                ) : (
                  initialsOf(staffName)
                )}
              </span>
              <div className="ld-msg-body">
                <div className="ld-msg-who">
                  {message.role === "guest"
                    ? `${enquiry.guest} · ${enquiry.channel}`
                    : message.role === "assistant"
                      ? "LodgeDesk AI"
                      : `${staffName} · ${staff.role}`}
                </div>
                <div className="ld-bubble">{message.text}</div>
                <div className="ld-msg-time">{message.time}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ld-reply">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              send();
            }
          }}
          placeholder={`Reply to ${firstName(enquiry.guest)}…`}
          aria-label={`Reply to ${enquiry.guest}`}
        />
        <div className="ld-reply-row">
          <button type="button" className="ld-suggest" onClick={suggest}>
            <Icon name="spark" size={13} />
            Draft with AI
          </button>
          <span className="ld-reply-hint">Ctrl + Enter to send · guest sees this in chat</span>
          <button type="button" className="ld-btn solid" onClick={send} disabled={!draft.trim()}>
            <Icon name="send" size={14} />
            Send reply
          </button>
        </div>
      </div>
    </div>
  );
}
