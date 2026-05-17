// lib/providers/gemini.ts
// Lokasi: conversa-bob-mcp/lib/providers/gemini.ts
// Provider Gemini API — handle OCR dokumen dan analisis data

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-1.5-flash";

// ── Tipe internal ─────────────────────────────────────────
interface GeminiTextPart {
  text: string;
}

interface GeminiImagePart {
  inline_data: { mime_type: string; data: string };
}

interface GeminiUrlPart {
  file_data: { mime_type: string; file_uri: string };
}

type GeminiPart = GeminiTextPart | GeminiImagePart | GeminiUrlPart;

// ── Core request ke Gemini ────────────────────────────────
async function generate(parts: GeminiPart[]): Promise<string> {
  const res = await fetch(
    `${GEMINI_BASE}/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ── OCR dokumen dari URL publik ───────────────────────────
export async function ocrFromUrl(
  imageUrl: string,
  documentType = "general"
): Promise<string> {
  const prompts: Record<string, string> = {
    ktp: `Ekstrak semua field dari KTP Indonesia ini. 
Format output JSON: { nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, 
alamat, rt_rw, kelurahan, kecamatan, kabupaten, agama, status_perkawinan, pekerjaan, wni }`,

    certificate: `Ekstrak semua informasi dari sertifikat ini.
Format output JSON: { nama, nomor_sertifikat, skema_sertifikasi, tanggal_terbit, 
tanggal_kadaluarsa, lembaga_penerbit, nomor_registrasi }`,

    invoice: `Ekstrak semua data dari invoice/faktur ini.
Format output JSON: { nomor_invoice, tanggal, penjual, pembeli, 
items: [{nama, qty, harga, subtotal}], total, pajak, grand_total }`,

    general: `Ekstrak semua teks yang terlihat dari dokumen ini secara lengkap dan akurat.
Pertahankan struktur dan format aslinya.`,
  };

  const prompt = prompts[documentType] ?? prompts.general;

  return generate([
    { text: prompt },
    { file_data: { mime_type: "image/jpeg", file_uri: imageUrl } },
  ]);
}

// ── OCR dari base64 ───────────────────────────────────────
export async function ocrFromBase64(
  base64: string,
  mimeType = "image/jpeg",
  documentType = "general"
): Promise<string> {
  const prompt =
    documentType === "ktp"
      ? `Ekstrak semua field KTP Indonesia. Output JSON.`
      : `Ekstrak semua teks dari dokumen ini secara lengkap.`;

  return generate([
    { text: prompt },
    { inline_data: { mime_type: mimeType, data: base64 } },
  ]);
}

// ── Analisis data teks/CSV/JSON ───────────────────────────
export async function analyzeData(
  data: string,
  question?: string
): Promise<string> {
  const prompt = question
    ? `Kamu adalah analis data ahli. Berikut datanya:\n\n${data}\n\nPertanyaan: ${question}\n\nBerikan analisis lengkap, insight utama, dan jawaban konkret.`
    : `Kamu adalah analis data ahli. Analisis data berikut secara menyeluruh:\n\n${data}\n\nBerikan: ringkasan, insight utama, pola yang ditemukan, dan rekomendasi actionable.`;

  return generate([{ text: prompt }]);
}

// ── Generate form schema dari deskripsi ───────────────────
export async function generateFormSchema(
  description: string,
  language = "id"
): Promise<string> {
  const lang = language === "id" ? "Bahasa Indonesia" : "English";

  const prompt = `Buat JSON schema form berdasarkan deskripsi berikut dalam ${lang}:

"${description}"

Output HANYA JSON valid dengan format:
{
  "title": "...",
  "description": "...",
  "fields": [
    {
      "id": "field_id",
      "type": "text|email|number|select|textarea|file|date|phone",
      "label": "...",
      "placeholder": "...",
      "required": true|false,
      "options": ["..."] // hanya untuk type select
    }
  ]
}`;

  return generate([{ text: prompt }]);
}
