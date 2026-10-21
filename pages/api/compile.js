import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import axios from "axios";
import { requireNeonAuth } from "../../src/utils/neonAuth";

const execFilePromise = promisify(execFile);

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

  // 1. Try local Tectonic compiler first (works in local dev if binary exists)
  const tectonicExe = path.resolve(process.cwd(), "bin/tectonic.exe");
  const tmpDir = path.resolve(process.cwd(), "scratch/compile_tmp");

  if (fs.existsSync(tectonicExe)) {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const fileId = "resume_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const texPath = path.join(tmpDir, `${fileId}.tex`);
    const pdfPath = path.join(tmpDir, `${fileId}.pdf`);

    try {
      fs.writeFileSync(texPath, latex, "utf8");
      await execFilePromise(tectonicExe, ["-o", tmpDir, texPath]);
      if (fs.existsSync(pdfPath)) {
        const pdfBuffer = fs.readFileSync(pdfPath);
        setTimeout(() => {
          try {
            if (fs.existsSync(texPath)) fs.unlinkSync(texPath);
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
          } catch (e) {}
        }, 1500);

        res.setHeader("Content-Type", "application/pdf");
        return res.send(pdfBuffer);
      }
    } catch (compileErr) {
      const errorLog = compileErr.stderr || compileErr.stdout || compileErr.message;
      console.warn("Local tectonic compile notice:", errorLog?.slice?.(0, 200));
    }
  }

  // 2. Cloud Compiler (POST payload - avoids 414 Request-URI Too Large)
  try {
    const cloudRes = await axios.post(
      "https://latex.ytotech.com/builds/sync",
      {
        compiler: "pdflatex",
        resources: [{ main: true, content: latex }],
      },
      {
        responseType: "arraybuffer",
        timeout: 35000,
      }
    );

    if (cloudRes.status === 200 || cloudRes.status === 201) {
      res.setHeader("Content-Type", "application/pdf");
      return res.send(Buffer.from(cloudRes.data));
    }
  } catch (ytotechErr) {
    console.warn("YtoTech compile error:", ytotechErr.response?.status || ytotechErr.message);
  }

  // 3. Cloud Fallback (latexonline.cc via POST tar / URL if short)
  try {
    if (latex.length < 3000) {
      const url = "https://latexonline.cc/compile?text=" + encodeURIComponent(latex);
      const cloudRes2 = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 25000,
      });
      res.setHeader("Content-Type", "application/pdf");
      return res.send(Buffer.from(cloudRes2.data));
    }
  } catch (fallbackErr) {
    console.warn("Fallback compile error:", fallbackErr.message);
  }

  return res.status(422).json({
    error: "LaTeX compilation failed. Please verify syntax, matched brackets, and packages.",
  });
}

export default requireNeonAuth(handler);
