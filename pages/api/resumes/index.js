import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
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

async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const listCmd = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: "resumes/",
      });
      const listRes = await s3.send(listCmd);
      const contents = listRes.Contents || [];

      // Fetch resume JSONs in parallel
      const resumes = await Promise.all(
        contents
          .filter((obj) => obj.Key.endsWith(".json"))
          .map(async (obj) => {
            try {
              const getCmd = new GetObjectCommand({
                Bucket: S3_BUCKET,
                Key: obj.Key,
              });
              const getRes = await s3.send(getCmd);
              const data = await getRes.Body.transformToString();
              const parsed = JSON.parse(data);
              return {
                id: parsed.id,
                title: parsed.title,
                target_company: parsed.target_company || "",
                target_role: parsed.target_role || "",
                template_name: parsed.template_name || "jake-resume",
                updated_at: parsed.updated_at || obj.LastModified,
              };
            } catch (e) {
              return null;
            }
          })
      );

      const validResumes = resumes
        .filter(Boolean)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      return res.json(validResumes);
    } catch (err) {
      console.error("S3 List resumes error:", err);
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
      const resumeData = {
        id: resumeId,
        title,
        target_company: target_company || "",
        target_role: target_role || "",
        jd_text: jd_text || "",
        template_name: template_name || "jake-resume",
        latex_content,
        updated_at: new Date().toISOString(),
      };

      const putCmd = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: `resumes/${resumeId}.json`,
        Body: JSON.stringify(resumeData, null, 2),
        ContentType: "application/json",
      });
      await s3.send(putCmd);

      return res.json(resumeData);
    } catch (err) {
      console.error("S3 Save resume error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default requireNeonAuth(handler);
