import "server-only";

/**
 * Creates issues in Linear over its GraphQL API.
 *
 *   LINEAR_API_KEY   a personal API key (Linear → Settings → Security & access → API keys)
 *   LINEAR_TEAM_ID   the team's id (a UUID, not its key like "PHA")
 */

const ISSUE_CREATE = `mutation IssueCreate($input: IssueCreateInput!) {
  issueCreate(input: $input) { success issue { identifier url title } }
}`;

export type CreatedIssue = { identifier: string; url: string; title: string };

export async function createIssue(input: { title: string; description: string }): Promise<CreatedIssue> {
  const key = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;
  if (!key || !teamId) throw new Error("LINEAR_API_KEY and LINEAR_TEAM_ID must be set");
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    // Personal API keys go in as is, without "Bearer".
    headers: { Authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify({ query: ISSUE_CREATE, variables: { input: { teamId, ...input } } }),
  });
  const data = (await res.json().catch(() => null)) as {
    data?: { issueCreate?: { success: boolean; issue?: CreatedIssue } };
    errors?: { message: string }[];
  } | null;
  const issue = data?.data?.issueCreate?.issue;
  if (!res.ok || !issue) {
    throw new Error(`Linear issueCreate failed (${res.status}): ${data?.errors?.map((e) => e.message).join("; ") ?? "no issue returned"}`);
  }
  return issue;
}
