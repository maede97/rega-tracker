type TrackerApiKeyModalProps = {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onSave: () => void;
};

export function TrackerApiKeyModal({ apiKey, onApiKeyChange, onSave }: TrackerApiKeyModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <form
        className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.32em] text-[var(--muted)]">Auth</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">API-Schluessel eingeben</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Fügen Sie Ihren Bearer-Token ein, um auf die REGA-Flugdaten zuzugreifen. Der Wert wird lokal im Browser gespeichert.
        </p>
        <input
          className="mt-5 w-full rounded-[1.2rem] border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--rega-red)]"
          onChange={(event) => onApiKeyChange(event.target.value)}
          placeholder="Bearer token..."
          type="text"
          value={apiKey}
        />
        <div className="mt-5 flex justify-end">
          <button
            className="cursor-pointer rounded-full bg-[var(--rega-red)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--rega-red-deep)]"
            type="submit"
          >
            Speichern
          </button>
        </div>
      </form>
    </div>
  );
}