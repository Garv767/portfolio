import React from "react";
import Card from "react-bootstrap/Card";
import { ImPointRight } from "react-icons/im";

function AboutCard() {
  return (
    <Card className="quote-card-view">
      <Card.Body>
        <blockquote className="blockquote mb-0">
          <p style={{ textAlign: "justify" }}>
            Hi everyone! I’m <span className="purple">Garv Rahut</span>{" "}
            from <span className="purple">Indore, India</span>.
            <br />
            I’m currently persuing{" "}
            
            <br />B.Tech in{" "}
            <span className="purple">Computer Science and Engineering</span> from {" "}
            <br />
            <span className="purple">SRM Institute of Science and Technology, KTR</span>.
            <br />
            <br />
            Outside of coding, I love engaging in activities that keep me
            creative and inspired:
          </p>

          <ul>
            <li className="about-activity">
              <ImPointRight /> Playing Games
            </li>
            <li className="about-activity">
              <ImPointRight /> Writing Tech Articles
            </li>
            <li className="about-activity">
              <ImPointRight /> Traveling and Exploring New Places
            </li>
          </ul>

          <p style={{ color: "rgb(155 126 172)" }}>
            "Strive to build things that make a difference!"{" "}
          </p>
          <footer className="blockquote-footer">Garv</footer>
        </blockquote>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
