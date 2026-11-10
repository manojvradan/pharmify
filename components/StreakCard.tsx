import { Flame } from "@/components/icons";
import { getViewerProgress } from "@/lib/session/viewer";

/*
 * The sidebar's streak: consecutive days with a finished interview (lib/session/progress.ts).
 * Rendered on the server and handed to the sidebar, which is a client component. When the
 * sidebar is collapsed (data-collapsed on its <aside>), only the flame and the number show.
 */

const card =
  "group/streak flex items-center gap-2.5 rounded-[16px] bg-sun-tint p-3 group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:px-0";

function StreakBody({ days, note }: { days: number | null; note: string }) {
  return (
    <div className={card} title={days === null ? undefined : `${days}-day streak · ${note}`}>
      {/* Flickers on hover. */}
      <span className="flex-none origin-bottom transition-transform duration-300 group-hover/streak:animate-wiggle motion-safe:group-hover/streak:scale-110">
        <Flame size={28} />
      </span>
      <div className="flex min-w-0 flex-col leading-[1.25] group-data-[collapsed=true]/sidebar:hidden">
        <span className="text-[15px] font-bold">
          {days === null ? "Streak" : days === 0 ? "Start a streak" : days === 1 ? "1-day streak" : `${days}-day streak`}
        </span>
        <span className="truncate text-xs text-muted">{note}</span>
      </div>
      {days !== null && (
        <span className="hidden text-[15px] font-bold group-data-[collapsed=true]/sidebar:inline" aria-hidden="true">
          {days}
        </span>
      )}
    </div>
  );
}

export async function StreakCard() {
  const p = await getViewerProgress();
  const s = p?.streak ?? { days: 0, today: false };
  const note = s.days === 0 ? "Finish one today" : s.today ? "Done for today" : "Play today to keep it";
  return <StreakBody days={s.days} note={note} />;
}

export function StreakCardFallback() {
  return <StreakBody days={null} note=" " />;
}
