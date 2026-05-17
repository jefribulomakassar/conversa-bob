// tools/analyze.ts
// Lokasi: conversa-bob-mcp/tools/analyze.ts
// Tool handler untuk conversa_analyze_data

import { z } from "zod";
import { analyzeData } from "../lib/providers/gemini";
import { textResult, MCPToolResult } from "../lib/mcp/protocol";

// Zod schema for input validation
const analyzeSchema = z.object({
  data: z.string().min(1, "Parameter 'data' wajib diisi dan tidak boleh kosong"),
  question: z.string().optional(),
});

export async function callAnalyze(
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  // Validate input with Zod
  const validation = analyzeSchema.safeParse(args);
  
  if (!validation.success) {
    const errors = validation.error.issues.map((err: z.ZodIssue) =>
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');
    return textResult(`Error: ${errors}`, true);
  }

  const { data, question } = validation.data;

  const result = await analyzeData(data, question);
  return textResult(result);
}

// Made with Bob
