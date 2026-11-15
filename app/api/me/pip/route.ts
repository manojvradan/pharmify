import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { Outfit } from "@/lib/pip/items";
import { getWardrobe, saveOutfit } from "@/lib/pip/store";

const headers = { "Cache-Control": "no-store" };

/** What the signed-in user's Pip owns and is wearing. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });
  return Response.json(await getWardrobe(userId), { headers });
}

const Body = z.object({ outfit: Outfit });

/** Changes what Pip is wearing. Only items the user has won can be worn. */
export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { owned } = await getWardrobe(userId);
  const outfit = parsed.data.outfit;
  if (Object.values(outfit).some((id) => !owned.includes(id))) {
    return Response.json({ error: "You haven't unlocked that yet" }, { status: 403 });
  }
  await saveOutfit(userId, outfit);
  return Response.json({ owned, outfit }, { headers });
}
