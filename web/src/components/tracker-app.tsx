"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clampRange, fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/date";
import { TrackerApiKeyModal } from "@/components/tracker-api-key-modal";
import { TrackerControls, type TrackerPreset } from "@/components/tracker-controls";
import { TrackerFlightSidebar } from "@/components/tracker-flight-sidebar";
import { TrackerHeader } from "@/components/tracker-header";
import { TrackerMapPanel } from "@/components/tracker-map-panel";
import { TrackerMobileMenu } from "@/components/tracker-mobile-menu";
import {
  getVisibleFlights,
  hasDataAtTime,
  nextDataTimeAfter,
  normalizeFlights,
  type ApiFlightRecord,
  type FlightsByCallsign,
} from "@/lib/tracker";

const API_ROOT = process.env.NEXT_PUBLIC_REGA_API_BASE ?? "https://rega-api.hueppis.com";
const API_RANGE_URL = `${API_ROOT}/flights/range`;
const API_LIVE_URL = `${API_ROOT}/flights`;
const LIVE_FETCH_INTERVAL_MS = 30_000;
const PLAY_DURATION_MS = 30_000;
const MOBILE_BREAKPOINT = 1280;
const PRESETS: TrackerPreset[] = [
  { label: "5 Minuten", value: 300 },
  { label: "15 Minuten", value: 900 },
  { label: "30 Minuten", value: 1800 },
  { label: "1 Stunde", value: 3600 },
  { label: "6 Stunden", value: 21600 },
  { label: "24 Stunden", value: 86400 },
  { label: "7 Tage", value: 604800 },
];

type TimelineState = {
  current: number;
  end: number;
  start: number;
};

function getDefaultInputs() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  return {
    end: toDatetimeLocalValue(now),
    start: toDatetimeLocalValue(oneHourAgo),
  };
}

function getEmptyInputs() {
  return {
    end: "",
    start: "",
  };
}

