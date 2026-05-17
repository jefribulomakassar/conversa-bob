// lib/providers/scraper.ts
// Lokasi: conversa-bob-mcp/lib/providers/scraper.ts
// Provider scraper — fetch konten web dan ekstrak teks bersih

// ── Strip HTML tags ───────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Konversi ke markdown sederhana ───────────────────────
function toMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n- $1")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Ekstrak metadata halaman ──────────────────────────────
function extractMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) meta.title = titleMatch[1].trim();

  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*/i);
  if (descMatch) meta.description = descMatch[1].trim();

  return meta;
}

// ── Main scraper ──────────────────────────────────────────
export async function scrapeUrl(
  url: string,
  format: "text" | "json" | "markdown" = "text"
): Promise<string> {
  // Validasi URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`URL tidak valid: ${url}`);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Hanya URL http/https yang diizinkan");
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ConversaBot/1.0; +https://conversa-bob-mcp.vercel.app)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Gagal fetch ${url}: HTTP ${res.status}`);
  }

  const html = await res.text();
  const meta = extractMeta(html);

  switch (format) {
    case "markdown": {
      const md = toMarkdown(html);
      return `# ${meta.title ?? url}\n\n${md}`;
    }

    case "json": {
      const text = stripHtml(html);
      return JSON.stringify(
        { url, title: meta.title, description: meta.description, content: text },
        null,
        2
      );
    }

    case "text":
    default: {
      const text = stripHtml(html);
      return meta.title ? `${meta.title}\n\n${text}` : text;
    }
  }
}
