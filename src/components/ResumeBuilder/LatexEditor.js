import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button, Form, Spinner, Badge } from "react-bootstrap";
import { AiOutlineSend, AiOutlineThunderbolt } from "react-icons/ai";
import axios from "axios";

const API_BASE = "http://localhost:5001/api";

function LatexEditor({
  content,
  onChange,
  activeFileName,
  isMarkdown,
  onSaveS3,
  savingS3,
  onOpenAiStudio,
}) {
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState("");

  const handleRefine = async (e) => {
    e.preventDefault();
    if (!refinePrompt.trim() || refining) return;

    setRefining(true);
    setRefineError("");

    try {
      const apiKey = localStorage.getItem("gemini_api_key") || "";
      const res = await axios.post(`${API_BASE}/ai/refine`, {
        currentLatex: content,
        instruction: refinePrompt,
        modelChoice: "gemini-2.0-flash",
        clientApiKey: apiKey,
      });

      if (res.data.latex) {
        onChange(res.data.latex);
        setRefinePrompt("");
      }
    } catch (err) {
      setRefineError(err.response?.data?.error || err.message || "Refinement failed");
    } finally {
      setRefining(false);
    }
  };

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#1e1e1e",
      borderRight: "1px solid rgba(192, 132, 245, 0.2)",
    }}>
      {/* Editor Subheader */}
      <div style={{
        padding: "8px 14px",
        background: "#161616",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.85rem", color: "#e0d6f5", fontWeight: "600", fontFamily: "monospace" }}>
            {activeFileName}
          </span>
          {isMarkdown ? (
            <Badge bg="warning" text="dark" style={{ fontSize: "0.65rem" }}>Markdown Context</Badge>
          ) : (
            <Badge bg="secondary" style={{ fontSize: "0.65rem", background: "rgba(192,132,245,0.2)" }}>LaTeX</Badge>
          )}
        </div>

        {isMarkdown ? (
          <Button
            size="sm"
            variant="success"
            onClick={onSaveS3}
            disabled={savingS3}
            style={{ fontSize: "0.75rem", padding: "2px 10px" }}
          >
            {savingS3 ? "Saving S3..." : "Save to Neon S3"}
          </Button>
        ) : (
          <div style={{ display: "flex", gap: "6px" }}>
            <Button
              size="sm"
              variant="outline-primary"
              onClick={onOpenAiStudio}
              style={{ fontSize: "0.75rem", padding: "2px 8px", borderColor: "rgba(192,132,245,0.4)", color: "#c084f5" }}
            >
              <AiOutlineThunderbolt /> Optimize for JD
            </Button>
          </div>
        )}
      </div>

      {/* Monaco Code Editor */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language={isMarkdown ? "markdown" : "latex"}
          theme="vs-dark"
          value={content}
          onChange={(val) => onChange(val || "")}
          options={{
            fontFamily: "Fira Code, Cascadia Code, Consolas, monospace",
            fontSize: 13,
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            renderLineHighlight: "all",
            smoothScrolling: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Bottom In-Line AI Refine Bar (Only in LaTeX mode) */}
      {!isMarkdown && (
        <div style={{
          background: "#161616",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "8px 12px",
        }}>
          {refineError && (
            <div style={{ color: "#ff6b6b", fontSize: "0.75rem", marginBottom: "4px" }}>
              ⚠️ {refineError}
            </div>
          )}
          <Form onSubmit={handleRefine} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ color: "#c084f5", fontSize: "0.9rem" }}>
              <AiOutlineThunderbolt />
            </div>
            <Form.Control
              type="text"
              placeholder="Ask AI to refine current LaTeX (e.g. 'Add metrics to project 1', 'Shorten education to 2 lines')..."
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              disabled={refining}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(192,132,245,0.2)",
                color: "#fff",
                fontSize: "0.8rem",
                padding: "5px 10px",
              }}
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={refining || !refinePrompt.trim()}
              style={{
                background: "#623686",
                borderColor: "#623686",
                fontSize: "0.75rem",
                padding: "5px 12px",
                whiteSpace: "nowrap",
              }}
            >
              {refining ? <Spinner animation="border" size="sm" /> : <><AiOutlineSend /> Refine</>}
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
}

export default LatexEditor;
