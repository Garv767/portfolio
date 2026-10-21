import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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
  const { id } = req.query;
  const s3Key = `resumes/${id}.json`;

  if (req.method === "GET") {
    try {
      const getCmd = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
      });
      const s3Res = await s3.send(getCmd);
      const data = await s3Res.Body.transformToString();
      return res.json(JSON.parse(data));
    } catch (err) {
      return res.status(404).json({ error: "Resume not found in S3 bucket" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const delCmd = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
      });
      await s3.send(delCmd);
      return res.json({ success: true, message: "Resume deleted from S3" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireNeonAuth(handler);
