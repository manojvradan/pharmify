/**
 * Copy of lib/voice/agentTicket.shared.ts in the web app. The agent is built and deployed
 * on its own (LiveKit Cloud builds only this folder), so it can't import from the app.
 * Keep the two in step.
 */
export const AGENT_TICKET_HEADER = "x-agent-ticket";
export const VOICE_AGENT_NAME = "pharmify-actor";

export type CharacterId = "patient" | "prescriber";

export type AgentJobMetadata = {
  sessionId: string;
  ticket: string;
  apiBase: string;
  characters: { id: CharacterId; name: string; openingLine?: string; voiceId: string }[];
};

export const TOPIC_SWITCH = "pharmify.agent";
export const TOPIC_ENDED = "pharmify.ended";
