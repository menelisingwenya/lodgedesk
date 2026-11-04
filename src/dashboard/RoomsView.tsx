import { useState, useEffect } from "react";
import { Icon } from "./Icons";
import { getCurrentUser, type StaffUser } from "./auth";
import {
  loadBranches,
  loadRoomTypes,
  loadBranchRoomTypes,
  saveBranchRoomType,
  addRoomType,
  type Branch,
  type RoomType,
  type BranchRoomType,
} from "../lib/lodgeData";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(confirmed: boolean, price: number | null): string {
  if (confirmed && price !== null) {
    const num = Number(price);
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return "Price to confirm";
}

export default function RoomsView({
  onNotice,
  user,
}: {
  onNotice: (message: string) => void;
  user?: StaffUser;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [branchRoomTypes, setBranchRoomTypes] = useState<BranchRoomType[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state for room row
  const [editingRoomTypeId, setEditingRoomTypeId] = useState<string | null>(null);
  const [editRoomCount, setEditRoomCount] = useState<string>("1");
  const [editPriceUsd, setEditPriceUsd] = useState<string>("");
  const [editPriceConfirmed, setEditPriceConfirmed] = useState<boolean>(false);
  const [editPriceNote, setEditPriceNote] = useState<string>("per night");
  const [savingRow, setSavingRow] = useState(false);

  // Add room type state
  const [showAddTypeForm, setShowAddTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeSlug, setNewTypeSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [addingType, setAddingType] = useState(false);

  const activeUser = user ?? getCurrentUser();
  const isOwner = activeUser?.role?.toLowerCase() === "owner";

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [bList, rtList, brtList] = await Promise.all([
        loadBranches(),
        loadRoomTypes(),
        loadBranchRoomTypes(),
      ]);
      setBranches(bList);
      setRoomTypes(rtList);
      setBranchRoomTypes(brtList);

      if (bList.length > 0 && (!selectedBranchId || !bList.some((b) => b.id === selectedBranchId))) {
        setSelectedBranchId(bList[0].id);
      }
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
        const [bList, rtList, brtList] = await Promise.all([
          loadBranches(),
          loadRoomTypes(),
          loadBranchRoomTypes(),
        ]);
        if (active) {
          setBranches(bList);
          setRoomTypes(rtList);
          setBranchRoomTypes(brtList);
          if (bList.length > 0) {
            setSelectedBranchId(bList[0].id);
          }
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

  function startEditing(roomTypeId: string, existing?: BranchRoomType) {
    if (!isOwner) return;
    setEditingRoomTypeId(roomTypeId);
    if (existing) {
      setEditRoomCount(String(existing.room_count));
      setEditPriceUsd(existing.price_usd !== null ? String(existing.price_usd) : "");
      setEditPriceConfirmed(Boolean(existing.price_confirmed));
      setEditPriceNote(existing.price_note || "per night");
    } else {
      setEditRoomCount("1");
      setEditPriceUsd("");
      setEditPriceConfirmed(false);
      setEditPriceNote("per night");
    }
  }

  function cancelEditing() {
    setEditingRoomTypeId(null);
    setEditRoomCount("1");
    setEditPriceUsd("");
    setEditPriceConfirmed(false);
    setEditPriceNote("per night");
  }

  async function handleSaveRow(roomTypeId: string) {
    if (!selectedBranchId || !isOwner) return;

    const count = parseInt(editRoomCount, 10);
    if (isNaN(count) || count <= 0) {
      onNotice("Room count must be a whole number above 0.");
      return;
    }

    const priceNum = editPriceUsd.trim() !== "" ? parseFloat(editPriceUsd) : null;
    if (priceNum !== null && (isNaN(priceNum) || priceNum < 0)) {
      onNotice("Please enter a valid price in USD.");
      return;
    }

    setSavingRow(true);
    try {
      await saveBranchRoomType({
        branch_id: selectedBranchId,
        room_type_id: roomTypeId,
        room_count: count,
        price_usd: priceNum,
        price_confirmed: priceNum !== null ? editPriceConfirmed : false,
        price_note: editPriceNote,
      });

      // Reload fresh data
      const brtList = await loadBranchRoomTypes();
      setBranchRoomTypes(brtList);
      cancelEditing();
      onNotice("Room details and rates saved.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
      }
      onNotice("Could not save room rate. Please try again.");
    } finally {
      setSavingRow(false);
    }
  }

  async function handleAddRoomType(e: React.FormEvent) {
    e.preventDefault();
    if (!newTypeName.trim() || addingType || !isOwner) return;

    setAddingType(true);
    try {
      const finalSlug = newTypeSlug.trim() || slugify(newTypeName);
      const newRt = await addRoomType({
        name: newTypeName,
        slug: finalSlug,
        description: newTypeDescription || null,
      });

      setRoomTypes((prev) => [...prev, newRt].sort((a, b) => a.name.localeCompare(b.name)));
      setShowAddTypeForm(false);
      setNewTypeName("");
      setNewTypeSlug("");
      setIsSlugManual(false);
      setNewTypeDescription("");
      onNotice(`Room type "${newRt.name}" created.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
      }
      onNotice("Could not create room type. Please try again.");
    } finally {
      setAddingType(false);
    }
  }

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const currentBranchRooms = branchRoomTypes.filter((brt) => brt.branch_id === selectedBranchId);

  // Price input validity for enabling "Price confirmed" checkbox
  const hasPriceEntered =
    editPriceUsd.trim() !== "" && !isNaN(Number(editPriceUsd)) && Number(editPriceUsd) >= 0;

  return (
    <div className="ld-wrap">
      <header className="ld-page-head">
        <div>
          <h1>Rooms &amp; rates</h1>
          <p>
            The rates LodgeDesk is quoting guests today. Rates are held in the property system and the
            assistant reads them fresh on every reply.
          </p>
        </div>
        <div className="ld-page-actions">
          {isOwner && !loading && !error && branches.length > 0 && (
            <button
              className="ld-btn ghost"
              type="button"
              onClick={() => setShowAddTypeForm((open) => !open)}
            >
              <Icon name="plus" size={14} />
              {showAddTypeForm ? "Close form" : "Add room type"}
            </button>
          )}
        </div>
      </header>

      {showAddTypeForm && isOwner && (
        <form
          onSubmit={handleAddRoomType}
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
            Add new room type
          </h3>
          <div style={{ display: "grid", gap: 14 }}>
            <label className="login-field">
              <span>Room Type Name</span>
              <input
                type="text"
                required
                placeholder="e.g. Executive Deluxe"
                value={newTypeName}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewTypeName(val);
                  if (!isSlugManual) {
                    setNewTypeSlug(slugify(val));
                  }
                }}
                disabled={addingType}
              />
            </label>

            <label className="login-field">
              <span>Slug (identifier)</span>
              <input
                type="text"
                required
                placeholder="e.g. executive-deluxe"
                value={newTypeSlug}
                onChange={(e) => {
                  setIsSlugManual(true);
                  setNewTypeSlug(e.target.value);
                }}
                disabled={addingType}
              />
            </label>

            <label className="login-field">
              <span>Description / Amenities</span>
              <input
                type="text"
                placeholder="e.g. King bed · Garden view · Lounge access"
                value={newTypeDescription}
                onChange={(e) => setNewTypeDescription(e.target.value)}
                disabled={addingType}
              />
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="ld-btn solid" type="submit" disabled={addingType}>
                {addingType ? "Creating…" : "Create room type"}
              </button>
              <button
                className="ld-btn ghost"
                type="button"
                onClick={() => setShowAddTypeForm(false)}
                disabled={addingType}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading && (
        <p className="ld-ask-hint" style={{ textAlign: "left", marginTop: 24 }}>
          Loading rooms &amp; rates…
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
        </div>
      )}

      {!loading && !error && branches.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 20,
              marginBottom: 16,
            }}
          >
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ld-ink)",
              }}
            >
              Select branch:
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                cancelEditing();
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid var(--ld-line)",
                background: "var(--ld-panel)",
                color: "var(--ld-ink)",
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 500,
              }}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {!b.is_open ? "(Closed)" : ""}
                </option>
              ))}
            </select>
          </div>

          {roomTypes.length === 0 ? (
            <div style={{ marginTop: 32, textAlign: "center" }}>
              <p style={{ color: "var(--ld-muted)" }}>
                No room types configured yet.
              </p>
              {isOwner && !showAddTypeForm && (
                <button
                  className="ld-btn solid"
                  type="button"
                  style={{ marginTop: 14 }}
                  onClick={() => setShowAddTypeForm(true)}
                >
                  <Icon name="plus" size={14} />
                  Add room type
                </button>
              )}
            </div>
          ) : (
            <div className="ld-room-table" role="table" aria-label="Room types and rates">
              <div className="ld-room-row ld-room-head" role="row">
                <span>Room</span>
                <span>Rooms</span>
                <span>Rate</span>
                <span>Branch</span>
                {isOwner && <span>Action</span>}
              </div>

              {roomTypes.map((rt) => {
                const brt = currentBranchRooms.find((b) => b.room_type_id === rt.id);
                const isEditing = editingRoomTypeId === rt.id;

                if (isEditing) {
                  return (
                    <div
                      key={rt.id}
                      style={{
                        padding: 16,
                        borderBottom: "1px solid var(--ld-line)",
                        background: "var(--ld-panel)",
                      }}
                    >
                      <h4 style={{ margin: "0 0 12px", fontSize: 14.5, color: "var(--ld-ink)" }}>
                        Edit {rt.name} at {selectedBranch?.name}
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                          gap: 12,
                          alignItems: "flex-end",
                        }}
                      >
                        <label className="login-field" style={{ margin: 0 }}>
                          <span>Room count</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={editRoomCount}
                            onChange={(e) => setEditRoomCount(e.target.value)}
                            disabled={savingRow}
                          />
                        </label>

                        <label className="login-field" style={{ margin: 0 }}>
                          <span>Price (USD)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Optional"
                            value={editPriceUsd}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditPriceUsd(val);
                              if (val.trim() === "" || Number(val) < 0) {
                                setEditPriceConfirmed(false);
                              }
                            }}
                            disabled={savingRow}
                          />
                        </label>

                        <label className="login-field" style={{ margin: 0 }}>
                          <span>Price note</span>
                          <input
                            type="text"
                            placeholder="e.g. per night"
                            value={editPriceNote}
                            onChange={(e) => setEditPriceNote(e.target.value)}
                            disabled={savingRow}
                          />
                        </label>

                        <div style={{ display: "flex", alignItems: "center", paddingBottom: 10 }}>
                          <label
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              cursor: hasPriceEntered ? "pointer" : "not-allowed",
                              opacity: hasPriceEntered ? 1 : 0.5,
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--ld-ink)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={editPriceConfirmed}
                              disabled={!hasPriceEntered || savingRow}
                              onChange={(e) => setEditPriceConfirmed(e.target.checked)}
                            />
                            Price confirmed
                          </label>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                        <button
                          className="ld-btn solid"
                          type="button"
                          onClick={() => handleSaveRow(rt.id)}
                          disabled={savingRow}
                        >
                          {savingRow ? "Saving…" : "Save"}
                        </button>
                        <button
                          className="ld-btn ghost"
                          type="button"
                          onClick={cancelEditing}
                          disabled={savingRow}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                const priceText = brt ? formatPrice(brt.price_confirmed, brt.price_usd) : "Not added";
                const isConfirmed = Boolean(brt?.price_confirmed && brt.price_usd !== null);

                return (
                  <div className="ld-room-row" role="row" key={rt.id}>
                    <span className="ld-room-name">
                      {rt.name}
                      {rt.description && <small>{rt.description}</small>}
                    </span>

                    <span className="ld-cell">
                      {brt ? `${brt.room_count} room${brt.room_count === 1 ? "" : "s"}` : "—"}
                    </span>

                    <span className="ld-room-rate">
                      {isConfirmed ? (
                        <>
                          {priceText}
                          <small>{brt?.price_note || "per night"}</small>
                        </>
                      ) : (
                        <span
                          style={{
                            fontSize: 13,
                            color: brt ? "var(--ld-gold)" : "var(--ld-faint)",
                            fontStyle: brt ? "italic" : "normal",
                            fontFamily: "var(--ld-sans)",
                          }}
                        >
                          {priceText}
                          {brt?.price_note && <small>{brt.price_note}</small>}
                        </span>
                      )}
                    </span>

                    <span className="ld-cell">
                      {selectedBranch?.name}
                    </span>

                    {isOwner && (
                      <span className="ld-cell">
                        <button
                          className="ld-btn ghost"
                          type="button"
                          style={{ fontSize: 12, padding: "4px 10px" }}
                          onClick={() => startEditing(rt.id, brt)}
                        >
                          {brt ? "Edit" : "Configure"}
                        </button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <p className="ld-ask-hint" style={{ textAlign: "left", marginTop: 24 }}>
        Room rates and configurations are stored in the property system.
      </p>
    </div>
  );
}
