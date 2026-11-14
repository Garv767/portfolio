import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";
import { compileLatexToPdf } from "../../../src/utils/latexCompiler.js";

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

// In-memory cache for compiled PDFs: Map<cacheKey, Buffer>
const pdfCache = new Map();

async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

function normalizeSlug(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/\.(pdf|tex)$/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function findResume(resumes, reqName, owner = "garv") {
  const raw = String(reqName || "").replace(/\.(pdf|tex)$/i, "").trim();
  const norm = normalizeSlug(raw);

  // 1. Direct ID match
  const byId = resumes.find(
    (r) => r.id.toLowerCase() === raw.toLowerCase() || normalizeSlug(r.id) === norm
  );
  if (byId) return { match: byId, reason: "id" };

  // 2. Exact Title match (case-insensitive, ignoring .tex)
  const byExactTitle = resumes.find(
    (r) => r.title.replace(/\.tex$/i, "").toLowerCase() === raw.toLowerCase()
  );
  if (byExactTitle) return { match: byExactTitle, reason: "exact_title" };

  // 3. Slug match on Title
  const bySlugTitle = resumes.find((r) => normalizeSlug(r.title) === norm);
  if (bySlugTitle) return { match: bySlugTitle, reason: "slug_title" };

  // 4. Target Company or Role match
  const byCompany = resumes.find(
    (r) => r.target_company && normalizeSlug(r.target_company) === norm
  );
  if (byCompany) return { match: byCompany, reason: "target_company" };

  const byRole = resumes.find(
    (r) => r.target_role && normalizeSlug(r.target_role) === norm
  );
  if (byRole) return { match: byRole, reason: "target_role" };

  // 5. Common aliases for published resume
  const publishedAliases = new Set([
    "",
    "resume",
    "cv",
    "default",
    "published",
    "active",
    "current",
    "latest",
    owner.toLowerCase(),
    `${owner.toLowerCase()}_resume`,
    `${owner.toLowerCase()}_cv`,
    `${owner.toLowerCase()}s_resume`,
    `${owner.toLowerCase()}_s_resume`,
    "garv_rahut",
    "garv_rahut_resume",
    "garv_rahut_cv",
  ]);

  const published = resumes.find((r) => r.is_published) || resumes[0];

  if (publishedAliases.has(norm)) {
    return { match: published, reason: "published_alias" };
  }

  // 6. Partial / substring match on Title
  const bySubstring = resumes.find((r) => {
    const rNorm = normalizeSlug(r.title);
    return rNorm && norm && (rNorm.includes(norm) || norm.includes(rNorm));
  });
  if (bySubstring) return { match: bySubstring, reason: "substring" };

  return null;
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

  let filename = req.query.filename;
  if (Array.isArray(filename)) {
    filename = filename.join("/");
  }

  try {
    const sql = neon(dbUrl);
    const resumes = await sql`
      SELECT id, title, target_company, target_role, template_name, s3_key, is_published, updated_at
      FROM public.resumes
      ORDER BY is_published DESC, updated_at DESC;
    `;

    if (!resumes || resumes.length === 0) {
      return res.status(404).json({ error: "No resumes found in database." });
    }

    const resolution = findResume(resumes, filename, "garv");

    if (!resolution || !resolution.match) {
      return res.status(404).json({
        error: `Resume not found matching '${filename || ""}'`,
        available_resumes: resumes.map((r) => ({
          title: r.title,
          url: `/resumes/${r.title.replace(/\.tex$/i, "").replace(/\s+/g, "_")}.pdf`,
        })),
      });
    }

    const resume = resolution.match;
    const cacheKey = `${resume.id}_${new Date(resume.updated_at).getTime()}`;
    const safeTitle = (resume.title || "resume")
      .replace(/\.tex$/i, "")
      .replace(/[^a-zA-Z0-9_\-]/g, "_");
    const downloadFilename = `${safeTitle}.pdf`;

    // HTTP 304 If-None-Match check
    const clientEtag = req.headers["if-none-match"];
    if (clientEtag && clientEtag.replace(/^W\//, "") === `"${cacheKey}"`) {
      res.setHeader("ETag", `"${cacheKey}"`);
      res.setHeader(
        "Cache-Control",
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
      );
      return res.status(304).end();
    }

    // Check in-memory cache
    if (pdfCache.has(cacheKey)) {
      const cachedBuffer = pdfCache.get(cacheKey);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${downloadFilename}"`
      );
      res.setHeader("ETag", `"${cacheKey}"`);
      res.setHeader(
        "Cache-Control",
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
      );
      return res.send(cachedBuffer);
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

    // Cache the result in memory
    pdfCache.set(cacheKey, pdfBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${downloadFilename}"`
    );
    res.setHeader("ETag", `"${cacheKey}"`);
    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
    );
    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Dynamic resume PDF serving error:", err);
    return res
      .status(500)
      .json({ error: "Failed to render resume PDF: " + err.message });
  }
}
