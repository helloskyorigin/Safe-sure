"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Github, LockKeyhole, Settings2 } from "lucide-react";

type Status = { configured: boolean; connected: boolean; login: string | null };
type Repo = { fullName: string; private: boolean };

export default function PrivateRepoConnector() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/github/status", { cache: "no-store", credentials: "same-origin" })
      .then(async response => {
        if (!response.ok) throw new Error("Connection unavailable");
        return response.json() as Promise<Status>;
      })
      .then(data => { if (active) setStatus(data); })
      .catch(() => { if (active) setError("Could not check GitHub connection."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!status?.connected) return;
    let active = true;
    setLoadingRepos(true);
    setError("");
    fetch("/api/github/repositories", { cache: "no-store", credentials: "same-origin" })
      .then(async response => {
        const body = await response.json() as { repositories?: Repo[]; error?: string };
        if (!response.ok) throw new Error(body.error || "Could not load repositories.");
        return body;
      })
      .then(body => {
        if (!active) return;
        const available = (body.repositories || [])
          .slice()
          .sort((a, b) => a.fullName.localeCompare(b.fullName));
        setRepos(available);
        setSelected(current => available.some(repo => repo.fullName === current)
          ? current : available[0]?.fullName || "");
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load repositories.");
      })
      .finally(() => { if (active) setLoadingRepos(false); });
    return () => { active = false; };
  }, [status?.connected]);

  const selectedRepo = useMemo(
    () => repos.find(repo => repo.fullName === selected) || null,
    [repos, selected],
  );

  if (error) return <div className="connect-private-panel">
    <p role="alert" className="connect-error">{error}</p>
    <a className="connect-install-link" href="/api/auth/github/start">
      Reconnect GitHub <ArrowRight size={14}/>
    </a>
  </div>;

  if (!status) return <p className="connect-loading" role="status">Checking GitHub connection…</p>;

  if (!status.configured) return (
    <div className="connect-unavailable" role="status">
      <LockKeyhole size={19}/>
      <p>GitHub connection is not configured on this deployment.</p>
    </div>
  );

  if (!status.connected) return (
    <div className="connect-private-panel">
      <p className="connect-private-caption">
        Connect GitHub to choose a repository you explicitly allow Secuvora to inspect.
      </p>
      <a className="connect-submit" href="/api/auth/github/start">
        <Github size={18}/> Connect GitHub <ArrowRight size={18}/>
      </a>
      <p className="connect-field-hint">Read-only repository access. Secuvora never requests permission to push code.</p>
    </div>
  );

  return <div className="connect-private-panel">
    <p className="connect-account"><CheckCircle2 size={16}/> Connected as <strong>{status.login}</strong></p>
    <label htmlFor="connect-private-repo">Repository</label>
    <select
      id="connect-private-repo"
      value={selected}
      disabled={loadingRepos || repos.length === 0}
      onChange={event => setSelected(event.target.value)}
      className="connect-repo-select"
    >
      {repos.length === 0
        ? <option value="">{loadingRepos ? "Loading repositories…" : "No authorized repositories"}</option>
        : repos.map(repo => (
          <option value={repo.fullName} key={repo.fullName}>
            {repo.fullName}{repo.private ? " · Private" : ""}
          </option>
        ))}
    </select>

    <div className="connect-repo-meta">
      {selectedRepo
        ? <span>{selectedRepo.private ? "Private repository" : "Repository"} · Read-only</span>
        : <span>Only repositories granted to the Secuvora GitHub App can appear here.</span>}
      <a
        className="connect-install-link"
        rel="noopener noreferrer"
        target="_blank"
        href="https://github.com/settings/installations"
      >
        <Settings2 size={14}/> Manage repository access
      </a>
    </div>

    {repos.length === 0 && !loadingRepos && (
      <div className="connect-empty-repos" role="status">
        <strong>No authorized repositories.</strong>
        <p>Add repositories in GitHub's Installed GitHub Apps settings, then return here and refresh.</p>
      </div>
    )}

    <button
      type="button"
      className="connect-submit"
      disabled={!selected || loadingRepos}
      onClick={() => router.push("/assess/scanning?github=" + encodeURIComponent(selected))}
    >
      Begin analysis <ArrowRight size={18}/>
    </button>
  </div>;
}
