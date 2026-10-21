const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFilePromise = promisify(execFile);
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { neon } = require("@neondatabase/serverless");
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// 1. Database connection
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

// 2. Neon S3 Storage Client
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

// Helper: Ensure scratch/tmp dir exists
const TMP_DIR = path.resolve(__dirname, "../scratch/compile_tmp");
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// -------------------------------------------------------------
// COMPILE LATEX TO PDF
// -------------------------------------------------------------
app.post("/api/compile", async (req, res) => {
  const { latex } = req.body;
  if (!latex) {
    return res.status(400).json({ error: "No LaTeX code provided" });
  }

  const fileId = "resume_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const texPath = path.join(TMP_DIR, `${fileId}.tex`);
  const pdfPath = path.join(TMP_DIR, `${fileId}.pdf`);
  const tectonicExe = path.resolve(__dirname, "../bin/tectonic.exe");

  try {
    fs.writeFileSync(texPath, latex, "utf8");

    // Check if local tectonic executable is available
    if (fs.existsSync(tectonicExe)) {
      try {
        await execFilePromise(tectonicExe, ["-o", TMP_DIR, texPath]);
        if (fs.existsSync(pdfPath)) {
          const pdfBuffer = fs.readFileSync(pdfPath);
          // Clean up files asynchronously
          setTimeout(() => {
            try {
              if (fs.existsSync(texPath)) fs.unlinkSync(texPath);
              if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
            } catch (e) {}
          }, 2000);

          res.setHeader("Content-Type", "application/pdf");
          return res.send(pdfBuffer);
        }
      } catch (compileErr) {
        const errorLog = compileErr.stderr || compileErr.stdout || compileErr.message;
        console.error("Tectonic compilation warning/error:", errorLog);
        return res.status(422).json({
          error: "LaTeX compilation failed",
          log: errorLog,
        });
      }
    } else {
      return res.status(500).json({ error: "Tectonic compiler not found at " + tectonicExe });
    }
  } catch (err) {
    console.error("Compile handler error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// S3 STORAGE: master_context.md
// -------------------------------------------------------------
app.get("/api/storage/master-context", async (req, res) => {
  try {
    const cmd = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: "master_context.md",
    });
    const s3Res = await s3.send(cmd);
    const content = await s3Res.Body.transformToString();
    return res.json({ content });
  } catch (err) {
    // If not found, return empty template
    console.warn("master_context.md not found or error:", err.message);
    return res.json({
      content: `# Master Career & Profile Context\n- Name: Garv Rahut\n- Target: Software Engineer / AI / Full Stack\n- GitHub: https://github.com/garv767\n`,
    });
  }
});

app.post("/api/storage/master-context", async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "No content provided" });
  }
  try {
    const cmd = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: "master_context.md",
      Body: content,
      ContentType: "text/markdown",
    });
    await s3.send(cmd);
    return res.json({ success: true, message: "master_context.md saved to S3" });
  } catch (err) {
    console.error("Failed to save master_context.md:", err);
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// NEON DATABASE: PROJECTS & SAVED RESUMES
// -------------------------------------------------------------
app.get("/api/projects", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "Database not configured" });
  try {
    const projects = await sql`SELECT * FROM portfolio_projects ORDER BY priority ASC`;
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/resumes", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "Database not configured" });
  try {
    const resumes = await sql`SELECT id, title, target_company, target_role, template_name, updated_at FROM saved_resumes ORDER BY updated_at DESC`;
    return res.json(resumes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/resumes/:id", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "Database not configured" });
  try {
    const rows = await sql`SELECT * FROM saved_resumes WHERE id = ${req.params.id}`;
    if (rows.length === 0) return res.status(404).json({ error: "Resume not found" });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/resumes", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "Database not configured" });
  const { id, title, target_company, target_role, jd_text, template_name, latex_content } = req.body;
  if (!title || !latex_content) {
    return res.status(400).json({ error: "Title and LaTeX content are required" });
  }

  try {
    let result;
    if (id) {
      result = await sql`
        UPDATE saved_resumes SET
          title = ${title},
          target_company = ${target_company || ""},
          target_role = ${target_role || ""},
          jd_text = ${jd_text || ""},
          template_name = ${template_name || "jake-resume"},
          latex_content = ${latex_content},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
    } else {
      result = await sql`
        INSERT INTO saved_resumes (
          title, target_company, target_role, jd_text, template_name, latex_content, updated_at
        ) VALUES (
          ${title}, ${target_company || ""}, ${target_role || ""}, ${jd_text || ""}, ${template_name || "jake-resume"}, ${latex_content}, NOW()
        )
        RETURNING *
      `;
    }
    return res.json(result[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/api/resumes/:id", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "Database not configured" });
  try {
    await sql`DELETE FROM saved_resumes WHERE id = ${req.params.id}`;
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// DOCUMENT PARSING (DOCX, PDF, TXT)
// -------------------------------------------------------------
app.post("/api/parse-doc", async (req, res) => {
  const { fileData, fileName } = req.body; // base64 string
  if (!fileData) {
    return res.status(400).json({ error: "No file data received" });
  }

  try {
    const buffer = Buffer.from(fileData, "base64");
    const ext = path.extname(fileName || "").toLowerCase();

    if (ext === ".pdf") {
      const pdfData = await pdfParse(buffer);
      return res.json({ text: pdfData.text });
    } else if (ext === ".docx" || ext === ".doc") {
      const result = await mammoth.extractRawText({ buffer });
      return res.json({ text: result.value });
    } else {
      // Plain text or markdown
      return res.json({ text: buffer.toString("utf8") });
    }
  } catch (err) {
    console.error("Document parsing error:", err);
    return res.status(500).json({ error: "Failed to parse document: " + err.message });
  }
});

// -------------------------------------------------------------
// GEMINI AI RESUME GENERATION & REFINEMENT
// -------------------------------------------------------------
app.post("/api/ai/generate", async (req, res) => {
  const { jdText, targetRole, targetCompany, customPrompt, templateSkeleton, modelChoice, clientApiKey } = req.body;

  const apiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      error: "Google Gemini API key required. Please provide it in the prompt modal or set GEMINI_API_KEY in .env.local",
    });
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
    if (sql) {
      try {
        const projects = await sql`SELECT repo_name, display_title, custom_description, language, topics FROM portfolio_projects LIMIT 30`;
        projectsContext = projects.map(p => `- Project: ${p.display_title} (${p.repo_name})\n  Language: ${p.language || "N/A"}\n  Topics: ${(p.topics || []).join(", ")}\n  Description: ${p.custom_description}`).join("\n\n");
      } catch (e) {
        console.warn("Could not fetch projects from DB:", e.message);
      }
    }

    // 3. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const selectedModel = modelChoice || "gemini-3.8-flash";
    const model = genAI.getGenerativeModel({ model: selectedModel });

    const prompt = `You are an elite Tech Career Strategist and LaTeX Resume Architect.
Your task is to craft an impeccably tailored, high-density, ATS-optimized 1-page software engineer resume in LaTeX matching the candidate to the target job description.

--- TARGET JOB DESCRIPTION ---
Company: ${targetCompany || "Target Company"}
Role: ${targetRole || "Software Engineer"}
Job Description:
${jdText}

--- CANDIDATE MASTER CONTEXT ---
${masterContext || "No master context available. Use candidate name: Garv Rahut."}

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

    // Strip markdown code fences if present
    if (outputText.startsWith("```latex")) {
      outputText = outputText.replace(/^```latex\n?/, "").replace(/\n?```$/, "").trim();
    } else if (outputText.startsWith("```")) {
      outputText = outputText.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    }

    return res.json({ latex: outputText });
  } catch (err) {
    console.error("AI Generation error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/ai/refine", async (req, res) => {
  const { currentLatex, instruction, modelChoice, clientApiKey } = req.body;

  const apiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({
      error: "Google Gemini API key required. Please provide it or set GEMINI_API_KEY in .env.local",
    });
  }

  if (!currentLatex || !instruction) {
    return res.status(400).json({ error: "Current LaTeX code and instruction are required" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const selectedModel = modelChoice || "gemini-3.8-flash";
    const model = genAI.getGenerativeModel({ model: selectedModel });

    const prompt = `You are an expert LaTeX resume editor.
The user has an existing LaTeX resume that they have manually edited and customized.
You MUST apply the user's specific instruction to the LaTeX code while PRESERVING all other sections, custom formatting, and details.

--- USER INSTRUCTION ---
${instruction}

--- CURRENT LATEX CODE ---
${currentLatex}

--- STRICT RULES ---
1. Return ONLY the complete, compile-ready LaTeX code.
2. Do NOT wrap in markdown \`\`\`latex codeblocks.
3. Preserve all existing manual edits and formatting, only modifying what is requested.
4. Strictly escape special characters (\\%, \\&, \\_, \\#).
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
    console.error("AI Refine error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Portfolio & AI Resume Builder API Server running on http://localhost:${PORT}`);
});
