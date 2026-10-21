import React, { useState } from "react";
import { Button, Spinner, Badge } from "react-bootstrap";
import { 
  AiOutlineDownload, 
  AiOutlineReload, 
  AiOutlineZoomIn, 
  AiOutlineZoomOut, 
  AiOutlineWarning,
  AiOutlineCheck,
  AiOutlineFileText,
  AiOutlineUndo
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

  const handleZoomIn = () => setZoom((prev) => Math.min(220, prev + 15));
  const handleZoomOut = () => setZoom((prev) => Math.max(50, prev - 15));
  const handleZoomReset = () => setZoom(100);

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#222",
      userSelect: "none",
    }}>
      {/* Top Toolbar */}
      <div style={{
        padding: "8px 14px",
        background: "#181818",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        flexWrap: "wrap",
      }}>
        {/* Left Status & Recompile */}
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
              fontWeight: 600,
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
              style={{ cursor: "pointer", fontSize: "0.7rem", padding: "5px 8px" }}
              onClick={() => setShowErrorLog(!showErrorLog)}
            >
              <AiOutlineWarning /> View Error Log
            </Badge>
          )}
        </div>

        {/* Center Functional Zoom Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "6px" }}>
          <Button
            size="sm"
            variant="dark"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            style={{ padding: "2px 7px", fontSize: "0.8rem", color: "#eee", background: "transparent", border: "none" }}
            title="Zoom Out"
          >
            <AiOutlineZoomOut />
          </Button>
          <span
            onClick={handleZoomReset}
            style={{
              fontSize: "0.78rem",
              color: "#c084f5",
              minWidth: "48px",
              textAlign: "center",
              cursor: "pointer",
              fontWeight: 600,
            }}
            title="Click to reset to 100%"
          >
            {zoom}%
          </span>
          <Button
            size="sm"
            variant="dark"
            onClick={handleZoomIn}
            disabled={zoom >= 220}
            style={{ padding: "2px 7px", fontSize: "0.8rem", color: "#eee", background: "transparent", border: "none" }}
            title="Zoom In"
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
              fontWeight: 600,
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

      {/* PDF Viewport with Dynamic Zoom Scale & Scroll */}
      <div style={{
        flex: 1,
        position: "relative",
        background: "#2f2f2f",
        overflow: "auto",
        display: "flex",
        padding: "24px 16px",
      }}>
        {compiling && !pdfBlobUrl && (
          <div style={{ textAlign: "center", color: "#fff", margin: "auto" }}>
            <Spinner animation="border" style={{ color: "#c084f5" }} />
            <div style={{ marginTop: "10px", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
              Compiling LaTeX document...
            </div>
          </div>
        )}

        {pdfBlobUrl ? (
          <div
            style={{
              width: `${(850 * zoom) / 100}px`,
              height: `${(1100 * zoom) / 100}px`,
              flexShrink: 0,
              position: "relative",
              margin: "auto",
              transition: "width 0.15s ease-out, height 0.15s ease-out",
            }}
          >
            <div
              style={{
                width: "850px",
                height: "1100px",
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
                boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                borderRadius: "4px",
                background: "#fff",
                overflow: "hidden",
                transition: "transform 0.15s ease-out",
              }}
            >
              <iframe
                key={pdfBlobUrl}
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                title="PDF Live Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                }}
              />
            </div>
          </div>
        ) : (
          !compiling && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginTop: "20%" }}>
              Click <strong>Recompile</strong> to render live PDF preview
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default PdfPreview;
