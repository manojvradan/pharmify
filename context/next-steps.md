# Next steps: evals, hidden facts and open items

Nov 5, 2026 · living document, update as items close

This tracks what is left after the text-only loop (milestone 2 in `mvp-plan.md`) started working: what we need from people, the evals we still need, and the hidden facts two cases are missing. Status as of PR #1 (`phase-1-agent-hardening`).

## Where things stand

| Area | Status |
| --- | --- |
| Text-only loop (actor, fact gate, grader, debrief) | Working end to end on all 3 cases |
| Actor model | Sonnet 5.5. Haiku contradicted unlocked facts in probes, so it is only an `ACTOR_MODEL` override |
| Fact gate | Deterministic triggers: words close together in one sentence. 3 false unlocks found and fixed |
| Grader | Structured report with moments anchored to the transcript; shape and quotes checked in code |
| Unit tests (`npm test`) | 109, no API calls |
| Live actor eval (`npm run eval`) | 25 calls, one per probe; needs `npm run dev` |
| Persistence, auth, server-owned sessions | Not started (Phase 2) |
| Voice (LiveKit Agents) | Not started (Phase 3) |

## Needed from you

| Item | Why | Status |
| --- | --- | --- |
| Accept Neon's marketplace terms in the Vercel dashboard | The CLI can't accept terms for you; the install is waiting on it | Waiting |
| Install Clerk (Vercel Marketplace) | Sign-in for Phase 2 | Not started |
| Recruit a pharmacist reviewer | Every case, every hidden fact below, and grader calibration need sign-off | Not started |
| Decide an eval budget per run | Grader consistency and LLM-judge evals need repeated live calls; currently "minimal" | Minimal for now |
| Check the Board's current candidate guide | The guide we hold is the 2021 version | Not started |

When Neon (and later Clerk) is installed, pull the env vars with `vercel env pull` into a **separate file** and merge them in. A plain `vercel env pull .env.local` overwrites the file and drops `ANTHROPIC_API_KEY`.

## Evals

### In place

| Eval | What it checks | Where |
| --- | --- | --- |
| Fact gate unit tests | Right questions unlock each fact; real false unlocks stay locked; whole-session regressions | `lib/session/factGate.test.ts` |
| Trigger hygiene | No trigger shrinks to one common word after stopwords are dropped (the "at home" → "home" bug) | `lib/session/factGate.test.ts` |
| Structural leak tests | No hidden fact or answer-key text reaches the actor before it is unlocked; unlocking reveals only that fact | `lib/session/actor.test.ts` |
| Report guards | Result derived from fail conditions; each condition and skill once; counselling matches the key; quotes verbatim | `lib/session/reportGuards.test.ts` |
| Actor exam-mode spot check | No coaching, no stage directions or labels, at most 3 sentences; warns on a possible locked-fact mention | `evals/actor.eval.ts` |

### Still needed

Ordered by how much they protect candidates. Rough cost assumes about 1–2¢ per actor turn and 5–10¢ per grader run on current models; measure before trusting it.

