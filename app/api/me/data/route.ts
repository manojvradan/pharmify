import { auth } from "@clerk/nextjs/server";
import { deleteUserData } from "@/lib/session/store";

/**
 * Deletes every session, transcript, debrief and usage record for the signed-in user.
 * Their Clerk account itself is managed in Clerk.
 */
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in" }, { status: 401 });
  const sessionsDeleted = await deleteUserData(userId);
  return Response.json({ sessionsDeleted });
}
