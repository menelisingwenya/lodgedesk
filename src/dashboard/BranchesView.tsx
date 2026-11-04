import { useState, useEffect } from "react";
import { Icon } from "./Icons";
import { getCurrentUser, type StaffUser } from "./auth";
import {
  loadBranches,
  loadBranchRoomTypes,
  addBranch,
  updateBranchIsOpen,
  type Branch,
  type BranchRoomType,
} from "../lib/lodgeData";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BranchesView({
  onNotice,
  user,
}: {
  onNotice: (message: string) => void;
  user?: StaffUser;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchRoomTypes, setBranchRoomTypes] = useState<BranchRoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [address, setAddress] = useState("");
  const [directions, setDirections] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const activeUser = user ?? getCurrentUser();
  const isOwner = activeUser?.role?.toLowerCase() === "owner";

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [bList, brtList] = await Promise.all([
        loadBranches(),
        loadBranchRoomTypes(),
      ]);
      setBranches(bList);
      setBranchRoomTypes(brtList);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
      }
      setError("Could not load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [bList, brtList] = await Promise.all([
          loadBranches(),
          loadBranchRoomTypes(),
        ]);
        if (active) {
          setBranches(bList);
          setBranchRoomTypes(brtList);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (active) {
          if (err instanceof Error) {
            console.error(err.message);
          }
          setError("Could not load data. Please try again.");
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const roomsForBranch = (branchId: string) =>
    branchRoomTypes
      .filter((brt) => brt.branch_id === branchId)
      .reduce((sum, brt) => sum + brt.room_count, 0);

  async function handleToggleOpen(branch: Branch) {
    if (!isOwner) return;
    try {
      const nextOpen = !branch.is_open;
      await updateBranchIsOpen(branch.id, nextOpen);
      setBranches((prev) =>
        prev.map((b) => (b.id === branch.id ? { ...b, is_open: nextOpen } : b))
      );
      onNotice(`${branch.name} is now ${nextOpen ? "open" : "closed"}.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
      }
      onNotice("Could not update branch status. Please try again.");
    }
  }

  async function handleAddBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      const finalSlug = slug.trim() || slugify(name);
      const newBranch = await addBranch({
        name,
        slug: finalSlug,
        address: address || null,
        directions: directions || null,
        is_open: isOpen,
      });

      setBranches((prev) =>
        [...prev, newBranch].sort((a, b) => a.name.localeCompare(b.name))
      );
      setShowAddForm(false);
      setName("");
      setSlug("");
      setIsSlugManual(false);
      setAddress("");
      setDirections("");
      setIsOpen(true);
      onNotice(`Branch "${newBranch.name}" added successfully.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
      }
      onNotice("Could not add branch. Please check inputs and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ld-wrap">
      <header className="ld-page-head">
        <div>
          <h1>Branches</h1>
          <p>
            Harris Lodges branches and properties across Bulawayo and beyond.
          </p>
        </div>
        <div className="ld-page-actions">
          {isOwner && !loading && !error && (
            <button
              className="ld-btn solid"
              type="button"
              onClick={() => setShowAddForm((open) => !open)}
            >
              <Icon name="plus" size={14} />
              {showAddForm ? "Cancel" : "Add branch"}
            </button>
          )}
        </div>
      </header>

      {showAddForm && isOwner && (
        <form
          onSubmit={handleAddBranch}
          style={{
            marginTop: 20,
            marginBottom: 24,
            padding: 20,
            background: "var(--ld-panel)",
            border: "1px solid var(--ld-line)",
            borderRadius: 12,
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "var(--ld-ink)" }}>
            Add new branch
          </h3>
          <div style={{ display: "grid", gap: 14 }}>
            <label className="login-field">
              <span>Branch Name</span>
              <input
                type="text"
                required
                placeholder="e.g. Prime Harris"
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  if (!isSlugManual) {
                    setSlug(slugify(val));
                  }
                }}
                disabled={submitting}
              />
            </label>

            <label className="login-field">
              <span>Slug (identifier)</span>
              <input
                type="text"
                required
                placeholder="e.g. prime-harris"
                value={slug}
                onChange={(e) => {
                  setIsSlugManual(true);
                  setSlug(e.target.value);
                }}
                disabled={submitting}
              />
            </label>

            <label className="login-field">
              <span>Address</span>
              <input
                type="text"
                placeholder="e.g. City centre, Bulawayo"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={submitting}
              />
            </label>

            <label className="login-field">
              <span>Directions</span>
              <textarea
                placeholder="e.g. Corner of 10th Ave and Main St..."
                value={directions}
                onChange={(e) => setDirections(e.target.value)}
                disabled={submitting}
                style={{
                  width: "100%",
                  minHeight: 64,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--ld-line)",
                  background: "var(--ld-panel-2)",
                  color: "var(--ld-ink)",
                  fontFamily: "inherit",
                  fontSize: 14,
                }}
              />
            </label>

            <div>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--ld-ink)",
                }}
              >
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={(e) => setIsOpen(e.target.checked)}
                  disabled={submitting}
                />
                Open for bookings
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="ld-btn solid" type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add branch"}
              </button>
              <button
                className="ld-btn ghost"
                type="button"
                onClick={() => setShowAddForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading && (
        <p className="ld-ask-hint" style={{ textAlign: "left", marginTop: 24 }}>
          Loading branches…
        </p>
      )}

      {error && !loading && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <p style={{ color: "var(--ld-ink-dim)", marginBottom: 12 }}>
            Could not load data. Please try again.
          </p>
          <button className="ld-btn ghost" type="button" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && branches.length === 0 && (
        <div style={{ marginTop: 36, textAlign: "center" }}>
          <p style={{ color: "var(--ld-muted)", fontSize: 14 }}>
            No branches yet. The owner can add them.
          </p>
          {isOwner && !showAddForm && (
            <button
              className="ld-btn solid"
              type="button"
              style={{ marginTop: 16 }}
              onClick={() => setShowAddForm(true)}
            >
              <Icon name="plus" size={14} />
              Add branch
            </button>
          )}
        </div>
      )}

      {!loading && !error && branches.length > 0 && (
        <div className="ld-branch-grid">
          {branches.map((branch) => {
            const count = roomsForBranch(branch.id);
            return (
              <article className="ld-branch-card" key={branch.id}>
                <header>
                  <span className="ld-branch-monogram" aria-hidden="true">
                    {branch.name.charAt(0)}
                  </span>
                  <div>
                    <h3>{branch.name}</h3>
                    <p>{branch.address || branch.slug}</p>
                  </div>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => handleToggleOpen(branch)}
                      className="ld-btn ghost"
                      style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        padding: "4px 8px",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      title="Click to toggle Open / Closed"
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: branch.is_open
                            ? "var(--ld-brand)"
                            : "var(--ld-faint)",
                        }}
                      />
                      {branch.is_open ? "Open" : "Closed"}
                    </button>
                  ) : (
                    <span className="ld-branch-open">
                      status
                      <b
                        style={{
                          color: branch.is_open
                            ? "var(--ld-brand)"
                            : "var(--ld-faint)",
                        }}
                      >
                        {branch.is_open ? "Open" : "Closed"}
                      </b>
                    </span>
                  )}
                </header>

                {branch.directions && (
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: 11.5,
                      color: "var(--ld-faint)",
                    }}
                  >
                    {branch.directions}
                  </p>
                )}

                <div className="ld-branch-foot">
                  <span>
                    {count} room{count === 1 ? "" : "s"}
                  </span>
                  <span style={{ marginLeft: "auto", color: "var(--ld-faint)" }}>
                    {branch.slug}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="ld-ask-hint" style={{ textAlign: "left", marginTop: 24 }}>
        Occupancy and room counts are pulled from the property system.
      </p>
    </div>
  );
}
