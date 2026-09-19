export type ApiFlightRecord = {
  active?: boolean | number;
  callsign: string;
  ground_speed?: number | string | null;
  height?: number | string | null;
  latitude: number | string;
  longitude: number | string;
  observed_at?: number | string;
  timestamp?: number | string;
};

export type FlightPoint = {
  active: boolean;
  groundSpeed: number | null;
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

export type FlightSegment = {
  callsign: string;
  end: number;
  points: FlightPoint[];
  start: number;
};

export type SharedFlightDescriptor = {
  callsign: string;
  end?: number;
  start: number;
};

export const FLIGHT_SEGMENT_GAP_SECONDS = 20 * 60;

export function normalizeFlights(records: ApiFlightRecord[]) {
  const grouped: FlightsByCallsign = {};

  for (const record of records) {
    const groundSpeed = record.ground_speed == null ? null : Number(record.ground_speed);
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
      groundSpeed: Number.isFinite(groundSpeed) ? groundSpeed : null,
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

export function segmentFlightPoints(
  callsign: string,
  points: FlightPoint[],
  maxGapSeconds = FLIGHT_SEGMENT_GAP_SECONDS,
) {
  if (!points.length) {
    return [];
  }

  const segments: FlightSegment[] = [];
  let currentPoints: FlightPoint[] = [points[0]];

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const previousPoint = currentPoints.at(-1);

    if (!previousPoint) {
      currentPoints = [point];
      continue;
    }

    if (point.ts - previousPoint.ts > maxGapSeconds) {
      segments.push({
        callsign,
        end: currentPoints.at(-1)?.ts ?? currentPoints[0].ts,
        points: currentPoints,
        start: currentPoints[0].ts,
      });
      currentPoints = [point];
      continue;
    }

    currentPoints.push(point);
  }

  segments.push({
    callsign,
    end: currentPoints.at(-1)?.ts ?? currentPoints[0].ts,
    points: currentPoints,
    start: currentPoints[0].ts,
  });

  return segments;
}

export function getFlightSegments(
  flightData: FlightsByCallsign,
  callsign: string,
  maxGapSeconds = FLIGHT_SEGMENT_GAP_SECONDS,
) {
  return segmentFlightPoints(callsign, flightData[callsign] ?? [], maxGapSeconds);
}

export function findSharedFlightSegment(
  flightData: FlightsByCallsign,
  descriptor: SharedFlightDescriptor,
  maxGapSeconds = FLIGHT_SEGMENT_GAP_SECONDS,
) {
  const segments = getFlightSegments(flightData, descriptor.callsign, maxGapSeconds);
  const requestedEnd = descriptor.end ?? descriptor.start;

  return (
    segments.find((segment) => {
      const coversRequestedRange = segment.start <= descriptor.start && segment.end >= requestedEnd;
      const overlapsRequestedRange = segment.end >= descriptor.start && segment.start <= requestedEnd;

      return coversRequestedRange || overlapsRequestedRange;
    }) ?? null
  );
}

export function getFlightDataForSegment(segment: FlightSegment | null): FlightsByCallsign {
  if (!segment) {
    return {};
  }

  return {
    [segment.callsign]: segment.points,
  };
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
    return "Höhe unbekannt";
  }

  return `${Math.round(height).toLocaleString("de-CH")} ft`;
}

export function formatGroundSpeed(groundSpeed: number | null) {
  if (groundSpeed === null) {
    return "Bodengeschwindigkeit unbekannt";
  }

  return `${Math.round(groundSpeed).toLocaleString("de-CH")} kt`;
}

export function formatFlightMetrics(height: number | null, groundSpeed: number | null) {
  return `${formatHeight(height)} / ${formatGroundSpeed(groundSpeed)}`;
}