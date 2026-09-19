"use client";

import type { CircleMarker as LeafletCircleMarker, LeafletEvent } from "leaflet";
import { LocateFixed, Share2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { formatFlightMetrics, type FlightsByCallsign, type VisibleFlight } from "@/lib/tracker";
import { formatSwiss } from "@/lib/date";

type TrackerMapProps = {
  autoZoom: boolean;
  flightData: FlightsByCallsign;
  focusedCallsign: string | null;
  followedCallsign: string | null;
  isLiveMode: boolean;
  isPseudoFullscreen: boolean;
  onMapInteraction: () => void;
  onShareFlight: (callsign: string) => void;
  onToggleFollow: (callsign: string) => void;
  shareableCallsigns: ReadonlySet<string>;
  visibleFlights: VisibleFlight[];
};

type MapControllerProps = {
  autoZoom: boolean;
  focusedFlight: VisibleFlight | null;
  followedFlight: VisibleFlight | null;
  isPseudoFullscreen: boolean;
  onMapInteraction: () => void;
  visibleFlights: VisibleFlight[];
};

function MapController({
  autoZoom,
  focusedFlight,
  followedFlight,
  isPseudoFullscreen,
  onMapInteraction,
  visibleFlights,
}: MapControllerProps) {
  const map = useMap();
  const lastFocusedTargetRef = useRef<string | null>(null);
  const lastFollowTargetRef = useRef<string | null>(null);

  const bounds = useMemo(() => {
    return visibleFlights.map((flight) => [flight.lastPoint.lat, flight.lastPoint.lon] as [number, number]);
  }, [visibleFlights]);

  useEffect(() => {
    const stopFollowingOnUserMove = (event: LeafletEvent & { originalEvent?: Event }) => {
      if ("originalEvent" in event && event.originalEvent) {
        onMapInteraction();
      }
    };

    map.on("movestart", stopFollowingOnUserMove);
    map.on("zoomstart", stopFollowingOnUserMove);
    map.on("mousedown", stopFollowingOnUserMove);
    map.on("touchstart", stopFollowingOnUserMove);

    return () => {
      map.off("movestart", stopFollowingOnUserMove);
      map.off("zoomstart", stopFollowingOnUserMove);
      map.off("mousedown", stopFollowingOnUserMove);
      map.off("touchstart", stopFollowingOnUserMove);
    };
  }, [map, onMapInteraction]);

  useEffect(() => {
    map.invalidateSize({ animate: false });
  }, [isPseudoFullscreen, map]);

  useEffect(() => {
    if (!autoZoom || followedFlight || !bounds.length) {
      return;
    }

    map.fitBounds(bounds, { padding: [40, 40] });
  }, [autoZoom, bounds, followedFlight, map]);

  useEffect(() => {
    if (!focusedFlight) {
      lastFocusedTargetRef.current = null;
      return;
    }

    if (lastFocusedTargetRef.current === focusedFlight.callsign) {
      return;
    }

    lastFocusedTargetRef.current = focusedFlight.callsign;

    map.flyTo([focusedFlight.lastPoint.lat, focusedFlight.lastPoint.lon], Math.max(map.getZoom(), 10), {
      animate: true,
      duration: 0.55,
    });
  }, [focusedFlight, map]);

  useEffect(() => {
    if (!followedFlight) {
      lastFollowTargetRef.current = null;
      return;
    }

    const targetKey = `${followedFlight.callsign}:${followedFlight.lastPoint.ts}`;
    if (lastFollowTargetRef.current === targetKey) {
      return;
    }

    lastFollowTargetRef.current = targetKey;
    map.stop();
    map.panTo([followedFlight.lastPoint.lat, followedFlight.lastPoint.lon], {
      animate: true,
      duration: 0.5,
    });
  }, [followedFlight, map]);

  return null;
}

export function TrackerMap({
  autoZoom,
  flightData,
  focusedCallsign,
  followedCallsign,
  isLiveMode,
  isPseudoFullscreen,
  onMapInteraction,
  onShareFlight,
  onToggleFollow,
  shareableCallsigns,
  visibleFlights,
}: TrackerMapProps) {
  const markerRefs = useRef<Record<string, LeafletCircleMarker | null>>({});

  const focusedFlight =
    visibleFlights.find((flight) => flight.callsign === focusedCallsign) ??
    visibleFlights.find((flight) => flight.callsign === followedCallsign) ??
    null;
  const followedFlight = visibleFlights.find((flight) => flight.callsign === followedCallsign) ?? null;

  useEffect(() => {
    if (!focusedCallsign) {
      return;
    }

    const marker = markerRefs.current[focusedCallsign];
    if (!marker) {
      return;
    }

    marker.openPopup();
  }, [focusedCallsign]);

  return (
    <MapContainer center={[46.8, 8.2]} zoom={8} zoomControl className="h-full w-full rounded-[1.75rem]">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController
        autoZoom={autoZoom}
        focusedFlight={focusedFlight}
        followedFlight={followedFlight}
        isPseudoFullscreen={isPseudoFullscreen}
        onMapInteraction={onMapInteraction}
        visibleFlights={visibleFlights}
      />

      {Object.entries(flightData).map(([callsign, points]) => {
        if (!points.length) {
          return null;
        }

        return (
          <Polyline
            key={`full-${callsign}`}
            pathOptions={{ color: "rgba(210, 35, 42, 0.25)", opacity: 0.9, weight: 2 }}
            positions={points.map((point) => [point.lat, point.lon] as [number, number])}
          />
        );
      })}

      {visibleFlights.map((flight) => {
        const isFollowed = followedCallsign === flight.callsign;
        const isShareable = shareableCallsigns.has(flight.callsign);

        return (
          <Fragment key={`progress-${flight.callsign}-${isLiveMode ? "live" : "range"}`}>
            <Polyline
              pathOptions={{
                color: "rgba(210, 35, 42, 0.95)",
                opacity: flight.isStale ? 0.45 : 0.95,
                weight: 3,
              }}
              positions={flight.points.map((point) => [point.lat, point.lon] as [number, number])}
            />
            <CircleMarker
              ref={(marker) => {
                markerRefs.current[flight.callsign] = marker;
              }}
              center={[flight.lastPoint.lat, flight.lastPoint.lon]}
              eventHandlers={{
                click: () => onMapInteraction(),
              }}
              pathOptions={{
                color: isFollowed ? "#b86b00" : "#ffffff",
                fillColor: isFollowed ? "#f1c84b" : "rgba(210, 35, 42, 0.95)",
                fillOpacity: flight.isStale ? 0.45 : 0.95,
                weight: isFollowed ? 2 : 1,
              }}
              radius={isFollowed ? 10 : 8}
            >
              <Tooltip
                className={`callsign-label${flight.isStale ? " stale-label" : ""}${isFollowed ? " followed-label" : ""}`}
                direction="right"
                offset={[10, 0]}
                permanent
              >
                {flight.callsign}
              </Tooltip>
              <Popup>
                <div className="min-w-48 space-y-3 p-1 text-sm text-slate-900">
                  <div>
                    <div className="font-semibold tracking-wide text-[var(--rega-red)]">{flight.callsign}</div>
                    <div className="text-xs text-slate-500">{formatSwiss(flight.lastPoint.ts)}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                    {flight.lastPoint.lat.toFixed(5)}, {flight.lastPoint.lon.toFixed(5)}
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                    {formatFlightMetrics(flight.lastPoint.height, flight.lastPoint.groundSpeed)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      aria-label={isFollowed ? `${flight.callsign} nicht mehr verfolgen` : `${flight.callsign} verfolgen`}
                      className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold transition ${
                        isFollowed
                          ? "cursor-pointer border-[var(--gold)] bg-[var(--gold)] text-slate-950"
                          : "cursor-pointer border-[var(--line)] bg-white text-[var(--rega-red)] hover:border-[var(--rega-red)] hover:bg-[var(--rega-red-soft)]/45"
                      }`}
                      onClick={() => onToggleFollow(flight.callsign)}
                      title={isFollowed ? "Folgen beenden" : "Helikopter verfolgen"}
                      type="button"
                    >
                      <LocateFixed className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                    <button
                      aria-label={isShareable ? `${flight.callsign} als Fluglink kopieren` : `${flight.callsign} kann noch nicht geteilt werden`}
                      className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold transition ${
                        isShareable
                          ? "cursor-pointer border-[var(--line)] bg-white text-slate-700 hover:border-[var(--rega-red)] hover:bg-[var(--rega-red-soft)]/45 hover:text-[var(--rega-red)]"
                          : "cursor-not-allowed border-[var(--line)] bg-slate-100 text-slate-400"
                      }`}
                      disabled={!isShareable}
                      onClick={() => onShareFlight(flight.callsign)}
                      title={isShareable ? "Fluglink kopieren" : "Flug ist noch nicht teilbar"}
                      type="button"
                    >
                      <Share2 className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}