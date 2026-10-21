import path from "path";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { fileData, fileName } = req.body;
  if (!fileData) return res.status(400).json({ error: "No file data received" });

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
      return res.json({ text: buffer.toString("utf8") });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to parse document: " + err.message });
  }
}
