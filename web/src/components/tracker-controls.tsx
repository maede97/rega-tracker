import {
  Maximize2,
  Minimize2,
  Minus,
  Pause,
  Play,
  Plus,
  RadioTower,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatSwiss } from "@/lib/date";

export type TrackerPreset = {
  label: string;
  value: number;
};

type TrackerControlsProps = {
  autoZoom: boolean;
  currentTime: number;
  endInput: string;
  isFullscreen: boolean;
  isLiveEnabled: boolean;
  isLiveFetching: boolean;
  isManualLoading: boolean;
  isPlaying: boolean;
  liveProgress: number;
  maxEndInput: string;
  onAutoZoomChange: (nextValue: boolean) => void;
  onDecreasePlaySpeed: () => void;
  onEndInputChange: (value: string) => void;
  onFetchRange: () => void;
  onIncreasePlaySpeed: () => void;
  onPresetChange: (seconds: number) => void;
  onStartInputChange: (value: string) => void;
  onTimelineChange: (value: number) => void;
  onToggleFullscreen: () => void;
  onToggleLive: () => void;
  onTogglePlayback: () => void;
  playSpeed: number;
  presets: TrackerPreset[];
  showFullscreenButton?: boolean;
  showInlineLiveStatus?: boolean;
  sliderStep: number;
  startInput: string;
  timelineEnd: number;
  timelineStart: number;
};

function getLiveClockStroke(progress: number) {
  return String(100 * (1 - Math.min(1, Math.max(0, progress))));
}

