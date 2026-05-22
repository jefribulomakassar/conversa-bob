# Error Handling Implementation Plan for tools/scan.ts

## Overview
Add comprehensive error handling to [`tools/scan.ts`](tools/scan.ts:1) for failed HTTP requests, invalid URL input, and API timeouts with structured JSON error responses.

## Current State Analysis

### Existing Error Handling
- ✅ Basic URL validation using `new URL()` (line 19-23)
- ✅ Empty parameter check (line 14-16)
- ❌ No try-catch for HTTP/network failures
- ❌ No timeout error handling
- ❌ No structured error response format
- ❌ Error messages in Indonesian, not JSON format

### Dependencies
- [`ocrFromUrl()`](lib/providers/gemini.ts:49) - Makes HTTP request to Gemini API
- [`generate()`](lib/providers/gemini.ts:25) - Has 30s timeout via `AbortSignal.timeout(30_000)`
- [`textResult()`](lib/mcp/protocol.ts:78) - Returns MCPToolResult format

## Error Response Format

### Structured JSON Error Schema
```typescript
{
  "error": {
    "type": "INVALID_URL" | "HTTP_ERROR" | "TIMEOUT" | "API_ERROR" | "NETWORK_ERROR",
    "message": "Human-readable error description",
    "details": "Additional context or technical details",
    "timestamp": "ISO 8601 timestamp"
  }
}
```

## Implementation Steps

### 1. Create Error Helper Function
**Location:** [`tools/scan.ts`](tools/scan.ts:1)

```typescript
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
      timestamp: new Date().toISOString()
    }
  };
  return textResult(JSON.stringify(errorObj, null, 2), true);
}
```

### 2. Enhanced URL Validation
**Current:** Lines 18-23
**Update:** Add more specific validation

```typescript
// Validate URL format
try {
  const url = new URL(imageUrl);
  
  // Check protocol
  if (!['http:', 'https:'].includes(url.protocol)) {
    return createErrorResponse(
      "INVALID_URL",
      "URL must use HTTP or HTTPS protocol",
      `Provided protocol: ${url.protocol}`
    );
  }
  
  // Check if URL is accessible (basic format check)
  if (!url.hostname) {
    return createErrorResponse(
      "INVALID_URL",
      "URL must have a valid hostname",
      `Provided URL: ${imageUrl}`
    );
  }
} catch (error) {
  return createErrorResponse(
    "INVALID_URL",
    "Invalid URL format provided",
    error instanceof Error ? error.message : String(error)
  );
}
```

### 3. Wrap API Call with Try-Catch
**Current:** Line 25 (direct call)
**Update:** Add comprehensive error handling

```typescript
try {
  const result = await ocrFromUrl(imageUrl, documentType);
  return textResult(result);
} catch (error) {
  // Handle timeout errors
  if (error instanceof Error && error.name === 'TimeoutError') {
    return createErrorResponse(
      "TIMEOUT",
      "API request timed out after 30 seconds",
      "The image processing took too long. Try with a smaller image or check your connection."
    );
  }
  
  // Handle AbortError (from AbortSignal.timeout)
  if (error instanceof Error && error.name === 'AbortError') {
    return createErrorResponse(
      "TIMEOUT",
      "Request was aborted due to timeout",
      "The API request exceeded the 30-second timeout limit."
    );
  }
  
  // Handle HTTP errors (from Gemini API)
  if (error instanceof Error && error.message.includes('Gemini error')) {
    const statusMatch = error.message.match(/Gemini error (\d+)/);
    const status = statusMatch ? statusMatch[1] : 'unknown';
    
    return createErrorResponse(
      "API_ERROR",
      `Gemini API returned an error (status: ${status})`,
      error.message
    );
  }
  
  // Handle network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createErrorResponse(
      "NETWORK_ERROR",
      "Network request failed",
      "Unable to connect to the API. Check your internet connection."
    );
  }
  
  // Generic error fallback
  return createErrorResponse(
    "HTTP_ERROR",
    "Failed to process image",
    error instanceof Error ? error.message : String(error)
  );
}
```

## Error Type Definitions

| Error Type | Trigger Condition | HTTP Status Equivalent |
|------------|------------------|------------------------|
| `INVALID_URL` | Malformed URL, invalid protocol, missing hostname | 400 Bad Request |
| `TIMEOUT` | Request exceeds 30s timeout | 408 Request Timeout |
| `API_ERROR` | Gemini API returns error response | 502 Bad Gateway |
| `NETWORK_ERROR` | Network connectivity issues | 503 Service Unavailable |
| `HTTP_ERROR` | Generic HTTP/fetch failures | 500 Internal Server Error |

## Testing Scenarios

### Test Cases to Validate

1. **Invalid URL Format**
   - Input: `"not-a-url"`
   - Expected: `INVALID_URL` error

2. **Invalid Protocol**
   - Input: `"ftp://example.com/image.jpg"`
   - Expected: `INVALID_URL` error

3. **Network Failure**
   - Simulate: Disconnect network
   - Expected: `NETWORK_ERROR` error

4. **API Timeout**
   - Simulate: Very large image or slow connection
   - Expected: `TIMEOUT` error after 30s

5. **API Error Response**
   - Simulate: Invalid API key or rate limit
   - Expected: `API_ERROR` with status code

6. **Successful Request**
   - Input: Valid image URL
   - Expected: OCR result text (not error)

## Code Changes Summary

### Files to Modify
1. **[`tools/scan.ts`](tools/scan.ts:1)** - Main implementation
   - Add `createErrorResponse()` helper function
   - Enhance URL validation (lines 18-23)
   - Wrap `ocrFromUrl()` call with try-catch (line 25)
   - Handle specific error types

### No Changes Required
- [`lib/providers/gemini.ts`](lib/providers/gemini.ts:1) - Already has timeout configured
- [`lib/mcp/protocol.ts`](lib/mcp/protocol.ts:1) - `textResult()` supports error flag

## Implementation Order

1. ✅ Create error helper function
2. ✅ Update URL validation with detailed checks
3. ✅ Add try-catch around API call
4. ✅ Implement specific error type handlers
5. ✅ Test all error scenarios
6. ✅ Verify JSON response format

## Expected Final Code Structure

```typescript
// tools/scan.ts
import { ocrFromUrl } from "../lib/providers/gemini";
import { textResult, MCPToolResult } from "../lib/mcp/protocol";

// Helper function for error responses
function createErrorResponse(...) { ... }

export async function callScan(args: Record<string, unknown>): Promise<MCPToolResult> {
  // 1. Parameter validation
  // 2. Enhanced URL validation
  // 3. Try-catch wrapped API call with specific error handling
  // 4. Return structured JSON errors or success result
}
```

## Success Criteria

- ✅ All error types return structured JSON format
- ✅ Error responses include type, message, details, and timestamp
- ✅ URL validation catches invalid formats and protocols
- ✅ Timeout errors are properly caught and reported
- ✅ Network failures return appropriate error type
- ✅ API errors include status code information
- ✅ Successful requests continue to work as before