export function TrackerApp() {
  const emptyInputs = getEmptyInputs();
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const playFrameRef = useRef<number | null>(null);
  const playbackStartRef = useRef<number | null>(null);
  const liveIntervalRef = useRef<number | null>(null);
  const timelineRef = useRef<TimelineState>({ current: 0, end: 0, start: 0 });

  const [apiKey, setApiKey] = useState("");
  const [autoZoom, setAutoZoom] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flightData, setFlightData] = useState<FlightsByCallsign>({});
  const [focusedCallsign, setFocusedCallsign] = useState<string | null>(null);
  const [followedCallsign, setFollowedCallsign] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isLiveEnabled, setIsLiveEnabled] = useState(false);
  const [isLiveFetching, setIsLiveFetching] = useState(false);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [showClearKey, setShowClearKey] = useState(false);
  const [startInput, setStartInput] = useState(emptyInputs.start);
  const [endInput, setEndInput] = useState(emptyInputs.end);
  const [timeline, setTimeline] = useState<TimelineState>({ current: 0, end: 0, start: 0 });
  const [lastLiveFetchAt, setLastLiveFetchAt] = useState<number | null>(null);
  const [maxEndInput, setMaxEndInput] = useState("");
  const { current: currentTime, end: timelineEnd, start: timelineStart } = timeline;

  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  const visibleFlights = useMemo(
    () => getVisibleFlights(flightData, currentTime, isLiveEnabled),
    [currentTime, flightData, isLiveEnabled],
  );

  const sortedFlights = useMemo(() => {
    return [...visibleFlights].sort((left, right) => {
      if (right.lastPoint.ts !== left.lastPoint.ts) {
        return right.lastPoint.ts - left.lastPoint.ts;
      }

      return left.callsign.localeCompare(right.callsign);
    });
  }, [visibleFlights]);

  const sliderStep = useMemo(() => {
    if (timelineEnd <= timelineStart) {
      return 60;
    }

    return Math.max(1, Math.floor((timelineEnd - timelineStart) / 300));
  }, [timelineEnd, timelineStart]);

  const stopPlayback = useCallback(() => {
    if (playFrameRef.current) {
      cancelAnimationFrame(playFrameRef.current);
      playFrameRef.current = null;
    }

    playbackStartRef.current = null;
    setIsPlaying(false);
  }, []);

  const syncFlights = useCallback(
    (records: ApiFlightRecord[], start: number, end: number) => {
      const grouped = normalizeFlights(records);

      startTransition(() => {
        setFlightData(grouped);
        setTimeline({ current: end, end, start });

        if (followedCallsign && !grouped[followedCallsign]) {
          setFollowedCallsign(null);
        }
      });
    },
    [followedCallsign],
  );

  const fetchRange = useCallback(async (startUnix?: number, endUnix?: number) => {
    setIsLiveEnabled(false);
    setLiveProgress(0);
    stopPlayback();
    setErrorMessage(null);

    const rawStart = startUnix ?? fromDatetimeLocalValue(startInput);
    const rawEnd = endUnix ?? fromDatetimeLocalValue(endInput);

    if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) {
      setErrorMessage("Bitte gueltige Start- und Endzeiten eingeben.");
      return;
    }

    const { startUnix: clampedStart, endUnix: clampedEnd } = clampRange(rawStart, rawEnd);

    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    setStartInput(toDatetimeLocalValue(new Date(clampedStart * 1000)));
    setEndInput(toDatetimeLocalValue(new Date(clampedEnd * 1000)));
    setIsManualLoading(true);

    try {
      const response = await fetch(`${API_RANGE_URL}?start=${clampedStart}&end=${clampedEnd}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setShowClearKey(true);
        }

        throw new Error(await response.text());
      }

      setShowClearKey(false);
      const data = (await response.json()) as { flights?: ApiFlightRecord[] };
      syncFlights(data.flights ?? [], clampedStart, clampedEnd);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler beim Laden der Daten.");
    } finally {
      setIsManualLoading(false);
    }
  }, [apiKey, endInput, startInput, stopPlayback, syncFlights]);

  const fetchLive = useCallback(async () => {
    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    const end = Math.floor(Date.now() / 1000);
    const start = end - 5 * 60;

    setErrorMessage(null);
    setIsLiveFetching(true);

    try {
      const response = await fetch(API_LIVE_URL, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setShowClearKey(true);
        }

        throw new Error(await response.text());
      }

      setShowClearKey(false);
      const data = (await response.json()) as { flights?: ApiFlightRecord[] };
      syncFlights(data.flights ?? [], start, end);
      setLastLiveFetchAt(performance.now());
      setLiveProgress(0);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Live-Daten konnten nicht geladen werden.");
    } finally {
      setIsLiveFetching(false);
    }
  }, [apiKey, syncFlights]);

  const toggleFullscreen = useCallback(async () => {
    const shell = mapShellRef.current;
    if (!shell) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsPseudoFullscreen(false);
        return;
      }

      if (shell.requestFullscreen) {
        await shell.requestFullscreen();
        return;
      }
    } catch {
      setIsPseudoFullscreen((current) => !current);
      return;
    }

    setIsPseudoFullscreen((current) => !current);
  }, []);

  const initializeFromBrowser = useCallback(() => {
    const storedKey = window.localStorage.getItem("rega_api_key") ?? "";
    setApiKey(storedKey);
    setIsKeyModalOpen(!storedKey);
    setAutoZoom(window.innerWidth <= MOBILE_BREAKPOINT);
    setIsLiveEnabled(Boolean(storedKey));
  }, []);

  useEffect(() => {
    queueMicrotask(initializeFromBrowser);
  }, [initializeFromBrowser]);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      const defaults = getDefaultInputs();

      setStartInput((current) => current || defaults.start);
      setEndInput((current) => current || defaults.end);
      setMaxEndInput(defaults.end);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));

      if (!document.fullscreenElement) {
        setIsPseudoFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        setAutoZoom(true);
      } else {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isLiveEnabled) {
      if (liveIntervalRef.current) {
        window.clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
      return;
    }

    queueMicrotask(() => {
      void fetchLive();
    });
    liveIntervalRef.current = window.setInterval(fetchLive, LIVE_FETCH_INTERVAL_MS);

    return () => {
      if (liveIntervalRef.current) {
        window.clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [isLiveEnabled, fetchLive]);

  useEffect(() => {
    if (!isLiveEnabled || lastLiveFetchAt === null) {
      return;
    }

    let animationFrame = 0;

    const updateProgress = () => {
      const progress = (performance.now() - lastLiveFetchAt) / LIVE_FETCH_INTERVAL_MS;
      setLiveProgress(Math.min(1, Math.max(0, progress)));
      animationFrame = requestAnimationFrame(updateProgress);
    };

    animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [isLiveEnabled, lastLiveFetchAt]);

  useEffect(() => {
    if (!isPlaying) {
      if (playFrameRef.current) {
        cancelAnimationFrame(playFrameRef.current);
        playFrameRef.current = null;
      }

      playbackStartRef.current = null;
      return;
    }

    if (timelineEnd <= timelineStart) {
      return;
    }

    const { current, end: max, start: min } = timelineRef.current;
    let playbackCurrent = current;

    if (playbackCurrent >= max) {
      playbackCurrent = min;
    }

    const fraction = max > min ? Math.min(1, Math.max(0, (playbackCurrent - min) / (max - min))) : 0;
    playbackStartRef.current = performance.now() - (PLAY_DURATION_MS * fraction) / playSpeed;

    const step = (now: number) => {
      const startedAt = playbackStartRef.current ?? now;
      const elapsed = now - startedAt;
      const fractionNow = Math.min(1, (elapsed * playSpeed) / PLAY_DURATION_MS);
      const nextValue = Math.floor(min + (max - min) * fractionNow);

      if (!hasDataAtTime(flightData, nextValue)) {
        const nextTs = nextDataTimeAfter(flightData, nextValue);

        if (!nextTs) {
          setIsPlaying(false);
          playFrameRef.current = null;
          return;
        }

        setTimeline((state) => ({ ...state, current: nextTs }));
        playbackStartRef.current = now - (PLAY_DURATION_MS * ((nextTs - min) / (max - min))) / playSpeed;
        playFrameRef.current = requestAnimationFrame(step);
        return;
      }

      setTimeline((state) => ({ ...state, current: nextValue }));

      if (fractionNow < 1) {
        playFrameRef.current = requestAnimationFrame(step);
      } else {
        setIsPlaying(false);
        playFrameRef.current = null;
      }
    };

    playFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (playFrameRef.current) {
        cancelAnimationFrame(playFrameRef.current);
        playFrameRef.current = null;
      }
    };
  }, [flightData, isPlaying, playSpeed, timelineEnd, timelineStart]);

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      setErrorMessage("Bitte einen API-Schluessel eingeben.");
      return;
    }

    window.localStorage.setItem("rega_api_key", apiKey.trim());
    setErrorMessage(null);
    setIsKeyModalOpen(false);
    setShowClearKey(false);
    setIsLiveEnabled(true);
  };

  const clearApiKey = () => {
    window.localStorage.removeItem("rega_api_key");
    setApiKey("");
    setShowClearKey(false);
    setIsLiveEnabled(false);
    setLiveProgress(0);
    setIsKeyModalOpen(true);
  };

  const handlePresetChange = (seconds: number) => {
    const end = Math.floor(Date.now() / 1000);
    const start = end - seconds;
    const { startUnix, endUnix } = clampRange(start, end);
    setStartInput(toDatetimeLocalValue(new Date(startUnix * 1000)));
    setEndInput(toDatetimeLocalValue(new Date(endUnix * 1000)));
    void fetchRange(startUnix, endUnix);
  };

  const handleToggleFollow = (callsign: string) => {
    setAutoZoom(false);
    setFocusedCallsign(callsign);
    setFollowedCallsign((current) => (current === callsign ? null : callsign));
  };

  const handleFollowFromList = (callsign: string) => {
    setAutoZoom(false);
    setFollowedCallsign((current) => (current === callsign ? null : callsign));
  };

  const handleAutoZoomChange = (nextValue: boolean) => {
    setAutoZoom(nextValue);
    if (nextValue) {
      setFollowedCallsign(null);
    }
  };

  const handleTimelineChange = (value: number) => {
    stopPlayback();
    setTimeline((state) => ({ ...state, current: value }));
  };

  const handleToggleLive = () => {
    setIsLiveEnabled((current) => {
      const next = !current;
      if (!next) {
        setLiveProgress(0);
      }
      return next;
    });
  };

  const handleTogglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else if (timelineEnd > timelineStart) {
      setIsPlaying(true);
    }
  };

  const handleSelectFlight = (callsign: string) => {
    setFocusedCallsign(callsign);
    if (followedCallsign === callsign) {
      setFollowedCallsign(null);
    }
  };

  const controlsProps = {
    autoZoom,
    currentTime,
    endInput,
    isFullscreen: isNativeFullscreen || isPseudoFullscreen,
    isLiveEnabled,
    isLiveFetching,
    isManualLoading,
    isPlaying,
    liveProgress,
    maxEndInput,
    onAutoZoomChange: handleAutoZoomChange,
    onDecreasePlaySpeed: () => setPlaySpeed((current) => Math.max(0.25, Number((current / 1.5).toFixed(2)))),
    onEndInputChange: setEndInput,
    onFetchRange: () => void fetchRange(),
    onIncreasePlaySpeed: () => setPlaySpeed((current) => Math.min(8, Number((current * 1.5).toFixed(2)))),
    onPresetChange: handlePresetChange,
    onStartInputChange: setStartInput,
    onTimelineChange: handleTimelineChange,
    onToggleFullscreen: () => void toggleFullscreen(),
    onToggleLive: handleToggleLive,
    onTogglePlayback: handleTogglePlayback,
    playSpeed,
    presets: PRESETS,
    sliderStep,
    startInput,
    timelineEnd,
    timelineStart,
  };

  const controls = (
    <TrackerControls
      {...controlsProps}
    />
  );

  const mobileControls = <TrackerControls {...controlsProps} showFullscreenButton={false} />;

  return (
    <main className="relative flex h-dvh min-h-dvh flex-col overflow-hidden xl:h-screen xl:max-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_68%)]" />

      <TrackerHeader controls={controls} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col overflow-hidden xl:grid xl:grid-cols-[minmax(0,1fr)_23rem] xl:gap-5 xl:py-6">
        <TrackerMapPanel
          autoZoom={autoZoom}
          flightData={flightData}
          focusedCallsign={focusedCallsign}
          followedCallsign={followedCallsign}
          isLiveEnabled={isLiveEnabled}
          isPseudoFullscreen={isPseudoFullscreen}
          mapShellRef={mapShellRef}
          onMapInteraction={() => setFollowedCallsign(null)}
          onToggleFollow={handleToggleFollow}
          visibleFlights={visibleFlights}
        />

        <TrackerFlightSidebar
          followedCallsign={followedCallsign}
          isLiveEnabled={isLiveEnabled}
          onClearApiKey={clearApiKey}
          onFollowFlight={handleFollowFromList}
          onSelectFlight={handleSelectFlight}
          showClearKey={showClearKey}
          sortedFlights={sortedFlights}
        />
      </div>

      <footer className="pointer-events-none fixed bottom-4 left-4 z-20 rounded-full border border-white/80 bg-white/88 px-4 py-2 text-xs font-medium text-slate-600 shadow-lg backdrop-blur max-xl:hidden">
        Bereitgestellt von Flightradar24 via rega.hueppis.com
      </footer>

      {isMobileMenuOpen ? (
        <TrackerMobileMenu
          autoZoom={autoZoom}
          controls={mobileControls}
          isLiveEnabled={isLiveEnabled}
          liveProgress={liveProgress}
          onAutoZoomChange={handleAutoZoomChange}
          onClearApiKey={clearApiKey}
          onClose={() => setIsMobileMenuOpen(false)}
          showClearKey={showClearKey}
        />
      ) : null}

      {errorMessage ? (
        <div className="fixed bottom-4 left-4 z-30 max-w-md rounded-[1.2rem] border border-red-200 bg-white/95 px-4 py-3 text-sm text-red-700 shadow-lg backdrop-blur">
          {errorMessage}
        </div>
      ) : null}

      {isKeyModalOpen ? <TrackerApiKeyModal apiKey={apiKey} onApiKeyChange={setApiKey} onSave={saveApiKey} /> : null}
    </main>
  );
}