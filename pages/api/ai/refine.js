import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { currentLatex, instruction, modelChoice, clientApiKey } = req.body;
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;

  if (!apiKey) return res.status(400).json({ error: "Google Gemini API key required." });
  if (!currentLatex || !instruction) return res.status(400).json({ error: "LaTeX and instruction required." });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const selectedModel = modelChoice || "gemini-2.0-flash";
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
    return res.status(500).json({ error: err.message });
  }
}
