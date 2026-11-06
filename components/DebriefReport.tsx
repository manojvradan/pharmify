import Link from "next/link";
import type { ReactNode } from "react";
import { Pip } from "@/components/Pip";
import type { Debrief } from "@/lib/session/report";
import { FAIL_CONDITIONS, SKILLS } from "@/lib/session/report";

/** Fail conditions, phrased as what the candidate should achieve. */
const SCORE_ROWS: Record<(typeof FAIL_CONDITIONS)[number], { label: string; tile: string; icon: ReactNode }> = {
  "Serious harm or injury": {
    label: "No serious harm to the patient",
    tile: "bg-pink-tint",
    icon: <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />,
  },
  "Risk not reasonably minimised": {
    label: "Risk reasonably minimised",
    tile: "bg-peach-tint",
    icon: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />,
  },
  "Practising legally and professionally": {
    label: "Practised legally and professionally",
    tile: "bg-sun-tint",
    icon: (
      <path d="M12 4v16M8 20h8M5 8h14M7.5 8L5 13.5a2.6 2.6 0 005 0L7.5 8zM16.5 8L14 13.5a2.6 2.6 0 005 0L16.5 8z" />
    ),
  },
  "Reasonable factual knowledge": {
    label: "Reasonable factual knowledge",
    tile: "bg-lilac-tint",
    icon: (
      <path d="M4 5.5A1.5 1.5 0 015.5 4H11v15H5.5A1.5 1.5 0 014 17.5zM20 5.5A1.5 1.5 0 0018.5 4H13v15h5.5a1.5 1.5 0 001.5-1.5z" />
    ),
  },
};

/** Skills, phrased to read inside a sentence. */
const SKILL_PHRASE: Record<(typeof SKILLS)[number], string> = {
  "History taking": "history taking",
  "Issue identified": "spotting the issue",
  "Options considered": "weighing options",
  "Prescriber contacted well": "the prescriber call",
  "Clear counselling": "counselling",
  "Prompt corrective action": "acting promptly",
};

