import { X } from "lucide-react";
import type { ReactNode } from "react";

type TrackerMobileMenuProps = {
  autoZoom: boolean;
  controls: ReactNode;
  isLiveEnabled: boolean;
  liveProgress: number;
  onAutoZoomChange: (nextValue: boolean) => void;
  onClearApiKey: () => void;
  onClose: () => void;
  showClearKey: boolean;
};

export function TrackerMobileMenu({
  autoZoom,
  controls,
  isLiveEnabled,
  liveProgress,
  onAutoZoomChange,
  onClearApiKey,
  onClose,
  showClearKey,
}: TrackerMobileMenuProps) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/45 xl:hidden" onClick={onClose}>
      <div
        className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col gap-4 overflow-y-auto bg-[linear-gradient(135deg,var(--rega-red),var(--rega-red-deep))] px-5 py-5 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-white/70">Controls</p>
            <h2 className="text-xl font-semibold text-white">Zeitleiste und Filter</h2>
          </div>
          <button
            className="cursor-pointer grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/10 text-lg text-white transition hover:bg-white/16"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
        <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Live Status</span>
            <span className="font-mono text-xs text-white/70">{isLiveEnabled ? "Aktiv" : "Pausiert"}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-100"
              style={{ width: `${Math.min(liveProgress, 1) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">{controls}</div>
        <label className="flex items-center gap-3 rounded-[1.25rem] border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur">
          <input
            checked={autoZoom}
            className="h-4 w-4 rounded accent-white"
            onChange={(event) => onAutoZoomChange(event.target.checked)}
            type="checkbox"
          />
          Auto-Zoom
        </label>
        {showClearKey ? (
          <button
            className="cursor-pointer rounded-full border border-white/20 bg-white px-4 py-3 text-sm font-semibold text-[var(--rega-red)] transition hover:bg-white/92"
            onClick={onClearApiKey}
            type="button"
          >
            API-Schlüssel ändern
          </button>
        ) : null}
        <div className="rounded-[1.4rem] border border-white/15 bg-white/10 px-4 py-4 text-sm text-white/78 backdrop-blur">
          Daten älter als zwei Wochen sind nicht verfügbar.
        </div>
        <div className="text-center text-xs text-white/70">Bereitgestellt von Flightradar24 via rega.hueppis.com</div>
      </div>
    </div>
  );
}