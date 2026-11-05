import { auth } from "@clerk/nextjs/server";
import { ProfileUpdate } from "@/lib/onboarding";
import { getProfile, saveProfile, type Profile } from "@/lib/profile";

const headers = { "Cache-Control": "no-store" };

function view(p: Profile | undefined) {
  return {
    examSitting: p?.examSitting ?? null,
    state: p?.state ?? null,
    internshipStage: p?.internshipStage ?? null,
    micChecked: Boolean(p?.micCheckedAt),
    onboarded: Boolean(p?.onboardedAt),
  };
}

/** The signed-in user's onboarding answers. A user who hasn't started gets empty answers. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });
  return Response.json(view(await getProfile(userId)), { headers });
}

/** Saves some or all onboarding answers; `completed: true` marks onboarding done. */
export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });

  const parsed = ProfileUpdate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  return Response.json(view(await saveProfile(userId, parsed.data)), { headers });
}
