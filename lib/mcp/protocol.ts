// lib/mcp/protocol.ts
// Implementasi JSON-RPC 2.0 sesuai spesifikasi MCP
// Referensi: https://bob.ibm.com/docs/ide/configuration/mcp/mcp-in-bob

export type MCPMethod =
  | "initialize"
  | "tools/list"
  | "tools/call"
  | "notifications/initialized";

// ── Request ──────────────────────────────────────────────
export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: MCPMethod;
  params?: Record<string, unknown>;
}

// ── Response ─────────────────────────────────────────────
export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

// ── Tool definition (dikirim ke Bob saat tools/list) ─────
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ── Tool call result (dikirim ke Bob setelah tools/call) ─
export interface MCPToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

// ── Error codes standar JSON-RPC ─────────────────────────
export const RPC_ERRORS = {
  PARSE_ERROR:      { code: -32700, message: "Parse error" },
  INVALID_REQUEST:  { code: -32600, message: "Invalid request" },
  METHOD_NOT_FOUND: { code: -32601, message: "Method not found" },
  INVALID_PARAMS:   { code: -32602, message: "Invalid params" },
  INTERNAL_ERROR:   { code: -32603, message: "Internal error" },
} as const;

// ── Helpers ───────────────────────────────────────────────

/** Buat response sukses */
export function okResponse(id: string | number, result: unknown): MCPResponse {
  return { jsonrpc: "2.0", id, result };
}

/** Buat response error */
export function errResponse(
  id: string | number | null,
  error: MCPError
): MCPResponse {
  return { jsonrpc: "2.0", id, error };
}

/** Buat tool result berisi teks */
export function textResult(text: string, isError = false): MCPToolResult {
  return {
    content: [{ type: "text", text }],
    isError,
  };
}

/** Validasi request MCP minimal */
export function validateRequest(body: unknown): body is MCPRequest {
  if (typeof body !== "object" || body === null) return false;
  const r = body as Record<string, unknown>;
  return (
    r.jsonrpc === "2.0" &&
    typeof r.method === "string" &&
    (r.id !== undefined || r.method.startsWith("notifications/"))
  );
}

/** Response saat Bob pertama kali initialize koneksi */
export const INITIALIZE_RESULT = {
  protocolVersion: "2024-11-05",
  capabilities: { tools: {} },
  serverInfo: {
    name: "conversa-mcp",
    version: "0.1.0",
  },
};
