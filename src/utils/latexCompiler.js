import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import axios from "axios";

const execFilePromise = promisify(execFile);

/**
 * Shared compilation engine for LaTeX to PDF
 * 1. Checks local tectonic.exe binary
 * 2. Falls back to YtoTech cloud compiler
 * 3. Falls back to latexonline.cc
 */
export async function compileLatexToPdf(latex) {
  if (!latex || typeof latex !== "string") {
    throw new Error("No LaTeX code provided");
  }

  // 1. Try local Tectonic compiler first
  const tectonicExe = path.resolve(process.cwd(), "bin/tectonic.exe");
  const tmpDir = path.resolve(process.cwd(), "scratch/compile_tmp");

  if (fs.existsSync(tectonicExe)) {
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const fileId = "tex_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
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

        return pdfBuffer;
      }
    } catch (compileErr) {
      const errorLog = compileErr.stderr || compileErr.stdout || compileErr.message;
      console.warn("Local tectonic compile notice:", errorLog?.slice?.(0, 200));
    }
  }

  // 2. Cloud Compiler (YtoTech POST payload)
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
      return Buffer.from(cloudRes.data);
    }
  } catch (ytotechErr) {
    console.warn("YtoTech compile error:", ytotechErr.response?.status || ytotechErr.message);
  }

  // 3. Cloud Fallback (latexonline.cc)
  try {
    if (latex.length < 4000) {
      const url = "https://latexonline.cc/compile?text=" + encodeURIComponent(latex);
      const cloudRes2 = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 25000,
      });
      return Buffer.from(cloudRes2.data);
    }
  } catch (fallbackErr) {
    console.warn("Fallback compile error:", fallbackErr.message);
  }

  throw new Error("LaTeX compilation failed on all compilers.");
}
