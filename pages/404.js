import React from "react";
import Link from "next/link";
import { Container, Button } from "react-bootstrap";
import Particle from "../src/components/Particle";

export default function Custom404() {
  return (
    <Container
      fluid
      className="about-section"
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Particle />
      <div style={{ position: "relative", zIndex: 1 }}>
        <h1 style={{ fontSize: "5rem", color: "#c084f5", fontWeight: 700 }}>
          404
        </h1>
        <h2 style={{ color: "white", marginBottom: "20px" }}>
          Page Not Found
        </h2>
        <p style={{ color: "#dcdcdc", maxWidth: "500px", margin: "0 auto 30px" }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" passHref legacyBehavior>
          <Button
            variant="primary"
            style={{
              background: "#623686",
              border: "none",
              padding: "10px 24px",
              fontSize: "1.1rem",
            }}
          >
            Return to Home
          </Button>
        </Link>
      </div>
    </Container>
  );
}
