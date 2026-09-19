export type ApiFlightRecord = {
  active?: boolean | number;
  callsign: string;
  height?: number | string | null;
  latitude: number | string;
  longitude: number | string;
  observed_at?: number | string;
  timestamp?: number | string;
};

export type FlightPoint = {
  active: boolean;
  height: number | null;
  lat: number;
  lon: number;
  ts: number;
};

export type FlightsByCallsign = Record<string, FlightPoint[]>;

export type VisibleFlight = {
  callsign: string;
  isStale: boolean;
  lastPoint: FlightPoint;
  points: FlightPoint[];
};

export function normalizeFlights(records: ApiFlightRecord[]) {
  const grouped: FlightsByCallsign = {};

  for (const record of records) {
    const height = record.height == null ? null : Number(record.height);
    const ts = Number(record.observed_at ?? record.timestamp);
    const lat = Number(record.latitude);
    const lon = Number(record.longitude);

    if (!record.callsign || !Number.isFinite(ts) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      continue;
    }

    grouped[record.callsign] ??= [];
    grouped[record.callsign].push({
      active: record.active === true || record.active === 1,
      height: Number.isFinite(height) ? height : null,
      lat,
      lon,
      ts,
    });
  }

  for (const callsign of Object.keys(grouped)) {
    grouped[callsign].sort((left, right) => left.ts - right.ts);
  }

  return grouped;
}

export function getVisibleFlights(
  flightData: FlightsByCallsign,
  unixTime: number,
  isLiveMode: boolean,
) {
  const visible: VisibleFlight[] = [];

  for (const callsign of Object.keys(flightData)) {
    const points = flightData[callsign]?.filter((point) => point.ts <= unixTime) ?? [];

    if (!points.length) {
      continue;
    }

    const lastPoint = points.at(-1);

    if (!lastPoint) {
      continue;
    }

    const isStale = isLiveMode
      ? points.every((point) => !point.active)
      : unixTime - lastPoint.ts > 60;

    visible.push({
      callsign,
      isStale,
      lastPoint,
      points,
    });
  }

  return visible.sort((left, right) => left.callsign.localeCompare(right.callsign));
}

export function hasDataAtTime(flightData: FlightsByCallsign, unixTime: number) {
  for (const callsign of Object.keys(flightData)) {
    const points = flightData[callsign] ?? [];
    if (points.some((point) => point.ts <= unixTime)) {
      return true;
    }
  }

  return false;
}

export function nextDataTimeAfter(flightData: FlightsByCallsign, unixTime: number) {
  let next = Number.POSITIVE_INFINITY;

  for (const callsign of Object.keys(flightData)) {
    for (const point of flightData[callsign] ?? []) {
      if (point.ts > unixTime && point.ts < next) {
        next = point.ts;
      }
    }
  }

  return Number.isFinite(next) ? next : null;
}

export function formatHeight(height: number | null) {
  if (height === null) {
    return "Hoehe unbekannt";
  }

  return `${Math.round(height).toLocaleString("de-CH")} ft`;
}