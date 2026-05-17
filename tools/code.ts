// tools/code.ts
// Lokasi: conversa-bob-mcp/tools/code.ts
// Tool handler untuk conversa_deploy_code

import { z } from "zod";
import { commitFile, triggerDeploy } from "../lib/providers/github";
import { textResult, MCPToolResult } from "../lib/mcp/protocol";

// Zod schema for input validation
const deploySchema = z.object({
  file_path: z.string().min(1, "Parameter 'file_path' wajib diisi dan tidak boleh kosong"),
  content: z.string().min(1, "Parameter 'content' wajib diisi dan tidak boleh kosong"),
  commit_message: z.string().min(1, "Parameter 'commit_message' wajib diisi dan tidak boleh kosong"),
});

export async function callDeploy(
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  // Validate input with Zod
  const validation = deploySchema.safeParse(args);
  
  if (!validation.success) {
    const errors = validation.error.issues.map((err: z.ZodIssue) => 
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');
    return textResult(`Error: ${errors}`, true);
  }

  const { file_path: filePath, content, commit_message: commitMessage } = validation.data;

  // 1. Commit file ke GitHub
  const commit = await commitFile(filePath, content, commitMessage);

  // 2. Trigger Vercel deployment
  const deployUrl = await triggerDeploy();

  return textResult(
    `✅ Berhasil!\n\n` +
    `📝 Commit: ${commit.url}\n` +
    `🔑 SHA: ${commit.sha}\n` +
    `🚀 Deploy URL: ${deployUrl}\n\n` +
    `Deployment sedang berjalan. Tunggu 1-2 menit lalu buka URL di atas.`
  );
}

// Made with Bob
