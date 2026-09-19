import { LocateFixed, Share2 } from "lucide-react";
import { formatSwiss } from "@/lib/date";
import { formatFlightMetrics, type VisibleFlight } from "@/lib/tracker";

type TrackerFlightListProps = {
  followedCallsign: string | null;
  onFollowFlight: (callsign: string) => void;
  onSelectFlight: (callsign: string) => void;
  onShareFlight: (callsign: string) => void;
  shareableCallsigns: ReadonlySet<string>;
  sortedFlights: VisibleFlight[];
};

export function TrackerFlightList({
  followedCallsign,
  onFollowFlight,
  onSelectFlight,
  onShareFlight,
  shareableCallsigns,
  sortedFlights,
}: TrackerFlightListProps) {
  if (!sortedFlights.length) {
    return (
      <div className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white px-4 py-5 text-sm text-[var(--muted)]">
        Noch keine Flugdaten geladen.
      </div>
    );
  }

  return sortedFlights.map((flight) => {
    const isFollowed = followedCallsign === flight.callsign;
    const isShareable = shareableCallsigns.has(flight.callsign);

    return (
      <div
        className={`group flex items-start gap-2 rounded-[1.15rem] border px-3 py-2.5 transition ${
          isFollowed
            ? "border-[var(--gold)] bg-[linear-gradient(135deg,#fff7d4,#fffdf8)]"
            : "border-[var(--line)] bg-white hover:border-[var(--rega-red)]/30 hover:bg-[var(--rega-red-soft)]/35"
        } ${flight.isStale ? "opacity-65" : "opacity-100"}`}
        key={flight.callsign}
      >
        <button
          className="cursor-pointer min-w-0 flex-1 text-left"
          onClick={() => onSelectFlight(flight.callsign)}
          type="button"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-semibold text-slate-950">{flight.callsign}</div>
            {isFollowed ? (
              <span className="rounded-full bg-[var(--gold)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-950">
                Folgen
              </span>
            ) : null}
          </div>
          <div className="mt-1 font-mono text-[0.7rem] text-[var(--muted)]">{formatSwiss(flight.lastPoint.ts)} / {flight.lastPoint.lat.toFixed(4)}, {flight.lastPoint.lon.toFixed(4)}</div>
          <div className="mt-1 text-[0.72rem] font-medium text-slate-600">{formatFlightMetrics(flight.lastPoint.height, flight.lastPoint.groundSpeed)}</div>
        </button>

        <div className="mt-0.5 flex shrink-0 flex-col gap-2">
          <button
            aria-label={isShareable ? `${flight.callsign} als exakten Fluglink kopieren` : `${flight.callsign} ist noch nicht als kompletter Flug teilbar`}
            className={`grid h-9 w-9 place-items-center rounded-full border transition ${
              isShareable
                ? "cursor-pointer border-[var(--line)] bg-white text-slate-700 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:border-[var(--rega-red)] hover:bg-[var(--rega-red-soft)]/45 hover:text-[var(--rega-red)]"
                : "cursor-not-allowed border-[var(--line)] bg-slate-100 text-slate-400 opacity-60"
            }`}
            disabled={!isShareable}
            onClick={(event) => {
              event.stopPropagation();
              onShareFlight(flight.callsign);
            }}
            title={isShareable ? "Exakten Fluglink kopieren" : "Nur komplette Fluege innerhalb des geladenen Zeitraums sind teilbar"}
            type="button"
          >
            <Share2 className="h-4 w-4" strokeWidth={2.2} />
          </button>

          <button
            aria-label={isFollowed ? `${flight.callsign} nicht mehr verfolgen` : `${flight.callsign} verfolgen`}
            className={`grid h-9 w-9 place-items-center rounded-full border transition ${
              isFollowed
                ? "cursor-pointer border-[var(--gold)] bg-[var(--gold)] text-slate-950"
                : "cursor-pointer border-[var(--line)] bg-white text-[var(--rega-red)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:border-[var(--rega-red)] hover:bg-[var(--rega-red-soft)]/45"
            }`}
            onClick={(event) => {
              event.stopPropagation();
              onFollowFlight(flight.callsign);
            }}
            title={isFollowed ? "Folgen beenden" : "Helikopter verfolgen"}
            type="button"
          >
            <LocateFixed className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    );
  });
}