"use client";

import { useState, type FormEvent } from "react";

/** Pilot waitlist: saves the email to the database. */
export function PilotSignup() {
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
      <p
        role="status"
        className="m-0 max-w-[500px] rounded-2xl border-2 border-ink bg-white px-5 py-4 font-semibold shadow-pop"
      >
        Spot saved for {email}. Pip will be in touch before the pilot opens.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-[500px] flex-wrap gap-2.5 pt-1.5">
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
        className="min-h-14 flex-[1_1_240px] rounded-2xl border-[1.5px] border-line bg-white px-[18px] text-base text-ink"
      />
      <button
        type="submit"
        disabled={sending}
        className="min-h-14 flex-none cursor-pointer rounded-2xl border-2 border-ink bg-sun px-[26px] font-bold text-ink shadow-pop disabled:cursor-wait disabled:opacity-70"
      >
        {sending ? "Saving…" : "Save my spot"}
      </button>
      {error && (
        <p role="alert" className="m-0 basis-full font-semibold text-alert">
          {error}
        </p>
      )}
    </form>
  );
}
