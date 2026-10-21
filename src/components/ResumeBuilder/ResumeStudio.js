import React, { useState, useEffect } from "react";
import { Button, Form, Badge, Spinner } from "react-bootstrap";
import { 
  AiOutlineThunderbolt, 
  AiOutlineSave, 
  AiOutlineCheck, 
  AiOutlineArrowLeft
} from "react-icons/ai";
import axios from "axios";

import FileTree from "./FileTree";
import LatexEditor from "./LatexEditor";
import PdfPreview from "./PdfPreview";
import AiStudioModal from "./AiStudioModal";
import { TEMPLATES, JAKE_RESUME_TEMPLATE } from "./templates";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

function ResumeStudio({ onBackToDashboard }) {
  // Active document state
  const [activeFile, setActiveFile] = useState("template:jake-resume");
  const [latexCode, setLatexCode] = useState(JAKE_RESUME_TEMPLATE);
  const [masterContext, setMasterContext] = useState("");
  const [resumeTitle, setResumeTitle] = useState("Garv_Rahut_Resume.tex");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [currentResumeId, setCurrentResumeId] = useState(null);

  // Saved resumes from Neon DB
  const [savedResumes, setSavedResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  // PDF Preview & Compilation state
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState("");
  const [compileDuration, setCompileDuration] = useState("");

  // Saving states
  const [savingDb, setSavingDb] = useState(false);
  const [savedDbSuccess, setSavedDbSuccess] = useState(false);
  const [savingS3, setSavingS3] = useState(false);

  // AI Modal
  const [showAiModal, setShowAiModal] = useState(false);

  // Initial load
  useEffect(() => {
    fetchSavedResumes();
    fetchMasterContext();
    compileLatex(JAKE_RESUME_TEMPLATE);
  }, []);

  const fetchSavedResumes = async () => {
    try {
      setLoadingResumes(true);
      const res = await axios.get(`${API_BASE}/resumes`);
      setSavedResumes(res.data || []);
    } catch (err) {
      console.error("Failed to fetch saved resumes:", err);
    } finally {
      setLoadingResumes(false);
    }
  };

  const fetchMasterContext = async () => {
    try {
      const res = await axios.get(`${API_BASE}/storage/master-context`);
      setMasterContext(res.data.content || "");
    } catch (err) {
      console.error("Failed to fetch master context:", err);
    }
  };

  const compileLatex = async (codeToCompile) => {
    const code = codeToCompile || latexCode;
    if (!code) return;

    setCompiling(true);
    setCompileError("");
    const startTime = performance.now();

    try {
      const res = await axios.post(`${API_BASE}/compile`, { latex: code }, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      setCompileDuration(duration);
    } catch (err) {
      if (err.response && err.response.data) {
        // Blob to JSON for error message
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorObj = JSON.parse(reader.result);
            setCompileError(errorObj.log || errorObj.error || "Compilation failed.");
          } catch (e) {
            setCompileError(reader.result || "Compilation failed.");
          }
        };
        reader.readAsText(err.response.data);
      } else {
        setCompileError(err.message || "Compilation failed.");
      }
    } finally {
      setCompiling(false);
    }
  };

  const handleSelectFile = (fileKey) => {
    setActiveFile(fileKey);

    if (fileKey === "master_context.md") {
      // Do nothing, editor shows masterContext
    } else if (fileKey.startsWith("template:")) {
      const tmplKey = fileKey.replace("template:", "");
      const found = TEMPLATES.find((t) => t.key === tmplKey);
      if (found) {
        setLatexCode(found.template);
        setCurrentResumeId(null);
        setResumeTitle(`${found.name.replace(/[^a-zA-Z0-9]/g, "_")}.tex`);
        compileLatex(found.template);
      }
    }
  };

  const handleSelectResume = async (resumeId) => {
    try {
      const res = await axios.get(`${API_BASE}/resumes/${resumeId}`);
      const resume = res.data;
      if (resume && resume.latex_content) {
        setActiveFile(`resume:${resume.id}`);
        setCurrentResumeId(resume.id);
        setResumeTitle(resume.title);
        setTargetCompany(resume.target_company || "");
        setTargetRole(resume.target_role || "");
        setLatexCode(resume.latex_content);
        compileLatex(resume.latex_content);
      } else {
        alert("Saved resume could not be loaded or has empty LaTeX content.");
      }
    } catch (err) {
      console.error("Failed to load resume:", err);
      alert("Error loading saved resume: " + (err.response?.data?.error || err.message));
    }
  };

  const handleSaveToNeon = async () => {
    if (!latexCode.trim()) return;

    setSavingDb(true);
    setSavedDbSuccess(false);

    try {
      const payload = {
        id: currentResumeId,
        title: resumeTitle,
        target_company: targetCompany,
        target_role: targetRole,
        template_name: activeFile.startsWith("template:") ? activeFile.replace("template:", "") : "custom",
        latex_content: latexCode,
      };

      const res = await axios.post(`${API_BASE}/resumes`, payload);
      setCurrentResumeId(res.data.id);
      setActiveFile(`resume:${res.data.id}`);
      setSavedDbSuccess(true);
      fetchSavedResumes();

      setTimeout(() => setSavedDbSuccess(false), 2500);
    } catch (err) {
      alert("Failed to save resume: " + (err.response?.data?.error || err.message));
    } finally {
      setSavingDb(false);
    }
  };

  const handleSaveMasterContextToS3 = async () => {
    setSavingS3(true);
    try {
      await axios.post(`${API_BASE}/storage/master-context`, { content: masterContext });
      alert("✅ master_context.md successfully saved to Neon S3 bucket!");
    } catch (err) {
      alert("Failed to save to S3: " + (err.response?.data?.error || err.message));
    } finally {
      setSavingS3(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    try {
      await axios.delete(`${API_BASE}/resumes/${resumeId}`);
      if (currentResumeId === resumeId) {
        handleNewResume();
      }
      fetchSavedResumes();
    } catch (err) {
      alert("Failed to delete resume: " + err.message);
    }
  };

  const handleNewResume = () => {
    setActiveFile("template:jake-resume");
    setLatexCode(JAKE_RESUME_TEMPLATE);
    setCurrentResumeId(null);
    setResumeTitle("New_Resume.tex");
    setTargetCompany("");
    setTargetRole("");
    compileLatex(JAKE_RESUME_TEMPLATE);
  };

  const handleAiGenerated = (newLatex, meta) => {
    setLatexCode(newLatex);
    if (meta.title) setResumeTitle(meta.title);
    if (meta.targetCompany) setTargetCompany(meta.targetCompany);
    if (meta.targetRole) setTargetRole(meta.targetRole);
    setActiveFile("custom_ai_resume.tex");
    compileLatex(newLatex);
  };

  const handleDownloadPdf = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement("a");
    a.href = pdfBlobUrl;
    a.download = resumeTitle.replace(/\.tex$/i, ".pdf");
    a.click();
  };

  const handleDownloadTex = () => {
    const blob = new Blob([latexCode], { type: "text/x-tex" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resumeTitle.endsWith(".tex") ? resumeTitle : `${resumeTitle}.tex`;
    a.click();
  };

  const isMarkdown = activeFile === "master_context.md";

  return (
    <div style={{
      height: "100%",
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      background: "#0d0617",
      color: "#fff",
      overflow: "hidden",
    }}>
      {/* TOP OVERLEAF-STYLE NAVBAR */}
      <div style={{
        flexShrink: 0,
        padding: "8px 18px",
        background: "rgba(17, 10, 26, 0.95)",
        borderBottom: "1px solid rgba(192, 132, 245, 0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}>
        {/* Left: Back & Title input */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          {onBackToDashboard && (
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={onBackToDashboard}
              style={{ fontSize: "0.8rem", padding: "4px 8px" }}
              title="Return to Projects Management"
            >
              <AiOutlineArrowLeft /> Projects
            </Button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#c084f5", fontWeight: "bold", fontSize: "1.05rem", whiteSpace: "nowrap" }}>
              ⚡ AI Resume Studio
            </span>
            <Form.Control
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              disabled={isMarkdown}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(192,132,245,0.3)",
                color: "#fff",
                fontWeight: "500",
                fontSize: "0.85rem",
                width: "240px",
                padding: "3px 8px",
              }}
            />
          </div>

          {(targetCompany || targetRole) && !isMarkdown && (
            <div style={{ display: "flex", gap: "6px" }}>
              {targetCompany && (
                <Badge bg="info" style={{ fontSize: "0.75rem", background: "rgba(13, 202, 240, 0.2)", border: "1px solid #0dcaf0" }}>
                  {targetCompany}
                </Badge>
              )}
              {targetRole && (
                <Badge bg="secondary" style={{ fontSize: "0.75rem", background: "rgba(108, 117, 125, 0.3)" }}>
                  {targetRole}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!isMarkdown && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowAiModal(true)}
                style={{
                  background: "linear-gradient(135deg, #8a2be2 0%, #4a00e0 100%)",
                  border: "none",
                  fontWeight: "600",
                  fontSize: "0.82rem",
                  padding: "5px 14px",
                  boxShadow: "0 2px 10px rgba(138,43,226,0.35)",
                }}
              >
                <AiOutlineThunderbolt /> AI Resume Studio
              </Button>

              <Button
                size="sm"
                variant={savedDbSuccess ? "success" : "outline-primary"}
                onClick={handleSaveToNeon}
                disabled={savingDb}
                style={{
                  fontSize: "0.82rem",
                  padding: "5px 12px",
                  borderColor: savedDbSuccess ? "#28a745" : "rgba(192,132,245,0.5)",
                  color: savedDbSuccess ? "#fff" : "#c084f5",
                }}
              >
                {savingDb ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" /> Saving...
                  </>
                ) : savedDbSuccess ? (
                  <>
                    <AiOutlineCheck className="me-1" /> Saved to Neon
                  </>
                ) : (
                  <>
                    <AiOutlineSave className="me-1" /> Save to Neon
                  </>
                )}
              </Button>
            </>
          )}

          {isMarkdown && (
            <Button
              size="sm"
              variant="success"
              onClick={handleSaveMasterContextToS3}
              disabled={savingS3}
              style={{ fontSize: "0.82rem", padding: "5px 14px" }}
            >
              {savingS3 ? "Saving to S3..." : "Save master_context.md to Neon S3"}
            </Button>
          )}
        </div>
      </div>

      {/* 3-COLUMN OVERLEAF WORKSPACE */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "220px 1fr 1fr",
        minHeight: 0,
      }}>
        {/* COLUMN 1: FILE TREE */}
        <FileTree
          activeFile={activeFile}
          onSelectFile={handleSelectFile}
          savedResumes={savedResumes}
          loadingResumes={loadingResumes}
          onSelectResume={handleSelectResume}
          onDeleteResume={handleDeleteResume}
          onNewResume={handleNewResume}
          masterContextLoaded={!!masterContext}
        />

        {/* COLUMN 2: MONACO CODE EDITOR */}
        <LatexEditor
          content={isMarkdown ? masterContext : latexCode}
          onChange={(val) => {
            if (isMarkdown) {
              setMasterContext(val);
            } else {
              setLatexCode(val);
            }
          }}
          activeFileName={isMarkdown ? "master_context.md" : resumeTitle}
          isMarkdown={isMarkdown}
          onSaveS3={handleSaveMasterContextToS3}
          savingS3={savingS3}
          onOpenAiStudio={() => setShowAiModal(true)}
        />

        {/* COLUMN 3: LIVE PDF PREVIEW */}
        <PdfPreview
          pdfBlobUrl={pdfBlobUrl}
          compiling={compiling}
          compileError={compileError}
          compileDuration={compileDuration}
          onRecompile={() => compileLatex(latexCode)}
          onDownloadPdf={handleDownloadPdf}
          onDownloadTex={handleDownloadTex}
        />
      </div>

      {/* AI OPTIMIZER MODAL */}
      <AiStudioModal
        show={showAiModal}
        onHide={() => setShowAiModal(false)}
        onGenerated={handleAiGenerated}
        currentLatexTemplate={latexCode}
        templateKey={activeFile.replace("template:", "")}
      />
    </div>
  );
}

export default ResumeStudio;
