import type { DispensingEntry } from "@/lib/cases/schema";

/** The patient's dispensing history, one line per dispensing as the dispensing software prints it. */
export function DispensingHistory({ entries }: { entries: DispensingEntry[] }) {
  return (
    <div className="flex flex-col">
      {entries.map((d, i) => {
        const detail = [d.directions, d.quantity && `Qty ${d.quantity}`, d.prescriber].filter(Boolean).join(" · ");
        return (
          <div
            key={`${d.date}-${d.item}-${i}`}
            className={`flex justify-between gap-3 py-1.5 text-sm ${i < entries.length - 1 ? "border-b border-line-soft" : ""}`}
          >
            <span className="flex min-w-0 flex-col">
              <span>{d.item}</span>
              {detail && <span className="text-[13px] text-subtle">{detail}</span>}
            </span>
            <span className="flex-none font-mono whitespace-nowrap text-subtle">{d.date}</span>
          </div>
        );
      })}
    </div>
  );
}
