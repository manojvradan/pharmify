import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { CastAvatar } from "@/components/CastAvatar";
import { LogoMark } from "@/components/icons";
import { Pip } from "@/components/Pip";
import { CATEGORY_LABEL, CaseDocuments } from "@/components/SessionChrome";
import { toPublic } from "@/lib/cases/bank";
import type { AgentId } from "@/lib/cases/schema";
import { db, schema } from "@/lib/db";

export const metadata: Metadata = { title: "Question preview", robots: { index: false, follow: false } };

const card = "flex flex-col gap-3 rounded-2xl border border-line bg-white p-5";
const label = "m-0 text-xs font-medium tracking-[0.05em] text-subtle uppercase";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="m-0 text-sm text-subtle">None</p>;
  return (
    <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[15px]">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

function sameToken(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * A drafted question from the WhatsApp bot, for the person checking it before approval:
 * the case papers exactly as candidates see them, then everything they don't see (who the
 * characters are, what they know, what unlocks it, and the answer key). Needs the secret
 * `t` from the link the bot sent; there's no sign-in.
 */
async function Preview({ params, searchParams }: PageProps<"/preview/[draftId]">) {
  const { draftId } = await params;
  const t = (await searchParams).t;
  if (!/^[0-9a-f-]{36}$/.test(draftId) || typeof t !== "string") notFound();
  const [row] = await db().select().from(schema.botCaseDrafts).where(eq(schema.botCaseDrafts.id, draftId));
  if (!row || !sameToken(row.token, t)) notFound();

  const c = row.record;
  const pub = toPublic(c);
  const personas = (["patient", "prescriber"] as AgentId[]).flatMap((id) => {
    const p = id === "patient" ? c.agents.patient : c.agents.prescriber;
    const shown = pub.agents.find((a) => a.id === id);
    return p ? [{ id, p, avatar: shown?.avatar ?? p.avatar ?? (id === "patient" ? "bertie-bear" : "dr-hoot"), voice: shown?.voice ?? p.voice }] : [];
  });
  const status = { draft: "Waiting for approval", published: "Approved and published", discarded: "Discarded" }[row.status];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="mx-auto flex max-w-[960px] items-center justify-between gap-4 px-4 pt-8 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
          <LogoMark size={30} />
          <span className="text-lg font-bold tracking-[-0.02em] text-brand">Pharmify</span>
        </Link>
        <span className="rounded-full bg-chip px-3 py-1 text-sm text-ink-2">{status}</span>
      </header>

      <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-4 pt-8 pb-20 sm:px-6">
        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm text-subtle">
            Question preview · {CATEGORY_LABEL[c.category]} · {c.problemType} · <code>{c.id}</code>
          </p>
          <h1 className="m-0 text-[clamp(28px,5vw,40px)] leading-[1.1] font-bold tracking-[-0.02em]">{c.title}</h1>
          <p className="m-0 text-ink-2">
            {pub.format === "roleplay" ? "20-minute role play with the characters below." : "5-minute spoken answer; no one replies."}
          </p>
        </div>

        {row.problems.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-alert bg-alert-tint p-5">
            <h2 className="m-0 text-lg font-bold text-alert-deep">Still failing checks: can&apos;t be approved yet</h2>
            <List items={row.problems} />
          </div>
        )}
        {row.assumptions.length > 0 && (
          <div className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-peach bg-peach-tint p-5">
            <h2 className="m-0 text-lg font-bold">Filled in by Claude: please check</h2>
            <p className="m-0 text-sm text-ink-2">The document didn&apos;t say these, so they were made up. Reply on WhatsApp to change any.</p>
            <List items={row.assumptions} />
          </div>
        )}

        <Section title="What the candidate sees">
          <div className="overflow-hidden rounded-2xl border border-line [&>aside]:max-w-none [&>aside]:border-r-0">
            <CaseDocuments c={pub} />
          </div>
        </Section>

        <Section title="Characters">
          {personas.map(({ id, p, avatar, voice }) => {
            const facts = c.hiddenFacts.filter((f) => f.agent === id);
            return (
              <div key={id} className={card}>
                <div className="flex items-center gap-4">
                  <CastAvatar id={avatar} size={64} decorative />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold">{p.name}</span>
                    <span className="text-sm text-subtle">
                      {p.label} · {id} · voice {voice ?? "default"}
                    </span>
                  </div>
                </div>
                <p className="m-0 text-[15px] text-ink-2">{p.description}</p>
                {p.situation && <p className="m-0 text-sm text-ink-2">{p.situation}</p>}
                {p.bio && (
                  <div className="flex flex-col gap-1">
                    <h3 className={label}>Profile</h3>
                    <dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-[15px]">
                      {Object.entries(p.bio).map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="text-subtle">{k}</dt>
                          <dd className="m-0">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                {p.openingLine && (
                  <div className="flex flex-col gap-1">
                    <h3 className={label}>Opening line</h3>
                    <p className="m-0 text-[15px] italic">“{p.openingLine}”</p>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <h3 className={label}>Says freely</h3>
                  <List items={p.publicFacts} />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className={label}>Only says when asked the right question</h3>
                  {facts.length === 0 && <p className="m-0 text-sm text-subtle">None</p>}
                  {facts.map((f) => (
                    <div key={f.id} className="flex flex-col gap-1 rounded-xl bg-canvas p-3">
                      <p className="m-0 text-[15px] font-medium">{f.fact}</p>
                      <p className="m-0 text-sm text-ink-2">Strong question: {f.unlockHint}</p>
                      <p className="m-0 text-[13px] text-subtle">Unlocked by: {f.triggers.join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </Section>

        <Section title="Answer key (grader only)">
          <div className={card}>
            <h3 className={label}>Planted problem</h3>
            <p className="m-0 text-[15px]">{c.answerKey.plantedProblem}</p>
            <h3 className={label}>Acceptable resolutions</h3>
            <List items={c.answerKey.acceptableResolutions} />
            <h3 className={label}>Unacceptable actions</h3>
            <List items={c.answerKey.unacceptableActions} />
            <h3 className={label}>Counselling points</h3>
            <List items={c.answerKey.counsellingPoints} />
            {c.answerKey.codePrinciples.length > 0 && (
              <>
                <h3 className={label}>Code of conduct principles</h3>
                <List items={c.answerKey.codePrinciples} />
              </>
            )}
            {c.answerKey.legal.length > 0 && (
              <>
                <h3 className={label}>Legal</h3>
                <List items={c.answerKey.legal} />
              </>
            )}
            <h3 className={label}>Model answer</h3>
            <p className="m-0 text-[15px]">{c.answerKey.modelAnswer}</p>
          </div>
        </Section>

        {row.prUrl && (
          <p className="m-0 text-sm text-subtle">
            Published in <a href={row.prUrl}>{row.prUrl}</a>
          </p>
        )}
      </main>
    </div>
  );
}

export default function PreviewPage(props: PageProps<"/preview/[draftId]">) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas text-muted">
          <Pip mood="thinking" size={90} />
          <p className="m-0">Loading the preview…</p>
        </main>
      }
    >
      <Preview {...props} />
    </Suspense>
  );
}
