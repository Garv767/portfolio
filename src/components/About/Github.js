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
          dark: ["#161b22", "#7c3aed", "#9333ea", "#a855f7", "#c084f5"],
        }}
        colorScheme="dark"
      />
    </Row>
  );
}

export default Github;
