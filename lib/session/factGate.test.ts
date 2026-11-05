import { describe, expect, it } from "vitest";
import raw from "@/data/cases/atorvastatin-doubling-up.json";
import { CaseRecord, type AgentId, type Turn } from "@/lib/cases/schema";
import { caseIds, getCase } from "@/lib/cases/bank";
import { normalise, unlockedFacts } from "./factGate";

const atorva = CaseRecord.parse(raw);

/** Fact ids unlocked by a single candidate line to one agent. */
function unlocks(agent: AgentId, line: string): string[] {
  const transcript: Turn[] = [{ role: "candidate", text: line, t: 0 }];
  return unlockedFacts(atorva, agent, transcript)
    .map((u) => u.factId)
    .sort();
}

describe("fact gate: atorvastatin case, patient", () => {
  it.each([
    ["Are you still taking the tablets you had before you went in?", "still-has-generic"],
    ["Have you still got your old cholesterol tablets at home?", "still-has-generic"],
    ["What medicines do you currently take?", "still-has-generic"],
    ["Did anyone at the hospital tell you to stop the old ones?", "not-told-to-stop"],
    ["Did the hospital say anything about your old tablets?", "not-told-to-stop"],
    ["Were you told to stop taking the generic one?", "not-told-to-stop"],
    ["Did they say to stop the old ones?", "not-told-to-stop"],
    ["Are you taking any other medicines?", "takes-warfarin"],
    ["Do you take anything else, like a blood thinner?", "takes-warfarin"],
    ["Any medicines from other doctors, or that you buy yourself?", "takes-warfarin"],
    ["Are you on warfarin?", "takes-warfarin"],
    ["Have you got any of those at home?", "still-has-generic"],
    ["Is there anything at home you're still taking?", "still-has-generic"],
    ["Did they give you any instructions about the old tablets?", "not-told-to-stop"],
  ])("%s → unlocks %s", (line, fact) => {
    expect(unlocks("patient", line)).toContain(fact);
  });

  it.each([
    // Found in a real run: "hospital" and "tell" far apart used to unlock not-told-to-stop.
    "Hi there, I see you've got a new script from the hospital. What did they tell you about it?",
    "Hi, how can I help you today?",
    "Is this for your cholesterol?",
    "One tablet at night, with or without food.",
    "Okay, so just the one tablet then. I'll give your GP a call.",
    "Thanks, I'll be back in a moment.",
    // Found in a real run: an instruction to stop is not a question about whether anyone said to stop.
    "I've spoken to your doctor. Just take the new one from the hospital, one tablet at night, and stop the old ones.",
    // Found by the actor eval: "at home" normalised to just "home".
    "Let's get this sorted so you can get home.",
    "Here are the instructions for the new tablet.",
  ])("%s → unlocks nothing", (line) => {
    expect(unlocks("patient", line)).toEqual([]);
  });

  it("never unlocks a prescriber fact from the patient conversation", () => {
    expect(unlocks("patient", "You're taking both, the same drug twice, a duplicate.")).not.toContain(
      "gp-did-not-intend-two",
    );
  });

  it("unlocks each fact only once, at the first turn that earns it", () => {
    const transcript: Turn[] = [
      { role: "candidate", text: "Hi, how can I help?", t: 0 },
      { role: "actor", text: "The hospital gave me this one.", t: 5 },
      { role: "candidate", text: "Are you taking any other medicines?", t: 30 },
      { role: "actor", text: "Just the warfarin.", t: 35 },
      { role: "candidate", text: "Any other medicines at all?", t: 60 },
    ];
    expect(unlockedFacts(atorva, "patient", transcript)).toEqual([
      { factId: "takes-warfarin", fact: expect.any(String), turnIndex: 2 },
    ]);
  });

  it("ignores what the actor says", () => {
    const transcript: Turn[] = [{ role: "actor", text: "I take warfarin and other medicines.", t: 0 }];
    expect(unlockedFacts(atorva, "patient", transcript)).toEqual([]);
  });
});

describe("fact gate: atorvastatin case, prescriber", () => {
  it.each([
    "He has both brand and generic atorvastatin at home.",
    "I think he's on two statins.",
    "They're the same drug, so this is a duplication.",
    "Did you intend for him to take both?",
    "I recommend he continues one product only.",
  ])("%s → unlocks the GP's intent", (line) => {
    expect(unlocks("prescriber", line)).toEqual(["gp-did-not-intend-two"]);
  });

  it.each([
    "Hi doctor, it's the pharmacist calling about Mr R.",
    "He was discharged from hospital yesterday.",
    "Thank you both for your time.",
  ])("%s → unlocks nothing", (line) => {
    expect(unlocks("prescriber", line)).toEqual([]);
  });
});

