"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import ConsoleShell from "../../components/console-shell";
import { useConsole } from "../../components/console-state";
import { apiPath, apiRequest, type ApiResult } from "../../lib/api";

export default function Projects() {
  const { projects, projectId, setProjectId, signedIn, loadingProjects, projectError, refreshProjects } = useConsole();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const result = await apiRequest<ApiResult<unknown> | unknown>(apiPath("/project/v1/create"), { method: "POST", body: JSON.stringify({ name: name.trim() }) });
    if (result.ok) {
      setName(""); setNotice(result.message); await refreshProjects();
    } else setError(result.message);
    setBusy(false);
  }

  async function remove(id: string, projectName: string) {
    if (!window.confirm(`Delete project “${projectName}”?`)) return;
    setError(""); setNotice("");
    const result = await apiRequest(apiPath(`/project/v1/delete?projectId=${encodeURIComponent(id)}`), { method: "DELETE" });
    if (result.ok) { setNotice(result.message); await refreshProjects(); }
    else setError(result.message);
  }

  return <ConsoleShell><section className="page-heading"><div className="heading-copy"><p className="eyebrow">WORKSPACE / PROJECTS</p><h1>Projects</h1><p>Projects group API keys, SMTP configuration, and email traffic.</p></div><span className="pill">{projects.length} / 2 projects</span></section>
    {!signedIn && <div className="alert" style={{ marginBottom: 15 }}>Sign in to manage projects. <Link className="text-link" href="/v1/auth">Open sign in</Link>.</div>}
    {signedIn && <div className="section-stack">
      <section className="panel"><div className="panel-header"><div><h2>Create project</h2><p>The current backend permits up to two projects per user.</p></div></div><div className="panel-body"><form onSubmit={create}><div className="form-grid"><div className="form-field"><label htmlFor="project-name">Project name</label><input id="project-name" value={name} onChange={event => setName(event.target.value)} maxLength={80} placeholder="e.g. Storefront" required /></div><div className="form-field" style={{ alignContent: "end" }}><button className="button primary" disabled={busy || projects.length >= 2}>{busy ? "Creating…" : "Create project"}</button></div></div></form>
        {(error || projectError) && <p className="alert error" role="alert" style={{ marginTop: 12 }}>{error || projectError}</p>}{notice && <p className="alert success" role="status" style={{ marginTop: 12 }}>{notice}</p>}
      </div></section>
      <section className="panel"><div className="panel-header"><div><h2>Your projects</h2><p>Select a project to manage its API keys and SMTP configuration.</p></div><button className="button small" onClick={() => void refreshProjects()} disabled={loadingProjects}>{loadingProjects ? "Refreshing…" : "Refresh"}</button></div>
        {loadingProjects ? <div className="loading-row" role="status">Loading projects…</div> : projects.length === 0 ? <div className="empty-state"><strong>No projects yet</strong><p>Create a project to start managing credentials and mail delivery.</p></div> : <div className="table-scroll"><table><thead><tr><th>PROJECT</th><th>CREATED</th><th>PROJECT ID</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{projects.map(project => <tr key={project.id}><td><strong>{project.name}</strong>{project.id === projectId && <span className="table-meta">Selected</span>}</td><td>{new Date(project.createdAt).toLocaleDateString()}</td><td><code className="code-chip">{project.id}</code></td><td className="table-actions"><div className="inline-actions"><button className={`button small ${project.id === projectId ? "primary" : ""}`} onClick={() => setProjectId(project.id)}>{project.id === projectId ? "Selected" : "Select"}</button><button className="button danger small" onClick={() => void remove(project.id, project.name)}>Delete</button></div></td></tr>)}</tbody></table></div>}
      </section>
      <div className="inline-actions"><Link className="button" href="/v1/api-keys">Manage API keys</Link><Link className="button" href="/v1/smtp">Configure SMTP</Link></div>
    </div>}
  </ConsoleShell>;
}
