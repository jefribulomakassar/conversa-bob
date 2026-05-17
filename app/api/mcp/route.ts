// app/api/mcp/route.ts
// Lokasi: conversa-bob-mcp/app/api/mcp/route.ts
// Endpoint MCP — support SSE transport (text/event-stream) untuk IBM Bob Shell

import { NextRequest, NextResponse } from "next/server";
import { handleMCPRequest } from "../../../lib/mcp/server";

const MCP_AUTH_TOKEN = "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function isAuthorized(req: NextRequest): boolean {
  if (!MCP_AUTH_TOKEN) return true;
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  return token === MCP_AUTH_TOKEN;
}

// ── OPTIONS — CORS preflight ──────────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ── GET — SSE transport (Bob Shell pakai ini untuk discovery) ──
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  // Bob Shell connect via SSE — kirim stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Kirim endpoint info via SSE
      const data = JSON.stringify({
        name: "conversa-mcp",
        version: "0.1.0",
        status: "ok",
        tools: [
          "conversa_analyze_data",
          "conversa_scan_document",
          "conversa_build_form",
          "conversa_scrape_url",
          "conversa_deploy_code",
        ],
      });
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      // Jangan close — SSE harus tetap terbuka
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ── POST — terima JSON-RPC request dari Bob ───────────────
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: 401, message: "Unauthorized" } },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const response = await handleMCPRequest(body);

  return NextResponse.json(response, { headers: CORS_HEADERS });
}
