"use client";

import { useState, type FormEvent } from "react";

const STYLES = {
  /** Rounded-rectangle fields, yellow button. */
  default: {
    form: "flex max-w-[500px] flex-wrap gap-2.5 pt-1.5",
    input: "min-h-14 flex-[1_1_240px] rounded-2xl border-[1.5px] border-line bg-white px-[18px] text-base text-ink",
    button:
      "min-h-14 flex-none cursor-pointer rounded-2xl border-2 border-ink bg-sun px-[26px] font-bold text-ink shadow-pop disabled:cursor-wait disabled:opacity-70",
    saved: "m-0 max-w-[500px] rounded-2xl border-2 border-ink bg-white px-5 py-4 font-semibold shadow-pop",
    label: "Save my spot",
  },
  /** The landing page's chunky pills: maroon outlines, pink button with a hard shadow. */
  pill: {
    form: "flex max-w-[480px] flex-wrap gap-3",
    input:
      "min-h-14 flex-[1_1_220px] rounded-full border-[3px] border-[#4A2233] bg-white px-5 text-[17px] text-[#4A2233]",
    button:
      "inline-flex min-h-14 flex-none cursor-pointer items-center justify-center rounded-full border-[3px] border-[#4A2233] bg-[#FF8CC6] px-7 text-lg font-extrabold text-[#4A2233] shadow-[0_5px_0_#4A2233] disabled:cursor-wait disabled:opacity-70",
    saved:
      "m-0 max-w-[480px] rounded-[28px] border-[3px] border-[#4A2233] bg-white px-5 py-4 font-bold text-[#4A2233] shadow-[0_5px_0_#4A2233]",
    label: "Join the pilot",
  },
} as const;

/** Pilot waitlist: saves the email to the database. */
export function PilotSignup({ variant = "default" }: { variant?: keyof typeof STYLES }) {
  const s = STYLES[variant];
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save your spot, try again");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your spot, try again");
    } finally {
      setSending(false);
    }
  }

  if (saved) {
    return (
      <p role="status" className={s.saved}>
        Spot saved for {email}. Pip will be in touch before the pilot opens.
      </p>
    );
  }

  return (
    <form id="join" onSubmit={onSubmit} className={s.form}>
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={s.input}
      />
      <button type="submit" disabled={sending} className={s.button}>
        {sending ? "Saving…" : s.label}
      </button>
      {error && (
        <p role="alert" className="m-0 basis-full font-semibold text-alert">
          {error}
        </p>
      )}
    </form>
  );
}
