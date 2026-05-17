// lib/mcp/server.ts
// Lokasi: conversa-bob-mcp/lib/mcp/server.ts
// Otak utama MCP server — routing request Bob ke tool yang sesuai

import {
  MCPRequest,
  MCPResponse,
  okResponse,
  errResponse,
  textResult,
  validateRequest,
  INITIALIZE_RESULT,
  RPC_ERRORS,
} from "./protocol";
import { listTools, findTool } from "./registry";
import { callAnalyze } from "../../tools/analyze";
import { callScan } from "../../tools/scan";
import { callForm } from "../../tools/form";
import { callScrape } from "../../tools/scrape";
import { callDeploy } from "../../tools/code";

// ── Router utama ──────────────────────────────────────────
export async function handleMCPRequest(
  body: unknown
): Promise<MCPResponse> {

  // 1. Validasi format JSON-RPC
  if (!validateRequest(body)) {
    return errResponse(null, RPC_ERRORS.INVALID_REQUEST);
  }

  const req = body as MCPRequest;

  // 2. Route berdasarkan method
  switch (req.method) {

    // Bob handshake pertama kali connect
    case "initialize":
      return okResponse(req.id, INITIALIZE_RESULT);

    // Bob notifikasi setelah initialize (tidak perlu response)
    case "notifications/initialized":
      return okResponse(req.id, {});

    // Bob minta daftar tools yang tersedia
    case "tools/list":
      return okResponse(req.id, listTools());

    // Bob memanggil salah satu tool
    case "tools/call":
      return await handleToolCall(req);

    default:
      return errResponse(req.id, RPC_ERRORS.METHOD_NOT_FOUND);
  }
}

// ── Handler tools/call ────────────────────────────────────
async function handleToolCall(req: MCPRequest): Promise<MCPResponse> {
  const params = req.params as { name?: string; arguments?: Record<string, unknown> };

  if (!params?.name) {
    return errResponse(req.id, RPC_ERRORS.INVALID_PARAMS);
  }

  // Cek tool terdaftar
  const tool = findTool(params.name);
  if (!tool) {
    return errResponse(req.id, {
      code: -32601,
      message: `Tool tidak ditemukan: ${params.name}`,
    });
  }

  const args = params.arguments ?? {};

  try {
    // Dispatch ke handler masing-masing tool
    let result;

    switch (params.name) {
      case "conversa_analyze_data":
        result = await callAnalyze(args);
        break;

      case "conversa_scan_document":
        result = await callScan(args);
        break;

      case "conversa_build_form":
        result = await callForm(args);
        break;

      case "conversa_scrape_url":
        result = await callScrape(args);
        break;

      case "conversa_deploy_code":
        result = await callDeploy(args);
        break;

      default:
        result = textResult(`Tool belum diimplementasi: ${params.name}`, true);
    }

    return okResponse(req.id, result);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return okResponse(
      req.id,
      textResult(`Error saat menjalankan ${params.name}: ${message}`, true)
    );
  }
}
