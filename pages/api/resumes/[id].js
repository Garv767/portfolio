import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";
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
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      // 1. Fetch metadata from Neon PostgreSQL mapping table
      const sql = neon(dbUrl);
      const rows = await sql`
        SELECT id, title, target_company, target_role, jd_text, template_name, s3_key, updated_at
        FROM public.resumes
        WHERE id = ${id}
        LIMIT 1
      `;

      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Resume metadata not found in database" });
      }

      const meta = rows[0];
      const s3Key = meta.s3_key || `resumes/${id}.tex`;

      // 2. Fetch raw .tex content from Neon S3
      const getCmd = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
      });
      const s3Res = await s3.send(getCmd);
      const rawLatex = await s3Res.Body.transformToString();

      return res.json({
        id: meta.id,
        title: meta.title,
        target_company: meta.target_company || "",
        target_role: meta.target_role || "",
        jd_text: meta.jd_text || "",
        template_name: meta.template_name || "custom",
        s3_key: s3Key,
        updated_at: meta.updated_at,
        latex_content: rawLatex,
      });
    } catch (err) {
      console.error("Get resume error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const sql = neon(dbUrl);
      const rows = await sql`SELECT s3_key FROM public.resumes WHERE id = ${id} LIMIT 1`;
      const s3Key = (rows && rows[0]?.s3_key) || `resumes/${id}.tex`;

      // 1. Delete raw .tex from Neon S3
      try {
        const delCmd = new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
        });
        await s3.send(delCmd);
      } catch (s3Err) {
        console.warn("Could not delete S3 object:", s3Err.message);
      }

      // 2. Delete entry from Neon PostgreSQL mapping table
      await sql`DELETE FROM public.resumes WHERE id = ${id}`;

      return res.json({ success: true, message: "Resume deleted" });
    } catch (err) {
      console.error("Delete resume error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireNeonAuth(handler);
