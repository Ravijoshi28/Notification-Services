"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import ConsoleShell from "../../components/console-shell";
import { useConsole } from "../../components/console-state";
import { apiPath, apiRequest } from "../../lib/api";

type PushConfig = { domain: string; publicKey: string };
type PushResponse = { data?: PushConfig; message?: string };

export default function PushNotifications() {
  const { projectId, signedIn } = useConsole();
  const [config, setConfig] = useState<PushConfig>({ domain: "", publicKey: "" });
  const [domain, setDomain] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [userId, setUserId] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [header, setHeader] = useState("");
  const [organization, setOrganization] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadConfig = useCallback(async () => {
    if (!signedIn || !projectId) return;
    setConfig({ domain: "", publicKey: "" });
    setDomain("");
    setLoading(true);
    const result = await apiRequest<PushResponse>(apiPath(`/push/v1/config?projectId=${encodeURIComponent(projectId)}`));
    if (result.ok && result.data?.data) {
      setConfig(result.data.data);
      setDomain(result.data.data.domain || "");
      setError("");
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, [projectId, signedIn]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadConfig(), 0);
    return () => window.clearTimeout(timer);
  }, [loadConfig]);

  async function saveDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) return;
    setSaving(true); setError(""); setNotice("");
    const result = await apiRequest<PushResponse>(apiPath("/push/v1/domain"), {
      method: "POST",
      body: JSON.stringify({ projectId, domain: domain.trim() }),
    });
    if (result.ok && result.data?.data) {
      setConfig(current => ({ ...current, domain: result.data?.data?.domain || "" }));
      setDomain(result.data.data.domain);
      setNotice("Domain saved. Use this same domain when registering browser subscriptions.");
    } else setError(result.message);
    setSaving(false);
  }

  async function sendPush(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true); setError(""); setNotice("");
    const result = await apiRequest<{ message?: string; id?: string }>(apiPath("/v1/service"), {
      method: "PUT",
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
      skipAuthRefresh: true,
      body: JSON.stringify({
        channel: "push",
        data: { id: crypto.randomUUID(), userId: userId.trim(), header: header.trim(), organization: organization.trim(), body: body.trim() },
      }),
    });
    if (!result.ok || !result.data?.id) {
      setError(result.message || "The API did not return a queued request ID.");
      setSending(false);
      return;
    }

    setNotice(`Push queued (${result.data.id}). Waiting for the delivery worker…`);
    try {
      for (let attempt = 0; attempt < 20; attempt++) {
        const status = await apiRequest<{ data?: { status: string; error?: string | null; attempts: number } }>(
          apiPath(`/v1/service/push/${encodeURIComponent(result.data.id)}`),
          { headers: { Authorization: `Bearer ${apiKey.trim()}` }, skipAuthRefresh: true },
        );
        if (!status.ok || !status.data?.data) {
          setError(`Push was queued, but delivery status could not be loaded: ${status.message}`);
          return;
        }
        const current = status.data.data;
        if (current.status === "sent") {
          setNotice(`Push accepted by the push provider after ${current.attempts} attempt(s).`);
          return;
        }
        if (current.status === "failed") {
          setError(`Push delivery failed: ${current.error || "No failure detail was recorded."}`);
          return;
        }
        setNotice(`Push status: ${current.status}. Waiting for the delivery worker…`);
        await new Promise(resolve => window.setTimeout(resolve, 1500));
      }
      setNotice("Push is still queued or retrying. Check that the separate worker process is running.");
    } finally {
      setSending(false);
    }
  }

  function decodeApplicationServerKey(key: string) {
    const normalized = key.trim();
    if (!/^[A-Za-z0-9_+/-]+={0,2}$/.test(normalized)) {
      throw new Error("VAPID_PUBLIC is not a valid base64url key. Generate a VAPID key pair and update server/.env.");
    }
    const base64 = normalized.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    let binary: string;
    try { binary = atob(padded); }
    catch { throw new Error("VAPID_PUBLIC could not be decoded. Check the key in server/.env."); }
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    if (bytes.length !== 65 || bytes[0] !== 4) {
      throw new Error("VAPID_PUBLIC is not a valid 65-byte public key. Generate a matching VAPID key pair and restart the backend.");
    }
    return bytes;
  }

  async function enableSubscription() {
    setSubscribing(true); setError(""); setNotice("");
    try {
      if (!config.publicKey) throw new Error("Set VAPID_PUBLIC in the backend before enabling browser notifications.");
      if (!userId.trim()) throw new Error("Enter the user ID to associate with this browser subscription.");
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("This browser does not support web push notifications.");
      }
      if (window.location.origin !== config.domain) {
        throw new Error(`Open this page on the project's saved app domain (${config.domain}) to subscribe this browser.`);
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error(`Browser notification permission was ${permission}.`);
      const worker = await navigator.serviceWorker.register("/PushNotification_service_worker.js");
      const current = await worker.pushManager.getSubscription();
      const applicationServerKey = decodeApplicationServerKey(config.publicKey);
      let subscription = current;
      if (current) {
        const previousKey = current.options.applicationServerKey;
        const matchesKey = previousKey && previousKey.byteLength === applicationServerKey.byteLength
          && applicationServerKey.every((byte, index) => byte === new Uint8Array(previousKey)[index]);
        if (!matchesKey) {
          await current.unsubscribe();
          subscription = null;
        }
      }
      subscription ||= await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      const result = await apiRequest<{ message?: string }>(apiPath("/push/v1/console-subscribe"), {
        method: "POST",
        body: JSON.stringify({ projectId, userId: userId.trim(), subscription: subscription.toJSON(), domain: window.location.origin }),
      });
      if (!result.ok) throw new Error(result.message);
      setNotice("Browser permission granted and subscription saved. Send a test push to this user ID.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to enable browser notifications.");
    } finally {
      setSubscribing(false);
    }
  }

  async function copyPublicKey() {
    try { await navigator.clipboard.writeText(config.publicKey); setNotice("VAPID public key copied."); }
    catch { setError("Clipboard is unavailable. Select and copy the key manually."); }
  }

  return <ConsoleShell>
    <section className="page-heading">
      <div className="heading-copy"><p className="eyebrow">DELIVERY / PUSH</p><h1>Push notifications</h1><p>Register your app domain, collect browser subscriptions, and send a push to one of your users.</p></div>
      <Link className="button" href="/v1/projects">Projects</Link>
    </section>

    {!signedIn && <div className="alert">Sign in to configure push notifications. <Link className="text-link" href="/v1/auth">Sign in</Link>.</div>}
    {signedIn && !projectId && <div className="panel empty-state"><strong>Select a project first</strong><p>Push domains and API keys belong to a project.</p><Link className="button primary" href="/v1/projects">Manage projects</Link></div>}
    {signedIn && projectId && <div className="section-stack">
      <section className="panel">
        <div className="panel-header"><div><h2>App domain</h2><p>Subscriptions are accepted only for this project domain.</p></div><span className="pill">{config.domain ? "Configured" : "Setup required"}</span></div>
        <div className="panel-body">
          <form onSubmit={saveDomain}>
            <div className="form-grid"><div className="form-field"><label htmlFor="push-domain">Website domain</label><input id="push-domain" type="url" value={domain} onChange={event => setDomain(event.target.value)} placeholder="https://app.example.com" required /><small>Use the exact origin where the service worker runs.</small></div><div className="form-field" style={{ alignContent: "end" }}><button className="button primary" disabled={saving || loading}>{saving ? "Saving…" : "Save domain"}</button></div></div>
          </form>
          <div className="form-field" style={{ marginTop: 14 }}><label htmlFor="vapid-public">VAPID public key</label><div className="inline-actions"><input id="vapid-public" className="mono" readOnly value={config.publicKey} placeholder={loading ? "Loading…" : "Set VAPID_PUBLIC in server/.env"} /><button className="button" type="button" onClick={() => void copyPublicKey()} disabled={!config.publicKey}>Copy</button></div><small>This public key is used by the browser SDK. Keep VAPID_SECRETKEY on the server. For localhost, set VAPID_SUBJECT to a mailto contact in server/.env.</small></div>
          {error && <p className="alert error" role="alert" style={{ marginTop: 12 }}>{error}</p>}{notice && <p className="alert success" role="status" style={{ marginTop: 12 }}>{notice}</p>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><div><h2>Enable this browser</h2><p>Request browser permission and save a push subscription for testing.</p></div><span className="pill">Browser permission</span></div>
        <div className="panel-body">
          {!config.domain && <p className="alert" style={{ marginBottom: 14 }}>Save the project domain first. This page must be opened from that same domain to subscribe.</p>}
          <div className="form-grid">
            <div className="form-field"><label htmlFor="subscribe-user-id">User ID</label><input id="subscribe-user-id" value={userId} onChange={event => setUserId(event.target.value)} placeholder="e.g. user-123" /><small>Use the same ID when sending the test push.</small></div>
            <div className="form-field" style={{ alignContent: "end" }}><button className="button primary" type="button" onClick={() => void enableSubscription()} disabled={subscribing || loading || !config.publicKey || !config.domain}>{subscribing ? "Requesting permission…" : "Enable browser notifications"}</button></div>
          </div>
          {error && <p className="alert error" role="alert" style={{ marginTop: 12 }}>{error}</p>}{notice && <p className="alert success" role="status" style={{ marginTop: 12 }}>{notice}</p>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><div><h2>Send a push</h2><p>Queue a notification for a subscribed user in this project.</p></div><span className="pill accent">API key required</span></div>
        <div className="panel-body">
          {!config.domain && <p className="alert" style={{ marginBottom: 14 }}>Save the app domain before sending push notifications.</p>}
          <form onSubmit={sendPush}>
            <div className="form-grid">
              <div className="form-field full"><label htmlFor="push-api-key">Project API key</label><input id="push-api-key" type="password" autoComplete="off" value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder="ns_live_…" required /></div>
              <div className="form-field"><label htmlFor="push-user-id">User ID</label><input id="push-user-id" value={userId} onChange={event => setUserId(event.target.value)} required /><small>The user ID your app sent with its subscription.</small></div>
              <div className="form-field"><label htmlFor="push-organization">Organization</label><input id="push-organization" value={organization} onChange={event => setOrganization(event.target.value)} required /></div>
              <div className="form-field full"><label htmlFor="push-title">Notification title</label><input id="push-title" value={header} onChange={event => setHeader(event.target.value)} required /></div>
              <div className="form-field full"><label htmlFor="push-body">Message</label><textarea id="push-body" value={body} onChange={event => setBody(event.target.value)} required /></div>
            </div>
            <div className="form-actions"><p className="field-help">PUT <span className="mono">/appNoti/api/v1/service</span></p><button className="button primary" disabled={sending || !config.domain}>{sending ? "Queueing…" : "Queue push"}</button></div>
          </form>
          {error && <p className="alert error" role="alert" style={{ marginTop: 14 }}>{error}</p>}{notice && <p className="alert success" role="status" style={{ marginTop: 14 }}>{notice}</p>}
        </div>
      </section>
    </div>}
  </ConsoleShell>;
}
