import React from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import Particle from "../../src/components/Particle";
import { AiOutlineFilePdf, AiOutlineHome } from "react-icons/ai";
import { neon } from "@neondatabase/serverless";

const ResumeNew = dynamic(() => import("../../src/components/Resume/ResumeNew"), {
  ssr: false,
});

function normalizeSlug(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/\.(pdf|tex)$/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function findResume(resumes, reqName, owner = "garv") {
  const raw = String(reqName || "").replace(/\.(pdf|tex)$/i, "").trim();
  const norm = normalizeSlug(raw);

  const byId = resumes.find(
    (r) => r.id.toLowerCase() === raw.toLowerCase() || normalizeSlug(r.id) === norm
  );
  if (byId) return { match: byId, reason: "id" };

  const byExactTitle = resumes.find(
    (r) => r.title.replace(/\.tex$/i, "").toLowerCase() === raw.toLowerCase()
  );
  if (byExactTitle) return { match: byExactTitle, reason: "exact_title" };

  const bySlugTitle = resumes.find((r) => normalizeSlug(r.title) === norm);
  if (bySlugTitle) return { match: bySlugTitle, reason: "slug_title" };

  const byCompany = resumes.find(
    (r) => r.target_company && normalizeSlug(r.target_company) === norm
  );
  if (byCompany) return { match: byCompany, reason: "target_company" };

  const byRole = resumes.find(
    (r) => r.target_role && normalizeSlug(r.target_role) === norm
  );
  if (byRole) return { match: byRole, reason: "target_role" };

  const publishedAliases = new Set([
    "",
    "resume",
    "cv",
    "default",
    "published",
    "active",
    "current",
    "latest",
    owner.toLowerCase(),
    `${owner.toLowerCase()}_resume`,
    `${owner.toLowerCase()}_cv`,
    `${owner.toLowerCase()}s_resume`,
    `${owner.toLowerCase()}_s_resume`,
    "garv_rahut",
    "garv_rahut_resume",
    "garv_rahut_cv",
  ]);

  const published = resumes.find((r) => r.is_published) || resumes[0];

  if (publishedAliases.has(norm)) {
    return { match: published, reason: "published_alias" };
  }

  const bySubstring = resumes.find((r) => {
    const rNorm = normalizeSlug(r.title);
    return rNorm && norm && (rNorm.includes(norm) || norm.includes(rNorm));
  });
  if (bySubstring) return { match: bySubstring, reason: "substring" };

  return null;
}

export default function DynamicResumePage({ found, resume, requestedName, availableResumes }) {
  if (found && resume) {
    return (
      <>
        <Head>
          <title>{resume.title} | Garv Rahut</title>
          <meta name="description" content={`View and download ${resume.title} by Garv Rahut.`} />
        </Head>
        <ResumeNew
          customPdfUrl={resume.pdfUrl}
          customTitle={resume.title}
          downloadName={`${resume.safeTitle}.pdf`}
        />
      </>
    );
  }

  // 404 Resume Not Found with exact portfolio appearance
  return (
    <>
      <Head>
        <title>Resume Not Found | Garv Rahut</title>
        <meta name="description" content="Requested resume document not found." />
      </Head>
      <Container fluid className="resume-section">
        <Particle />
        <Container>
          <Row className="justify-content-center" style={{ minHeight: "60vh", alignItems: "center" }}>
            <Col md={8} lg={6}>
              <Card
                style={{
                  backgroundColor: "rgba(10, 10, 15, 0.85)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "20px",
                  padding: "30px",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
                  textAlign: "center",
                  color: "#e2e8f0",
                }}
              >
                <div style={{ marginBottom: "15px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: "50px",
                      backgroundColor: "rgba(244, 63, 94, 0.12)",
                      border: "1px solid rgba(244, 63, 94, 0.3)",
                      color: "#fb7185",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      letterSpacing: "1px",
                    }}
                  >
                    404 // RESUME NOT FOUND
                  </span>
                </div>

                <h3 style={{ color: "#fff", fontWeight: 700, marginBottom: "12px" }}>
                  Resume Document Not Found
                </h3>

                <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                  The requested resume{" "}
                  <code
                    style={{
                      color: "#fb7185",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      padding: "2px 6px",
                      borderRadius: "6px",
                    }}
                  >
                    {requestedName}
                  </code>{" "}
                  could not be located in the database.
                </p>

                {availableResumes && availableResumes.length > 0 && (
                  <div style={{ marginBottom: "28px", textAlign: "left" }}>
                    <p
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "#c084f5",
                        marginBottom: "10px",
                      }}
                    >
                      Available Resumes:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {availableResumes.map((item) => (
                        <a
                          key={item.url}
                          href={item.url}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            color: "#fff",
                            textDecoration: "none",
                            fontSize: "13px",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(192, 132, 245, 0.5)";
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.07)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <AiOutlineFilePdf style={{ color: "#c084f5", fontSize: "16px" }} />
                            <span>{item.title}</span>
                          </div>
                          <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                            Open PDF →
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "20px" }}>
                  <Button
                    variant="primary"
                    href="/"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 24px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    <AiOutlineHome />
                    &nbsp;Explore Full Portfolio
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </Container>
    </>
  );
}

export async function getServerSideProps(context) {
  const { slug } = context.params;
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  try {
    const sql = neon(dbUrl);
    const resumes = await sql`
      SELECT id, title, target_company, target_role, template_name, s3_key, is_published, updated_at
      FROM public.resumes
      ORDER BY is_published DESC, updated_at DESC;
    `;

    if (!resumes || resumes.length === 0) {
      if (context.res) context.res.statusCode = 404;
      return {
        props: {
          found: false,
          requestedName: slug || "",
          availableResumes: [],
        },
      };
    }

    const resolution = findResume(resumes, slug, "garv");

    if (!resolution || !resolution.match) {
      if (context.res) context.res.statusCode = 404;
      return {
        props: {
          found: false,
          requestedName: slug || "",
          availableResumes: resumes.map((r) => ({
            title: r.title,
            url: `/resumes/${r.title.replace(/\.tex$/i, "").replace(/\s+/g, "_")}.pdf`,
          })),
        },
      };
    }

    const resume = resolution.match;
    const safeTitle = (resume.title || "Garv_Rahut_Resume")
      .replace(/\.tex$/i, "")
      .replace(/[^a-zA-Z0-9_\-]/g, "_");

    return {
      props: {
        found: true,
        resume: {
          id: resume.id,
          title: resume.title,
          safeTitle,
          pdfUrl: `/api/resumes/render-pdf?filename=${encodeURIComponent(slug)}`,
        },
      },
    };
  } catch (err) {
    console.error("Dynamic resume page error:", err);
    if (context.res) context.res.statusCode = 500;
    return {
      props: {
        found: false,
        requestedName: slug || "",
        availableResumes: [],
      },
    };
  }
}
