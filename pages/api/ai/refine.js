import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireNeonAuth } from "../../../src/utils/neonAuth";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { currentLatex, instruction, modelChoice, clientApiKey } = req.body;
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

  if (!apiKey) return res.status(400).json({ error: "Google Gemini API key required." });
  if (!currentLatex || !instruction) return res.status(400).json({ error: "LaTeX and instruction required." });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const requestedModel = modelChoice || "gemini-3.8-flash";

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

    const fallbackList = [
      requestedModel,
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-4-argon",
      "gemini-3.1-pro-preview",
      "gemini-3.1-flash-lite"
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let outputText = "";
    let lastError = null;

    for (const modelName of fallbackList) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        outputText = result.response.text().trim();
        if (outputText) {
          lastError = null;
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Refine model ${modelName} returned: ${err.message}. Trying next fallback...`);
        if (err.message && err.message.includes("API key not valid")) {
          throw err;
        }
      }
    }

    if (!outputText && lastError) {
      throw lastError;
    }

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

export default requireNeonAuth(handler);
