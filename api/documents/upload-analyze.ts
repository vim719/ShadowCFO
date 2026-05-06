import type { IncomingMessage, ServerResponse } from "node:http";
import crypto from "node:crypto";
import Busboy from "busboy";
import pdf from "pdf-parse";
import { createClient } from "@supabase/supabase-js";

type LeakInsight = {
  id: string;
  title: string;
  amount: number;
  frequency: "monthly" | "yearly";
  confidence: number;
  category: string;
  agentReasoning: string;
  agentEvidence: string[];
  fixDescription: string;
  fixDestination?: string;
};

type ParsedTransaction = {
  date: string; // YYYY-MM-DD
  merchant: string;
  amount: number; // absolute value, USD
  direction: "expense" | "income";
  rawLine: string;
};

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
}

function normalizeMerchant(input: string) {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toIsoDate(mmddyyyy: string): string | null {
  const m = mmddyyyy.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
  return iso;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.abs(n);
}

function parseSignedDirection(line: string): "expense" | "income" | null {
  if (/\+\s*\$/.test(line) || /\bIncome\+/.test(line)) return "income";
  if (/\-\s*\$/.test(line) || /\b[A-Za-z]+\-\b/.test(line)) return "expense";
  // Most statement rows include +/- markers. If missing, treat as unknown.
  return null;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function toIsoDateFromMonthDay(monthToken: string, dayToken: string, year: number): string | null {
  const month = MONTHS[monthToken.toLowerCase()];
  const day = Number(dayToken);
  if (!month || !Number.isFinite(day) || day < 1 || day > 31) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function extractTransactionsFromText(text: string): ParsedTransaction[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const txs: ParsedTransaction[] = [];
  let currentYear: number | null = null;

  for (const line of lines) {
    // Track section year from headers like "October 2025" or "March 2026".
    const header = line.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b/i);
    if (header?.[2]) {
      const y = Number(header[2]);
      if (Number.isFinite(y)) currentYear = y;
      continue;
    }

    // Heuristic: find a date + at least one $ amount on the same line.
    // Supports both "10/04/2025" and "Oct 04" styles.
    let isoDate: string | null = null;
    const numericDateMatch = line.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
    if (numericDateMatch?.[1]) isoDate = toIsoDate(numericDateMatch[1]);

    if (!isoDate) {
      const monthDay = line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2})\b/i);
      if (monthDay?.[1] && monthDay?.[2] && currentYear) {
        isoDate = toIsoDateFromMonthDay(monthDay[1], monthDay[2], currentYear);
      }
    }

    if (!isoDate) continue;

    const direction = parseSignedDirection(line);
    if (!direction) continue;

    const amountMatch = line.match(/([+-])\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (!amountMatch?.[2]) continue;
    const rawAmount = amountMatch[2];
    const amount = parseAmount(rawAmount);
    if (!amount || amount <= 0) continue;

    // Merchant guess: remove date + amount and trim.
    const merchantGuess = normalizeMerchant(
      line
        .replace(numericDateMatch?.[0] ?? "", " ")
        .replace(rawAmount, " ")
        .replace(/\s+/g, " ")
        .trim()
    );
    if (!merchantGuess) continue;

    txs.push({
      date: isoDate,
      merchant: merchantGuess,
      amount: Math.round(amount * 100) / 100,
      direction,
      rawLine: line,
    });
  }

  return txs;
}

