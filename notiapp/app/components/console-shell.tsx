"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiPath, apiRequest } from "../lib/api";
import { useConsole } from "./console-state";
import { useTheme } from "./theme-state";

const navigation = [
  { title: "WORKSPACE", items: [
    { href: "/", label: "Overview", icon: "◫" },
    { href: "/v1/projects", label: "Projects", icon: "▦" },
    { href: "/v1/api-keys", label: "API keys", icon: "⌘" },
  ] },
  { title: "DELIVERY", items: [
    { href: "/v1/smtp", label: "SMTP settings", icon: "✉" },
    { href: "/v1/in-app", label: "In-app", icon: "▣", soon: true },
    { href: "/v1/sms", label: "SMS", icon: "▤", soon: true },
  ] },
];

export default function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activePath = pathname === "/v1" || pathname === "/v1/dashboard" ? "/" : pathname;
  const router = useRouter();
  const { projects, projectId, setProjectId, signedIn, loadingProjects, projectError, refreshProjects } = useConsole();
  const { theme, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  const isAccountPage = pathname === "/v1/auth";
  const requiresSession = ["/v1/projects", "/v1/api-keys", "/v1/smtp"].includes(pathname);

  useEffect(() => {
    if (loadingProjects) return;
    if (isAccountPage && signedIn) router.replace("/v1/projects");
    else if (requiresSession && !signedIn && !projectError) router.replace("/v1/auth");
  }, [isAccountPage, loadingProjects, projectError, requiresSession, router, signedIn]);

  async function logout() {
    setLoggingOut(true);
    await apiRequest(apiPath("/auth/v1/delete"), { method: "DELETE" });
    window.dispatchEvent(new Event("notiapp:auth-change"));
    setLoggingOut(false);
    router.replace("/v1/auth");
  }

  const waitingForSession = loadingProjects && (isAccountPage || requiresSession);
  const blockedPage = isAccountPage && signedIn || requiresSession && !signedIn;

  return <div className="app-frame">
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label="NotiApp home"><span className="brand-mark">n</span><span>notiapp</span><span className="brand-plan">DEV</span></Link>
      <div className="workspace-picker">
        <span className="workspace-avatar">{(projects.find(project => project.id === projectId)?.name || "N").slice(0, 1).toUpperCase()}</span>
        <label className="sr-only" htmlFor="workspace">Selected project</label>
        <select id="workspace" value={projectId} onChange={event => setProjectId(event.target.value)} disabled={!signedIn || projects.length === 0}>
          <option value="">{loadingProjects ? "Loading projects…" : signedIn ? "Select a project" : "No session"}</option>
          {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <span className="select-caret" aria-hidden="true">⌄</span>
      </div>

      <nav className="side-nav" aria-label="Main navigation">
        {navigation.map(group => <div className="nav-group" key={group.title}>
          <p className="nav-heading">{group.title}</p>
          {group.items.map(item => <Link key={item.href} href={item.href} className={`nav-link ${activePath === item.href ? "active" : ""}`} aria-current={activePath === item.href ? "page" : undefined}>
            <span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>{item.soon && <span className="nav-soon">SOON</span>}
          </Link>)}
        </div>)}
      </nav>

      <div className="sidebar-bottom">
        <div className="service-health"><span className="health-indicator" /><span>API endpoint</span><button className="health-refresh" onClick={() => void refreshProjects()} aria-label="Refresh project access">↻</button></div>
        {projectError && <p className="sidebar-error" role="status">{projectError}</p>}
        <div className="user-row"><div className="user-avatar">{signedIn ? "U" : "?"}</div><div className="user-label"><strong>{signedIn ? "Signed in" : "Not signed in"}</strong><small>{signedIn ? `${projects.length} project${projects.length === 1 ? "" : "s"}` : "Connect your account"}</small></div>
          {signedIn ? <button className="quiet-icon" onClick={logout} disabled={loggingOut} aria-label="Sign out">↪</button> : <Link className="sign-in-small" href="/v1/auth">Sign in</Link>}
        </div>
      </div>
    </aside>

    <div className="main-column">
      <header className="topbar">
        <div className="breadcrumbs"><span>NotiApp</span><span className="crumb-slash">/</span><strong>{navigation.flatMap(group => group.items).find(item => item.href === activePath)?.label || (pathname === "/v1/auth" ? "Account" : "Workspace")}</strong></div>
        <div className="topbar-actions"><span className="environment"><i /> Development</span><button className="icon-action" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title="Toggle theme">{theme === "dark" ? "☼" : "◐"}</button>{signedIn ? <button className="top-action" onClick={logout} disabled={loggingOut}>{loggingOut ? "Signing out…" : "Sign out"}</button> : <Link className="top-action" href="/v1/auth">Sign in</Link>}</div>
      </header>
      <main className="page-content">
        {waitingForSession ? <div className="loading-row" role="status">Checking your session…</div> : blockedPage ? projectError ? <section className="panel empty-state"><strong>Could not verify your session</strong><p>{projectError}</p><button className="button" onClick={() => void refreshProjects()}>Try again</button></section> : <div className="loading-row" role="status">{isAccountPage ? "Opening your workspace…" : "Redirecting to sign in…"}</div> : children}
      </main>
      <footer className="app-footer"><span>NotiApp <span className="footer-separator">·</span> Developer console</span><span>Email delivery and project API</span></footer>
    </div>
  </div>;
}
