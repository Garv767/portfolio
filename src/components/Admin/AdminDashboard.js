import React, { useState, useEffect } from "react";
import { Container, Button, Form, Collapse, Badge } from "react-bootstrap";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { supabase } from "../../utils/supabaseClient";
import axios from "axios";
import Particle from "../Particle";
import { CgWebsite } from "react-icons/cg";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineSave, AiOutlineLogout, AiOutlineCheck, AiOutlineDown, AiOutlineRight } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

const GITHUB_USERNAME = "garv767";

// Conventional 3x2 dot grid drag handle
const DragHandleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.6 }}>
    <circle cx="5" cy="4" r="1.5" />
    <circle cx="11" cy="4" r="1.5" />
    <circle cx="5" cy="8" r="1.5" />
    <circle cx="11" cy="8" r="1.5" />
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="11" cy="12" r="1.5" />
  </svg>
);

function AdminDashboard() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRepos, setExpandedRepos] = useState({});
  // Per-repo dirty tracking: { repoName: { field: newValue } }
  const [dirtyState, setDirtyState] = useState({});
  // Per-repo save status: 'idle' | 'saving' | 'saved'
  const [saveStatus, setSaveStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const ghRes = await axios.get(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`
      );
      const ghRepos = ghRes.data;

      const { data: dbData, error } = await supabase
        .from("portfolio_projects")
        .select("*")
        .order("priority", { ascending: true });

      if (error) throw error;

      const configMap = new Map();
      dbData.forEach((d) => configMap.set(d.repo_name, d));

      const merged = ghRepos.map((repo) => {
        const config = configMap.get(repo.name);
        // Store GitHub's homepage separately so we can always fall back to it
        const gh_homepage = repo.homepage || "";
        const demo_url = config?.demo_url || gh_homepage;
        return {
          repo_name: repo.name,
          display_title: config?.display_title || repo.name,
          custom_description: config?.custom_description || repo.description || "",
          custom_image_url: config?.custom_image_url || "",
          demo_url,
          demo_url_override: config?.demo_url || "", // tracks explicit admin override
          gh_homepage,
          is_visible: config?.is_visible ?? false,
          priority: config?.priority ?? 999,
          is_fork: repo.fork,
          language: repo.language,
        };
      });

      // Visible items first (by priority), then hidden ones
      const sorted = merged.sort((a, b) => {
        if (a.is_visible !== b.is_visible) return a.is_visible ? -1 : 1;
        return a.priority - b.priority;
      });

      setRepos(sorted);
      setDirtyState({});
      setSaveStatus({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (repoName) => {
    setExpandedRepos((prev) => ({ ...prev, [repoName]: !prev[repoName] }));
  };

  const handleFieldChange = (repoName, field, value) => {
    setRepos((prev) =>
      prev.map((r) => (r.repo_name === repoName ? { ...r, [field]: value } : r))
    );
    setDirtyState((prev) => ({
      ...prev,
      [repoName]: { ...(prev[repoName] || {}), [field]: value },
    }));
    setSaveStatus((prev) => ({ ...prev, [repoName]: "idle" }));
  };

  const handleResetDemoUrl = (repoName) => {
    // Clear the admin override — public site will fall back to gh_homepage
    setRepos((prev) =>
      prev.map((r) =>
        r.repo_name === repoName
          ? { ...r, demo_url: r.gh_homepage, demo_url_override: "" }
          : r
      )
    );
    setDirtyState((prev) => ({
      ...prev,
      [repoName]: { ...(prev[repoName] || {}), demo_url_override: "__cleared__" },
    }));
    setSaveStatus((prev) => ({ ...prev, [repoName]: "idle" }));
  };

  const handleSave = async (repoName) => {
    setSaveStatus((prev) => ({ ...prev, [repoName]: "saving" }));
    const repo = repos.find((r) => r.repo_name === repoName);
    // Save null for demo_url when the admin cleared their override, so the
    // public site falls back to the GitHub homepage field.
    const demoToSave =
      repo.demo_url_override === "" || repo.demo_url === repo.gh_homepage
        ? null
        : repo.demo_url_override || repo.demo_url;

    const { error } = await supabase.from("portfolio_projects").upsert(
      {
        repo_name: repoName,
        display_title: repo.display_title,
        custom_description: repo.custom_description,
        custom_image_url: repo.custom_image_url,
        demo_url: demoToSave,
        is_visible: repo.is_visible,
        priority: repo.priority,
      },
      { onConflict: "repo_name" }
    );

    if (error) {
      console.error("Error saving:", error);
      setSaveStatus((prev) => ({ ...prev, [repoName]: "idle" }));
    } else {
      setSaveStatus((prev) => ({ ...prev, [repoName]: "saved" }));
      setDirtyState((prev) => {
        const next = { ...prev };
        delete next[repoName];
        return next;
      });
      setTimeout(
        () => setSaveStatus((prev) => ({ ...prev, [repoName]: "idle" })),
        2000
      );
    }
  };

  const handleToggleVisibility = (repoName, currentVisibility) => {
    const newVal = !currentVisibility;
    setRepos((prev) =>
      prev.map((r) => (r.repo_name === repoName ? { ...r, is_visible: newVal } : r))
    );
    setDirtyState((prev) => ({
      ...prev,
      [repoName]: { ...(prev[repoName] || {}), is_visible: newVal },
    }));
    setSaveStatus((prev) => ({ ...prev, [repoName]: "idle" }));
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(repos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const updatedItems = items.map((item, index) => ({ ...item, priority: index }));
    setRepos(updatedItems);

    const updates = updatedItems.map((item) => ({
      repo_name: item.repo_name,
      priority: item.priority,
    }));
    const { error } = await supabase
      .from("portfolio_projects")
      .upsert(updates, { onConflict: "repo_name" });
    if (error) console.error("Error updating priorities:", error);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getSaveButton = (repoName) => {
    const status = saveStatus[repoName] || "idle";
    const isDirty = !!dirtyState[repoName];

    if (status === "saving") {
      return (
        <Button variant="secondary" size="sm" disabled style={{ minWidth: "90px" }}>
          Saving...
        </Button>
      );
    }
    if (status === "saved") {
      return (
        <Button
          variant="success"
          size="sm"
          style={{ minWidth: "90px", background: "#198754", borderColor: "#198754" }}
        >
          <AiOutlineCheck /> Saved
        </Button>
      );
    }
    if (isDirty) {
      return (
        <Button
          variant="warning"
          size="sm"
          style={{ minWidth: "90px", color: "#000" }}
          onClick={() => handleSave(repoName)}
        >
          <AiOutlineSave /> Save
        </Button>
      );
    }
    return (
      <Button variant="outline-secondary" size="sm" style={{ minWidth: "90px" }} disabled>
        <AiOutlineSave /> Save
      </Button>
    );
  };

  const cardStyle = {
    background: "rgba(17, 10, 26, 0.85)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(192, 132, 245, 0.2)",
    borderRadius: "12px",
    marginBottom: "10px",
    transition: "border-color 0.2s",
  };

  const headerStyle = (isExpanded, isDirty) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    cursor: "pointer",
    borderRadius: isExpanded ? "12px 12px 0 0" : "12px",
    borderBottom: isExpanded ? "1px solid rgba(192, 132, 245, 0.15)" : "none",
    background: isDirty ? "rgba(255, 193, 7, 0.05)" : "transparent",
  });

  const inputStyle = (hasOverride) => ({
    background: "rgba(255,255,255,0.06)",
    color: "white",
    border: `1px solid ${hasOverride ? "rgba(192,132,245,0.4)" : "rgba(255,255,255,0.15)"}`,
  });

  return (
    <Container fluid className="about-section" style={{ paddingTop: "100px", paddingBottom: "60px" }}>
      <Particle />
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="project-heading">
            Project <strong className="purple">Management </strong>
          </h1>
          <Button variant="outline-danger" onClick={handleLogout}>
            <AiOutlineLogout /> Logout
          </Button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "20px" }}>
          {repos.length} repositories found. Drag to reorder. Yellow border = unsaved changes.
        </p>

        {loading ? (
          <p style={{ color: "gray", textAlign: "center" }}>Loading repositories...</p>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="repos">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {repos.map((repo, index) => {
                    const isExpanded = !!expandedRepos[repo.repo_name];
                    const isDirty = !!dirtyState[repo.repo_name];
                    return (
                      <Draggable
                        key={repo.repo_name}
                        draggableId={repo.repo_name}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              ...cardStyle,
                              borderColor: snapshot.isDragging
                                ? "#c084f5"
                                : isDirty
                                ? "rgba(255, 193, 7, 0.4)"
                                : "rgba(192, 132, 245, 0.2)",
                              opacity: repo.is_visible ? 1 : 0.55,
                            }}
                          >
                            {/* ── Accordion Header ── */}
                            <div style={headerStyle(isExpanded, isDirty)}>
                              {/* 3x2 dot drag handle */}
                              <span
                                {...provided.dragHandleProps}
                                style={{ cursor: "grab", color: "white", flexShrink: 0 }}
                                title="Drag to reorder"
                              >
                                <DragHandleIcon />
                              </span>

                              {/* Expand caret */}
                              <span
                                onClick={() => toggleExpand(repo.repo_name)}
                                style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }}
                              >
                                {isExpanded ? (
                                  <AiOutlineDown size={14} />
                                ) : (
                                  <AiOutlineRight size={14} />
                                )}
                              </span>

                              {/* Clickable title area */}
                              <div
                                onClick={() => toggleExpand(repo.repo_name)}
                                style={{ flex: 1, minWidth: 0 }}
                              >
                                <span style={{ color: "white", fontWeight: 600, fontSize: "0.95rem" }}>
                                  {repo.display_title}
                                </span>
                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginLeft: "8px" }}>
                                  {repo.repo_name}
                                </span>
                                {repo.is_fork && (
                                  <Badge bg="secondary" className="ms-2" style={{ fontSize: "0.7rem" }}>
                                    Fork
                                  </Badge>
                                )}
                                {repo.language && (
                                  <Badge
                                    bg="dark"
                                    className="ms-2"
                                    style={{ fontSize: "0.7rem", color: "#c084f5", border: "1px solid #c084f5" }}
                                  >
                                    {repo.language}
                                  </Badge>
                                )}
                                {repo.demo_url && (
                                  <Badge bg="info" className="ms-2" style={{ fontSize: "0.7rem" }}>
                                    Demo
                                  </Badge>
                                )}
                                {isDirty && (
                                  <Badge bg="warning" text="dark" className="ms-2" style={{ fontSize: "0.7rem" }}>
                                    Unsaved
                                  </Badge>
                                )}
                              </div>

                              {/* Quick demo link — only when a URL exists */}
                              {repo.demo_url && (
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  href={repo.demo_url}
                                  target="_blank"
                                  style={{ flexShrink: 0, padding: "2px 6px" }}
                                  title="View Live Demo"
                                >
                                  <CgWebsite />
                                </Button>
                              )}

                              {/* Visibility toggle */}
                              <Button
                                variant={repo.is_visible ? "success" : "outline-secondary"}
                                size="sm"
                                onClick={() => handleToggleVisibility(repo.repo_name, repo.is_visible)}
                                title={repo.is_visible ? "Visible on site" : "Hidden from site"}
                                style={{ flexShrink: 0 }}
                              >
                                {repo.is_visible ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
                              </Button>

                              {/* Smart save button */}
                              <div style={{ flexShrink: 0 }}>{getSaveButton(repo.repo_name)}</div>
                            </div>

                            {/* ── Accordion Body ── */}
                            <Collapse in={isExpanded}>
                              <div>
                                <div style={{ padding: "16px 20px", display: "grid", gap: "14px" }}>
                                  {/* Row 1: Title + Demo URL */}
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                    <Form.Group>
                                      <Form.Label style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", marginBottom: "4px" }}>
                                        Custom Display Title
                                      </Form.Label>
                                      <Form.Control
                                        size="sm"
                                        value={repo.display_title}
                                        placeholder="Custom Title"
                                        style={inputStyle(false)}
                                        onChange={(e) =>
                                          handleFieldChange(repo.repo_name, "display_title", e.target.value)
                                        }
                                      />
                                    </Form.Group>

                                    {/* Demo URL with source indicator */}
                                    <Form.Group>
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                                        <Form.Label style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", margin: 0 }}>
                                          Demo / Live URL
                                        </Form.Label>
                                        <span style={{ fontSize: "0.7rem" }}>
                                          {repo.demo_url_override ? (
                                            <span style={{ color: "#c084f5" }}>Admin Override</span>
                                          ) : repo.gh_homepage ? (
                                            <span style={{ color: "#6ec6ff" }}>GitHub Auto</span>
                                          ) : (
                                            <span style={{ color: "rgba(255,255,255,0.3)" }}>None</span>
                                          )}
                                          {repo.demo_url_override && (
                                            <Button
                                              variant="link"
                                              size="sm"
                                              style={{ color: "rgba(255,255,255,0.4)", padding: "0 0 0 6px", fontSize: "0.72rem" }}
                                              onClick={() => handleResetDemoUrl(repo.repo_name)}
                                              title="Clear override — revert to GitHub website field"
                                            >
                                              Reset to GitHub
                                            </Button>
                                          )}
                                        </span>
                                      </div>
                                      <Form.Control
                                        size="sm"
                                        value={repo.demo_url}
                                        placeholder={repo.gh_homepage || "https://..."}
                                        style={inputStyle(!!repo.demo_url_override)}
                                        onChange={(e) => {
                                          handleFieldChange(repo.repo_name, "demo_url", e.target.value);
                                          handleFieldChange(repo.repo_name, "demo_url_override", e.target.value);
                                        }}
                                      />
                                      {repo.gh_homepage && !repo.demo_url_override && (
                                        <Form.Text style={{ color: "rgba(110,198,255,0.6)", fontSize: "0.72rem" }}>
                                          Auto-fetched from GitHub: {repo.gh_homepage}
                                        </Form.Text>
                                      )}
                                    </Form.Group>
                                  </div>

                                  {/* Row 2: Description */}
                                  <Form.Group>
                                    <Form.Label style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", marginBottom: "4px" }}>
                                      Custom Description
                                    </Form.Label>
                                    <Form.Control
                                      as="textarea"
                                      rows={3}
                                      value={repo.custom_description}
                                      placeholder="Override the GitHub description..."
                                      style={inputStyle(false)}
                                      onChange={(e) =>
                                        handleFieldChange(repo.repo_name, "custom_description", e.target.value)
                                      }
                                    />
                                  </Form.Group>

                                  {/* Row 3: Custom Image URL */}
                                  <Form.Group>
                                    <Form.Label style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", marginBottom: "4px" }}>
                                      Custom Image URL
                                    </Form.Label>
                                    <Form.Control
                                      size="sm"
                                      value={repo.custom_image_url}
                                      placeholder="https://... (leave blank to use GitHub social preview)"
                                      style={inputStyle(false)}
                                      onChange={(e) =>
                                        handleFieldChange(repo.repo_name, "custom_image_url", e.target.value)
                                      }
                                    />
                                  </Form.Group>
                                </div>
                              </div>
                            </Collapse>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Container>
    </Container>
  );
}

export default AdminDashboard;
