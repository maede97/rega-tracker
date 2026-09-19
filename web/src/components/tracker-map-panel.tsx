import dynamic from "next/dynamic";
import type { RefObject } from "react";
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