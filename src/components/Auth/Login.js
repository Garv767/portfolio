import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Alert, Card } from "react-bootstrap";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import Particle from "../Particle";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/admin");
    } catch (err) {
      setError(err.message);
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
                background: "rgba(17, 10, 26, 0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid #c084f5",
              }}
            >
              <Card.Body>
                <h1 className="project-heading text-center mb-4">
                  Admin <strong className="purple">Login</strong>
                </h1>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3" controlId="formEmail">
                    <Form.Label style={{ color: "white" }}>Email address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
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
                        background: "rgba(255, 255, 255, 0.1)",
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
                    style={{ background: "#623686", border: "none" }}
                  >
                    {loading ? "Authenticating..." : "Login"}
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