export function TrackerControls({
  autoZoom,
  currentTime,
  endInput,
  isFullscreen,
  isLiveEnabled,
  isLiveFetching,
  isManualLoading,
  isPlaying,
  liveProgress,
  maxEndInput,
  onAutoZoomChange,
  onDecreasePlaySpeed,
  onEndInputChange,
  onFetchRange,
  onIncreasePlaySpeed,
  onPresetChange,
  onStartInputChange,
  onTimelineChange,
  onToggleFullscreen,
  onToggleLive,
  onTogglePlayback,
  playSpeed,
  presets,
  showFullscreenButton = true,
  showInlineLiveStatus = true,
  sliderStep,
  startInput,
  timelineEnd,
  timelineStart,
}: TrackerControlsProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) {
        setIsHydrated(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const sliderIsDisabled = !isHydrated || timelineEnd <= timelineStart;
  const sliderMax = isHydrated ? timelineEnd || 100 : 100;
  const sliderMin = isHydrated ? timelineStart || 0 : 0;
  const sliderValue = isHydrated ? currentTime || timelineStart || 0 : 0;
  const sliderResolvedStep = isHydrated ? sliderStep : 60;

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:flex-nowrap xl:items-center xl:justify-end xl:gap-2 2xl:gap-3">
      <label className="flex min-w-44 flex-col gap-1 text-xs font-medium uppercase tracking-[0.18em] text-white/75 xl:min-w-36 xl:text-[0.65rem] 2xl:min-w-40">
        Start
        <input
          className="rounded-2xl border border-white/15 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-white/50 xl:px-2.5 xl:py-1.5 xl:text-[0.8rem]"
          max={endInput || undefined}
          onChange={(event) => onStartInputChange(event.target.value)}
          type="datetime-local"
          value={startInput}
        />
      </label>
      <label className="flex min-w-44 flex-col gap-1 text-xs font-medium uppercase tracking-[0.18em] text-white/75 xl:min-w-36 xl:text-[0.65rem] 2xl:min-w-40">
        Ende
        <input
          className="rounded-2xl border border-white/15 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-white/50 xl:px-2.5 xl:py-1.5 xl:text-[0.8rem]"
          max={maxEndInput}
          onChange={(event) => onEndInputChange(event.target.value)}
          type="datetime-local"
          value={endInput}
        />
      </label>
      <button
        aria-label={isManualLoading ? "Zeitraum wird abgerufen" : "Zeitraum abrufen"}
        className="cursor-pointer grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/16 xl:h-8 xl:w-8"
        onClick={onFetchRange}
        title={isManualLoading ? "Zeitraum wird abgerufen" : "Zeitraum abrufen"}
        type="button"
      >
        <RefreshCw className={`h-4 w-4 ${isManualLoading ? "animate-spin" : ""}`} strokeWidth={2.25} />
        <span className="sr-only">{isManualLoading ? "Abrufen..." : "Abrufen"}</span>
      </button>
      <select
        className="rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white outline-none transition hover:bg-white/8 xl:px-3 xl:py-1.5 xl:text-[0.8rem]"
        defaultValue=""
        onChange={(event) => {
          if (event.target.value) {
            onPresetChange(Number(event.target.value));
            event.target.value = "";
          }
        }}
      >
        <option value="">Voreinstellungen</option>
        {presets.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
      </select>
      <button
        aria-label={isLiveEnabled ? "Live-Modus deaktivieren" : "Live-Modus aktivieren"}
        className={`cursor-pointer inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition xl:px-3 xl:py-1.5 xl:text-[0.8rem] ${
          isLiveEnabled
            ? "border-white bg-white text-[var(--rega-red)]"
            : "border-white/20 bg-white/10 text-white hover:bg-white/16"
        }`}
        onClick={onToggleLive}
        title={isLiveEnabled ? "Live-Modus deaktivieren" : "Live-Modus aktivieren"}
        type="button"
      >
        <span>Live</span>
        <RadioTower className="h-4 w-4" strokeWidth={2.25} />
      </button>
      {showInlineLiveStatus ? (
        <div className="hidden items-center gap-2 xl:flex xl:flex-shrink-0">
          <div className={`grid h-6 w-6 place-items-center ${isLiveFetching ? "animate-pulse" : ""}`}>
            <svg className="h-5 w-5 -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-white/25"
                d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831a15.9155 15.9155 0 1 1 0-31.831"
                fill="none"
                strokeWidth="3"
              />
              <path
                className="stroke-white transition-[stroke-dashoffset] duration-100"
                d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831a15.9155 15.9155 0 1 1 0-31.831"
                fill="none"
                strokeDasharray="100"
                strokeDashoffset={getLiveClockStroke(liveProgress)}
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-white xl:text-[0.8rem] xl:whitespace-nowrap">
            <input
              checked={autoZoom}
              className="h-4 w-4 rounded accent-white"
              onChange={(event) => onAutoZoomChange(event.target.checked)}
              type="checkbox"
            />
            Auto-Zoom
          </label>
        </div>
      ) : null}
      <div className="flex flex-col gap-2 rounded-[1.4rem] border border-white/15 bg-white/10 px-2 py-2 xl:min-w-0 xl:flex-1 xl:flex-row xl:items-center xl:gap-1.5 xl:rounded-full xl:px-1.5 xl:py-1">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 xl:min-w-0 xl:flex-1 xl:w-28 2xl:w-36">
            <input
              className="w-full accent-white"
              disabled={sliderIsDisabled}
              max={sliderMax}
              min={sliderMin}
              onChange={(event) => onTimelineChange(Number(event.target.value))}
              step={sliderResolvedStep}
              type="range"
              value={sliderValue}
            />
          </div>
          <button
            aria-label="Wiedergabegeschwindigkeit verringern"
            className="cursor-pointer grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-white/15 bg-transparent text-white transition hover:bg-white/12 xl:h-8 xl:w-8"
            onClick={onDecreasePlaySpeed}
            title="Wiedergabegeschwindigkeit verringern"
            type="button"
          >
            <Minus className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <button
            aria-label={isPlaying ? "Wiedergabe pausieren" : "Wiedergabe starten"}
            className={`cursor-pointer grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border text-white transition xl:h-8 xl:w-8 ${
              isPlaying
                ? "border-[var(--rega-red)] bg-[var(--rega-red)] text-white"
                : "border-white/15 bg-transparent hover:bg-white/12"
            }`}
            onClick={onTogglePlayback}
            title={isPlaying ? "Wiedergabe pausieren" : "Wiedergabe starten"}
            type="button"
          >
            {isPlaying ? <Pause className="h-4 w-4" strokeWidth={2.25} /> : <Play className="h-4 w-4" strokeWidth={2.25} />}
          </button>
          <button
            aria-label="Wiedergabegeschwindigkeit erhoehen"
            className="cursor-pointer grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-white/15 bg-transparent text-white transition hover:bg-white/12 xl:h-8 xl:w-8"
            onClick={onIncreasePlaySpeed}
            title="Wiedergabegeschwindigkeit erhoehen"
            type="button"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 px-1 xl:min-w-0 xl:flex-shrink-0 xl:justify-start xl:gap-2 xl:px-0">
          <div className="min-w-10 text-left font-mono text-sm text-white xl:text-center xl:text-[0.8rem]">{playSpeed}x</div>
          <div className="text-right text-sm text-white/90 xl:min-w-32 xl:text-center xl:text-[0.8rem] 2xl:min-w-36">{formatSwiss(currentTime)}</div>
        </div>
      </div>
      {showFullscreenButton ? (
        <button
          aria-label={isFullscreen ? "Vollbild beenden" : "Vollbild aktivieren"}
          className="cursor-pointer grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/16 xl:h-8 xl:w-8"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Vollbild beenden" : "Vollbild aktivieren"}
          type="button"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" strokeWidth={2.25} /> : <Maximize2 className="h-4 w-4" strokeWidth={2.25} />}
          <span className="sr-only">{isFullscreen ? "Vollbild beenden" : "Vollbild"}</span>
        </button>
      ) : null}
    </div>
  );
}