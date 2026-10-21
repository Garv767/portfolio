import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getDb, requireNeonAuth } from "../../../src/utils/neonAuth";

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

async function handler(req, res) {
  const sql = getDb();

  if (req.method === "GET") {
    try {
      // 1. Fetch directly from Neon PostgreSQL master_context table
      const rows = await sql`SELECT content FROM public.master_context WHERE id = 'default' LIMIT 1`;
      if (rows.length > 0 && rows[0].content) {
        return res.json({ content: rows[0].content });
      }

      // 2. Fallback to Neon S3
      const cmd = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: "master_context.md",
      });
      const s3Res = await s3.send(cmd);
      const content = await s3Res.Body.transformToString();
      return res.json({ content });
    } catch (err) {
      return res.json({
        content: `# Master Career & Profile Context - Garv Rahut\n`,
      });
    }
  }

  if (req.method === "POST") {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "No content provided" });

    try {
      // 1. Save directly into Neon PostgreSQL master_context table
      await sql`
        INSERT INTO public.master_context (id, content, updated_at)
        VALUES ('default', ${content}, NOW())
        ON CONFLICT (id) DO UPDATE 
        SET content = EXCLUDED.content, updated_at = NOW()
      `;

      // 2. Also sync to Neon S3
      try {
        const cmd = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: "master_context.md",
          Body: content,
          ContentType: "text/markdown",
        });
        await s3.send(cmd);
      } catch (s3Err) {
        console.warn("Neon S3 sync notice:", s3Err.message);
      }

      return res.json({ success: true, message: "master_context saved directly to Neon database" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireNeonAuth(handler);
