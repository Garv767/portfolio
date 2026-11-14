import React, { useState, useEffect } from "react";
import { Container, Row, Spinner } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Particle from "../Particle";
import { AiOutlineDownload } from "react-icons/ai";
import { Document, Page, pdfjs } from "react-pdf";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

function ResumeNew({ customPdfUrl, customTitle, downloadName }) {
  const [width, setWidth] = useState(1200);
  const [pdfUrl, setPdfUrl] = useState(customPdfUrl || "/api/resumes/published-pdf");
  const [numPages, setNumPages] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWidth(window.innerWidth);
      if (customPdfUrl) {
        setPdfUrl(customPdfUrl);
      } else {
        setPdfUrl(`/api/resumes/published-pdf?v=${Date.now()}`);
      }
    }
  }, [customPdfUrl]);

  const handleDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoadError(false);
  };

  const handleDocumentLoadError = (err) => {
    console.error("Failed to load dynamic PDF from " + pdfUrl, err);
    setLoadError(true);
  };

  return (
    <div>
      <Container fluid className="resume-section">
        <Particle />
        {customTitle && (
          <Row style={{ justifyContent: "center", position: "relative", marginBottom: "15px" }}>
            <h2 className="project-heading" style={{ textAlign: "center" }}>
              {customTitle}
            </h2>
          </Row>
        )}
        <Row style={{ justifyContent: "center", position: "relative" }}>
          <Button
            variant="primary"
            href={pdfUrl}
            target="_blank"
            download={downloadName || "Garv_Rahut_Resume.pdf"}
            style={{ maxWidth: "250px" }}
          >
            <AiOutlineDownload />
            &nbsp;Download CV
          </Button>
        </Row>

        <Row className="resume">
          {loadError ? (
            <div className="text-center p-5">
              <p style={{ color: "#ff6b6b" }}>Unable to load resume preview. Please use the Download CV button above to view directly.</p>
            </div>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading={
                <div className="text-center p-5">
                  <Spinner animation="border" variant="primary" />
                  <p style={{ color: "#c084f5", marginTop: "12px" }}>Rendering Resume...</p>
                </div>
              }
              className="d-flex justify-content-center"
            >
              <Page pageNumber={1} scale={width > 786 ? 1.7 : 0.6} />
            </Document>
          )}
        </Row>

        <Row style={{ justifyContent: "center", position: "relative" }}>
          <Button
            variant="primary"
            href={pdfUrl}
            target="_blank"
            download={downloadName || "Garv_Rahut_Resume.pdf"}
            style={{ maxWidth: "250px" }}
          >
            <AiOutlineDownload />
            &nbsp;Download CV
          </Button>
        </Row>
      </Container>
    </div>
  );
}

export default ResumeNew;
