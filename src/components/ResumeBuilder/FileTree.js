import React from "react";
import { Button, Spinner } from "react-bootstrap";
import { 
  AiOutlineFile, 
  AiOutlineFolder, 
  AiOutlinePlus, 
  AiOutlineDelete, 
  AiOutlineBook
} from "react-icons/ai";
import { TEMPLATES } from "./templates";

function FileTree({
  activeFile,
  onSelectFile,
  savedResumes,
  loadingResumes,
  onSelectResume,
  onDeleteResume,
  onNewResume,
  masterContextLoaded,
}) {
  return (
    <div style={{
      background: "#120a1f",
      borderRight: "1px solid rgba(192, 132, 245, 0.2)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      userSelect: "none",
    }}>
      {/* Top Header & New Button */}
      <div style={{
        padding: "12px 14px",
        borderBottom: "1px solid rgba(192, 132, 245, 0.2)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span style={{ fontSize: "0.85rem", letterSpacing: "0.5px", color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>
          Files
        </span>
        <Button
          size="sm"
          variant="outline-primary"
          onClick={onNewResume}
          style={{ fontSize: "0.75rem", padding: "2px 8px", borderColor: "rgba(192,132,245,0.4)", color: "#c084f5" }}
        >
          <AiOutlinePlus /> New
        </Button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        
        {/* 1. MASTER CONTEXT */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "0.75rem", color: "#c084f5", fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <AiOutlineBook /> Master context
          </div>
          <div
            onClick={() => onSelectFile("master_context.md")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "7px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              background: activeFile === "master_context.md" ? "rgba(192, 132, 245, 0.25)" : "transparent",
              color: activeFile === "master_context.md" ? "#fff" : "rgba(255,255,255,0.8)",
              border: activeFile === "master_context.md" ? "1px solid rgba(192, 132, 245, 0.4)" : "1px solid transparent",
              fontSize: "0.85rem",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
              <AiOutlineFile style={{ color: "#ffd700" }} />
              <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                master_context.md
              </span>
            </div>
          </div>
        </div>

        {/* 2. PRESET TEMPLATES */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "0.75rem", color: "#c084f5", fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <AiOutlineFolder /> Preset Templates
          </div>
          {TEMPLATES.map((tmpl) => {
            const isSelected = activeFile === `template:${tmpl.key}`;
            return (
              <div
                key={tmpl.key}
                onClick={() => onSelectFile(`template:${tmpl.key}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: isSelected ? "rgba(192, 132, 245, 0.25)" : "transparent",
                  color: isSelected ? "#fff" : "rgba(255,255,255,0.75)",
                  border: isSelected ? "1px solid rgba(192, 132, 245, 0.4)" : "1px solid transparent",
                  fontSize: "0.82rem",
                  marginBottom: "2px",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <AiOutlineFile style={{ color: "#70a1ff" }} />
                  <span>{tmpl.key}.tex</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. SAVED RESUMES */}
        <div>
          <div style={{ fontSize: "0.75rem", color: "#c084f5", fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "space-between", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <span>Saved Resumes ({savedResumes.length})</span>
            {loadingResumes && <Spinner animation="border" size="sm" style={{ width: "12px", height: "12px" }} />}
          </div>

          {savedResumes.length === 0 && !loadingResumes && (
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontStyle: "italic", padding: "6px 8px" }}>
              No saved resumes yet. Click "Save" to persist versions.
            </div>
          )}

          {savedResumes.map((resume) => {
            const isSelected = activeFile === `resume:${resume.id}`;
            return (
              <div
                key={resume.id}
                onClick={() => onSelectResume(resume.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: isSelected ? "rgba(192, 132, 245, 0.25)" : "rgba(255,255,255,0.03)",
                  color: isSelected ? "#fff" : "rgba(255,255,255,0.85)",
                  border: isSelected ? "1px solid rgba(192, 132, 245, 0.4)" : "1px solid rgba(255,255,255,0.05)",
                  fontSize: "0.82rem",
                  marginBottom: "4px",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <AiOutlineFile style={{ color: "#2ed573" }} />
                    <span style={{ fontWeight: "500", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {resume.title}
                    </span>
                  </div>
                  {resume.target_company && (
                    <div style={{ fontSize: "0.7rem", color: "rgba(192, 132, 245, 0.9)", marginLeft: "18px" }}>
                      {resume.target_company} {resume.target_role ? `• ${resume.target_role}` : ""}
                    </div>
                  )}
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete saved resume "${resume.title}"?`)) {
                      onDeleteResume(resume.id);
                    }
                  }}
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    padding: "4px",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                  title="Delete Resume"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ff4757")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                >
                  <AiOutlineDelete />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default FileTree;
