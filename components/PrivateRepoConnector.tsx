"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Github, LockKeyhole } from "lucide-react";

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
      .then(async r => { if (!r.ok) throw new Error("Connection unavailable"); return r.json() as Promise<Status>; })
      .then(data => { if (active) setStatus(data); })
      .catch(() => { if (active) setError("Could not check GitHub connection."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!status?.connected) return;
    let active = true;
    setLoadingRepos(true);
    fetch("/api/github/repositories", { cache: "no-store", credentials: "same-origin" })
      .then(async response => {
        const body = await response.json() as { repositories?: Repo[]; error?: string };
        if (!response.ok) throw new Error(body.error || "Could not load repositories.");
        return body;
      })
      .then(body => {
        if (!active) return;
        const allowed = (body.repositories || []).filter(item => item.private);
        setRepos(allowed);
        setSelected(allowed[0]?.fullName || "");
      })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Could not load repositories."); })
      .finally(() => { if (active) setLoadingRepos(false); });
    return () => { active = false; };
  }, [status?.connected]);

  if (error) return <p role="alert" className="connect-error">{error}</p>;
  if (!status) return <p className="connect-loading" role="status">Checking GitHub connection…</p>;

  if (!status.configured) return (
    <div className="connect-unavailable" role="status">
      <LockKeyhole size={19}/>
      <p>Private GitHub access isn't configured on this deployment yet.</p>
    </div>
  );

  if (!status.connected) return (
    <div className="connect-private-panel">
      <p className="connect-private-caption">Authorize GitHub to choose an accessible private repository.</p>
      <a className="connect-submit" href="/api/auth/github/start">
        <Github size={18}/> Continue with GitHub <ArrowRight size={18}/>
      </a>
    </div>
  );

  return <div className="connect-private-panel">
    <p className="connect-account"><CheckCircle2 size={16}/> Connected as <strong>{status.login}</strong></p>
    <label htmlFor="connect-private-repo">Choose repository</label>
    <select id="connect-private-repo" value={selected} disabled={loadingRepos || repos.length === 0}
      onChange={event => setSelected(event.target.value)} className="connect-repo-select">
      {repos.length === 0 ? <option value="">{loadingRepos ? "Loading repositories…" : "No authorized private repositories"}</option> :
        repos.map(repo => <option value={repo.fullName} key={repo.fullName}>{repo.fullName}</option>)}
    </select>
    {repos.length === 0 && !loadingRepos && process.env.NEXT_PUBLIC_GITHUB_APP_SLUG && (
      <a className="connect-install-link" rel="noopener noreferrer"
        href={"https://github.com/apps/" + encodeURIComponent(process.env.NEXT_PUBLIC_GITHUB_APP_SLUG) + "/installations/new"}>
        Grant repository access <ArrowRight size={14}/>
      </a>
    )}
    <button type="button" className="connect-submit" disabled={!selected || loadingRepos}
      onClick={() => router.push("/assess/scanning?private=" + encodeURIComponent(selected))}>
      Run security agent <ArrowRight size={18}/>
    </button>
  </div>;
}
