"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { checkSession } from "../lib/api";

export type Project = { id: string; name: string; ownerId: string; createdAt: string };
type ConsoleState = {
  projects: Project[];
  projectId: string;
  setProjectId: (id: string) => void;
  signedIn: boolean;
  loadingProjects: boolean;
  projectError: string;
  refreshProjects: () => Promise<boolean>;
};

const Context = createContext<ConsoleState | null>(null);

export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectIdState] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState("");

  const refreshProjects = useCallback(async () => {
    await Promise.resolve();
    setLoadingProjects(true);
    const result = await checkSession<{ data?: Project[] }>();
    if (result.ok) {
      const next = result.data?.data || [];
      setProjects(next);
      setSignedIn(true);
      setProjectError("");
      setProjectIdState(current => next.some(project => project.id === current) ? current : next[0]?.id || "");
      setLoadingProjects(false);
      return true;
    } else {
      setProjects([]);
      setProjectIdState("");
      setSignedIn(false);
      if (result.status === 401) setProjectError("");
      else setProjectError(result.message);
    }
    setLoadingProjects(false);
    return false;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshProjects(), 0);
    const handleAuth = () => void refreshProjects();
    const handleAuthExpired = () => {
      setProjects([]);
      setProjectIdState("");
      setSignedIn(false);
      setProjectError("");
      setLoadingProjects(false);
    };
    window.addEventListener("EzNotification:auth-change", handleAuth);
    window.addEventListener("EzNotification:auth-expired", handleAuthExpired);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("EzNotification:auth-change", handleAuth);
      window.removeEventListener("EzNotification:auth-expired", handleAuthExpired);
    };
  }, [refreshProjects]);

  const setProjectId = useCallback((id: string) => {
    setProjectIdState(id);
  }, []);

  const value = useMemo(() => ({ projects, projectId, setProjectId, signedIn, loadingProjects, projectError, refreshProjects }), [projects, projectId, setProjectId, signedIn, loadingProjects, projectError, refreshProjects]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useConsole() {
  const value = useContext(Context);
  if (!value) throw new Error("ConsoleProvider is required");
  return value;
}
