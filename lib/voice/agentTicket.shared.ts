/** Header the hands-free voice agent sends its session ticket in (see agentTicket.ts). */
export const AGENT_TICKET_HEADER = "x-agent-ticket";
/** The LiveKit agent name the worker in agent/ registers, and that rooms dispatch. */
export const VOICE_AGENT_NAME = "pharmify-actor";

/** What the browser's room token asks LiveKit to hand the agent when it joins. */
export type AgentJobMetadata = {
  sessionId: string;
  ticket: string;
  /** Where the agent calls /api/session/turn: this deployment's own origin. */
  apiBase: string;
  characters: { id: "patient" | "prescriber"; name: string; openingLine?: string; voiceId: string }[];
};

/** Text-stream topics between the browser and the agent. */
export const TOPIC_SWITCH = "pharmify.agent"; // browser -> agent: who the candidate is talking to
export const TOPIC_ENDED = "pharmify.ended"; // agent -> browser: the server says the part is over
