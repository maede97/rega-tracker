import type { VisibleFlight } from "@/lib/tracker";
import { TrackerFlightList } from "@/components/tracker-flight-list";

type TrackerFlightSidebarProps = {
  followedCallsign: string | null;
  isLiveEnabled: boolean;
  onClearApiKey: () => void;
  onFollowFlight: (callsign: string) => void;
  onSelectFlight: (callsign: string) => void;
  showClearKey: boolean;
  sortedFlights: VisibleFlight[];
};

export function TrackerFlightSidebar({
  followedCallsign,
  isLiveEnabled,
  onClearApiKey,
  onFollowFlight,
  onSelectFlight,
  showClearKey,
  sortedFlights,
}: TrackerFlightSidebarProps) {
  return (
    <aside className="hidden overflow-hidden rounded-[2rem] border border-white/70 bg-[var(--paper)] shadow-[var(--shadow)] xl:flex xl:min-h-0 xl:flex-col">
      <div className="border-b border-[var(--line)] px-5 py-5">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-[var(--muted)]">Live status</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Helikopterliste</h2>
          </div>
          {isLiveEnabled ? (
            <div className="rounded-full border border-[var(--line)] bg-[var(--rega-red-soft)] px-3 py-1 font-mono text-xs font-medium text-[var(--rega-red)]">
              Live
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <TrackerFlightList
          followedCallsign={followedCallsign}
          onFollowFlight={onFollowFlight}
          onSelectFlight={onSelectFlight}
          sortedFlights={sortedFlights}
        />
      </div>

      <div className="border-t border-[var(--line)] px-5 py-4 text-sm text-[var(--muted)]">
        <div className="flex items-center justify-between gap-3">
          <span>Daten älter als vier Wochen sind nicht verfügbar.</span>
          {showClearKey ? (
            <button
              className="cursor-pointer rounded-full border border-[var(--line)] px-3 py-1.5 text-sm font-medium text-slate-950 transition hover:border-[var(--rega-red)] hover:text-[var(--rega-red)]"
              onClick={onClearApiKey}
              type="button"
            >
              API-Schlüssel ändern
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}