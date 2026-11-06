import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./dashboard.css";
import { supabase } from "../lib/supabase";
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

  useEffect(() => {
    async function loadLiveEnquiries() {
      try {
        // Fetch enquiries joined with branch and room_type names
        const { data, error } = await supabase
          .from("enquiries")
          .select(`
            *,
            branches ( name ),
            room_types ( name )
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!data || data.length === 0) return;

        // Collect all unique conversation IDs so we can load messages in one query
        const convIds = [
          ...new Set(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data as any[])
              .map((item) => item.conversation_id)
              .filter(Boolean)
          ),
        ] as string[];

        // Fetch all messages for those conversations in one round-trip
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let msgsByConv: Record<string, any[]> = {};
        if (convIds.length > 0) {
          const { data: msgData, error: msgError } = await supabase
            .from("messages")
            .select("id, conversation_id, role, content, created_at")
            .in("conversation_id", convIds)
            .order("created_at", { ascending: true });

          if (!msgError && msgData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            msgsByConv = (msgData as any[]).reduce((acc, msg) => {
              const key = msg.conversation_id as string;
              if (!acc[key]) acc[key] = [];
              acc[key].push(msg);
              return acc;
            }, {} as Record<string, any[]>);
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const liveData: Enquiry[] = (data as any[]).map((item, index) => {
          // Resolve branch and room names from the join
          const branchName: string =
            item.branches?.name ?? "Harris Lodge";
          const roomName: string =
            item.room_types?.name ?? "Standard";

          // Format dates
          const fmtDate = (d: string | null) => {
            if (!d) return "—";
            const dt = new Date(d);
            return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          };
          const arrival = fmtDate(item.check_in);
          const departure = fmtDate(item.check_out);
          const nights =
            item.check_in && item.check_out
              ? Math.max(
                  1,
                  Math.round(
                    (new Date(item.check_out).getTime() - new Date(item.check_in).getTime()) /
                      86_400_000
                  )
                )
              : 1;

          // Map status
          const statusMap: Record<string, EnquiryStatus> = {
            new: "new",
            handed_off: "handoff",
            contacted: "contacted",
            closed: "closed",
          };
          const status: EnquiryStatus = statusMap[item.status] ?? "new";

          // Build messages from real conversation history
          const rawMsgs = item.conversation_id
            ? (msgsByConv[item.conversation_id] ?? [])
            : [];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const messages: Message[] = rawMsgs.map((msg: any) => {
            const time = new Date(msg.created_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return {
              id: String(msg.id),
              role: (msg.role === "assistant" ? "assistant" : "guest") as Message["role"],
              text: String(msg.content),
              time,
            };
          });

          // Fall back to a single placeholder if we have no conversation yet
          if (messages.length === 0) {
            messages.push({
              id: `m-live-${index}`,
              role: "guest",
              text: item.contact
                ? `Contact: ${item.contact}`
                : "New enquiry received via web chat.",
              time: new Date(item.created_at).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            });
          }

          const lastMsg = messages[messages.length - 1];
          const preview =
            lastMsg?.text.slice(0, 120) ?? item.contact ?? "New enquiry";

          const summaryParts: string[] = [];
          if (branchName) summaryParts.push(branchName);
          if (roomName) summaryParts.push(roomName);
          if (item.check_in) summaryParts.push(`Check-in ${arrival}`);
          if (item.check_out) summaryParts.push(`Check-out ${departure}`);
          if (item.guests) summaryParts.push(`${item.guests} guest${item.guests > 1 ? "s" : ""}`);
          if (item.contact) summaryParts.push(`Contact: ${item.contact}`);
          if (item.notes) summaryParts.push(item.notes);

          return {
            id: String(item.id),
            ref: `HL-${1060 + index}`,
            guest: item.guest_name || "Unknown Guest",
            initials: (item.guest_name || "UG")
              .split(" ")
              .filter(Boolean)
              .map((n: string) => n[0]?.toUpperCase() ?? "")
              .join("")
              .substring(0, 2),
            channel: "Web chat" as const,
            branch: branchName as Enquiry["branch"],
            room: roomName as Enquiry["room"],
            arrival,
            departure,
            nights,
            guests: item.guests ?? 1,
            rate: null,
            total: null,
            status,
            handoffReason: item.handoff_reason ?? undefined,
            updated: "Just now",
            unread: status === "new" || status === "handoff",
            preview,
            summary: summaryParts.join(" · ") || "Live enquiry",
            messages,
          };
        });

        setEnquiries([...liveData, ...ENQUIRIES]);
      } catch (err) {
        console.error("Dashboard database fetch error:", err);
      }
    }
    loadLiveEnquiries();
  }, []);
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

