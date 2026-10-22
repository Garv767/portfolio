import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import { requireNeonAuth } from "../../../src/utils/neonAuth";

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

async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const sql = neon(dbUrl);
      const rows = await sql`
        SELECT id, title, target_company, target_role, template_name, s3_key, is_published, updated_at
        FROM public.resumes
        ORDER BY updated_at DESC
      `;
      return res.json(rows);
    } catch (err) {
      console.error("List resumes error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    const { id, title, target_company, target_role, jd_text, template_name, latex_content } = req.body;
    if (!title || !latex_content) {
      return res.status(400).json({ error: "Title and LaTeX content required" });
    }

    try {
      const resumeId = id || crypto.randomUUID();
      const s3Key = `resumes/${resumeId}.tex`;

      // 1. Store raw .tex file in Neon S3 bucket
      const putCmd = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: latex_content,
        ContentType: "text/x-tex; charset=utf-8",
      });
      await s3.send(putCmd);

      // 2. Upsert details in Neon PostgreSQL mapping table
      const sql = neon(dbUrl);
      await sql`
        INSERT INTO public.resumes (
          id, title, target_company, target_role, jd_text, template_name, s3_key, updated_at
        ) VALUES (
          ${resumeId}, 
          ${title}, 
          ${target_company || null}, 
          ${target_role || null}, 
          ${jd_text || null}, 
          ${template_name || "custom"}, 
          ${s3Key}, 
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          target_company = EXCLUDED.target_company,
          target_role = EXCLUDED.target_role,
          jd_text = EXCLUDED.jd_text,
          template_name = EXCLUDED.template_name,
          s3_key = EXCLUDED.s3_key,
          updated_at = NOW();
      `;

      return res.json({
        id: resumeId,
        title,
        target_company,
        target_role,
        template_name,
        s3_key: s3Key,
        latex_content,
      });
    } catch (err) {
      console.error("Save resume error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireNeonAuth(handler);