/** Full candidate scripts from live runs on 2026-11-05: which facts each one has earned. */
describe("fact gate: whole sessions", () => {
  function earned(script: [AgentId, string][]) {
    const by: Record<AgentId, Turn[]> = { patient: [], prescriber: [] };
    script.forEach(([agent, text], i) => by[agent].push({ role: "candidate", text, t: i * 60 }));
    return (Object.keys(by) as AgentId[]).flatMap((a) => unlockedFacts(atorva, a, by[a]).map((u) => u.factId)).sort();
  }

  const weak: [AgentId, string][] = [
    [
      "patient",
      "Hi there, I see you've got a new script from the hospital. What did they tell you about it?"
    ],
    [
      "patient",
      "I can see we dispensed generic atorvastatin 40 for you last month. Are you still taking the tablets you had before you went in?"
    ],
    [
      "patient",
      "Okay, so just the one tablet then. I'll give your GP a call."
    ],
    [
      "prescriber",
      "Hi doctor, it's the pharmacist about Mr R. I think he might be on two statins, so maybe he should stop one?"
    ],
    [
      "prescriber",
      "Okay thanks, I'll tell him to just take the new one."
    ],
    [
      "patient",
      "I've spoken to your doctor. Just take the new one from the hospital, one tablet at night, and stop the old ones. Come back if you have any questions."
    ]
  ];
  const strong: [AgentId, string][] = [
    [
      "patient",
      "Hi Mr R, I'm the pharmacist. Before I fill this, are you still taking the cholesterol tablets you had before you went in?"
    ],
    [
      "patient",
      "Did anyone at the hospital tell you to stop the old ones?"
    ],
    [
      "patient",
      "And are you taking any other medicines, including from other doctors or anything you buy yourself?"
    ],
    [
      "patient",
      "Thanks. The new script and your old tablets are actually the same medicine, atorvastatin 40, just different brands, so taking both would double your dose. Please don't take both. I'll call your GP now to confirm which one you should continue."
    ],
    [
      "prescriber",
      "Hi doctor, it's the pharmacist calling about Mr R. He's been discharged with brand atorvastatin 40 mg at night, and he's still taking the generic atorvastatin 40 mg you prescribed, so he's doubling up. He also takes warfarin and sometimes misses doses. I recommend he continues one product only, the generic atorvastatin 40 mg at night. Can you confirm?"
    ],
    [
      "prescriber",
      "Great, I'll counsel him on that and let him know to see you about his warfarin. Thanks doctor."
    ],
    [
      "patient",
      "Your GP has confirmed you should take just one atorvastatin 40 mg tablet at night, your usual generic one, and not the new box as well. I'll hold the new script for now. Watch for unexplained muscle pain, weakness or dark urine, and if that happens stop and see your doctor. Since you sometimes miss your warfarin, please talk to your GP about that too. Come back any time if you're unsure."
    ]
  ];

  it("the weak candidate earns only what they asked about", () => {
    expect(earned(weak)).toEqual(["gp-did-not-intend-two", "still-has-generic"]);
  });

  it("the strong candidate earns every fact", () => {
    expect(earned(strong)).toEqual(["gp-did-not-intend-two", "not-told-to-stop", "still-has-generic", "takes-warfarin"]);
  });
});

/** Single words that are distinctive enough to unlock a fact on their own. */
const SINGLE_WORD_OK = new Set(["warfarin", "duplicate", "intend"]);

describe("trigger hygiene, every case", () => {
  const triggers = caseIds().flatMap((id) =>
    getCase(id)!.hiddenFacts.flatMap((f) => f.triggers.map((t) => [id, f.id, t] as const)),
  );

  // Stopwords are dropped when matching, so "at home" would become just "home".
  it.each(triggers)("%s / %s: %j keeps two words, or one distinctive word", (_c, _f, trigger) => {
    const words = normalise(trigger);
    expect(words.length > 1 || SINGLE_WORD_OK.has(words[0]), `normalises to [${words.join(" ")}]`).toBe(true);
  });
});
