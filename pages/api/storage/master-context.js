import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
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

async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const cmd = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: "master_context.md",
      });
      const s3Res = await s3.send(cmd);
      const content = await s3Res.Body.transformToString();
      return res.json({ content });
    } catch (err) {
      return res.status(404).json({ error: "master_context.md not found in S3 bucket" });
    }
  }

  if (req.method === "POST") {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "No content provided" });

    try {
      const cmd = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: "master_context.md",
        Body: content,
        ContentType: "text/markdown",
      });
      await s3.send(cmd);
      return res.json({ success: true, message: "master_context saved directly to Neon S3 bucket" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireNeonAuth(handler);
