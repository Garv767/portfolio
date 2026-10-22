import React from "react";
import GitHubCalendar from "react-github-calendar";
import { Row } from "react-bootstrap";

function Github() {
  return (
    <Row
      style={{
        justifyContent: "center",
        paddingBottom: "10px",
        color: "white",
      }}
    >
      <h1 className="project-heading pb-4" style={{ paddingBottom: "20px" }}>
        Days I <strong className="purple">Code</strong>
      </h1>
      <div
        style={{
          border: "1px solid rgba(192, 132, 245, 0.35)",
          borderRadius: "14px",
          padding: "24px 20px",
          background: "rgba(17, 10, 26, 0.7)",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.4)",
          maxWidth: "100%",
          display: "inline-flex",
          justifyContent: "center",
          overflowX: "auto",
        }}
      >
        <GitHubCalendar
          username="garv767"
          blockSize={30}
          blockMargin={10}
          fontSize={20}
          theme={{
            level0: "#161b22",
            level1: "#0e4429",
            level2: "#006d32",
            level3: "#26a641",
            level4: "#39d353",
          }}
        />
      </div>
    </Row>
  );
}

export default Github;
