import { Menu } from "lucide-react";
import type { ReactNode } from "react";

type TrackerHeaderProps = {
  controls: ReactNode;
  onOpenMobileMenu: () => void;
};

export function TrackerHeader({ controls, onOpenMobileMenu }: TrackerHeaderProps) {
  return (
    <header className="relative z-10 border-b border-white/10 bg-[linear-gradient(135deg,var(--rega-red),var(--rega-red-deep))] px-4 py-4 text-white shadow-[var(--shadow)] sm:px-6">
      <div className="mx-auto flex max-w-[1800px] items-center gap-4 xl:justify-between">
        <div className="flex items-center gap-3 xl:flex-shrink-0">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-base font-bold tracking-[0.08em] text-[var(--rega-red)] shadow-lg xl:h-11 xl:w-11 xl:text-sm">
            REGA
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight xl:text-lg">Flugverlauf</h1>
          </div>
        </div>

        <button
          className="cursor-pointer ml-auto grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 text-xl xl:hidden"
          onClick={onOpenMobileMenu}
          type="button"
        >
          <Menu className="h-5 w-5" strokeWidth={2.25} />
        </button>

        <div className="hidden xl:min-w-0 xl:flex-1 xl:block">{controls}</div>
      </div>
    </header>
  );
}