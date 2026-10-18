"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConsoleShell from "../../components/console-shell";
import { useConsole } from "../../components/console-state";
import { apiPath, apiRequest } from "../../lib/api";

export default function Account() {
  const router = useRouter();
  const { refreshProjects } = useConsole();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const path = mode === "login" ? "/auth/v1/login" : "/auth/v1/signup";
    const result = await apiRequest<{ message?: string }>(apiPath(path), {
      method: "POST",
      body: JSON.stringify(mode === "login" ? { email, password } : { username, email, password }),
    });
    if (result.ok) {
      if (result.data?.message === "User already exist") {
        setError("An account with this email already exists. Sign in instead.");
      } else if (await refreshProjects()) {
        router.replace("/v1/projects");
      } else {
        setError("The backend accepted the request, but the session could not be verified. Check the API URL, CORS origin, and cookie settings.");
      }
    } else setError(result.message);
    setBusy(false);
  }

  return <ConsoleShell><div className="auth-wrap"><section className="panel auth-card"><div className="panel-header"><div><p className="eyebrow">ACCOUNT / SESSION</p><h2>{mode === "login" ? "Sign in to your workspace" : "Create your account"}</h2><p>Session cookies connect the console to your backend.</p></div></div><div className="panel-body">
    <div className="auth-tabs" role="tablist" aria-label="Account action"><button type="button" className={`button ${mode === "login" ? "primary" : ""}`} role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setError(""); }}>Sign in</button><button type="button" className={`button ${mode === "signup" ? "primary" : ""}`} role="tab" aria-selected={mode === "signup"} onClick={() => { setMode("signup"); setError(""); }}>Create account</button></div>
    <form onSubmit={submit}><div className="form-grid">{mode === "signup" && <div className="form-field full"><label htmlFor="username">Name</label><input id="username" autoComplete="name" value={username} onChange={event => setUsername(event.target.value)} required /></div>}<div className="form-field full"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></div><div className="form-field full"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} value={password} onChange={event => setPassword(event.target.value)} required /></div></div>
      {error && <p className="alert error" role="alert" style={{ marginTop: 14 }}>{error}</p>}
      <div className="form-actions"><Link className="text-link" href="/">Back to overview</Link><button className="button primary" disabled={busy}>{busy ? "Connecting…" : mode === "login" ? "Sign in" : "Create account"}</button></div>
    </form>
  </div></section></div></ConsoleShell>;
}
