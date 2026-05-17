// lib/providers/github.ts
// Lokasi: conversa-bob-mcp/lib/providers/github.ts
// Provider GitHub API — commit file ke repo dan trigger Vercel deploy

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GITHUB_REPO = process.env.GITHUB_REPO ?? "";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? "main";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN ?? "";
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID ?? "";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID ?? "";

const GH_BASE = "https://api.github.com";

// ── Helper request GitHub ─────────────────────────────────
async function ghRequest<T>(
  path: string,
  method = "GET",
  body?: unknown
): Promise<T> {
  const res = await fetch(`${GH_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub ${res.status}: ${err}`);
  }

  return res.json() as Promise<T>;
}

// ── Ambil SHA file yang sudah ada (diperlukan untuk update) ──
async function getFileSha(filePath: string): Promise<string | null> {
  try {
    const data = await ghRequest<{ sha: string }>(
      `/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`
    );
    return data.sha;
  } catch {
    return null; // File belum ada — akan dibuat baru
  }
}

// ── Commit satu file ke repo ──────────────────────────────
export async function commitFile(
  filePath: string,
  content: string,
  commitMessage: string
): Promise<{ sha: string; url: string }> {
  const sha = await getFileSha(filePath);

  const base64Content = Buffer.from(content, "utf-8").toString("base64");

  const body: Record<string, unknown> = {
    message: commitMessage,
    content: base64Content,
    branch: GITHUB_BRANCH,
  };

  if (sha) body.sha = sha; // Wajib ada jika file sudah exist

  const data = await ghRequest<{ commit: { sha: string; html_url: string } }>(
    `/repos/${GITHUB_REPO}/contents/${filePath}`,
    "PUT",
    body
  );

  return {
    sha: data.commit.sha,
    url: data.commit.html_url,
  };
}

// ── Trigger Vercel deployment ─────────────────────────────
export async function triggerDeploy(): Promise<string> {
  const teamQuery = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";

  const res = await fetch(
    `https://api.vercel.com/v13/deployments${teamQuery}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: VERCEL_PROJECT_ID,
        gitSource: {
          type: "github",
          repo: GITHUB_REPO,
          ref: GITHUB_BRANCH,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel deploy error ${res.status}: ${err}`);
  }

  const data = await res.json() as { url: string };
  return `https://${data.url}`;
}
