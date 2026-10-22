import { compileLatexToPdf } from "../../src/utils/latexCompiler";
import { requireNeonAuth } from "../../src/utils/neonAuth";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
    responseLimit: "25mb",
  },
};

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { latex } = req.body;
  if (!latex) {
    return res.status(400).json({ error: "No LaTeX code provided" });
  }

  try {
    const pdfBuffer = await compileLatexToPdf(latex);
    res.setHeader("Content-Type", "application/pdf");
    return res.send(pdfBuffer);
  } catch (err) {
    return res.status(422).json({
      error: err.message || "LaTeX compilation failed. Please verify syntax, matched brackets, and packages.",
    });
  }
}

export default requireNeonAuth(handler);
