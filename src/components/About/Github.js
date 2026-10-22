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
      <GitHubCalendar
        username="garv767"
        blockSize={30}
        blockMargin={10}
        fontSize={20}
        theme={{
          level0: "hsla(191, 85%, 11%, 0.92)",
          level1: "hsla(191, 85%, 11%, 0.76)",
          level2: "hsla(191, 85%, 11%, 0.6)",
          level3: "hsla(191, 85%, 11%, 0.44)",
          level4: "hsl(0, 0%, 92%)",
        }}
      />
    </Row>
  );
}

export default Github;
