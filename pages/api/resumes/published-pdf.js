import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";
import { compileLatexToPdf } from "../../../src/utils/latexCompiler";

const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});
const S3_BUCKET = process.env.NEON_S3_BUCKET_NAME || "resume-storage";
const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

// In-memory cache for compiled PDF: { cacheKey: { buffer, timestamp } }
let pdfCache = {
  key: null,
  buffer: null,
};

async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

export const config = {
  api: {
    responseLimit: "25mb",
  },
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sql = neon(dbUrl);
    // Find published resume or most recent
    const rows = await sql`
      SELECT id, title, s3_key, updated_at
      FROM public.resumes
      ORDER BY is_published DESC, updated_at DESC
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "No published resume found in database." });
    }

    const resume = rows[0];
    const cacheKey = `${resume.id}_${new Date(resume.updated_at).getTime()}`;

    // Return cached PDF if fresh
    if (pdfCache.key === cacheKey && pdfCache.buffer) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${(resume.title || "resume").replace(/\.tex$/i, "")}.pdf"`);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.send(pdfCache.buffer);
    }

    // Fetch .tex content from Neon S3
    const getCmd = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: resume.s3_key,
    });
    const s3Res = await s3.send(getCmd);
    const latex = await streamToString(s3Res.Body);

    // Compile to PDF
    const pdfBuffer = await compileLatexToPdf(latex);

    // Cache the result
    pdfCache = {
      key: cacheKey,
      buffer: pdfBuffer,
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${(resume.title || "resume").replace(/\.tex$/i, "")}.pdf"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Public PDF serving error:", err);
    return res.status(500).json({ error: "Failed to generate published resume PDF: " + err.message });
  }
}
