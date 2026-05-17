// app/layout.tsx
// Lokasi: conversa-bob-mcp/app/layout.tsx
// Root layout wajib untuk Next.js App Router

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conversa × IBM Bob — MCP Server",
  description:
    "Conversa AI exposed as an MCP Server for IBM Bob IDE. Access OCR, data analysis, form builder, web scraper, and code deploy directly from your editor.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
