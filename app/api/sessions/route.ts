import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getCase } from "@/lib/cases/bank";
import { PART_SECONDS_BY_FORMAT, caseFormat } from "@/lib/cases/format";
import { createSession } from "@/lib/session/store";

const Body = z.object({ caseId: z.string() });

/** Starts a session. The server's start time is the clock from here on. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const c = getCase(parsed.data.caseId);
  if (!c) return Response.json({ error: "Unknown case" }, { status: 404 });

  const session = await createSession(userId, c);
  return Response.json(
    { sessionId: session.id, partSeconds: PART_SECONDS_BY_FORMAT[caseFormat(c.category)] },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
