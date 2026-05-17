// tools/scan.ts
// Lokasi: conversa-bob-mcp/tools/scan.ts
// Tool handler untuk conversa_scan_document

import { z } from "zod";
import { ocrFromUrl } from "../lib/providers/gemini";
import { textResult, MCPToolResult } from "../lib/mcp/protocol";

// Zod schema for input validation
const scanSchema = z.object({
  image_url: z.string()
    .min(1, "Parameter 'image_url' is required")
    .url("Invalid URL format")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return ["http:", "https:"].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      { message: "URL must use HTTP or HTTPS protocol" }
    ),
  document_type: z.string().optional().default("general"),
});

/**
 * Create a structured JSON error response
 * @param type - Error type identifier
 * @param message - Human-readable error description
 * @param details - Additional context or technical details
 * @returns MCPToolResult with formatted error JSON
 */
function createErrorResponse(
  type: string,
  message: string,
  details?: string
): MCPToolResult {
  const errorObj = {
    error: {
      type,
      message,
      details: details || "",
      timestamp: new Date().toISOString(),
    },
  };
  return textResult(JSON.stringify(errorObj, null, 2), true);
}

export async function callScan(
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  // Validate input with Zod
  const validation = scanSchema.safeParse(args);
  
  if (!validation.success) {
    const errors = validation.error.issues.map((err: z.ZodIssue) => 
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');
    return createErrorResponse(
      "INVALID_PARAMETER",
      "Input validation failed",
      errors
    );
  }

  const { image_url: imageUrl, document_type: documentType } = validation.data;

  // Call OCR API with comprehensive error handling
  try {
    const result = await ocrFromUrl(imageUrl, documentType);
    return textResult(result);
  } catch (error) {
    // Handle timeout errors (AbortError from AbortSignal.timeout)
    if (error instanceof Error && error.name === "AbortError") {
      return createErrorResponse(
        "TIMEOUT",
        "Request was aborted due to timeout",
        "The API request exceeded the 30-second timeout limit. Try with a smaller image or check your connection."
      );
    }

    // Handle TimeoutError (alternative timeout error type)
    if (error instanceof Error && error.name === "TimeoutError") {
      return createErrorResponse(
        "TIMEOUT",
        "API request timed out after 30 seconds",
        "The image processing took too long. Try with a smaller image or check your connection."
      );
    }

    // Handle Gemini API errors (from generate() function)
    if (error instanceof Error && error.message.includes("Gemini error")) {
      const statusMatch = error.message.match(/Gemini error (\d+)/);
      const status = statusMatch ? statusMatch[1] : "unknown";

      return createErrorResponse(
        "API_ERROR",
        `Gemini API returned an error (status: ${status})`,
        error.message
      );
    }

    // Handle network/fetch errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return createErrorResponse(
        "NETWORK_ERROR",
        "Network request failed",
        "Unable to connect to the API. Check your internet connection and try again."
      );
    }

    // Generic error fallback
    return createErrorResponse(
      "HTTP_ERROR",
      "Failed to process image",
      error instanceof Error ? error.message : String(error)
    );
  }
}

// Made with Bob
