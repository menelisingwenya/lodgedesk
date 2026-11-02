import { Icon } from "./Icons";
import { ROOMS } from "./data";
import { money } from "./utils";

export default function RoomsView({ onNotice }: { onNotice: (message: string) => void }) {
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
          <button className="ld-btn ghost" type="button" onClick={() => onNotice("Rate updates sync overnight from the property system.")}>
            <Icon name="external" size={14} />
            Open rate sheet
          </button>
        </div>
      </header>

      <div className="ld-room-table" role="table" aria-label="Room types and rates">
        <div className="ld-room-row ld-room-head" role="row">
          <span>Room</span>
          <span>Sleeps</span>
          <span>Rate</span>
          <span>Occupancy this week</span>
          <span>Branches</span>
        </div>

        {ROOMS.map((room) => (
          <div className="ld-room-row" role="row" key={room.name}>
            <span className="ld-room-name">
              {room.name}
              <small>{room.note}</small>
            </span>
            <span className="ld-cell">{room.sleeps}</span>
            <span className="ld-room-rate">
              {money(room.rate)}
              <small>{room.unit}</small>
            </span>
            <span className="ld-occupancy">
              <span className="ld-bar">
                <i style={{ width: `${room.occupancy}%` }} />
              </span>
              {room.occupancy}%
            </span>
            <span className="ld-cell">{room.branches} branches</span>
          </div>
        ))}
      </div>

      <p className="ld-ask-hint" style={{ textAlign: "left", marginTop: 16 }}>
        Conference Room rates are per day and include the venue, 4K display and AV support.
      </p>
    </div>
  );
}
