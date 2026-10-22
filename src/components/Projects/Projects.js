import React from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import ProjectCard from "./ProjectCards";
import Particle from "../Particle";
import useProjects from "../../hooks/useProjects";

function Projects() {
  const { projects, loading, error } = useProjects();

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

        {loading ? (
          <div className="text-center" style={{ padding: "80px 0" }}>
            <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem", borderWidth: "3px" }} />
            <p style={{ color: "#c084f5", marginTop: "16px", fontSize: "1.05rem" }}>
              Loading projects...
            </p>
          </div>
        ) : (
          <>
            {error && (
              <p className="text-danger text-center">
                Failed to load projects. Check console for details.
              </p>
            )}
            <Row style={{ justifyContent: "center", paddingBottom: "10px" }}>
              {projects.map((project) => (
                <Col md={4} className="project-card" key={project.id}>
                  <ProjectCard
                    imgPath={project.imgPath}
                    isBlog={false}
                    title={project.title}
                    description={project.description}
                    ghLink={project.ghLink}
                    demoLink={project.demoLink}
                    stars={project.stars}
                    forks={project.forks}
                    language={project.language}
                  />
                </Col>
              ))}
              {projects.length === 0 && !loading && !error && (
                <p className="text-center mt-5" style={{ color: "gray" }}>
                  No projects featured yet. Tag a GitHub repo with the{" "}
                  <strong>'portfolio'</strong> topic or enable one in the Admin Panel!
                </p>
              )}
            </Row>
          </>
        )}
      </Container>
    </Container>
  );
}

export default Projects;
