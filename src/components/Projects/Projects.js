import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import ProjectCard from "./ProjectCards";
import Particle from "../Particle";
import unfugly from "../../Assets/Projects/Unfugly.png";
import isSpam from "../../Assets/Projects/isSpam.png";
import phishingSentinel from "../../Assets/Projects/PhishingSentinel.png"; 
import bitsOfCode from "../../Assets/Projects/blog.png";

function Projects() {
  return (
    <Container fluid className="project-section">
      <Particle />
      <Container>
        <h1 className="project-heading">
          My Recent <strong className="purple">Works </strong>
        </h1>
        <p style={{ color: "white" }}>
          Here are a few projects I've worked on recently.
        </p>
        <Row style={{ justifyContent: "center", paddingBottom: "10px" }}>
          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={unfugly}
              isBlog={false}
              title="Unfugly"
              description="Your academics displayed in a much more visually appealing way."
              ghLink="https://github.com/garv767/Unfugly"
              demoLink="https://chromewebstore.google.com/detail/lfjlfkbcnoioefacgcjanjdiodphnoce?utm_source=item-share-cb"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={isSpam}
              isBlog={false}
              title="!isSpam"
              description="An zero friction extension to classify mails as spam or ham using a custom ml model."
              ghLink="https://github.com/garv767/-isSpam"
              demoLink="https://chromewebstore.google.com/detail/giioaghhfkefecelfjjfldaagofjmfgg?utm_source=item-share-cb"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={phishingSentinel}
              isBlog={false}
              title="Phishing Sentinel"
              description="An zero friction extension to classify mails as spam or ham using a custom ml model."
              ghLink="https://github.com/Garv767/Phishing-Sentinel"
              demoLink=""
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={bitsOfCode}
              isBlog={false}
              title="Crime Record Analysis"
              description="The Crime Record & Pattern Analysis Database System provides a centralized relational database that enables efficient record management and advanced analytical querying."
              ghLink="https://github.com/Garv767/Crime-Record-Analysis"
              demoLink=""
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={bitsOfCode}
              isBlog={false}
              title="Health Tracker"
              description="A modern full‑stack health tracking application."
              ghLink="https://github.com/Garv767/health-tracker"
              demoLink=""
            />
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default Projects;
