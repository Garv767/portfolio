import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Modal } from "react-bootstrap";
import { 
  AiOutlineCheckCircle, 
  AiOutlineEdit, 
  AiOutlineEye, 
  AiOutlineDelete, 
  AiOutlineGlobal, 
  AiOutlineFileText,
  AiOutlineArrowRight
} from "react-icons/ai";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

function ResumeDisplay({ onOpenStudioWithResume, onSwitchToStudio }) {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishingId, setPublishingId] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/resumes`);
      setResumes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching resumes:", err);
      setError(err.response?.data?.error || err.message || "Failed to load saved resumes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPublished = async (resumeId) => {
    try {
      setPublishingId(resumeId);
      await axios.post(`${API_BASE}/resumes/publish`, { resumeId });
      // Optimistically update local state
      setResumes((prev) =>
        prev.map((r) => ({
          ...r,
          is_published: r.id === resumeId,
        }))
      );
    } catch (err) {
      alert("Failed to publish resume: " + (err.response?.data?.error || err.message));
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this saved resume?")) return;
    try {
      await axios.delete(`${API_BASE}/resumes/${resumeId}`);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
    } catch (err) {
      alert("Failed to delete resume: " + (err.response?.data?.error || err.message));
    }
  };

  const handlePreview = (resume) => {
    setPreviewTitle(resume.title || "Resume Preview");
    // If it's the published resume, preview through the compiled endpoint or fetch .tex and compile
    setPreviewPdfUrl(`/api/resumes/published-pdf?t=${Date.now()}`);
    setShowPreviewModal(true);
  };

  return (
    <Container fluid style={{ padding: "20px 24px", color: "#fff" }}>
      {/* Top Banner */}
      <div 
        style={{
          background: "linear-gradient(135deg, rgba(138,43,226,0.15) 0%, rgba(74,0,224,0.15) 100%)",
          border: "1px solid rgba(192, 132, 245, 0.3)",
          borderRadius: "12px",
          padding: "18px 24px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h4 style={{ margin: "0 0 6px 0", color: "#c084f5", fontWeight: "700" }}>
            Public Resume Display Selection
          </h4>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
            Select which saved LaTeX resume is actively compiled and presented to visitors on your public{" "}
            <a href="/resume" target="_blank" rel="noreferrer" style={{ color: "#6ec6ff", textDecoration: "underline" }}>
              /resume
            </a>{" "}
            page.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Button
            variant="outline-info"
            size="sm"
            href="/resume"
            target="_blank"
            style={{ fontWeight: "600", fontSize: "0.85rem", padding: "6px 14px" }}
          >
            <AiOutlineGlobal className="me-1" /> View Live /resume Page
          </Button>

          {onSwitchToStudio && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSwitchToStudio}
              style={{
                background: "linear-gradient(135deg, #8a2be2 0%, #4a00e0 100%)",
                border: "none",
                fontWeight: "600",
                fontSize: "0.85rem",
                padding: "6px 14px",
              }}
            >
              Open AI Resume Studio <AiOutlineArrowRight className="ms-1" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spinner animation="border" variant="primary" />
          <p style={{ color: "#c084f5", marginTop: "14px" }}>Loading saved resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div 
          style={{
            textAlign: "center",
            padding: "50px 20px",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "12px",
            border: "1px dashed rgba(192, 132, 245, 0.3)",
          }}
        >
          <AiOutlineFileText size={48} style={{ color: "#c084f5", marginBottom: "16px", opacity: 0.8 }} />
          <h5>No Saved Resumes Found</h5>
          <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: "500px", margin: "0 auto 20px auto", fontSize: "0.9rem" }}>
            You haven't saved any resumes to Neon database yet. Go to the AI Resume Studio to generate or edit a resume and save it!
          </p>
          {onSwitchToStudio && (
            <Button
              variant="primary"
              onClick={onSwitchToStudio}
              style={{
                background: "linear-gradient(135deg, #8a2be2 0%, #4a00e0 100%)",
                border: "none",
                fontWeight: "600",
              }}
            >
              Go to AI Resume Studio
            </Button>
          )}
        </div>
      ) : (
        <Row className="g-3">
          {resumes.map((resume) => {
            const isPub = !!resume.is_published;
            const isPublishing = publishingId === resume.id;

            return (
              <Col md={6} lg={4} key={resume.id}>
                <Card
                  style={{
                    background: isPub 
                      ? "linear-gradient(180deg, rgba(40, 167, 69, 0.12) 0%, rgba(17, 10, 26, 0.95) 100%)" 
                      : "rgba(255,255,255,0.03)",
                    border: isPub 
                      ? "2px solid #28a745" 
                      : "1px solid rgba(192, 132, 245, 0.25)",
                    borderRadius: "10px",
                    color: "#fff",
                    boxShadow: isPub ? "0 4px 20px rgba(40,167,69,0.25)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Card.Body style={{ padding: "18px" }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 
                        style={{ 
                          fontSize: "1.05rem", 
                          fontWeight: "700", 
                          margin: 0, 
                          color: isPub ? "#6fcf97" : "#fff",
                          wordBreak: "break-all"
                        }}
                      >
                        {resume.title}
                      </h5>
                      {isPub ? (
                        <Badge bg="success" style={{ fontSize: "0.75rem", padding: "4px 8px" }}>
                          <AiOutlineCheckCircle className="me-1" /> ACTIVE PUBLIC
                        </Badge>
                      ) : (
                        <Badge bg="secondary" style={{ fontSize: "0.75rem", padding: "4px 8px", background: "rgba(108,117,125,0.4)" }}>
                          Draft
                        </Badge>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {resume.target_company && (
                        <Badge bg="info" style={{ fontSize: "0.72rem", background: "rgba(13,202,240,0.2)", border: "1px solid #0dcaf0" }}>
                          {resume.target_company}
                        </Badge>
                      )}
                      {resume.target_role && (
                        <Badge bg="secondary" style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.1)" }}>
                          {resume.target_role}
                        </Badge>
                      )}
                      {resume.template_name && (
                        <Badge bg="dark" style={{ fontSize: "0.72rem", border: "1px solid rgba(192,132,245,0.4)", color: "#c084f5" }}>
                          {resume.template_name}
                        </Badge>
                      )}
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginBottom: "16px" }}>
                      Last updated: {resume.updated_at ? new Date(resume.updated_at).toLocaleString() : "Recently"}
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {isPub ? (
                        <Button
                          variant="success"
                          size="sm"
                          disabled
                          style={{ flex: 1, fontWeight: "600", fontSize: "0.8rem", opacity: 0.9 }}
                        >
                          <AiOutlineCheckCircle className="me-1" /> Currently Displayed
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          disabled={isPublishing}
                          onClick={() => handleSetPublished(resume.id)}
                          style={{ flex: 1, fontWeight: "600", fontSize: "0.8rem" }}
                        >
                          {isPublishing ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-1" /> Setting...
                            </>
                          ) : (
                            "Set as Public Resume"
                          )}
                        </Button>
                      )}

                      {onOpenStudioWithResume && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => onOpenStudioWithResume(resume.id)}
                          style={{ fontSize: "0.8rem", borderColor: "rgba(192,132,245,0.5)", color: "#c084f5" }}
                          title="Open in AI Resume Studio to edit"
                        >
                          <AiOutlineEdit /> Edit
                        </Button>
                      )}

                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(resume.id)}
                        style={{ fontSize: "0.8rem" }}
                        title="Delete resume"
                      >
                        <AiOutlineDelete />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* PDF Preview Modal */}
      <Modal 
        show={showPreviewModal} 
        onHide={() => setShowPreviewModal(false)}
        size="lg"
        centered
        contentClassName="bg-dark text-white"
        style={{ border: "1px solid rgba(192,132,245,0.3)" }}
      >
        <Modal.Header closeButton closeVariant="white" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <Modal.Title style={{ fontSize: "1rem", color: "#c084f5" }}>
            {previewTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: "75vh", padding: 0 }}>
          {previewPdfUrl && (
            <iframe
              src={previewPdfUrl}
              title="PDF Preview"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default ResumeDisplay;
