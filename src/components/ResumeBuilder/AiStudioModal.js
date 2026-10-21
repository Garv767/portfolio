import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Alert, Badge } from "react-bootstrap";
import { AiOutlineCloudUpload, AiOutlineThunderbolt, AiOutlineKey } from "react-icons/ai";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

function AiStudioModal({ show, onHide, onGenerated, currentLatexTemplate, templateKey }) {
  const [jdText, setJdText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [modelChoice, setModelChoice] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gemini_selected_model");
      if (stored && !stored.includes("2.0") && !stored.includes("2.5-flash")) {
        return stored;
      }
      return "gemini-3.8-flash";
    }
    return "gemini-3.8-flash";
  });
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gemini_api_key") || "";
    }
    return "";
  });
  const [rememberKey] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState("");
  const [error, setError] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setUploadSuccess("");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result.split(",")[1];
        try {
          const res = await axios.post(`${API_BASE}/parse-doc`, {
            fileData: base64Data,
            fileName: file.name,
          });
          setJdText(res.data.text);
          setUploadSuccess(`Extracted text from "${file.name}" (${res.data.text.length} characters)`);
        } catch (err) {
          setError("Failed to parse document: " + (err.response?.data?.error || err.message));
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("File read error: " + err.message);
      setUploading(false);
    }
  };

  const handleApiKeyChange = (val) => {
    setApiKey(val);
    if (rememberKey) {
      localStorage.setItem("gemini_api_key", val);
    }
  };

  const handleGenerate = async () => {
    if (!jdText.trim()) {
      setError("Please paste or upload a Job Description.");
      return;
    }

    setGenerating(true);
    setError("");
    setGenStep("Connecting to Neon S3 (master_context.md) & DB (33 projects)...");

    try {
      setTimeout(() => setGenStep("Synthesizing context with Gemini AI..."), 800);

      const res = await axios.post(`${API_BASE}/ai/generate`, {
        jdText,
        targetRole,
        targetCompany,
        customPrompt,
        templateSkeleton: currentLatexTemplate,
        modelChoice,
        clientApiKey: apiKey.trim(),
      });

      if (res.data.latex) {
        setGenStep("Compiling generated LaTeX...");
        onGenerated(res.data.latex, {
          title: `${targetCompany || "Custom"}_${targetRole || "SWE"}_Resume.tex`,
          targetRole,
          targetCompany,
          jdText,
        });
        onHide();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to generate resume.");
    } finally {
      setGenerating(false);
      setGenStep("");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" className="ai-studio-modal">
      <Modal.Header closeButton style={{ background: "#180d2b", borderBottom: "1px solid rgba(192, 132, 245, 0.3)", color: "#fff" }}>
        <Modal.Title className="d-flex align-items-center gap-2">
          <AiOutlineThunderbolt style={{ color: "#c084f5", fontSize: "1.4rem" }} />
          <span>AI Resume Studio <Badge bg="primary" style={{ fontSize: "0.7rem", verticalAlign: "middle" }}>JD Optimizer</Badge></span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: "#0e071a", color: "#e0d6f5", maxHeight: "75vh", overflowY: "auto" }}>
        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible style={{ background: "rgba(220,53,69,0.2)", border: "1px solid #dc3545", color: "#ff8b94" }}>
            {error}
          </Alert>
        )}

        {/* 1. Target Role & Company */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label style={{ fontSize: "0.85rem", color: "#c084f5", fontWeight: "600" }}>Target Company</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Stripe, Google, Datadog"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(192,132,245,0.2)", color: "#fff" }}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label style={{ fontSize: "0.85rem", color: "#c084f5", fontWeight: "600" }}>Target Role / Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Software Engineer, Backend / Systems"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(192,132,245,0.2)", color: "#fff" }}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* 2. Upload JD / File Dropzone */}
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: "0.85rem", color: "#c084f5", fontWeight: "600" }}>
            Job Description (Upload PDF, DOCX, or Paste Text)
          </Form.Label>
          <div
            style={{
              border: "2px dashed rgba(192, 132, 245, 0.4)",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
              background: "rgba(255,255,255,0.02)",
              marginBottom: "10px",
              cursor: "pointer",
            }}
            onClick={() => document.getElementById("jd-file-input").click()}
          >
            <input
              id="jd-file-input"
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            {uploading ? (
              <div className="d-flex justify-content-center align-items-center gap-2">
                <Spinner animation="border" size="sm" variant="info" />
                <span>Extracting document text...</span>
              </div>
            ) : (
              <div>
                <AiOutlineCloudUpload style={{ fontSize: "2rem", color: "#c084f5", marginBottom: "4px" }} />
                <div style={{ fontSize: "0.85rem", color: "#ccc" }}>
                  Click to upload <strong>PDF</strong>, <strong>Word (.docx)</strong>, or text file
                </div>
              </div>
            )}
          </div>

          {uploadSuccess && (
            <div style={{ color: "#28a745", fontSize: "0.8rem", marginBottom: "6px" }}>
              ✓ {uploadSuccess}
            </div>
          )}

          <Form.Control
            as="textarea"
            rows={5}
            placeholder="Or paste the job description text here directly..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(192,132,245,0.2)",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: "0.85rem",
            }}
          />
        </Form.Group>

        {/* 3. Additional Instructions */}
        <Form.Group className="mb-3">
          <Form.Label style={{ fontSize: "0.85rem", color: "#c084f5", fontWeight: "600" }}>
            Special Focus / Tailoring Directives (Optional)
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g. 'Emphasize Python, distributed systems & ML; de-emphasize frontend'"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(192,132,245,0.2)", color: "#fff" }}
          />
        </Form.Group>

        {/* 4. Model Selection & API Key */}
        <Row className="mb-2 align-items-end">
          <Col md={6}>
            <Form.Group>
              <Form.Label style={{ fontSize: "0.85rem", color: "#c084f5", fontWeight: "600" }}>AI Model</Form.Label>
              <Form.Select
                value={modelChoice}
                onChange={(e) => {
                  setModelChoice(e.target.value);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("gemini_selected_model", e.target.value);
                  }
                }}
                style={{ background: "#21123a", border: "1px solid rgba(192,132,245,0.3)", color: "#fff" }}
              >
                <optgroup label="⚡ Recommended Active Models (Google AI Studio)">
                  <option value="gemini-3.8-flash">⚡ Gemini 3.8 Flash (High-Efficiency Workhorse)</option>
                  <option value="gemini-3.5-flash-lite">🏎️ Gemini 3.5 Flash-Lite (Low Latency, High Availability)</option>
                  <option value="gemini-4-argon">🔥 Gemini 4 Argon (Flagship Reasoning & Code)</option>
                  <option value="gemini-3.6-flash">🚀 Gemini 3.6 Flash (Fast Text & Code)</option>
                  <option value="gemini-3.8-live-extended-thinking">🧠 Gemini 3.8 Live Extended Thinking</option>
                  <option value="gemini-3.1-pro-preview">💎 Gemini 3.1 Pro Preview (Deep Context)</option>
                  <option value="gemini-3.1-flash-lite">💡 Gemini 3.1 Flash-Lite</option>
                  <option value="gemini-3-flash-preview">🌟 Gemini 3 Flash Preview</option>
                  <option value="gemini-omni-1.1-flash">🔮 Gemini Omni Flash (1.1 Flash)</option>
                  <option value="gemini-2.5-pro">🏆 Gemini 2.5 Pro (Deep Reasoning)</option>
                </optgroup>
                <optgroup label="⚠️ Legacy (May 404 for new users)">
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                </optgroup>
              </Form.Select>
              <div style={{ fontSize: "0.72rem", color: "#a5b1c2", marginTop: "4px" }}>
                🛡️ Includes automatic 503 high-demand fallback across 3.8/3.5/3.6/4 endpoints.
              </div>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label style={{ fontSize: "0.85rem", color: "#c084f5", fontWeight: "600" }}>
                <AiOutlineKey /> Gemini API Key
              </Form.Label>
              <Form.Control
                type="password"
                placeholder="Google AI Studio key (or from .env)"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(192,132,245,0.2)", color: "#fff" }}
              />
            </Form.Group>
          </Col>
        </Row>

        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "6px" }}>
          ℹ️ The AI automatically loads <strong>master_context.md</strong> from your Neon S3 bucket and <strong>33 synced projects</strong> from Neon PostgreSQL.
        </div>
      </Modal.Body>

      <Modal.Footer style={{ background: "#180d2b", borderTop: "1px solid rgba(192, 132, 245, 0.3)" }}>
        <Button variant="outline-secondary" onClick={onHide} disabled={generating}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={generating}
          style={{ background: "#623686", borderColor: "#623686", minWidth: "160px" }}
        >
          {generating ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              {genStep || "Optimizing..."}
            </>
          ) : (
            <>
              <AiOutlineThunderbolt className="me-1" /> Generate Custom Resume
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AiStudioModal;
