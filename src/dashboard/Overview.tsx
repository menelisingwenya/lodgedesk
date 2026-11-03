import type { RefObject } from "react";
import { Icon } from "./Icons";
import EnquiryTable from "./EnquiryTable";
import type { Enquiry } from "./data";

export type AskFilter = "all" | "handoff";

interface OverviewProps {
  first: string;
  rows: Enquiry[];
  totalOpen: number;
  branchCount: number;
  totalBranches: number;
  handoffCount: number;
  newCount: number;
  contacted: number;
  unpriced: number;
  unread: number;
  query: string;
  filter: AskFilter;
  askRef: RefObject<HTMLInputElement | null>;
  onQuery: (value: string) => void;
  onFilter: (filter: AskFilter) => void;
  onOpen: (id: string) => void;
  onViewAll: () => void;
}

export default function Overview({
  first,
  rows,
  totalOpen,
  branchCount,
  totalBranches,
  handoffCount,
  newCount,
  contacted,
  unpriced,
  unread,
  query,
  filter,
  askRef,
  onQuery,
  onFilter,
  onOpen,
  onViewAll,
}: OverviewProps) {
  return (
    <div className="ld-wrap">
      <section className="ld-hero">
        <h1>Hey there, {first}</h1>
        <p className="ld-hero-sub">
          <b>{totalOpen} open conversations</b> from {branchCount} of {totalBranches} branches —{" "}
          <b>{handoffCount}</b> handed off and <b>{unpriced}</b> price{unpriced === 1 ? "" : "s"} to
          confirm.
        </p>

        <div className="ld-narrow">
          <div className="ld-ask">
            <div className="ld-ask-input">
              <input
                ref={askRef}
                type="text"
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder="Search by guest, branch or room…"
                aria-label="Search enquiries"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="ld-ask-row">
              <button
                type="button"
                className={`ld-chip ${filter === "all" ? "is-on" : ""}`}
                onClick={() => onFilter("all")}
              >
                All enquiries
              </button>
              <button
                type="button"
                className={`ld-chip ${filter === "handoff" ? "is-on" : ""}`}
                onClick={() => onFilter("handoff")}
              >
                Handed off
              </button>
            </div>
          </div>
          <p className="ld-ask-hint">
            Press <kbd>/</kbd> to search · <kbd>Esc</kbd> to clear
          </p>
        </div>
      </section>

      <section className="ld-stats" aria-label="Today at a glance">
        <article className="ld-stat">
          <div className="ld-stat-label">
            New enquiries
            <Icon name="inbox" size={13} />
          </div>
          <div className="ld-stat-value">{newCount}</div>
          <p className="ld-stat-note">
            <em>{unread} unread</em> across the desk
          </p>
        </article>

        <article className="ld-stat">
          <div className="ld-stat-label">
            Handed off
            <Icon name="users" size={13} />
          </div>
          <div className="ld-stat-value">{handoffCount}</div>
          <p className="ld-stat-note">Waiting on staff</p>
        </article>

        <article className="ld-stat">
          <div className="ld-stat-label">
            Contacted
            <Icon name="check-circle" size={13} />
          </div>
          <div className="ld-stat-value">{contacted}</div>
          <p className="ld-stat-note">Replies sent to guests</p>
        </article>

        <article className="ld-stat">
          <div className="ld-stat-label">
            Prices to confirm
            <Icon name="dollar" size={13} />
          </div>
          <div className="ld-stat-value">{unpriced}</div>
          <p className="ld-stat-note">Rate not yet confirmed</p>
        </article>
      </section>

      <section className="ld-section">
        <div className="ld-section-head">
          <h2>Recent enquiries</h2>
          <span className="ld-count">
            {filter === "all" && !query ? `${totalOpen} open` : `${rows.length} shown`}
          </span>
          <button type="button" className="ld-link" onClick={onViewAll}>
            All enquiries
            <Icon name="arrow-right" size={13} />
          </button>
        </div>

        {rows.length > 0 ? (
          <EnquiryTable rows={rows.slice(0, 6)} onOpen={onOpen} />
        ) : (
          <div className="ld-empty">
            <h3>No enquiries found</h3>
            <p>
              Nothing matches {query ? `“${query}”` : "this filter"} right now. Try another search or
              clear the filter.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
