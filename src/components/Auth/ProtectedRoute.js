import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from "react-bootstrap";
import { AiOutlineLock, AiOutlineSafetyCertificate } from "react-icons/ai";
import Particle from "../Particle";

const ProtectedRoute = ({ children, initialAuthenticated, initialUser = null }) => {
  const isServerKnown = typeof initialAuthenticated === "boolean";
  const [authState, setAuthState] = useState({
    loading: isServerKnown ? false : true,
    authenticated: !!initialAuthenticated,
    user: initialUser,
  });

  // Login form state for the auth wall
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const checkSession = async () => {
    // If the server already determined authentication, verify if local token exists or skip
    if (initialAuthenticated) return;

    try {
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("neon_auth_token")
          : null;

      const headers = storedToken
        ? { Authorization: `Bearer ${storedToken}` }
        : {};

      const res = await axios.get("/api/auth/session", {
        headers,
        withCredentials: true,
      });

      if (res.data?.authenticated) {
        setAuthState({
          loading: false,
          authenticated: true,
          user: res.data.user,
        });
      } else {
        setAuthState({
          loading: false,
          authenticated: false,
          user: null,
        });
      }
    } catch (e) {
      setAuthState({
        loading: false,
        authenticated: false,
        user: null,
      });
    }
  };

  useEffect(() => {
    if (!isServerKnown) {
      checkSession();
    }
  }, [isServerKnown]);

  const handleWallLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await axios.post(
        "/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      if (res.data?.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("neon_auth_token", res.data.token);
          localStorage.setItem("neon_auth_user", JSON.stringify(res.data.user));
        }
        setAuthState({
          loading: false,
          authenticated: true,
          user: res.data.user,
        });
      } else {
        setErrorMsg(res.data?.error || "Authentication failed");
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          err.message ||
          "Authentication failed. Verify your Neon Auth credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Initial verification loading state (only for client-side navigation without SSR)
  if (authState.loading) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#c084f5",
          fontFamily: "sans-serif",
        }}
      >
        <Spinner animation="border" style={{ color: "#c084f5", marginBottom: "16px" }} />
        <span style={{ fontSize: "1rem", letterSpacing: "0.5px" }}>
          Verifying Neon Auth Session...
        </span>
      </div>
    );
  }

  // 2. Authenticated: Render Admin Panel
  if (authState.authenticated) {
    return children;
  }

  // 3. Not authenticated: Render the Neon Auth Wall
  return (
    <Container
      fluid
      className="about-section"
      style={{
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Particle />
      <Container style={{ position: "relative", zIndex: 10 }}>
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <Card
              className="project-card-view"
              style={{
                background: "rgba(18, 11, 28, 0.88)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(192, 132, 245, 0.4)",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
                borderRadius: "14px",
                padding: "10px",
              }}
            >
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "rgba(192, 132, 245, 0.12)",
                      border: "1px solid #c084f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      color: "#c084f5",
                      fontSize: "1.8rem",
                    }}
                  >
                    <AiOutlineLock />
                  </div>
                  <Badge
                    bg="dark"
                    style={{
                      border: "1px solid rgba(0, 229, 153, 0.5)",
                      color: "#00e599",
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      marginBottom: "12px",
                    }}
                  >
                    <AiOutlineSafetyCertificate style={{ marginRight: "4px" }} /> Neon Better Auth
                  </Badge>
                  <h2 style={{ color: "white", fontSize: "1.6rem", fontWeight: 700 }}>
                    Admin <strong className="purple">Auth Wall</strong>
                  </h2>
                  <p style={{ color: "#a5a5a5", fontSize: "0.9rem", marginTop: "8px" }}>
                    Access to the Admin Dashboard and AI Resume Studio is restricted to authorized Neon database users.
                  </p>
                </div>

                {errorMsg && (
                  <Alert
                    variant="danger"
                    style={{
                      background: "rgba(220, 53, 69, 0.15)",
                      border: "1px solid rgba(220, 53, 69, 0.4)",
                      color: "#ff858d",
                      fontSize: "0.9rem",
                    }}
                  >
                    {errorMsg}
                  </Alert>
                )}

                <Form onSubmit={handleWallLogin}>
                  <Form.Group className="mb-3" controlId="wallEmail">
                    <Form.Label style={{ color: "#e0e0e0", fontSize: "0.9rem" }}>
                      Neon Auth Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter authorized user email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "white",
                        border: "1px solid rgba(192, 132, 245, 0.3)",
                        padding: "10px 14px",
                      }}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="wallPassword">
                    <Form.Label style={{ color: "#e0e0e0", fontSize: "0.9rem" }}>
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        color: "white",
                        border: "1px solid rgba(192, 132, 245, 0.3)",
                        padding: "10px 14px",
                      }}
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100"
                    disabled={submitting}
                    style={{
                      background: "linear-gradient(135deg, #623686 0%, #9543cd 100%)",
                      border: "none",
                      padding: "12px",
                      fontWeight: 600,
                      fontSize: "1rem",
                      borderRadius: "8px",
                      boxShadow: "0 4px 15px rgba(98, 54, 134, 0.4)",
                    }}
                  >
                    {submitting ? (
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
                      "Unlock Admin Panel"
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
};

export default ProtectedRoute;
