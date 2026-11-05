import type { Metadata } from "next";
import { DebriefReport } from "@/components/DebriefReport";
import type { Debrief } from "@/lib/session/report";

export const metadata: Metadata = { title: "Interview results" };

// A sample debrief, shown until debriefs are saved per user. Example content; needs pharmacist review.
const SAMPLE: Debrief = {
  caseTitle: "Case 04",
  problemType: "Doubling up",
  draft: true,
  timeUsed: 19 * 60 + 42,
  report: {
    result: "not_yet",
    headline: "So close. One thing to fix.",
    summary: "You spotted the duplicate and got the GP on side. Just one question let you down.",
    focus: {
      title: "Always ask about other medicines",
      detail: "He takes warfarin, but you never asked, so the risk wasn't reasonably minimised.",
    },
    failConditions: [
      {
        condition: "Serious harm or injury",
        result: "pass",
        evidence: "Nothing was supplied before the duplication was raised.",
        moments: [
          {
            time: "04:30",
            agent: "patient",
            speaker: "candidate",
            quote: "Both of these are atorvastatin, just different brands.",
            note: "You stopped him doubling up before anything was supplied.",
          },
        ],
      },
      {
        condition: "Risk not reasonably minimised",
        result: "fail",
        evidence: "Other medicines weren't explored, so his warfarin went unnoticed.",
        moments: [
          {
            time: "11:05",
            agent: "patient",
            speaker: "candidate",
            quote: "Okay, so just the one tablet then.",
            note: "You wrapped up the history here without asking about other medicines.",
          },
          {
            time: "14:20",
            agent: "prescriber",
            speaker: "candidate",
            quote: "I think he might be on two statins, so maybe he should stop one?",
            note: "The GP needed a clear recommendation, not an open question.",
          },
        ],
      },
      {
        condition: "Practising legally and professionally",
        result: "pass",
        evidence: "Contacted the GP before changing therapy.",
        moments: [],
      },
      {
        condition: "Reasonable factual knowledge",
        result: "pass",
        evidence: "You correctly identified the brand and generic as the same medicine.",
        moments: [
          {
            time: "04:30",
            agent: "patient",
            speaker: "candidate",
            quote: "Both of these are atorvastatin, just different brands.",
            note: "Accurate and in plain words he could follow.",
          },
        ],
      },
    ],
    skills: [
      { skill: "History taking", result: "partly" },
      { skill: "Issue identified", result: "yes" },
      { skill: "Options considered", result: "yes" },
      { skill: "Prescriber contacted well", result: "yes" },
      { skill: "Clear counselling", result: "partly" },
      { skill: "Prompt corrective action", result: "yes" },
    ],
    counselling: [
      { point: "Dose", covered: true },
      { point: "Timing", covered: true },
      { point: "Side effects", covered: false },
      { point: "What to watch for", covered: false },
      { point: "When to return", covered: true },
    ],
    replays: [
      {
        time: "11:05",
        agent: "patient",
        youSaid: "Okay, so just the one tablet then. I'll give the hospital a call.",
        tryInstead:
          "Before I call, are you taking anything else? Including medicines from other doctors, or anything you buy yourself?",
      },
      {
        time: "14:20",
        agent: "prescriber",
        youSaid: "I think he might be on two statins, so maybe he should stop one?",
        tryInstead:
          "He has both brand and generic atorvastatin 40 mg at home. I recommend he continues one product only. Can you confirm?",
      },
    ],
  },
  facts: [
    { id: "a", fact: "Still has the generic at home", found: true, unlockHint: "" },
    { id: "b", fact: "Nobody told him to stop it", found: true, unlockHint: "" },
    {
      id: "c",
      fact: "he takes warfarin and sometimes forgets doses",
      found: false,
      unlockHint: "“Are you taking any other medicines?”",
    },
  ],
};

export default function DebriefPage() {
  return <DebriefReport debrief={SAMPLE} replayHref="/session/atorvastatin-doubling-up" />;
}
