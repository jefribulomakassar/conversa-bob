// tools/scrape.ts
// Lokasi: conversa-bob-mcp/tools/scrape.ts
// Tool handler untuk conversa_scrape_url

import { z } from "zod";
import { scrapeUrl } from "../lib/providers/scraper";
import { textResult, MCPToolResult } from "../lib/mcp/protocol";

// Zod schema for input validation
const scrapeSchema = z.object({
  url: z.string()
    .min(1, "Parameter 'url' wajib diisi dan tidak boleh kosong")
    .url("Invalid URL format"),
  format: z.enum(["text", "json", "markdown"]).optional().default("text"),
});

export async function callScrape(
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  // Validate input with Zod
  const validation = scrapeSchema.safeParse(args);
  
  if (!validation.success) {
    const errors = validation.error.issues.map((err: z.ZodIssue) => 
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');
    return textResult(`Error: ${errors}`, true);
  }

  const { url, format } = validation.data;

  const result = await scrapeUrl(url, format);
  return textResult(result);
}

// Made with Bob
