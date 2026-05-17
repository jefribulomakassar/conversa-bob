// lib/mcp/registry.ts
// Lokasi: conversa-bob-mcp/lib/mcp/registry.ts
// Daftar semua MCP tools yang diexpose ke IBM Bob IDE

import { MCPTool } from "./protocol";

export const TOOLS: MCPTool[] = [
  {
    name: "conversa_analyze_data",
    description:
      "Kirim data CSV/JSON/teks ke Conversa AI untuk dianalisis. " +
      "Mengembalikan insight, statistik, dan ringkasan dalam bahasa natural.",
    inputSchema: {
      type: "object",
      properties: {
        data: {
          type: "string",
          description: "Data yang ingin dianalisis (CSV, JSON, atau teks biasa)",
        },
        question: {
          type: "string",
          description: "Pertanyaan spesifik tentang data (opsional)",
        },
      },
      required: ["data"],
    },
  },
  {
    name: "conversa_scan_document",
    description:
      "Kirim URL gambar atau base64 dokumen (KTP, sertifikat, PDF scan) " +
      "ke pipeline OCR Conversa. Mengembalikan teks terstruktur hasil ekstraksi.",
    inputSchema: {
      type: "object",
      properties: {
        image_url: {
          type: "string",
          description: "URL publik gambar dokumen yang akan di-scan",
        },
        document_type: {
          type: "string",
          enum: ["ktp", "certificate", "invoice", "general"],
          description: "Jenis dokumen untuk optimasi prompt OCR",
        },
      },
      required: ["image_url"],
    },
  },
  {
    name: "conversa_build_form",
    description:
      "Deskripsikan form yang dibutuhkan, Conversa AI akan generate " +
      "form lengkap dan mengembalikan URL form yang siap dipakai.",
    inputSchema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description:
            "Deskripsi form yang diinginkan, contoh: 'Form pendaftaran dengan nama, email, dan file upload'",
        },
        language: {
          type: "string",
          enum: ["id", "en"],
          description: "Bahasa form (id = Indonesia, en = English)",
        },
      },
      required: ["description"],
    },
  },
  {
    name: "conversa_scrape_url",
    description:
      "Kirim URL halaman web, Conversa akan mengekstrak konten utama " +
      "dan mengembalikannya dalam format teks bersih atau JSON.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL halaman web yang ingin di-scrape",
        },
        format: {
          type: "string",
          enum: ["text", "json", "markdown"],
          description: "Format output yang diinginkan",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "conversa_deploy_code",
    description:
      "Commit perubahan kode ke GitHub lalu trigger deployment ke Vercel. " +
      "Mengembalikan URL deployment setelah selesai.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path file di repo yang ingin diupdate, contoh: app/page.tsx",
        },
        content: {
          type: "string",
          description: "Konten baru file tersebut",
        },
        commit_message: {
          type: "string",
          description: "Pesan commit Git",
        },
      },
      required: ["file_path", "content", "commit_message"],
    },
  },
];

/** Cari tool berdasarkan nama */
export function findTool(name: string): MCPTool | undefined {
  return TOOLS.find((t) => t.name === name);
}

/** Kembalikan semua tools dalam format tools/list response */
export function listTools() {
  return { tools: TOOLS };
}
