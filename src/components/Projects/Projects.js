import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import ProjectCard from "./ProjectCards";
import Particle from "../Particle";
import useProjects from "../../hooks/useProjects";
import Preloader from "../Pre";

function Projects() {
  const { projects, loading, error } = useProjects();

  if (loading) return <Preloader load={true} />;

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
      </Container>
    </Container>
  );
}

export default Projects;
