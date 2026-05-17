// tools/form.ts
// Lokasi: conversa-bob-mcp/tools/form.ts
// Tool handler untuk conversa_build_form

import { z } from "zod";
import { generateFormSchema } from "../lib/providers/gemini";
import { textResult, MCPToolResult } from "../lib/mcp/protocol";

// Zod schema for input validation
const formSchema = z.object({
  description: z.string().min(1, "Parameter 'description' wajib diisi dan tidak boleh kosong"),
  language: z.string().optional().default("id"),
});

export async function callForm(
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  // Validate input with Zod
  const validation = formSchema.safeParse(args);
  
  if (!validation.success) {
    const errors = validation.error.issues.map((err: z.ZodIssue) => 
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');
    return textResult(`Error: ${errors}`, true);
  }

  const { description, language } = validation.data;

  const schema = await generateFormSchema(description, language);

  // Coba parse JSON untuk validasi
  try {
    JSON.parse(schema);
  } catch {
    // Tetap return meski bukan JSON valid — biarkan Bob handle
    return textResult(`Form schema generated (raw):\n\n${schema}`);
  }

  return textResult(
    `Form schema berhasil dibuat:\n\n${schema}\n\nSalin JSON di atas ke Conversa Form Builder untuk generate URL form.`
  );
}

// Made with Bob
