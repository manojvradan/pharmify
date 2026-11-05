import { z } from "zod";
import { db, schema } from "@/lib/db";

const Body = z.object({ email: z.email().max(254) });

/** Public: joins the pilot waitlist. Signing up twice is not an error. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please enter a valid email address" }, { status: 400 });
  await db()
    .insert(schema.pilotSignups)
    .values({ email: parsed.data.email.trim().toLowerCase() })
    .onConflictDoNothing();
  return Response.json({ ok: true }, { status: 201 });
}
