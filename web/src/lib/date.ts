export const MAX_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatSwiss(unixTime: number | null | undefined, withSeconds = false) {
  if (!unixTime) {
    return "-";
  }

  const date = new Date(unixTime * 1000);
  const datePart = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (!withSeconds) {
    return `${datePart} ${timePart}`;
  }

  return `${datePart} ${timePart}:${pad(date.getSeconds())}`;
}

export function toDatetimeLocalValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string) {
  if (!value) {
    return Number.NaN;
  }

  const unixTime = Math.floor(new Date(value).getTime() / 1000);
  return Number.isFinite(unixTime) ? unixTime : Number.NaN;
}

export function clampRange(startUnix: number, endUnix: number) {
  const nowUnix = Math.floor(Date.now() / 1000);
  const minUnix = Math.floor((Date.now() - MAX_LOOKBACK_MS) / 1000);

  const clampedStart = Math.max(minUnix, Math.min(startUnix, nowUnix));
  const clampedEnd = Math.max(minUnix, Math.min(endUnix, nowUnix));

  if (clampedEnd <= clampedStart) {
    return {
      startUnix: Math.max(minUnix, clampedEnd - 3600),
      endUnix: clampedEnd,
    };
  }

  return {
    startUnix: clampedStart,
    endUnix: clampedEnd,
  };
}