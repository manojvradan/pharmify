"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Marks an interview that was left unfinished, from whatever was said, then opens its
 * debrief. Same marking as finishing normally (/api/session/grade), which also closes it.
 */
export function GetFeedbackButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "marking" | "error">("idle");

  async function mark() {
    setState("marking");
    try {
      const res = await fetch("/api/session/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error();
      router.push(`/debrief/${sessionId}`);
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void mark()}
      disabled={state === "marking"}
      className="flex-none cursor-pointer rounded-full border-[1.5px] border-ink bg-white px-3.5 py-1.5 text-[13px] font-bold text-ink hover:bg-ink hover:text-white disabled:cursor-wait disabled:opacity-70"
    >
      {state === "marking" ? "Marking… (about a minute)" : state === "error" ? "Couldn't mark it. Try again" : "Get feedback"}
    </button>
  );
}
