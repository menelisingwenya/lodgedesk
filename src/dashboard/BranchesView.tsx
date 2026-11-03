import { Icon } from "./Icons";
import { BRANCHES } from "./data";

export default function BranchesView({ onNotice }: { onNotice: (message: string) => void }) {
  return (
    <div className="ld-wrap">
      <header className="ld-page-head">
        <div>
          <h1>Branches</h1>
          <p>
            Eleven Harris Lodges — ten across Bulawayo and one in London. LodgeDesk routes each guest to
            the branch that matches their dates, party size and budget.
          </p>
        </div>
        <div className="ld-page-actions">
          <button className="ld-btn ghost" type="button" onClick={() => onNotice("Branch transfers are handled by the reservations manager.")}>
            <Icon name="users" size={14} />
            Manage team
          </button>
        </div>
      </header>

      <div className="ld-branch-grid">
        {BRANCHES.map((branch) => (
          <article className="ld-branch-card" key={branch.name}>
            <header>
              <span className="ld-branch-monogram" aria-hidden="true">
                {branch.name.charAt(0)}
              </span>
              <div>
                <h3>{branch.name}</h3>
                <p>{branch.area}</p>
              </div>
              <span className="ld-branch-open">
                open
                <b>{branch.open}</b>
              </span>
            </header>
            <div className="ld-branch-foot">
              <span>{branch.rooms} rooms</span>
              <span className="ld-bar cool">
                <i style={{ width: `${branch.occupancy}%` }} />
              </span>
              <span>{branch.occupancy}% full</span>
            </div>
          </article>
        ))}
      </div>

      <p className="ld-ask-hint" style={{ textAlign: "left", marginTop: 16 }}>
        Occupancy is pulled from the property system every 15 minutes.
      </p>
    </div>
  );
}
