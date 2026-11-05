"use client";

import { useState } from "react";
import { Pip } from "@/components/Pip";
import { CODE_OF_ETHICS, DOMAINS, SESSION_SIZE, type Domain } from "@/lib/flashcards";

const ALL = CODE_OF_ETHICS.cards;
const COUNTS = new Map(DOMAINS.map((d) => [d, ALL.filter((c) => c.domain === d).length]));

const pillStat = "rounded-full border-[1.5px] border-line px-3.5 py-2 text-sm font-bold";
const gradeBtn =
  "min-h-[60px] cursor-pointer rounded-[18px] border-2 border-ink text-[17px] font-semibold text-ink shadow-pop-md";

export function FlashcardDeck() {
  const [deck, setDeck] = useState<Domain | "all">("all");
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learning, setLearning] = useState(0);
  const [mastered, setMastered] = useState(0);

  const cards = deck === "all" ? ALL : ALL.filter((c) => c.domain === deck);
  const due = Math.min(SESSION_SIZE, cards.length);
  const card = cards[i % cards.length];
  const done = Math.min(i, due);
  const left = due - done;
  const finished = done >= due;

  function next(gotIt: boolean) {
    setI(i + 1);
    setFlipped(false);
    if (gotIt) setMastered(mastered + 1);
    else setLearning(learning + 1);
  }

  function chooseDeck(d: Domain | "all") {
    setDeck(d);
    setI(0);
    setFlipped(false);
  }

  return (
    <main className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-[clamp(16px,3vw,40px)] pt-8 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-[clamp(28px,3vw,38px)] font-bold tracking-[-0.015em]">Code of Ethics flashcards</h1>
          <p className="m-0 text-muted">A few cards a day. Say your answer out loud, then flip.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <span className={`${pillStat} bg-white`}>
            Due today <b>{left}</b>
          </span>
          <span className={`${pillStat} bg-white`}>
            Learning <b>{learning}</b>
          </span>
          <span className={`${pillStat} bg-sun`}>
            Mastered <b>{mastered}</b>
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3.5">
        <span aria-hidden="true" className="block h-3.5 flex-1 overflow-hidden rounded-[7px] border-[1.5px] border-line bg-white">
          <span className="block h-full bg-pink transition-[width]" style={{ width: `${Math.round((done / due) * 100)}%` }} />
        </span>
        <span className="font-mono text-sm">
          {done} / {due}
        </span>
      </div>

      <div className="flex flex-wrap items-start gap-7">
        {/* Card */}
        <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-5">
          {finished ? (
            <div className="flex min-h-[340px] flex-col items-center justify-center gap-4 rounded-[32px] border-[1.5px] border-line bg-white p-10 text-center shadow-card">
              <Pip mood="celebrate" size={110} />
              <p className="m-0 text-[clamp(24px,2.6vw,34px)] font-bold tracking-[-0.02em]">All done for today.</p>
              <p className="m-0 text-muted">Come back tomorrow to keep the streak going.</p>
              <button
                type="button"
                onClick={() => chooseDeck(deck)}
                className="min-h-12 cursor-pointer rounded-[14px] border-2 border-ink bg-white px-6 font-bold text-ink shadow-pop"
              >
                Study this deck again
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setFlipped(!flipped)}
                aria-label={flipped ? "Show the question" : "Show the answer"}
                className={`relative box-border flex min-h-[340px] w-full cursor-pointer flex-col gap-[18px] rounded-[32px] border-[1.5px] border-line px-10 py-9 text-left text-ink shadow-card ${
                  flipped ? "bg-sun-tint" : "bg-white"
                }`}
              >
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="rounded-full bg-ink px-3 py-[5px] font-mono text-xs text-white">
                    {flipped ? "ANSWER" : "QUESTION"}
                  </span>
                  <span className="text-sm font-bold text-muted">{card.section}</span>
                </span>
                {flipped ? (
                  <span className="flex flex-col gap-3">
                    <span className="text-[22px] leading-[1.35] font-semibold">{card.back}</span>
                    <span className="text-sm text-muted">Source: {card.source}</span>
                  </span>
                ) : (
                  <span className="text-[clamp(24px,2.6vw,34px)] leading-[1.2] font-bold tracking-[-0.02em] text-balance">
                    {card.front}
                  </span>
                )}
                <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-muted">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M2.5 8a5.5 5.5 0 019.4-3.9M13.5 8a5.5 5.5 0 01-9.4 3.9M12 1.5v3h-3M4 14.5v-3h3"
                      stroke="#4F4960"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {flipped ? "Tap the card to see the question again" : "Tap the card to flip"}
                </span>
              </button>

              {flipped ? (
                <div
                  role="group"
                  aria-label="How well did you know it?"
                  className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-3"
                >
                  <button type="button" onClick={() => next(false)} className={`${gradeBtn} bg-white`}>
                    Again<span className="block text-xs font-semibold text-muted">in a few minutes</span>
                  </button>
                  <button type="button" onClick={() => next(false)} className={`${gradeBtn} bg-pink-tint`}>
                    Almost<span className="block text-xs font-semibold text-muted">tomorrow</span>
                  </button>
                  <button type="button" onClick={() => next(true)} className={`${gradeBtn} bg-pink`}>
                    Got it<span className="block text-xs font-semibold text-plum">in 4 days</span>
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setFlipped(true)}
                    className="min-h-[60px] cursor-pointer rounded-[18px] border-2 border-ink bg-sun px-9 text-[19px] font-bold text-ink shadow-pop-md"
                  >
                    Show answer
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Side panel */}
        <aside aria-label="Study tips and decks" className="flex min-w-0 flex-[1_1_260px] flex-col gap-4">
          <div className="flex items-center gap-3.5 rounded-3xl border-[1.5px] border-line bg-white p-5">
            <Pip mood={flipped ? "happy" : "thinking"} size={70} />
            <p className="m-0 text-[15px] leading-[1.4] font-bold">
              {flipped
                ? "How close were you? Be honest, it helps the cards come back at the right time."
                : "Say your answer out loud before you flip. It sticks better."}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 rounded-3xl border-[1.5px] border-line bg-white p-5">
            <h2 className="m-0 text-lg font-bold">Decks</h2>
            {(["all", ...DOMAINS] as const).map((d) => {
              const active = deck === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => chooseDeck(d)}
                  aria-pressed={active}
                  className={`flex min-h-11 cursor-pointer items-center justify-between rounded-xl px-3.5 text-left text-base text-ink ${
                    active ? "bg-pink-tint font-bold" : "bg-transparent font-semibold"
                  }`}
                >
                  {d === "all" ? "All cards" : d}
                  <span className="text-sm text-muted">{d === "all" ? ALL.length : COUNTS.get(d)}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}
