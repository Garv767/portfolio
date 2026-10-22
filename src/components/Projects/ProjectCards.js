import React from "react";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { CgWebsite } from "react-icons/cg";
import { BsGithub } from "react-icons/bs";
import { AiOutlineStar } from "react-icons/ai";
import { BiGitRepoForked } from "react-icons/bi";
import { formatImageUrl } from "../../utils/imageUrl";

function ProjectCards(props) {
  const imgSrc = formatImageUrl(props.imgPath?.src || props.imgPath);
  return (
    <Card className="project-card-view">
      <Card.Img variant="top" src={imgSrc} alt="card-img" loading="lazy" />
      <Card.Body>
        <Card.Title>{props.title}</Card.Title>
        <Card.Text style={{ textAlign: "justify" }}>
          {props.description}
        </Card.Text>

        {/* Stats row: language, stars, forks */}
        <div style={{ paddingBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
          {props.language && (
            <span className="purple" style={{ fontSize: "0.9em" }}>
              {props.language}
            </span>
          )}
          <span style={{ fontSize: "0.9em", display: "flex", alignItems: "center", gap: "3px" }}>
            <AiOutlineStar /> {props.stars || 0}
          </span>
          <span style={{ fontSize: "0.9em", display: "flex", alignItems: "center", gap: "3px" }}>
            <BiGitRepoForked /> {props.forks || 0}
          </span>
        </div>

        <Button variant="primary" href={props.ghLink} target="_blank">
          <BsGithub /> &nbsp;
          {props.isBlog ? "Blog" : "GitHub"}
        </Button>

        {/* Demo button — only shown when a link is present */}
        {!props.isBlog && props.demoLink && (
          <Button
            variant="primary"
            href={props.demoLink}
            target="_blank"
            style={{ marginLeft: "10px" }}
          >
            <CgWebsite /> &nbsp;Demo
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}

export default ProjectCards;
