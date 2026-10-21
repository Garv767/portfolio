import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Alert, Card, Badge, Spinner } from "react-bootstrap";
import axios from "axios";
import { useRouter } from "next/router";
import { AiOutlineSafetyCertificate, AiOutlineLock } from "react-icons/ai";
import Particle from "../Particle";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(
        "/api/auth/login",
        { email, password },
        { withCredentials: true }
      );
      if (res.data?.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("neon_auth_token", res.data.token);
          localStorage.setItem("neon_auth_user", JSON.stringify(res.data.user || { email }));
        }
        router.push("/admin");
      } else {
        setError(res.data?.error || "Login failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Authentication failed. Verify your Neon Auth credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="about-section" style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Particle />
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card
              className="project-card-view"
              style={{
                background: "rgba(18, 11, 28, 0.85)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(192, 132, 245, 0.4)",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
                borderRadius: "14px",
              }}
            >
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <div
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "50%",
                      background: "rgba(192, 132, 245, 0.12)",
                      border: "1px solid #c084f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                      color: "#c084f5",
                      fontSize: "1.6rem",
                    }}
                  >
                    <AiOutlineLock />
                  </div>
                  <Badge
                    bg="dark"
                    style={{
                      border: "1px solid rgba(0, 229, 153, 0.5)",
                      color: "#00e599",
                      padding: "5px 10px",
                      fontSize: "0.78rem",
                      marginBottom: "10px",
                    }}
                  >
                    <AiOutlineSafetyCertificate style={{ marginRight: "4px" }} /> Neon Better Auth
                  </Badge>
                  <h1 className="project-heading text-center" style={{ fontSize: "1.8rem" }}>
                    Admin <strong className="purple">Login</strong>
                  </h1>
                </div>

                {error && (
                  <Alert
                    variant="danger"
                    style={{
                      background: "rgba(220, 53, 69, 0.15)",
                      border: "1px solid rgba(220, 53, 69, 0.4)",
                      color: "#ff858d",
                      fontSize: "0.9rem",
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3" controlId="formEmail">
                    <Form.Label style={{ color: "white" }}>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "white",
                        border: "1px solid rgba(192, 132, 245, 0.3)",
                      }}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-4" controlId="formPassword">
                    <Form.Label style={{ color: "white" }}>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "white",
                        border: "1px solid rgba(192, 132, 245, 0.3)",
                      }}
                      required
                    />
                  </Form.Group>
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={loading}
                    style={{
                      background: "linear-gradient(135deg, #623686 0%, #9543cd 100%)",
                      border: "none",
                      padding: "12px",
                      fontWeight: 600,
                      borderRadius: "8px",
                    }}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Authenticating with Neon...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default Login;
