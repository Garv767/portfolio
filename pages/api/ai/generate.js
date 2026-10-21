import { GoogleGenerativeAI } from "@google/generative-ai";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";

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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { jdText, targetRole, targetCompany, customPrompt, templateSkeleton, modelChoice, clientApiKey } = req.body;
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: "Google Gemini API key required." });
  }

  try {
    // 1. Fetch master_context.md from Neon S3
    let masterContext = "";
    try {
      const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: "master_context.md" });
      const s3Res = await s3.send(cmd);
      masterContext = await s3Res.Body.transformToString();
    } catch (e) {
      console.warn("Could not fetch master_context from S3:", e.message);
    }

    // 2. Fetch projects from Neon DB
    let projectsContext = "";
    const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    if (dbUrl) {
      try {
        const sql = neon(dbUrl);
        const projects = await sql`SELECT repo_name, display_title, custom_description, language, topics FROM portfolio_projects LIMIT 30`;
        projectsContext = projects.map(p => `- Project: ${p.display_title} (${p.repo_name})\n  Language: ${p.language || "N/A"}\n  Topics: ${(p.topics || []).join(", ")}\n  Description: ${p.custom_description}`).join("\n\n");
      } catch (e) {
        console.warn("Could not fetch projects from DB:", e.message);
      }
    }

    // 3. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const selectedModel = modelChoice || "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ model: selectedModel });

    const prompt = `You are an elite Tech Career Strategist and LaTeX Resume Architect.
Your task is to craft an impeccably tailored, high-density, ATS-optimized 1-page software engineer resume in LaTeX matching the candidate to the target job description.

--- TARGET JOB DESCRIPTION ---
Company: ${targetCompany || "Target Company"}
Role: ${targetRole || "Software Engineer"}
Job Description:
${jdText}

--- CANDIDATE MASTER CONTEXT ---
${masterContext || "No master context available. Candidate name: Garv Rahut."}

--- CANDIDATE'S SYNCED GITHUB PROJECTS ---
${projectsContext}

--- USER'S ADDITIONAL INSTRUCTIONS ---
${customPrompt || "Focus on quantifiable business/system impact and relevant tech stack alignment."}

--- LATEX TEMPLATE SKELETON ---
Use this exact template structure. Fill in every section with tailored, punchy, STAR-method bullet points:
${templateSkeleton}

--- STRICT CRITICAL RULES ---
1. Output ONLY pure compile-ready LaTeX code starting with \\documentclass and ending with \\end{document}.
2. Do NOT wrap in markdown \`\`\`latex codeblocks or explain anything before/after.
3. Every bullet point must begin with a strong action verb and highlight quantifiable metrics (%, speedup, latency, scale, accuracy).
4. Strictly escape all LaTeX special characters (e.g. use \\%, \\&, \\#, \\_). Never output raw unescaped %, &, or _.
5. Ensure all \\begin{...} have matching \\end{...}.
6. Keep the resume strictly formatted to fit on ONE page.
`;

    const result = await model.generateContent(prompt);
    let outputText = result.response.text().trim();

    if (outputText.startsWith("```latex")) {
      outputText = outputText.replace(/^```latex\n?/, "").replace(/\n?```$/, "").trim();
    } else if (outputText.startsWith("```")) {
      outputText = outputText.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    }

    return res.json({ latex: outputText });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