/** "a", "a and b", "a, b and c". */
function list(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function SectionHeading({ id, tile, children, icon }: { id: string; tile: string; children: ReactNode; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3.5">
      <span aria-hidden="true" className={`grid size-11 place-items-center rounded-[14px] ${tile}`}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#16112A"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      </span>
      <h2 id={id} className="m-0 text-[22px] font-bold tracking-[-0.015em]">
        {children}
      </h2>
    </div>
  );
}

const card = "rounded-3xl border-[1.5px] border-line bg-white";

export function DebriefReport({
  debrief,
  replayHref,
  onReplay,
}: {
  debrief: Debrief;
  /** Where "Try again with new details" goes. */
  replayHref: string;
  /** If given, replay resets in place instead of navigating. */
  onReplay?: () => void;
}) {
  const { report, facts } = debrief;
  const passed = report.result === "pass";
  const [moment, ...otherReplays] = report.replays;

  const missedFacts = facts.filter((f) => !f.found);
  const covered = report.counselling.filter((c) => c.covered).map((c) => c.point.toLowerCase());
  const missedCounselling = report.counselling.filter((c) => !c.covered).map((c) => c.point.toLowerCase());
  const strong = report.skills.filter((s) => s.result === "yes").map((s) => SKILL_PHRASE[s.skill]);
  const workOn = report.skills
    .filter((s) => s.result === "partly" || s.result === "no")
    .map((s) => SKILL_PHRASE[s.skill]);

  const replayClass =
    "inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-[14px] border-2 border-ink bg-sun px-[22px] font-bold text-ink no-underline shadow-pop hover:text-ink";
  const replayContent = (
    <>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M2.5 8a5.5 5.5 0 019.4-3.9M12 1.5v3h-3M13.5 8a5.5 5.5 0 01-9.4 3.9M4 14.5v-3h3"
          stroke="#16112A"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Try again with new details
    </>
  );

  return (
    <main className="box-border min-w-0 flex-[999_1_560px] px-[clamp(16px,3vw,40px)] pt-7 pb-14">
      <div className="mx-auto flex max-w-[920px] flex-col gap-7">
        <Link
          href="/home"
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-[15px] font-semibold text-ink-2 no-underline hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to dashboard
        </Link>

        {/* 1. Verdict and reveal */}
        <section aria-label="Your result" className={`${card} overflow-hidden rounded-[28px] shadow-card`}>
          <div className="flex flex-wrap items-center gap-7 px-9 py-8">
            <div className="relative size-28 flex-none overflow-hidden rounded-full bg-pink-tint">
              <div className="absolute top-[-2px] left-[7px]">
                <Pip mood={passed ? "celebrate" : "thinking"} size={98} />
              </div>
            </div>
            <div className="flex flex-[1_1_320px] flex-col gap-2">
              <span
                className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-sm font-bold ${
                  passed ? "bg-ok-tint text-ok" : "bg-alert-tint text-alert"
                }`}
              >
                <span aria-hidden="true" className={`size-2 rounded-full ${passed ? "bg-ok" : "bg-alert"}`} />
                {passed ? "Passed" : "Not yet a pass"}
              </span>
              <h1 className="m-0 text-[clamp(30px,3.4vw,42px)] leading-[1.08] font-bold tracking-[-0.02em] text-balance">
                {report.headline}
              </h1>
              <p className="m-0 max-w-[48ch] text-muted">{report.summary}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t-[1.5px] border-line bg-canvas px-9 py-[18px]">
            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-2.5">
              <span className="text-sm font-semibold text-subtle">The case was</span>
              <span className="text-xl font-bold">{debrief.problemType}</span>
            </div>
            {onReplay ? (
              <button type="button" onClick={onReplay} className={replayClass}>
                {replayContent}
              </button>
            ) : (
              <Link href={replayHref} className={replayClass}>
                {replayContent}
              </Link>
            )}
          </div>
        </section>

        {/* 2. Fix this first */}
        <section aria-labelledby="fix" className="flex flex-col gap-3">
          <SectionHeading
            id="fix"
            tile="bg-pink-tint"
            icon={<path d="M12 3a9 9 0 109 9M12 7a5 5 0 105 5M12 12l8-8M16 4h4v4" />}
          >
            {passed ? "Sharpen this next" : "Fix this first"}
          </SectionHeading>
          <div className={`${card} flex flex-col gap-[18px] px-7 py-[26px]`}>
            <div className="flex flex-col gap-1">
              <h3 className="m-0 flex items-center gap-2.5 text-xl font-bold">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" className="flex-none">
                  <path d="M11 2.5L20.5 19h-19z" fill="#FFE0B8" stroke="#16112A" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M11 8.5v5M11 16.2v.3" stroke="#16112A" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {report.focus.title}
              </h3>
              <p className="m-0 max-w-[62ch] text-muted">{report.focus.detail}</p>
            </div>
            {moment && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3.5">
                <div className="flex flex-col gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-subtle">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M2.5 4.5a2 2 0 012-2h7a2 2 0 012 2v5a2 2 0 01-2 2H7l-3 2.5v-2.5h0.5a2 2 0 01-2-2z"
                        stroke="#625C70"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="font-mono">{moment.time}</span> · You said
                    {moment.agent === "prescriber" ? " to the prescriber" : ""}
                  </span>
                  <p className="m-0 rounded-2xl bg-canvas px-4 py-3.5 text-ink-2">“{moment.youSaid}”</p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-pink-link">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M8 1.8a4.4 4.4 0 00-2.6 8c.5.4.8.9.8 1.5v.7h3.6v-.7c0-.6.3-1.1.8-1.5A4.4 4.4 0 008 1.8zM6.4 14.2h3.2"
                        stroke="#B4236E"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Try this instead
                  </span>
                  <p className="m-0 rounded-2xl bg-pink-tint px-4 py-3.5 font-semibold">“{moment.tryInstead}”</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. Scorecard */}
        <section aria-labelledby="score" className="flex flex-col gap-3">
          <SectionHeading
            id="score"
            tile="bg-sun-tint"
            icon={<path d="M9 4h6v3H9zM7 5.5H5.5v15h13v-15H17M8.5 13l2.5 2.5 4.5-5" />}
          >
            How you did
          </SectionHeading>
          <ul className={`${card} m-0 list-none px-7 py-2`}>
            {report.failConditions.map((f, i) => {
              const row = SCORE_ROWS[f.condition];
              const ok = f.result === "pass";
              return (
                <li
                  key={f.condition}
                  className={i < report.failConditions.length - 1 ? "border-b border-line-soft" : ""}
                >
                  {/* Failed rows start open: the moments are the point of the scorecard. */}
                  <details className="group" open={!ok}>
                    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3.5 py-3 [&::-webkit-details-marker]:hidden">
                      <span aria-hidden="true" className={`grid size-9 flex-none place-items-center rounded-xl ${row.tile}`}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#16112A"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {row.icon}
                        </svg>
                      </span>
                      <span className={`flex-1 ${ok ? "" : "font-semibold"}`}>{row.label}</span>
                      <span
                        className={`flex-none rounded-full px-2.5 py-[3px] text-[13px] font-bold ${
                          ok ? "bg-ok-tint text-ok" : "bg-alert-tint text-alert"
                        }`}
                      >
                        {ok ? "Passed" : "Not met"}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                        className="flex-none text-subtle transition-transform group-open:rotate-180 motion-reduce:transition-none"
                      >
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <div className="flex flex-col gap-3 pb-4 pl-[50px]">
                      <p className="m-0 max-w-[62ch] text-[15px] text-muted">{f.evidence}</p>
                      {f.moments.length > 0 && (
                        <ol className="m-0 flex list-none flex-col gap-2.5 p-0" aria-label={`Moments for ${row.label}`}>
                          {f.moments.map((m) => (
                            <li
                              key={`${m.time}-${m.quote}`}
                              className={`flex flex-col gap-1.5 rounded-2xl border-l-4 px-4 py-3 ${
                                ok ? "border-ok bg-ok-tint/40" : "border-alert bg-alert-tint/40"
                              }`}
                            >
                              <span className="text-[13px] font-semibold text-subtle">
                                <span className="font-mono">{m.time}</span> ·{" "}
                                {m.speaker === "candidate"
                                  ? `You said${m.agent === "prescriber" ? " to the prescriber" : ""}`
                                  : m.agent === "prescriber"
                                    ? "The prescriber said"
                                    : "The patient said"}
                              </span>
                              <q className="text-ink-2 before:content-['“'] after:content-['”']">{m.quote}</q>
                              <span className="text-[14px] font-semibold">{m.note}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 4. Go deeper */}
        <section aria-labelledby="deeper" className="flex flex-col gap-3">
          <SectionHeading
            id="deeper"
            tile="bg-lilac-tint"
            icon={<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5" />}
          >
            Go deeper
          </SectionHeading>
          <div className={`${card} flex flex-col gap-3.5 px-7 pt-[22px] pb-6`}>
            <ul className="m-0 flex list-disc flex-col gap-2.5 pl-5 text-ink-2">
              {facts.length > 0 && (
                <li className="pl-1">
                  <b className="font-semibold">Hidden facts:</b> you found {facts.length - missedFacts.length} of{" "}
                  {facts.length}.
                  {missedFacts.length > 0 && ` Missed: ${list(missedFacts.map((f) => f.fact))}.`}
                </li>
              )}
              {report.counselling.length > 0 && (
                <li className="pl-1">
                  <b className="font-semibold">Counselling:</b>{" "}
                  {covered.length > 0 ? `covered ${list(covered)}.` : "none of the key points were covered."}
                  {covered.length > 0 && missedCounselling.length > 0 && ` Missed ${list(missedCounselling)}.`}
                </li>
              )}
              {(strong.length > 0 || workOn.length > 0) && (
                <li className="pl-1">
                  <b className="font-semibold">Skills:</b>{" "}
                  {strong.length > 0 && `strong at ${list(strong)}.`}
                  {strong.length > 0 && workOn.length > 0 && " "}
                  {workOn.length > 0 && `${strong.length > 0 ? "Work" : "work"} on ${list(workOn)}.`}
                </li>
              )}
              {otherReplays.map((r) => (
                <li key={`${r.time}-${r.youSaid}`} className="pl-1">
                  <b className="font-semibold">
                    {debrief.format === "explain" ? "In your answer" : r.agent === "prescriber" ? "Prescriber call" : "With the patient"},{" "}
                    {r.time}:
                  </b>{" "}
                  you said “{r.youSaid}” Try “{r.tryInstead}”
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="m-0 text-center text-[13px] text-subtle">
          Practice feedback, not a predicted exam result.
          {debrief.draft && " This case is a draft and still needs pharmacist review."}
        </p>
      </div>
    </main>
  );
}
