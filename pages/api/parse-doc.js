import path from "path";
import mammoth from "mammoth";
import * as pdfParseModule from "pdf-parse";

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
      let parsedText = "";
      if (typeof pdfParseModule.PDFParse === "function") {
        const parser = new pdfParseModule.PDFParse({ data: buffer });
        await parser.load();
        const result = await parser.getText();
        parsedText = typeof result === "string" ? result : result.text || "";
      } else if (typeof pdfParseModule.default === "function") {
        const data = await pdfParseModule.default(buffer);
        parsedText = data.text;
      } else if (typeof pdfParseModule === "function") {
        const data = await pdfParseModule(buffer);
        parsedText = data.text;
      } else {
        throw new Error("PDF parser class not recognized");
      }
      return res.json({ text: (parsedText || "").trim() });
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      return res.json({ text: (result.value || "").trim() });
    } else if (ext === ".doc") {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return res.json({ text: (result.value || "").trim() });
      } catch (e) {
        const str = buffer.toString("utf8").replace(/[^\x20-\x7E\t\r\n]/g, " ").replace(/\s+/g, " ");
        return res.json({ text: str.trim() });
      }
    } else {
      return res.json({ text: buffer.toString("utf8").trim() });
    }
  } catch (err) {
    console.error("Document parse error:", err);
    return res.status(500).json({ error: "Failed to parse document: " + err.message });
  }
}
