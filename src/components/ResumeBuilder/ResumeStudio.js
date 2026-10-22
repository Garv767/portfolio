import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Badge, Spinner, Dropdown, ButtonGroup } from "react-bootstrap";
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

function ResumeStudio({ onBackToDashboard, initialResumeId }) {
  // Active document state
  const [activeFile, setActiveFile] = useState("template:jake-resume");
  const [latexCode, setLatexCode] = useState(JAKE_RESUME_TEMPLATE);
  const [masterContext, setMasterContext] = useState("");
  const [resumeTitle, setResumeTitle] = useState("Garv_Rahut_Resume.tex");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [currentResumeId, setCurrentResumeId] = useState(null);
  const [saveAsName, setSaveAsName] = useState("");

  // Resizable panel dimensions
  const [filePanelWidth, setFilePanelWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("resume_file_panel_width");
      return saved ? parseInt(saved, 10) : 230;
    }
    return 230;
  });

  const [editorSplitPercent, setEditorSplitPercent] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("resume_editor_split_percent");
      return saved ? parseFloat(saved, 10) : 50;
    }
    return 50;
  });

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingEditor, setIsDraggingEditor] = useState(false);
  const workspaceRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingFile && !isDraggingEditor) return;
      if (!workspaceRef.current) return;

      const rect = workspaceRef.current.getBoundingClientRect();

      if (isDraggingFile) {
        const newWidth = Math.max(160, Math.min(480, e.clientX - rect.left));
        setFilePanelWidth(newWidth);
        localStorage.setItem("resume_file_panel_width", newWidth);
      } else if (isDraggingEditor) {
        const availableWidth = rect.width - filePanelWidth - 10;
        const editorWidthPx = e.clientX - rect.left - filePanelWidth - 5;
        const newPercent = Math.max(20, Math.min(80, (editorWidthPx / availableWidth) * 100));
        setEditorSplitPercent(newPercent);
        localStorage.setItem("resume_editor_split_percent", newPercent);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingFile(false);
      setIsDraggingEditor(false);
    };

    if (isDraggingFile || isDraggingEditor) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDraggingFile, isDraggingEditor, filePanelWidth]);
  // Saved resumes from Neon DB
  const [savedResumes, setSavedResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  // PDF Preview & Compilation state
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState("");
  const [compileDuration, setCompileDuration] = useState("");

  // Saving states
  const [savingAction, setSavingAction] = useState(null); // 'save' | 'save_as' | null
  const [savedSuccess, setSavedSuccess] = useState(null); // 'save' | 'save_as' | null
  const [savingS3, setSavingS3] = useState(false);

  // AI Modal
  const [showAiModal, setShowAiModal] = useState(false);

  // Initial load
  useEffect(() => {
    fetchSavedResumes();
    fetchMasterContext();
    if (initialResumeId) {
      handleSelectResume(initialResumeId);
    } else {
      compileLatex(JAKE_RESUME_TEMPLATE);
    }
  }, [initialResumeId]);

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
        setSaveAsName(resume.title.endsWith(".tex") ? resume.title.replace(/\.tex$/i, "_Copy.tex") : `${resume.title}_Copy.tex`);
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

  /**
   * Save (overwrite current) or Save As (create new record)
   */
  const handleSave = async (isSaveAs = false, customSaveAsTitle = null) => {
    if (!latexCode.trim()) return;

    let targetTitle = resumeTitle;
    let targetId = currentResumeId;

    if (isSaveAs) {
      targetTitle = (customSaveAsTitle && customSaveAsTitle.trim()) 
        ? customSaveAsTitle.trim() 
        : (saveAsName.trim() || `${resumeTitle.replace(/\.tex$/i, "")}_Copy.tex`);
      if (!targetTitle.endsWith(".tex")) targetTitle += ".tex";
      targetId = null; // Forces creation of brand new record in DB + S3
    }

    const actionKey = isSaveAs ? "save_as" : "save";
    setSavingAction(actionKey);
    setSavedSuccess(null);

    try {
      const payload = {
        id: targetId,
        title: targetTitle,
        target_company: targetCompany,
        target_role: targetRole,
        template_name: activeFile.startsWith("template:") ? activeFile.replace("template:", "") : "custom",
        latex_content: latexCode,
      };

      const res = await axios.post(`${API_BASE}/resumes`, payload);
      setCurrentResumeId(res.data.id);
      setResumeTitle(targetTitle);
      setSaveAsName(targetTitle.endsWith(".tex") ? targetTitle.replace(/\.tex$/i, "_Copy.tex") : `${targetTitle}_Copy.tex`);
      setActiveFile(`resume:${res.data.id}`);
      setSavedSuccess(actionKey);
      fetchSavedResumes();

      setTimeout(() => setSavedSuccess(null), 3000);
    } catch (err) {
      alert("Failed to save resume: " + (err.response?.data?.error || err.message));
    } finally {
      setSavingAction(null);
    }
  };

  const handleSaveMasterContextToS3 = async () => {
    setSavingS3(true);
    try {
      await axios.post(`${API_BASE}/storage/master-context`, { content: masterContext });
      alert("master_context.md successfully saved!");
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
        {/* Left: Title input */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#c084f5", fontWeight: "bold", fontSize: "1.05rem", whiteSpace: "nowrap" }}>
              AI Resume Studio
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

              {/* When editing a template or new resume (not yet saved), show ONLY Save button */}
              {!currentResumeId ? (
                <Button
                  size="sm"
                  variant={savedSuccess === "save" ? "success" : "outline-primary"}
                  onClick={() => handleSave(false)}
                  disabled={savingAction !== null}
                  style={{
                    fontSize: "0.82rem",
                    padding: "5px 14px",
                    borderColor: savedSuccess === "save" ? "#28a745" : "rgba(192,132,245,0.5)",
                    color: savedSuccess === "save" ? "#fff" : "#c084f5",
                  }}
                  title="Save resume to database"
                >
                  {savingAction === "save" ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" /> Saving...
                    </>
                  ) : savedSuccess === "save" ? (
                    <>
                      <AiOutlineCheck className="me-1" /> Saved
                    </>
                  ) : (
                    <>
                      <AiOutlineSave className="me-1" /> Save
                    </>
                  )}
                </Button>
              ) : (
                /* When editing an already saved resume, show Save with a dropdown arrow for Save As */
                <Dropdown as={ButtonGroup} size="sm">
                  <Button
                    size="sm"
                    variant={savedSuccess === "save" ? "success" : "outline-primary"}
                    onClick={() => handleSave(false)}
                    disabled={savingAction !== null}
                    style={{
                      fontSize: "0.82rem",
                      padding: "5px 14px",
                      borderColor: savedSuccess === "save" ? "#28a745" : "rgba(192,132,245,0.5)",
                      color: savedSuccess === "save" ? "#fff" : "#c084f5",
                    }}
                    title="Overwrite current saved resume"
                  >
                    {savingAction === "save" ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-1" /> Saving...
                      </>
                    ) : savedSuccess === "save" ? (
                      <>
                        <AiOutlineCheck className="me-1" /> Saved
                      </>
                    ) : (
                      <>
                        <AiOutlineSave className="me-1" /> Save
                      </>
                    )}
                  </Button>

                  <Dropdown.Toggle
                    split
                    variant={savedSuccess === "save_as" ? "success" : "outline-primary"}
                    id="save-as-dropdown-toggle"
                    disabled={savingAction !== null}
                    style={{
                      padding: "5px 8px",
                      borderColor: savedSuccess === "save_as" ? "#28a745" : "rgba(192,132,245,0.5)",
                      color: savedSuccess === "save_as" ? "#fff" : "#c084f5",
                    }}
                    title="Save As Options"
                  />

                  <Dropdown.Menu
                    align="end"
                    style={{
                      background: "#160d29",
                      border: "1px solid rgba(192,132,245,0.35)",
                      borderRadius: "8px",
                      padding: "14px",
                      minWidth: "270px",
                      boxShadow: "0 8px 25px rgba(0,0,0,0.6)",
                      zIndex: 1050,
                    }}
                  >
                    <div style={{ color: "#c084f5", fontSize: "0.8rem", fontWeight: "700", marginBottom: "8px" }}>
                      Save As New Resume
                    </div>
                    <Form.Control
                      size="sm"
                      type="text"
                      value={saveAsName}
                      onChange={(e) => setSaveAsName(e.target.value)}
                      placeholder="e.g. Resume_Copy.tex"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(192,132,245,0.3)",
                        color: "#fff",
                        fontSize: "0.82rem",
                        marginBottom: "10px",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSave(true, saveAsName);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleSave(true, saveAsName)}
                      disabled={savingAction !== null || !saveAsName.trim()}
                      style={{ width: "100%", fontSize: "0.8rem", fontWeight: "600" }}
                    >
                      {savingAction === "save_as" ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-1" /> Saving New...
                        </>
                      ) : savedSuccess === "save_as" ? (
                        <>
                          <AiOutlineCheck className="me-1" /> Saved As New!
                        </>
                      ) : (
                        "Save As New Record"
                      )}
                    </Button>
                  </Dropdown.Menu>
                </Dropdown>
              )}
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
              {savingS3 ? "Saving..." : "Save Master Context"}
            </Button>
          )}
        </div>
      </div>

      {/* 3-COLUMN RESIZABLE WORKSPACE */}
      <div 
        ref={workspaceRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          position: "relative",
          userSelect: isDraggingFile || isDraggingEditor ? "none" : "auto",
        }}
      >
        {/* Transparent drag shield when dragging to prevent iframe from consuming mouse events */}
        {(isDraggingFile || isDraggingEditor) && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            cursor: "col-resize",
          }} />
        )}

        {/* COLUMN 1: FILE TREE */}
        <div style={{
          width: `${filePanelWidth}px`,
          flexShrink: 0,
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
        }}>
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
        </div>

        {/* RESIZER 1: Files <-> Editor */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          style={{
            width: "5px",
            flexShrink: 0,
            cursor: "col-resize",
            background: isDraggingFile ? "#c084f5" : "rgba(192, 132, 245, 0.15)",
            transition: "background 0.15s ease",
            zIndex: 20,
          }}
          title="Drag to resize Files panel"
          onMouseEnter={(e) => {
            if (!isDraggingFile) e.currentTarget.style.background = "#c084f5";
          }}
          onMouseLeave={(e) => {
            if (!isDraggingFile) e.currentTarget.style.background = "rgba(192, 132, 245, 0.15)";
          }}
        />

        {/* COLUMN 2: MONACO CODE EDITOR */}
        <div style={{
          flex: `0 0 calc(${editorSplitPercent}% - 5px)`,
          minWidth: "240px",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
        }}>
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
        </div>

        {/* RESIZER 2: Editor <-> Preview */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDraggingEditor(true);
          }}
          style={{
            width: "5px",
            flexShrink: 0,
            cursor: "col-resize",
            background: isDraggingEditor ? "#c084f5" : "rgba(192, 132, 245, 0.15)",
            transition: "background 0.15s ease",
            zIndex: 20,
          }}
          title="Drag to resize Code / Preview panels"
          onMouseEnter={(e) => {
            if (!isDraggingEditor) e.currentTarget.style.background = "#c084f5";
          }}
          onMouseLeave={(e) => {
            if (!isDraggingEditor) e.currentTarget.style.background = "rgba(192, 132, 245, 0.15)";
          }}
        />

        {/* COLUMN 3: LIVE PDF PREVIEW */}
        <div style={{
          flex: 1,
          minWidth: "260px",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
        }}>
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
