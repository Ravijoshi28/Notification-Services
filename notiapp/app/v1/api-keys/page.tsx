"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import ConsoleShell from "../../components/console-shell";
import { useConsole } from "../../components/console-state";
import { apiPath, apiRequest } from "../../lib/api";

type ApiKey = { id: string; name: string; lastFour: string; createdAt?: string };
type KeyResponse = { data?: ApiKey[]; message?: string };

export default function ApiKeys() {
  const { projectId, signedIn } = useConsole();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadKeys = useCallback(async () => {
    await Promise.resolve();
    if (!signedIn || !projectId) { setKeys([]); return; }
    setLoading(true);
    const result = await apiRequest<KeyResponse>(apiPath(`/api-route/v1/project?projectId=${encodeURIComponent(projectId)}`));
    if (result.ok) { setKeys(result.data?.data || []); setError(""); }
    else { setKeys([]); setError(result.message); }
    setLoading(false);
  }, [projectId, signedIn]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadKeys(), 0);
    return () => window.clearTimeout(timer);
  }, [loadKeys]);

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return;
    setBusy(true); setError(""); setMessage(""); setSecret("");
    const result = await apiRequest<{ data?: ApiKey & { key?: string } }>(apiPath(`/api-route/v1/create-api?projectId=${encodeURIComponent(projectId)}`), {
      method: "POST", body: JSON.stringify({ name: name.trim() }),
    });
    if (result.ok && result.data?.data?.key) {
      setSecret(result.data.data.key);
      setMessage("API key created. Copy the full value now; it will not be shown again.");
      setName("");
      await loadKeys();
    } else setError(result.message || "The backend did not return a new key.");
    setBusy(false);
  }

  async function remove(key: ApiKey) {
    if (!projectId || !window.confirm(`Delete API key “${key.name}”? This cannot be undone.`)) return;
    setError(""); setMessage("");
    const result = await apiRequest(apiPath(`/api-route/v1/delete-api?projectId=${encodeURIComponent(projectId)}`), {
      method: "DELETE", body: JSON.stringify({ apiid: key.id }),
    });
    if (result.ok) { setMessage("API key deleted."); await loadKeys(); }
    else setError(result.message);
  }

  async function copySecret() {
    try { await navigator.clipboard.writeText(secret); setMessage("Copied to clipboard."); }
    catch { setMessage("Clipboard is unavailable. Select the key and copy it manually."); }
  }

  return <ConsoleShell><section className="page-heading"><div className="heading-copy"><p className="eyebrow">ACCESS / CREDENTIALS</p><h1>API keys</h1><p>Create and revoke project credentials. The full key is returned only when it is created. Key can be copied only one time that is during creation copy it and store in your backend env file.This is for security purpose.</p></div><div className="heading-actions"><Link className="button" href="/v1/projects">Projects</Link></div></section>
    {!signedIn && <div className="alert" style={{ marginBottom: 15 }}>Sign in to manage project API keys. <Link className="text-link" href="/v1/auth">Open sign in</Link>.</div>}
    {signedIn && !projectId && <div className="panel empty-state"><strong>Select or create a project</strong><p>API keys belong to a project. Pick one in the sidebar or create a project first.</p><Link className="button primary" href="/v1/projects">Manage projects</Link></div>}
    {signedIn && projectId && <div className="section-stack">
      <section className="panel"><div className="panel-header"><div><h2>Create a project key</h2><p>Use one key per application or integration.</p></div><span className="pill accent">Project scoped</span></div><div className="panel-body">
        <form onSubmit={generate}><div className="form-grid"><div className="form-field"><label htmlFor="key-name">Key name</label><input id="key-name" value={name} onChange={event => setName(event.target.value)} placeholder="Production sender" maxLength={60} required /></div><div className="form-field" style={{ alignContent: "end" }}><button className="button primary" disabled={busy || !name.trim()}>{busy ? "Creating…" : "Create API key"}</button></div></div></form>
        {error && <p className="alert error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
        {message && <p className="alert success" role="status" style={{ marginTop: 12 }}>{message}</p>}
        {secret && <div className="form-field" style={{ marginTop: 12 }}><label htmlFor="new-secret">New API key</label><div className="inline-actions"><input id="new-secret" className="mono" readOnly value={secret} onFocus={event => event.currentTarget.select()} /><button className="button" type="button" onClick={copySecret}>Copy</button><button className="button" type="button" onClick={() => setSecret("")}>Dismiss</button></div></div>}
      </div></section>
      <section className="panel"><div className="panel-header"><div><h2>Keys for this project</h2><p>Names and suffixes only; existing secrets cannot be retrieved.</p></div><button className="button small" onClick={() => void loadKeys()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button></div>
        {loading ? <div className="loading-row" role="status">Loading API keys…</div> : keys.length === 0 ? <div className="empty-state"><strong>No API keys yet</strong><p>Create a key above to authenticate email requests for this project.</p></div> : <div className="table-scroll"><table><thead><tr><th>NAME</th><th>KEY SUFFIX</th><th>CREATED</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{keys.map(key => <tr key={key.id}><td><strong>{key.name}</strong><span className="table-meta">Active project credential</span></td><td><code className="code-chip">•••• {key.lastFour}</code></td><td>{key.createdAt ? new Date(key.createdAt).toLocaleDateString() : "—"}</td><td className="table-actions"><button className="button danger small" onClick={() => void remove(key)}>Revoke</button></td></tr>)}</tbody></table></div>}
      </section>
    </div>}
  </ConsoleShell>;
}