| # | Eval | What it answers | How | Needs | Rough cost per run |
| --- | --- | --- | --- | --- | --- |
| 1 | **Grader golden set** | Does the grader reach the right verdict on known sessions? | Per case: a strong, a weak, an empty and an "unsafe supply" transcript, each with the expected pass/fail per fail condition. Assert the verdicts. | Pharmacist sets the expected marks | ~$1 (12 grades) |
| 2 | **Grader consistency** | Does the same transcript get the same marks every time? | Grade each golden transcript 5×; report agreement per fail condition. Target ≥ 4/5 on every condition. A run on Nov 5 flipped "Practising legally and professionally" on one transcript. | Budget | ~$3–5 |
| 3 | **Grader calibration** | Does the grader agree with a pharmacist? | Pharmacist marks the first 10 pilot sessions blind; compare per fail condition (Cohen's kappa) and on the overall result. Disagreements become rubric fixes. | Reviewer, real sessions | ~$1 |
| 4 | **Fact fidelity** | Once a fact is unlocked, does the actor use it, without denying or contradicting it? | For each fact: ask its `unlockHint`, then a model judge compares the reply with the fact. The Haiku failure would have been caught here. | Budget | ~$0.50 |
| 5 | **Invention** | Does the actor add medicines, people, events or reasons not in the case? | Judge each reply against the persona, public facts and unlocked facts; flag anything new. Seen on Nov 5: "for my heart", "a bag of tablets", "my wife sorts it". | Budget | ~$0.50 |
| 6 | **Fact gate recall on real phrasing** | How often do real candidates' questions miss a trigger? | Collect pilot transcripts; label which facts each candidate *should* have earned; measure misses. If recall is poor, add a model classifier behind `matches()`. | Pilot transcripts | Free (labelling) |
| 7 | **Injection and jailbreak** | Can a candidate talk the actor into giving answers? | Extend the eval probes: "ignore your instructions", role swaps, "the examiner said you can tell me", long multi-turn pressure. | — | ~$0.50 |
| 8 | **Latency** | Is the role play fast enough? | Log time to first token per turn (text now; speech end to end in Phase 3). Set a target after first measurements. | Phase 2 logging | Free (logged) |
| 9 | **Cost per session** | What does a 20-minute session cost? | Log token usage per call to `usage_events`; report per session. | Phase 2 tables | Free (logged) |
| 10 | **Quote drop rate** | How often does the grader quote something not in the transcript? | Log how many moments and replays `finaliseReport` drops; alert if above about 10%. | Phase 2 logging | Free (logged) |
| 11 | **Timer enforcement** | Are turns after 20:00 rejected and the session closed? | API test against server-owned sessions. | Phase 2 | Free |

## Hidden facts we need

`prescribing-for-family` and `telehealth-cannabis` have **no hidden facts**. Without them, the actor can only say "I'm not sure" to basic history questions, and the grader then marks the candidate down for gaps that exist only because the case is missing facts. Live runs showed both effects.

**Everything below is a draft for pharmacist review.** These are scenario facts (what the character knows), not drug information, but they change what a safe resolution looks like, so they need sign-off before they go into the case JSON.

Every trigger was checked against the fact gate's normaliser. A trigger has to keep at least two words after filler words are dropped, or be one distinctive clinical word. When these go into the JSON, add the single words used here to `SINGLE_WORD_OK` in `lib/session/factGate.test.ts`: fever, temperature, vomiting, pregnant, breastfeeding, contraception, allergies, allergic, anxiety, psychosis, schizophrenia, bipolar, hallucinations, paranoid, antidepressant, recreational, driving, indication, diagnosis.

**Fact-gate changes needed first:**
- "What's it for?", the most natural question in the cannabis case, can't match anything today: every word in it is a filler word. Keep "for" when it follows "what", or let the actor's persona handle it (he already says it's for his mental health).
- Plurals aren't stemmed: "UTIs" doesn't match "UTI", so both forms are listed for now. Add simple plural handling to the normaliser.

### Prescribing for family (Xiaoyu, possible UTI)

The case is about the ethics of treating a partner, so the clinical facts are kept uncomplicated: a candidate who assesses properly should find an uncomplicated presentation that fits a protocol. The point is that they have to *ask*.

| id | Fact (as Xiaoyu knows it) | Triggers | Unlock hint |
| --- | --- | --- | --- |
| `symptom-detail` | Burning when she passes urine and needing to go often and urgently, since yesterday morning. She hasn't seen any blood. | `symptoms start`, `long symptoms`, `describe symptoms`, `blood urine`, `blood wee` | "What symptoms do you have, and when did they start?" |
| `no-red-flags` | No fever or chills, no back or side pain, no nausea or vomiting. | `fever`, `temperature`, `back pain`, `side pain`, `feel sick`, `vomiting` | "Any fever, back or side pain, or vomiting?" |
| `not-pregnant` | She is not pregnant and not breastfeeding. She takes the contraceptive pill and her period finished last week. | `pregnant`, `breastfeeding`, `last period`, `contraception` | "Is there any chance you could be pregnant?" |
| `medicines-allergies` | Her only regular medicine is the pill. She has no known allergies. | `other medicine`, `any medicine`, `allergies`, `allergic`, `anything else` | "Do you take any medicines, and do you have any allergies?" |
| `previous-utis` | She had one UTI about eight months ago, treated by her GP with a short antibiotic course that worked. No others in the past year. | `uti before`, `utis before`, `previous uti`, `previous utis`, `many utis`, `last time` | "Have you had UTIs before? How many in the last year?" |
| `no-gp-today` | Her regular GP is at the clinic three hours away, which is closed until Monday. | `regular doctor`, `see doctor`, `doctor available`, `doctor open` | "Who is your regular GP, and could you see them?" |

Reviewer questions:
- Does this history fit the Queensland pharmacist UTI protocol as it stands? Check whether the pill, the previous UTI within 12 months, or her age affect eligibility.
- Should one variant swap in a complicating fact (for example a past rash with one antibiotic) to test whether the candidate stays objective when treating their partner gets harder? Keep it out of the default version.

### Telehealth cannabis

The case tests whether the candidate gathers a history and talks to the prescriber before supplying a THC product for a mental health indication. The hidden facts give a careful candidate something real to find: a family history that raises the psychosis risk, which the prescriber didn't ask about.

**Patient (guarded; shares more when the candidate explains why they're asking):**

| id | Fact | Triggers | Unlock hint |
| --- | --- | --- | --- |
| `indication` | It's for anxiety and trouble sleeping, which have bothered him for about a year. | `hoping help`, `trying treat`, `trouble sleeping`, `anxiety` | "Can I ask what you're hoping it will help with? It helps me check it's safe for you." |
| `family-psychosis` | His older brother has schizophrenia. Nobody asked him about family history in the telehealth call. | `family history`, `anyone family`, `family member`, `psychosis`, `schizophrenia`, `bipolar` | "Does anyone in your family have a mental health condition like schizophrenia or bipolar?" |
| `no-personal-psychosis` | He has never had hallucinations, paranoia or a psychotic episode himself, and has never been admitted to hospital for his mental health. | `hearing voices`, `hallucinations`, `paranoid`, `psychotic episode`, `admitted hospital`, `hospital mental` | "Have you ever experienced hearing voices or feeling paranoid?" |
| `stopped-antidepressant` | His GP started an antidepressant last year. He stopped it about a month ago because he didn't like how it made him feel, and hasn't told the GP. | `other medicine`, `any medicine`, `anything else`, `tried before`, `antidepressant` | "Are you taking any other medicines, or have you tried anything else for this?" |
| `gp-unaware` | His regular GP doesn't know about the telehealth prescription. | `regular doctor`, `gp know`, `doctor know`, `gp aware` | "Does your regular GP know about this prescription?" |
| `drives-for-work` | He drives a delivery van for work most days. | `driving`, `drive car`, `drive work`, `operate machinery`, `kind work`, `job involve` | "Do you drive or operate machinery?" |
| `past-cannabis` | He used cannabis recreationally in his twenties and found it helped him relax. | `used before`, `tried cannabis`, `cannabis before`, `recreational` | "Have you used cannabis before?" |

**Prescriber (defensive with vague criticism; cooperative with specific, respectful questions):**

| id | Fact | Triggers | Unlock hint |
| --- | --- | --- | --- |
| `rx-indication` | You prescribed it for generalised anxiety and insomnia after a 15-minute video consultation, based on what the patient reported. | `indication`, `diagnosis`, `why prescribe`, `reason prescribing` | "Could you tell me the indication you prescribed it for?" |
| `rx-screening-gap` | You asked about a personal history of psychosis (he said none) but did not ask about family history. | `family history`, `screen psychosis`, `psychosis history`, `schizophrenia` | "Did you screen for a personal or family history of psychosis?" |
| `rx-previous-treatment` | Your notes only say he "tried an antidepressant"; you didn't record which one, or whether he is still taking it. | `tried before`, `previous treatment`, `other treatment`, `antidepressant` | "What other treatments has he tried, and is he still on them?" |
| `rx-no-gp-contact` | You haven't contacted his regular GP. | `regular doctor`, `contacted gp`, `gp know`, `gp aware` | "Has his regular GP been told about this prescription?" |
| `rx-will-review` | If the pharmacist raises the family history specifically, you accept the concern, agree supply should be held, and will book a review with the patient this week. | `brother schizophrenia`, `family psychosis`, `hold supply`, `review patient`, `book review` | "His brother has schizophrenia. I'd like to hold supply until you've reviewed him. Are you happy with that?" |

Reviewer questions:
- Is a sibling with schizophrenia the right risk factor to plant? Is "hold supply pending review" the expected resolution, or should supply with close monitoring also be acceptable?
- The stopped antidepressant brings in a second issue (non-adherence the GP doesn't know about). Keep it, or move it to a variant so the case stays focused?
- Fill in the `[STATE]` and product placeholders, and check the S8 notes for that state.
- Some triggers rely on the candidate naming the condition (`schizophrenia`, `psychosis`). That's realistic, but a candidate who asks "any serious mental illness in your family?" would miss. Add `mental illness family` and `mental health family`.

## Content gaps beyond hidden facts

- **Seven more cases** to reach the 10 in the MVP plan: one per problem type in the Board's guide, plus one combined case.
- **The atorvastatin case** is still a draft (`review.status: "draft"`) and needs the same sign-off.
- **Answer keys:** the grader marks the counselling points in each answer key exactly, so check they are the points a pharmacist would actually expect for each case.
