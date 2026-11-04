"use client";

import { useState, type FormEvent } from "react";

/** Mock pilot sign-up: no backend yet, it only confirms on screen. */
export function PilotSignup() {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (email) setSaved(true);
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
        className="min-h-14 flex-none cursor-pointer rounded-2xl border-2 border-ink bg-sun px-[26px] font-bold text-ink shadow-pop"
      >
        Save my spot
      </button>
    </form>
  );
}
