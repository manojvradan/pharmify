import "server-only";

/** Hands-free voice (LiveKit) is on when the project keys and the agent ticket secret are all set. */
export function liveKitEnabled(): boolean {
  return Boolean(
    process.env.LIVEKIT_URL &&
      process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET &&
      (process.env.AGENT_TICKET_SECRET?.length ?? 0) >= 32 &&
      process.env.ELEVENLABS_API_KEY,
  );
}