function daysBetween(a: string, b: string) {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

function findZombieSubscriptions(txs: ParsedTransaction[]): LeakInsight[] {
  const byMerchant = new Map<string, ParsedTransaction[]>();
  for (const tx of txs) {
    if (tx.direction !== "expense") continue;
    if (tx.amount >= 50) continue; // per prompt: under $50
    if (tx.amount < 1) continue;
    const list = byMerchant.get(tx.merchant) ?? [];
    list.push(tx);
    byMerchant.set(tx.merchant, list);
  }

  const findings: LeakInsight[] = [];

  for (const [merchant, list] of byMerchant.entries()) {
    if (list.length < 6) continue;
    const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));

    // Check "roughly monthly": consecutive gaps mostly within 25-35 days.
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (!prev || !cur) continue;
      gaps.push(daysBetween(prev.date, cur.date));
    }
    const monthlyish = gaps.filter((g) => g >= 25 && g <= 35).length;
    if (monthlyish < Math.min(5, gaps.length)) continue;

    const amounts = sorted.map((t) => t.amount);
    const avg = amounts.reduce((s, n) => s + n, 0) / amounts.length;
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    // similar amounts: within 15% band
    if (avg > 0 && (max - min) / avg > 0.15) continue;

    const monthlyAmount = Math.round(avg * 100) / 100;
    const confidence = Math.min(92, 70 + monthlyish * 4);

    findings.push({
      id: `zombie-${crypto.createHash("sha1").update(merchant).digest("hex").slice(0, 10)}`,
      title: `${merchant} recurring charge`,
      amount: monthlyAmount,
      frequency: "monthly",
      confidence,
      category: "Zombie Subscription",
      agentReasoning:
        "This merchant appears repeatedly with a consistent amount on a monthly cadence in the statement you uploaded.",
      agentEvidence: sorted.slice(0, 8).map((t) => `${t.date}: $${t.amount} — ${t.rawLine}`),
      fixDescription:
        "Educational note: this looks like an ongoing recurring charge. If it’s not intentional, it’s a good candidate to review for potential cancellation or downgrade.",
    });
  }

  // Highest impact first
  findings.sort((a, b) => b.amount - a.amount);
  return findings.slice(0, 10);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const bucket = process.env.SUPABASE_DOCUMENTS_BUCKET || "documents";

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { file, filename, mimeType } = await new Promise<{
      file: Buffer;
      filename: string;
      mimeType: string;
    }>((resolve, reject) => {
      const bb = Busboy({
        headers: req.headers,
        limits: { files: 1, fileSize: 20 * 1024 * 1024 }, // 20MB
      });

      let buf: Buffer[] = [];
      let gotFile = false;
      let name = "statement.pdf";
      let mime = "application/pdf";

      bb.on(
        "file",
        (_field: string, stream: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
        gotFile = true;
        name = info.filename || name;
        mime = info.mimeType || mime;
        stream.on("data", (d: Buffer) => buf.push(Buffer.from(d)));
        stream.on("limit", () => reject(new Error("File too large (max 20MB)")));
        stream.on("error", reject);
      }
      );

      bb.on("error", reject);
      bb.on("finish", () => {
        if (!gotFile) return reject(new Error("No file uploaded"));
        const fileBuffer = Buffer.concat(buf);
        resolve({ file: fileBuffer, filename: name, mimeType: mime });
      });

      req.pipe(bb);
    });

    if (!mimeType.includes("pdf") && !filename.toLowerCase().endsWith(".pdf")) {
      return json(res, 400, { error: "Only PDF uploads are supported right now." });
    }

    const documentId = crypto.randomUUID();
    const safeName = sanitizeFilename(filename || "statement.pdf");
    const storagePath = `${documentId}/${safeName}`;

    const insertRes = await supabase
      .from("documents")
      .insert({
        id: documentId,
        original_filename: filename,
        mime_type: mimeType,
        storage_bucket: bucket,
        storage_path: storagePath,
        status: "processing",
      })
      .select("id")
      .single();

    if (insertRes.error) throw new Error(`Supabase insert failed: ${insertRes.error.message}`);

    const uploadRes = await supabase.storage.from(bucket).upload(storagePath, file, {
      contentType: mimeType,
      upsert: false,
    });
    if (uploadRes.error) throw new Error(`Storage upload failed: ${uploadRes.error.message}`);

    const parsed = await pdf(file);
    const parsedText = parsed.text || "";
    const transactions = extractTransactionsFromText(parsedText);
    const findings = findZombieSubscriptions(transactions);

    const updateRes = await supabase
      .from("documents")
      .update({
        status: "processed",
        parsed_text: parsedText,
        findings: { findings, transactions_count: transactions.length },
      })
      .eq("id", documentId);

    if (updateRes.error) throw new Error(`Supabase update failed: ${updateRes.error.message}`);

    return json(res, 200, {
      documentId,
      storage: { bucket, path: storagePath },
      filename: safeName,
      findings,
      meta: { transactionsCount: transactions.length },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json(res, 500, { error: message });
  }
}
