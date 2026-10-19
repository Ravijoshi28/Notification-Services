"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import ConsoleShell from "../../components/console-shell";
import { useConsole } from "../../components/console-state";
import { apiPath, apiRequest } from "../../lib/api";

type Delivery = { id: string; status: string; error?: string | null; sentAt?: string | null; attempts: number; updatedAt: string };

export default function ServiceTestPage() {
  const { projectId, signedIn } = useConsole();
  const [apiKey, setApiKey] = useState("");
  const [channel, setChannel] = useState<"email" | "push">("email");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [organization, setOrganization] = useState("");
  const [subject, setSubject] = useState("Test notification");
  const [header, setHeader] = useState("Test notification");
  const [body, setBody] = useState("This is a test notification from NotiApp.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [delivery, setDelivery] = useState<Delivery | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setDelivery(null);
    const requestId = crypto.randomUUID();
    const data = channel === "email"
      ? { id: requestId, recipientEmail: recipientEmail.trim(), subject: subject.trim(), body: body.trim() }
      : { id: requestId, userId: userId.trim(), organization: organization.trim(), header: header.trim(), body: body.trim() };

    const queued = await apiRequest<{ id?: string; status?: string; message?: string }>(apiPath("/v1/service"), {
      method: "PUT", headers: { Authorization: `Bearer ${apiKey.trim()}` }, skipAuthRefresh: true,
      body: JSON.stringify({ channel, data }),
    });
    if (!queued.ok || !queued.data?.id) {
      setError(queued.message || "The API did not return a queued request ID."); setBusy(false); return;
    }

    const path = apiPath(`/v1/service/${channel}/${encodeURIComponent(queued.data.id)}`);
    for (let attempt = 0; attempt < 20; attempt++) {
      const result = await apiRequest<{ data?: Delivery; message?: string }>(path, {
        headers: { Authorization: `Bearer ${apiKey.trim()}` }, skipAuthRefresh: true,
      });
      if (!result.ok || !result.data?.data) {
        setError(result.message); setBusy(false); return;
      }
      setDelivery(result.data.data);
      if (["sent", "failed"].includes(result.data.data.status)) break;
      await new Promise(resolve => window.setTimeout(resolve, 1500));
    }
    setBusy(false);
  }

  return <ConsoleShell>
    <section className="page-heading"><div className="heading-copy"><p className="eyebrow">DEVELOPER TOOLS / DELIVERY</p><h1>Service test</h1><p>Send a real test notification, then check the worker’s delivery result for this project.</p></div><Link className="button" href="/v1/api-keys">API keys</Link></section>
    {!signedIn && <div className="alert">Sign in and select a project to use the service tester. <Link className="text-link" href="/v1/auth">Sign in</Link>.</div>}
    {signedIn && !projectId && <div className="panel empty-state"><strong>Select a project first</strong><p>Delivery records and API keys are scoped to a project.</p><Link className="button primary" href="/v1/projects">Manage projects</Link></div>}
    {signedIn && projectId && <section className="panel"><div className="panel-header"><div><h2>Send and verify</h2><p>Requests are sent to the live queue and may deliver a real email or browser push.</p></div><span className="pill accent">Live test</span></div><div className="panel-body">
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="form-field full"><label htmlFor="test-api-key">Project API key</label><input id="test-api-key" type="password" autoComplete="off" value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder="ns_live_…" required /><small>Used only for this request; keep API keys out of client side app code.</small></div>
          <div className="form-field"><label htmlFor="test-channel">Service</label><select id="test-channel" value={channel} onChange={event => setChannel(event.target.value as "email" | "push")}><option value="email">Email</option><option value="push">Push notification</option></select></div>
          {channel === "email" ? <div className="form-field"><label htmlFor="test-recipient">Recipient email</label><input id="test-recipient" type="email" value={recipientEmail} onChange={event => setRecipientEmail(event.target.value)} required /></div> : <>
            <div className="form-field"><label htmlFor="test-user">Subscribed user ID</label><input id="test-user" value={userId} onChange={event => setUserId(event.target.value)} required /><small>Must match a saved browser subscription.</small></div>
            <div className="form-field"><label htmlFor="test-org">Organization</label><input id="test-org" value={organization} onChange={event => setOrganization(event.target.value)} required /></div>
          </>}
          {channel === "email" ? <div className="form-field full"><label htmlFor="test-subject">Subject</label><input id="test-subject" value={subject} onChange={event => setSubject(event.target.value)} required /></div> : <div className="form-field full"><label htmlFor="test-title">Title</label><input id="test-title" value={header} onChange={event => setHeader(event.target.value)} required /></div>}
          <div className="form-field full"><label htmlFor="test-body">Message</label><textarea id="test-body" value={body} onChange={event => setBody(event.target.value)} required /></div>
        </div>
        <div className="form-actions"><p className="field-help">Uses the selected project’s API key and worker.</p><button className="button primary" disabled={busy}>{busy ? "Checking delivery…" : `Send test ${channel}`}</button></div>
      </form>
      {error && <p className="alert error" role="alert" style={{ marginTop: 14 }}>{error}</p>}
      {delivery && <div style={{ marginTop: 14 }}><p className={`alert ${delivery.status === "sent" ? "success" : delivery.status === "failed" ? "error" : ""}`} role="status"><strong>{delivery.status === "sent" ? "Delivered to the provider" : delivery.status === "failed" ? "Delivery failed" : `Current status: ${delivery.status}`}</strong>{delivery.error ? ` — ${delivery.error}` : delivery.status === "queued" || delivery.status === "sending" || delivery.status === "retry" ? " — still processing; status will update while this page is open." : ""}</p><pre className="response-pre" style={{ marginTop: 9 }}>{JSON.stringify(delivery, null, 2)}</pre></div>}
    </div></section>}
  </ConsoleShell>;
}
