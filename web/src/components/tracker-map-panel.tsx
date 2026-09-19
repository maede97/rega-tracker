import dynamic from "next/dynamic";
import type { ReactNode, RefObject } from "react";
import type { FlightsByCallsign, VisibleFlight } from "@/lib/tracker";

const TrackerMap = dynamic(
  () => import("@/components/tracker-map").then((module) => module.TrackerMap),
  {
    loading: () => (
      <div className="flex h-full min-h-[24rem] items-center justify-center rounded-[1.75rem] bg-white/60 text-sm text-slate-500 shadow-[var(--shadow)]">
        Karte wird geladen...
      </div>
    ),
    ssr: false,
  },
);

type TrackerMapPanelProps = {
  autoZoom: boolean;
  flightData: FlightsByCallsign;
  focusedCallsign: string | null;
  followedCallsign: string | null;
  isLiveEnabled: boolean;
  mobileOverlay?: ReactNode;
  isPseudoFullscreen: boolean;
  mapShellRef: RefObject<HTMLDivElement | null>;
  onMapInteraction: () => void;
  onShareFlight: (callsign: string) => void;
  onToggleFollow: (callsign: string) => void;
  shareableCallsigns: ReadonlySet<string>;
  visibleFlights: VisibleFlight[];
};

export function TrackerMapPanel({
  autoZoom,
  flightData,
  focusedCallsign,
  followedCallsign,
  isLiveEnabled,
  mobileOverlay,
  isPseudoFullscreen,
  mapShellRef,
  onMapInteraction,
  onShareFlight,
  onToggleFollow,
  shareableCallsigns,
  visibleFlights,
}: TrackerMapPanelProps) {
  return (
    <section
      className={`relative min-h-0 flex-1 overflow-hidden bg-white xl:h-full xl:rounded-[2rem] xl:border xl:border-white/65 xl:bg-white/75 xl:p-3 xl:shadow-[var(--shadow)] xl:backdrop-blur ${
        isPseudoFullscreen ? "fixed inset-0 z-50 rounded-none border-0 p-0" : ""
      }`}
      ref={mapShellRef}
    >
      {mobileOverlay ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] xl:hidden">
          <div className="pointer-events-auto rounded-[1.5rem] border border-white/55 bg-[linear-gradient(135deg,rgba(165,12,31,0.92),rgba(110,7,18,0.92))] p-3 text-white shadow-xl backdrop-blur-md">
            {mobileOverlay}
          </div>
        </div>
      ) : null}
      <TrackerMap
        autoZoom={autoZoom}
        flightData={flightData}
        focusedCallsign={focusedCallsign}
        followedCallsign={followedCallsign}
        isLiveMode={isLiveEnabled}
        isPseudoFullscreen={isPseudoFullscreen}
        onMapInteraction={onMapInteraction}
        onShareFlight={onShareFlight}
        onToggleFollow={onToggleFollow}
        shareableCallsigns={shareableCallsigns}
        visibleFlights={visibleFlights}
      />
    </section>
  );
}