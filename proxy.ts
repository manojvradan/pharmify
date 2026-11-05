import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/** Pages that need a signed-in user. API routes check `auth()` themselves and answer 401 as JSON. */
const isProtectedPage = createRouteMatcher(["/home(.*)", "/flashcards(.*)", "/debrief(.*)", "/session(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedPage(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
