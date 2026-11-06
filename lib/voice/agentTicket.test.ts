import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { issueAgentTicket, verifyAgentTicket } from "./agentTicket";

const SID = "6f1c2a8e-0b1d-4c3e-9f2a-1b2c3d4e5f60";

describe("agent tickets", () => {
  beforeEach(() => {
    process.env.AGENT_TICKET_SECRET = "x".repeat(40);
  });
  afterEach(() => {
    delete process.env.AGENT_TICKET_SECRET;
  });

  it("verifies for the session and user it was issued for", () => {
    expect(verifyAgentTicket(issueAgentTicket(SID, "user_1"), SID)).toBe("user_1");
  });

  it("rejects another session, a tampered ticket, an expired one, and a different secret", () => {
    const t = issueAgentTicket(SID, "user_1");
    expect(verifyAgentTicket(t, "00000000-0000-4000-8000-000000000000")).toBeNull();
    const [payload, mac] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ sid: SID, uid: "user_2", exp: 9e9 })).toString("base64url");
    expect(verifyAgentTicket(`${forged}.${mac}`, SID)).toBeNull();
    expect(verifyAgentTicket(`${payload}.x${mac.slice(1)}`, SID)).toBeNull();
    expect(verifyAgentTicket(t, SID, Date.now() + 41 * 60_000)).toBeNull();
    process.env.AGENT_TICKET_SECRET = "y".repeat(40);
    expect(verifyAgentTicket(t, SID)).toBeNull();
  });

  it("is off without a long enough secret", () => {
    const t = issueAgentTicket(SID, "user_1");
    process.env.AGENT_TICKET_SECRET = "short";
    expect(verifyAgentTicket(t, SID)).toBeNull();
  });
});
