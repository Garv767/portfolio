import React, { useState } from "react";
import { Button, Spinner, Badge } from "react-bootstrap";
import { 
  AiOutlineDownload, 
  AiOutlineReload, 
  AiOutlineZoomIn, 
  AiOutlineZoomOut, 
  AiOutlineWarning,
  AiOutlineCheck,
  AiOutlineFileText
} from "react-icons/ai";

function PdfPreview({
  pdfBlobUrl,
  compiling,
  compileError,
  compileDuration,
  onRecompile,
  onDownloadPdf,
  onDownloadTex,
}) {
  const [zoom, setZoom] = useState(100);
  const [showErrorLog, setShowErrorLog] = useState(false);

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#2b2b2b",
      userSelect: "none",
    }}>
      {/* Top Toolbar */}
      <div style={{
        padding: "8px 14px",
        background: "#1e1e1e",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
      }}>
        {/* Left Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            size="sm"
            variant="success"
            onClick={onRecompile}
            disabled={compiling}
            style={{
              background: "#27ae60",
              borderColor: "#27ae60",
              fontSize: "0.75rem",
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {compiling ? (
              <>
                <Spinner animation="border" size="sm" /> Compiling...
              </>
            ) : (
              <>
                <AiOutlineReload /> Recompile
              </>
            )}
          </Button>

          {compileDuration && !compiling && !compileError && (
            <span style={{ fontSize: "0.75rem", color: "#2ed573", display: "flex", alignItems: "center", gap: "3px" }}>
              <AiOutlineCheck /> {compileDuration}s
            </span>
          )}

          {compileError && (
            <Badge
              bg="danger"
              style={{ cursor: "pointer", fontSize: "0.7rem" }}
              onClick={() => setShowErrorLog(!showErrorLog)}
            >
              <AiOutlineWarning /> Error Log
            </Badge>
          )}
        </div>

        {/* Center Zoom Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setZoom(Math.max(60, zoom - 15))}
            style={{ padding: "2px 6px", fontSize: "0.75rem", color: "#ccc" }}
          >
            <AiOutlineZoomOut />
          </Button>
          <span style={{ fontSize: "0.75rem", color: "#aaa", minWidth: "40px", textAlign: "center" }}>
            {zoom}%
          </span>
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setZoom(Math.min(180, zoom + 15))}
            style={{ padding: "2px 6px", fontSize: "0.75rem", color: "#ccc" }}
          >
            <AiOutlineZoomIn />
          </Button>
        </div>

        {/* Right Download Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Button
            size="sm"
            variant="outline-info"
            onClick={onDownloadTex}
            style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            title="Download .tex Source"
          >
            <AiOutlineFileText /> .tex
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={onDownloadPdf}
            disabled={!pdfBlobUrl}
            style={{
              background: "#623686",
              borderColor: "#623686",
              fontSize: "0.75rem",
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <AiOutlineDownload /> PDF
          </Button>
        </div>
      </div>

      {/* Error Console Panel (if compilation had errors) */}
      {compileError && (showErrorLog || !pdfBlobUrl) && (
        <div style={{
          background: "#2d0006",
          borderBottom: "1px solid #ff4757",
          padding: "10px 14px",
          color: "#ff6b81",
          fontSize: "0.75rem",
          fontFamily: "monospace",
          maxHeight: "150px",
          overflowY: "auto",
        }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
            <span>⚠️ LaTeX Compilation Error:</span>
            <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowErrorLog(false)}>Hide</span>
          </div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#ffa5b2" }}>
            {compileError}
          </pre>
        </div>
      )}

      {/* PDF Viewport */}
      <div style={{
        flex: 1,
        position: "relative",
        background: "#3e3e3e",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}>
        {compiling && !pdfBlobUrl && (
          <div style={{ textAlign: "center", color: "#fff" }}>
            <Spinner animation="border" variant="primary" />
            <div style={{ marginTop: "10px", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
              Compiling LaTeX with Tectonic engine...
            </div>
          </div>
        )}

        {pdfBlobUrl ? (
          <iframe
            src={`${pdfBlobUrl}#toolbar=0&navpanes=0&zoom=${zoom}`}
            title="PDF Live Preview"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              transformOrigin: "top center",
            }}
          />
        ) : (
          !compiling && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
              Click <strong>Recompile</strong> to render live PDF preview
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default PdfPreview;
