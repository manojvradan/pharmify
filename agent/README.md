# Pharmify voice agent

Hands-free voice for role-play sessions, on [LiveKit Agents](https://docs.livekit.io/agents/).
It joins one session's room, works out when the candidate has finished talking (Silero VAD
plus LiveKit's turn detector), and speaks as the patient or prescriber in that character's
ElevenLabs voice. The words themselves come from the web app: each turn is a POST to
`/api/session/turn` with a signed ticket, so the fact gate, the clock and the saved
transcript work exactly as in typed and hold-to-speak sessions.

```
browser ──mic/audio (WebRTC)── LiveKit room ── agent ──POST /api/session/turn── web app
        └─ /api/livekit/token: room token + dispatch metadata (session, ticket, voices)
```

## Run locally

Needs `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `ELEVENLABS_API_KEY` and
`AGENT_TICKET_SECRET` in the app's `.env.local` (this reads `../.env.local`).

```
npm install
npm run dev          # or `npm run dev:agent` from the app folder; then tick "Hands-free" on a case
npm run typecheck
```

While a LiveKit Cloud deployment of the agent exists, it and a local `npm run dev` both
take dispatches for `pharmify-actor`, and the cloud one can't reach localhost. Pause the
cloud deployment while testing locally, or test against a preview URL.

## Deploy to LiveKit Cloud

```
lk agent create --secrets ELEVENLABS_API_KEY=...   # first time: registers it and writes livekit.toml
lk agent deploy                                     # later changes
lk agent logs
```

LiveKit injects its own URL and keys. The web app needs `LIVEKIT_URL`, `LIVEKIT_API_KEY`,
`LIVEKIT_API_SECRET` and `AGENT_TICKET_SECRET` in Vercel for "Hands-free" to appear.

`src/protocol.ts` is a copy of `lib/voice/agentTicket.shared.ts`: keep them in step.
