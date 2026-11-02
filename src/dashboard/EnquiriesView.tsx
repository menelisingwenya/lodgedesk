import { Icon } from "./Icons";
import EnquiryTable from "./EnquiryTable";
import type { Enquiry } from "./data";
import type { AskFilter } from "./Overview";

interface EnquiriesViewProps {
  rows: Enquiry[];
  all: Enquiry[];
  query: string;
  filter: AskFilter;
  onQuery: (value: string) => void;
  onFilter: (filter: AskFilter) => void;
  onOpen: (id: string) => void;
}

const FILTERS: { id: AskFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "handoff", label: "Handed off" },
];

export default function EnquiriesView({
  rows,
  all,
  query,
  filter,
  onQuery,
  onFilter,
  onOpen,
}: EnquiriesViewProps) {
  const handoff = all.filter((e) => e.status === "handoff").length;
  const contacted = all.filter((e) => e.status === "contacted").length;
  const closed = all.filter((e) => e.status === "closed").length;

  return (
    <div className="ld-wrap">
      <header className="ld-page-head">
        <div>
          <h1>Enquiries</h1>
          <p>
            Every conversation LodgeDesk has opened with a guest. {handoff} handed off, {contacted}{" "}
            contacted, {closed} closed.
          </p>
        </div>
      </header>

      <div className="ld-toolbar">
        <div className="ld-filter-row" style={{ marginLeft: 0 }}>
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ld-filter-chip ${filter === item.id ? "is-on" : ""}`}
              onClick={() => onFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
          <span className="ld-toolbar-count">{rows.length} shown</span>
        </div>

        <label className="ld-search">
          <Icon name="search" size={15} />
          <input
            type="text"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search guest, branch or room"
            aria-label="Search enquiries"
          />
          {query && (
            <button
              type="button"
              className="ld-search-clear"
              onClick={() => onQuery("")}
              aria-label="Clear search"
            >
              <Icon name="close" size={13} />
            </button>
          )}
        </label>
      </div>

      {rows.length > 0 ? (
        <EnquiryTable rows={rows} onOpen={onOpen} />
      ) : (
        <div className="ld-empty">
          <h3>No enquiries found</h3>
          <p>Try a different search, or clear the filter to see the whole inbox.</p>
        </div>
      )}
    </div>
  );
}
