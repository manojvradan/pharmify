import "server-only";

import { CASE_INDEX_PATH, caseFilenames, renderCaseIndex } from "@/lib/cases/caseIndex";
import type { CaseRecord } from "@/lib/cases/schema";

/**
 * Publishes an approved case: one commit on a new branch with data/cases/<id>.json and the
 * regenerated case index, a pull request, and (unless BOT_AUTO_MERGE=false) a squash merge.
 * Merging to main makes Vercel deploy it; the build validates every case, so a bad one
 * fails the deploy and production keeps the last good version.
 *
 *   GITHUB_TOKEN  fine-grained token for the repo with Contents and Pull requests: read and write
 *   GITHUB_REPO   "owner/name", default manojvradan/pharmify
 */

const REPO = process.env.GITHUB_REPO ?? "manojvradan/pharmify";
const BASE = process.env.GITHUB_BASE_BRANCH ?? "main";

async function gh<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const data = (await res.json().catch(() => null)) as T & { message?: string };
  if (!res.ok) throw new Error(`GitHub ${init.method ?? "GET"} ${path} failed (${res.status}): ${data?.message ?? ""}`);
  return data;
}

export type Published = { prUrl: string; merged: boolean; mergeError?: string };

export async function publishCase(c: CaseRecord, approvedBy: string): Promise<Published> {
  const head = await gh<{ object: { sha: string } }>(`/git/ref/heads/${BASE}`);
  const baseSha = head.object.sha;
  const baseCommit = await gh<{ tree: { sha: string } }>(`/git/commits/${baseSha}`);
  const listing = await gh<{ name: string }[]>(`/contents/data/cases?ref=${BASE}`);
  const names = listing.map((f) => f.name);
  const file = `${c.id}.json`;
  if (caseFilenames(names).includes(file)) throw new Error(`A case called "${c.id}" is already in the repo. Ask me to change the id first.`);

  const tree = await gh<{ sha: string }>(`/git/trees`, {
    method: "POST",
    body: {
      base_tree: baseCommit.tree.sha,
      tree: [
        { path: `data/cases/${file}`, mode: "100644", type: "blob", content: `${JSON.stringify(c, null, 2)}\n` },
        { path: CASE_INDEX_PATH, mode: "100644", type: "blob", content: renderCaseIndex([...names, file]) },
      ],
    },
  });
  const commit = await gh<{ sha: string }>(`/git/commits`, {
    method: "POST",
    body: { message: `Add case: ${c.title} (${c.id})\n\nDrafted and approved by ${approvedBy} through the WhatsApp bot.`, tree: tree.sha, parents: [baseSha] },
  });
  const branch = `case/${c.id}-${Date.now().toString(36)}`;
  await gh(`/git/refs`, { method: "POST", body: { ref: `refs/heads/${branch}`, sha: commit.sha } });
  const pr = await gh<{ number: number; html_url: string }>(`/pulls`, {
    method: "POST",
    body: {
      title: `Add case: ${c.title}`,
      head: branch,
      base: BASE,
      body: `New ${c.category} case \`${c.id}\` (${c.problemType}), drafted from a document and approved by ${approvedBy} on WhatsApp. It goes live as a draft case (not yet pharmacist-reviewed).\n\n**Planted problem:** ${c.answerKey.plantedProblem}`,
    },
  });

  if (process.env.BOT_AUTO_MERGE === "false") return { prUrl: pr.html_url, merged: false };
  try {
    await gh(`/pulls/${pr.number}/merge`, { method: "PUT", body: { merge_method: "squash" } });
    return { prUrl: pr.html_url, merged: true };
  } catch (err) {
    return { prUrl: pr.html_url, merged: false, mergeError: err instanceof Error ? err.message : String(err) };
  }
}
