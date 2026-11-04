import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./dashboard.css";
import Sidebar, { type View } from "./Sidebar";
import Overview, { type AskFilter } from "./Overview";
import EnquiriesView from "./EnquiriesView";
import EnquiryDetail from "./EnquiryDetail";
import RoomsView from "./RoomsView";
import BranchesView from "./BranchesView";
import { BRANCHES, type Enquiry, type Message, type EnquiryStatus } from "./data";
import { ENQUIRIES } from "./mockData";
import { matchesQuery, openEnquiries, pricesToConfirm } from "./utils";
import { getCurrentUser, onAuthChange, signOut, type StaffUser } from "./auth";
import Login from "./Login";
import { Icon } from "./Icons";

const now = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const firstName = (name: string) => name.split(" ")[0];

export default function Dashboard() {
  const [user, setUser] = useState<StaffUser | null>(() => getCurrentUser());

  useEffect(() => onAuthChange(setUser), []);

  if (!user) return <Login />;

  return <DashboardShell user={user} />;
}

function DashboardShell({ user }: { user: StaffUser }) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(ENQUIRIES);
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AskFilter>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const rawView = params.get("view");
  const view: View =
    rawView === "enquiries" || rawView === "rooms" || rawView === "branches" ? rawView : "overview";
  const selectedId = params.get("enquiry");

  const askRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | null>(null);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [view, selectedId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (event.key === "/" && !typing) {
        event.preventDefault();
        setParams({});
        requestAnimationFrame(() => askRef.current?.focus());
      }
      if (event.key === "Escape") {
        if (typing) (target as HTMLInputElement).blur();
        setQuery("");
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setParams]);

  const open = useMemo(() => openEnquiries(enquiries), [enquiries]);
  const newCount = enquiries.filter((e) => e.status === "new").length;
  const handoffCount = enquiries.filter((e) => e.status === "handoff").length;
  const contacted = enquiries.filter((e) => e.status === "contacted").length;
  const unread = enquiries.filter((e) => e.unread).length;
  const unpriced = pricesToConfirm(enquiries).length;
  const branchCount = new Set(open.map((e) => e.branch)).size;
  const totalBranches = BRANCHES.filter((branch) => branch.is_open).length;

  const visible = useMemo(() => {
    const list =
      filter === "handoff" ? enquiries.filter((e) => e.status === "handoff") : enquiries;
    return list.filter((e) => matchesQuery(e, query));
  }, [enquiries, filter, query]);

  const selected = selectedId ? enquiries.find((e) => e.id === selectedId) : undefined;

  const navigate = (next: View) => {
    setParams(next === "overview" ? {} : { view: next });
    setSidebarOpen(false);
  };

  const openEnquiry = (id: string) => {
    setParams({ view, enquiry: id });
    setSidebarOpen(false);
  };

  const startNew = () => {
    setParams({});
    setQuery("");
    setFilter("all");
    setSidebarOpen(false);
    requestAnimationFrame(() => askRef.current?.focus());
  };

  const focusSearch = () => {
    setParams({});
    setSidebarOpen(false);
    requestAnimationFrame(() => askRef.current?.focus());
  };

  const patch = (id: string, update: (enquiry: Enquiry) => Enquiry) => {
    setEnquiries((list) => list.map((e) => (e.id === id ? update(e) : e)));
  };

  const reply = (id: string, text: string) => {
    const message: Message = {
      id: `m-${Date.now()}`,
      role: "staff",
      author: user.displayName,
      text,
      time: now(),
    };
    patch(id, (enquiry) => ({
      ...enquiry,
      messages: [...enquiry.messages, message],
      status:
        enquiry.status === "closed" ? enquiry.status : ("contacted" as EnquiryStatus),
      unread: false,
      updated: "now",
      preview: text,
    }));
    const guest = enquiries.find((e) => e.id === id);
    notify(`Reply sent to ${guest ? firstName(guest.guest) : "guest"}`);
  };

  const markContacted = (id: string) => {
    const target = enquiries.find((e) => e.id === id);
    patch(id, (enquiry) => ({
      ...enquiry,
      status: "contacted" as EnquiryStatus,
      unread: false,
    }));
    notify(`${target?.ref ?? "Enquiry"} marked as contacted`);
  };

  const closeEnquiry = (id: string) => {
    const target = enquiries.find((e) => e.id === id);
    patch(id, (enquiry) => ({ ...enquiry, status: "closed" as EnquiryStatus, unread: false }));
    notify(`${target?.ref ?? "Enquiry"} closed`);
  };

  const openInbox = () => {
    setFilter("all");
    setParams({ view: "enquiries" });
  };

  return (
    <div className={`ld-root ${sidebarOpen ? "sidebar-open" : ""}`}>
      <Sidebar
        enquiries={enquiries}
        selectedId={selectedId}
        view={view}
        query={query}
        openCount={open.length}
        user={user}
        onNavigate={navigate}
        onSearch={focusSearch}
        onSelect={openEnquiry}
        onNew={startNew}
        onSignOut={signOut}
      />

      {sidebarOpen && (
        <button
          type="button"
          className="ld-scrim"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="ld-main">
        <div className="ld-topbar">
          <div className="ld-topbar-left">
            <button
              type="button"
              className="ld-icon-btn ld-menu-btn"
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Icon name="menu" size={18} />
            </button>
          </div>

          <div className="ld-pill">
            <span className="ld-live-dot" aria-hidden="true" />
            <span className="ld-hide-sm">Harris Lodges · Staff</span>
            <span className="ld-pill-sep" aria-hidden="true" />
            <button type="button" onClick={openInbox}>
              {unread} unread
            </button>
          </div>

          <div className="ld-topbar-right">
            <button
              type="button"
              className="ld-icon-btn ld-bell"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => notify(unread > 0 ? `${unread} unread enquiries in the inbox` : "You're all caught up")}
            >
              <Icon name="bell" size={17} />
            </button>
          </div>
        </div>

        <div className="ld-scroll" ref={scrollRef}>
          {selected ? (
            <EnquiryDetail
              enquiry={selected}
              staff={user}
              backLabel={
                view === "overview"
                  ? "Back to overview"
                  : view === "rooms"
                    ? "Back to rooms & rates"
                    : view === "branches"
                      ? "Back to branches"
                      : "Back to enquiries"
              }
              onBack={() => setParams(view === "overview" ? {} : { view })}
              onReply={reply}
              onContact={markContacted}
              onClose={closeEnquiry}
              onNotice={notify}
            />
          ) : view === "overview" ? (
            <Overview
              first={firstName(user.displayName)}
              rows={visible}
              totalOpen={open.length}
              branchCount={branchCount}
              totalBranches={totalBranches}
              handoffCount={handoffCount}
              newCount={newCount}
              contacted={contacted}
              unpriced={unpriced}
              unread={unread}
              query={query}
              filter={filter}
              askRef={askRef}
              onQuery={setQuery}
              onFilter={setFilter}
              onOpen={openEnquiry}
              onViewAll={() => navigate("enquiries")}
            />
          ) : view === "enquiries" ? (
            <EnquiriesView
              rows={visible}
              all={enquiries}
              query={query}
              filter={filter}
              onQuery={setQuery}
              onFilter={setFilter}
              onOpen={openEnquiry}
            />
          ) : view === "rooms" ? (
            <RoomsView onNotice={notify} user={user} />
          ) : (
            <BranchesView onNotice={notify} user={user} />
          )}
        </div>
      </main>

      {toast && (
        <div className="ld-toast" role="status">
          <Icon name="check-circle" size={15} />
          {toast}
        </div>
      )}
    </div>
  );
}
