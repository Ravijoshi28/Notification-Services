"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import ConsoleShell from "../../components/console-shell";
import { useConsole } from "../../components/console-state";
import { apiPath, apiRequest } from "../../lib/api";

export default function Smtp() {
  const { projectId, signedIn } = useConsole();
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return;
    setBusy(true); setMessage(""); setError("");
    const result = await apiRequest(apiPath(`/v1/smtp/SMTPconnection?projectId=${encodeURIComponent(projectId)}`), {
      method: "POST", body: JSON.stringify({ host, port: Number(port), user, password, email, company }),
    });
    if (result.ok) {
      setMessage(`${result.message} SMTP delivery becomes available after email verification.`);
      setPassword("");
    } else setError(result.message);
    setBusy(false);
  }

  async function remove() {
    if (!projectId || !window.confirm("Delete the SMTP connection for the selected project?")) return;
    setBusy(true); setMessage(""); setError("");
    const result = await apiRequest(apiPath(`/v1/smtp/delete-connection?projectId=${encodeURIComponent(projectId)}`), { method: "POST" });
    if (result.ok) setMessage(result.message);
    else setError(result.message);
    setBusy(false);
  }

  return <ConsoleShell><section className="page-heading"><div className="heading-copy"><p className="eyebrow">DELIVERY / SMTP</p><h1>SMTP connection</h1><p>Connect a sender for one project. Credentials are submitted directly to your backend.</p></div><span className="pill warning">Verification required</span></section>
    {!signedIn && <div className="alert" style={{ marginBottom: 15 }}>Sign in before configuring SMTP. <Link className="text-link" href="/v1/auth">Open sign in</Link>.</div>}
    {signedIn && !projectId && <div className="panel empty-state"><strong>Select a project first</strong><p>SMTP settings belong to a project. Create or select a project to continue.</p><Link className="button primary" href="/v1/projects">Manage projects</Link></div>}
    {signedIn && projectId && <div className="overview-grid">
      <section className="panel"><div className="panel-header"><div><h2>Provider credentials</h2><p>The password is cleared from this form after a successful save.</p></div><span className="pill">Project scoped</span></div><div className="panel-body">
        <form onSubmit={save}><div className="form-grid">
          <div className="form-field"><label htmlFor="smtp-host">SMTP host</label><input id="smtp-host" value={host} onChange={event => setHost(event.target.value)} placeholder="smtp.example.com" required /></div>
          <div className="form-field"><label htmlFor="smtp-port">Port</label><input id="smtp-port" type="number" min="1" max="65535" value={port} onChange={event => setPort(event.target.value)} required /><small>Use 465 for implicit TLS or 587 for STARTTLS.</small></div>
          <div className="form-field full"><label htmlFor="smtp-user">SMTP username</label><input id="smtp-user" autoComplete="username" value={user} onChange={event => setUser(event.target.value)} placeholder="provider username" required /></div>
          <div className="form-field full"><label htmlFor="smtp-password">SMTP password or app password</label><input id="smtp-password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required /></div>
          <div className="form-field"><label htmlFor="sender-name">Sender name</label><input id="sender-name" value={company} onChange={event => setCompany(event.target.value)} placeholder="Acme" required /></div>
          <div className="form-field"><label htmlFor="sender-email">Sender email</label><input id="sender-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="notifications@example.com" required /></div>
        </div><div className="form-actions"><p className="field-help">SMTP values are stored by your backend.</p><button className="button primary" disabled={busy}>{busy ? "Saving…" : "Save and send verification"}</button></div></form>
        {error && <p className="alert error" role="alert" style={{ marginTop: 14 }}>{error}</p>}{message && <p className="alert success" role="status" style={{ marginTop: 14 }}>{message}</p>}
      </div></section>
      <div className="section-stack"><section className="panel"><div className="panel-header"><div><h2>Connection flow</h2><p>What happens after saving.</p></div></div><div className="panel-body service-list">
        <div className="service-row"><span className="service-glyph">01</span><div className="service-copy"><strong>Credentials saved</strong><p>Your backend encrypts and stores the provider password for this project.</p></div></div>
        <div className="service-row"><span className="service-glyph">02</span><div className="service-copy"><strong>Verify sender email</strong><p>Open the verification link sent to the sender address.</p></div></div>
        <div className="service-row"><span className="service-glyph">03</span><div className="service-copy"><strong>Run the email worker</strong><p>Queued emails need Redis and the separate worker process to be delivered.</p></div></div>
      </div></section><section className="panel"><div className="panel-header"><div><h2>Remove connection</h2><p>Delete the selected project’s SMTP configuration.</p></div></div><div className="panel-body"><button className="button danger" onClick={() => void remove()} disabled={busy}>Delete SMTP connection</button></div></section></div>
    </div>}
  </ConsoleShell>;
}
