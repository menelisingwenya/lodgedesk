import { useState } from "react";
import { Icon } from "./Icons";
import { STATUS_META, type Enquiry } from "./data";
import type { StaffUser } from "./auth";
import { matchesQuery } from "./utils";

export type View = "overview" | "enquiries" | "rooms" | "branches";

interface SidebarProps {
  enquiries: Enquiry[];
  selectedId: string | null;
  view: View;
  query: string;
  openCount: number;
  user: StaffUser;
  onNavigate: (view: View) => void;
  onSearch: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onSignOut: () => void;
}

const NAV: { id: View; label: string; icon: string; badge?: string }[] = [
  { id: "enquiries", label: "Enquiries", icon: "inbox" },
  { id: "rooms", label: "Rooms & rates", icon: "bed" },
  { id: "branches", label: "Branches", icon: "building" },
];

export default function Sidebar({
  enquiries,
  selectedId,
  view,
  query,
  openCount,
  user,
  onNavigate,
  onSearch,
  onSelect,
  onNew,
  onSignOut,
}: SidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const recent = enquiries.filter((e) => matchesQuery(e, query)).slice(0, 14);

  return (
    <aside className="ld-sidebar" aria-label="LodgeDesk navigation">
      <div className="ld-sidebar-inner">
        <div className="ld-brand">
          <span className="ld-brand-tile">
            <img src="/brand/harris-mark.png" alt="" />
          </span>
          <span className="ld-brand-name">
            LodgeDesk
            <span className="ld-brand-sub">Harris Lodges</span>
          </span>
        </div>

        <button className="ld-new" type="button" onClick={onNew}>
          <Icon name="plus" size={17} />
          New
        </button>

        <nav className="ld-nav" aria-label="Sections">
          <button type="button" className="ld-nav-item" onClick={onSearch}>
            <Icon name="search" size={17} />
            Search
          </button>
          <button
            type="button"
            className={`ld-nav-item ${view === "overview" && !selectedId ? "is-active" : ""}`}
            onClick={() => onNavigate("overview")}
            aria-current={view === "overview" && !selectedId ? "page" : undefined}
          >
            <Icon name="chart" size={17} />
            Overview
          </button>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ld-nav-item ${view === item.id && !selectedId ? "is-active" : ""}`}
              onClick={() => onNavigate(item.id)}
              aria-current={view === item.id && !selectedId ? "page" : undefined}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
              {item.id === "enquiries" ? (
                <span className="ld-nav-count">{openCount}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="ld-side-section">
          <button className="ld-side-title" type="button" onClick={() => onNavigate("enquiries")}>
            Today&rsquo;s enquiries
            <Icon name="chevron-down" size={14} />
          </button>
          <div className="ld-side-actions">
            <button
              className="ld-icon-btn"
              type="button"
              title="Filter enquiries"
              onClick={() => onNavigate("enquiries")}
            >
              <Icon name="filter" size={16} />
            </button>
          </div>
        </div>

        <div className="ld-convo-list" role="list">
          {recent.map((enquiry) => (
            <button
              key={enquiry.id}
              type="button"
              role="listitem"
              className={`ld-convo ${selectedId === enquiry.id ? "is-active" : ""} ${
                enquiry.unread ? "is-unread" : ""
              }`}
              onClick={() => onSelect(enquiry.id)}
              title={`${enquiry.guest} — ${enquiry.branch}, ${enquiry.room}`}
            >
              <span className={`ld-dot tone-${STATUS_META[enquiry.status].tone}`} />
              <span className="ld-convo-label">{enquiry.guest}</span>
            </button>
          ))}
          {recent.length === 0 && (
            <p className="ld-convo-empty">
              No enquiries match &ldquo;{query}&rdquo;.
            </p>
          )}
        </div>

        <div className="ld-side-foot">
          <button
            type="button"
            className="ld-user-trigger"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="ld-user-avatar">{user.initials}</span>
            <span className="ld-user-meta">
              <b>{user.displayName}</b>
              <span>
                · {user.role}
                <Icon name="chevron-down" size={12} />
              </span>
            </span>
          </button>
          <button className="ld-icon-btn" type="button" title="Workspace settings">
            <Icon name="sliders" size={17} />
          </button>

          {menuOpen && (
            <div className="ld-user-menu" role="menu">
              <p className="ld-user-menu-email">{user.email}</p>
              <button
                type="button"
                role="menuitem"
                className="ld-user-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onSignOut();
                }}
              >
                <Icon name="logout" size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
