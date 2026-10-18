"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import ConsoleShell from "./components/console-shell";
import { useConsole } from "./components/console-state";
import { API_URL, apiPath } from "./lib/api";

type ApiResponse = { status: number; body: string; queued: boolean };

export default function Home() {
  const { projects, projectId, signedIn } = useConsole();
  const [key, setKey] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<"idle" | "checking" | "online" | "offline">("idle");
  const requestRef = useRef({ fingerprint: "", id: "" });
  const selectedProject = projects.find(project => project.id === projectId);

  async function checkHealth() {
    setHealth("checking");
    try {
      const response = await fetch(`${API_URL}/health`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      setHealth(response.ok ? "online" : "offline");
    } catch {
      setHealth("offline");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    const fingerprint = JSON.stringify([recipientEmail, subject, body]);
    if (requestRef.current.fingerprint !== fingerprint) requestRef.current = { fingerprint, id: crypto.randomUUID() };
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}${apiPath("/v1/service")}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key.trim()}` },
        body: JSON.stringify({ channel: "email", data: { id: requestRef.current.id, recipientEmail, subject, body } }),
        signal: AbortSignal.timeout(15000),
      });
      const text = await response.text();
      let formatted = text;
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch { /* Keep backend text visible. */ }
      const queued = response.ok;
      setResult({ status: response.status, body: formatted || "Empty response", queued });
      if (queued) requestRef.current = { fingerprint: "", id: "" };
      else setError("The backend did not accept this request. Check the API key and server response.");
    } catch {
      setError("Could not reach the backend. Check the API URL, server, and Redis queue.");
    } finally {
      setBusy(false);
    }
  }

  return <ConsoleShell>
    <section className="page-heading">
      <div className="heading-copy"><p className="eyebrow">WORKSPACE / OVERVIEW</p><h1>Notification delivery</h1><p>Send an email through your project’s API key and inspect the queue response.</p></div>
      <div className="heading-actions"><Link className="button" href="/v1/projects">Manage projects</Link><button className="button primary" type="button" onClick={checkHealth} disabled={health === "checking"}>{health === "checking" ? "Checking…" : "Check API health"}</button></div>
    </section>

    <div className="metric-strip" aria-label="Service summary">
      <div className="metric-card"><span>Delivery channel</span><strong>Email</strong><small>Available via API key</small></div>
      <div className="metric-card"><span>Selected project</span><strong>{selectedProject?.name || "None selected"}</strong><small>{signedIn ? "Project context" : "Sign in to manage projects"}</small></div>
      <div className="metric-card"><span>API reachability</span><strong>{health === "online" ? "Online" : health === "offline" ? "Offline" : health === "checking" ? "Checking…" : "Not checked"}</strong><small>Health endpoint only</small></div>
    </div>

    <div className="overview-grid">
      <section className="panel">
        <div className="panel-header"><div><div className="panel-title"><h2>Send a test email</h2><span className="pill accent">Live endpoint</span></div><p>Queues one email using the selected API key.</p></div></div>
        <div className="panel-body">
          {!signedIn && <div className="alert" style={{ marginBottom: 14 }}>You can send with an existing key. <Link className="text-link" href="/v1/auth">Sign in</Link> to manage projects and credentials.</div>}
          {!selectedProject && signedIn && <div className="alert" style={{ marginBottom: 14 }}>Create a project and API key before sending. <Link className="text-link" href="/v1/projects">Open projects</Link>.</div>}
          <form onSubmit={submit}>
            <div className="form-grid">
              <div className="form-field full"><label htmlFor="api-key">Project API key</label><input id="api-key" type="password" autoComplete="off" placeholder="ns_live_…" value={key} onChange={event => setKey(event.target.value)} required /><small>The full key is only shown once when it is created.</small></div>
              <div className="form-field full"><label htmlFor="recipient">Recipient email</label><input id="recipient" type="email" placeholder="person@example.com" value={recipientEmail} onChange={event => setRecipientEmail(event.target.value)} required /></div>
              <div className="form-field full"><label htmlFor="subject">Subject</label><input id="subject" placeholder="Your order has shipped" value={subject} onChange={event => setSubject(event.target.value)} required /></div>
              <div className="form-field full"><label htmlFor="message">Message</label><textarea id="message" placeholder="Write the email message…" value={body} onChange={event => setBody(event.target.value)} required /></div>
            </div>
            <div className="form-actions"><p className="field-help">PUT <span className="mono">/appNoti/api/v1/service</span></p><button className="button primary" disabled={busy}>{busy ? "Queueing…" : "Queue email"}</button></div>
          </form>
          {error && <p className="alert error" role="alert" style={{ marginTop: 14 }}>{error}</p>}
          {result && <div style={{ marginTop: 16 }}><div className={`alert ${result.queued ? "success" : "error"}`} role="status">{result.queued ? "Accepted by the API. Delivery is not confirmed." : `Request returned HTTP ${result.status}.`}</div><pre className="response-pre" style={{ marginTop: 9 }}>{result.body}</pre></div>}
        </div>
      </section>

      <div className="section-stack">
        <section className="panel"><div className="panel-header"><div><h2>Services</h2><p>Availability from the current backend routes.</p></div></div>
          <div className="service-list">
            <div className="service-row"><span className="service-glyph">✉</span><div className="service-copy"><div className="service-topline"><strong>Email</strong><span className="pill success">Available</span></div><p>Queue email requests; a running worker and verified SMTP config are required for delivery.</p></div></div>
            <div className="service-row"><span className="service-glyph">▣</span><div className="service-copy"><div className="service-topline"><strong>In-app notifications</strong><span className="pill">Coming soon</span></div><p>No in-app delivery handler is implemented yet.</p></div></div>
            <div className="service-row"><span className="service-glyph">▤</span><div className="service-copy"><div className="service-topline"><strong>SMS</strong><span className="pill">Coming soon</span></div><p>The API currently returns “not available yet” for SMS.</p></div></div>
          </div>
        </section>
        <section className="panel"><div className="panel-header"><div><h2>Quick access</h2><p>Configure the resources needed to send.</p></div></div><div className="panel-body quick-link-list">
          <Link className="quick-link" href="/v1/projects"><span>Projects and API keys</span><span aria-hidden="true">↗</span></Link>
          <Link className="quick-link" href="/v1/smtp"><span>SMTP connection</span><span aria-hidden="true">↗</span></Link>
          <Link className="quick-link" href="/v1/in-app"><span>In-app notifications</span><span className="pill">Soon</span></Link>
        </div></section>
      </div>
    </div>
  </ConsoleShell>;
}
