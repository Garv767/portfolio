import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
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

function getLocalMasterContext() {
  try {
    const localPath = path.resolve(process.cwd(), "public/master_context.md");
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath, "utf8");
    }
  } catch (e) {}
  return "# Master Career & Profile Context - Garv Rahut\n";
}

async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const cmd = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: "master_context.md",
      });
      const s3Res = await s3.send(cmd);
      const content = await s3Res.Body.transformToString();
      if (content && content.trim().length > 50) {
        return res.json({ content });
      }
      return res.json({ content: getLocalMasterContext() });
    } catch (err) {
      return res.json({
        content: getLocalMasterContext(),
      });
    }
  }

  if (req.method === "POST") {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "No content provided" });

    try {
      // 1. Save to S3
      const cmd = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: "master_context.md",
        Body: content,
        ContentType: "text/markdown",
      });
      await s3.send(cmd);

      // 2. Also keep local file in sync
      try {
        const localPath = path.resolve(process.cwd(), "public/master_context.md");
        fs.writeFileSync(localPath, content, "utf8");
      } catch (e) {}

      return res.json({ success: true, message: "master_context.md saved to S3" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireNeonAuth(handler);
