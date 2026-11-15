import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DebriefReport } from "@/components/DebriefReport";
import { getCase } from "@/lib/cases/bank";
import { rewardFor } from "@/lib/pip/store";
import { getDebrief, getOwnedSession } from "@/lib/session/store";

export const metadata: Metadata = { title: "Case results" };

async function SavedDebrief({ params }: { params: PageProps<"/debrief/[sessionId]">["params"] }) {
  const { sessionId } = await params;
  const { userId } = await auth();
  // Not a UUID, not theirs, or not graded yet: all look the same from outside.
  if (!userId || !/^[0-9a-f-]{36}$/i.test(sessionId)) notFound();
  const session = await getOwnedSession(userId, sessionId);
  const debrief = session && (await getDebrief(session.id));
  if (!session || !debrief) notFound();
  const reward = debrief.report.result === "pass" ? await rewardFor(userId, session.id) : [];
  // A case reviewed since this debrief was saved no longer shows the draft note.
  const c = getCase(session.caseId);
  const draft = c ? c.review.status !== "reviewed" : debrief.draft;
  return <DebriefReport debrief={{ ...debrief, draft, reward }} replayHref={`/session/${session.caseId}`} />;
}

export default function DebriefPage({ params }: PageProps<"/debrief/[sessionId]">) {
  return (
    <Suspense fallback={<main className="flex-[999_1_560px] px-10 pt-10 text-muted">Loading your results…</main>}>
      <SavedDebrief params={params} />
    </Suspense>
  );
}
