"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Github, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type Status = { configured: boolean; connected: boolean; login: string | null };
type Repo = { fullName: string; private: boolean };

export default function PrivateRepoConnector({ onUnavailable }: { onUnavailable: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/github/status", { cache: "no-store" })
      .then(r => r.json())
      .then((data: Status) => { if (active) setStatus(data); })
      .catch(() => { if (active) setError("GitHub connection status is unavailable."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!status?.connected) return;
    let active = true;
    fetch("/api/github/repositories", { cache: "no-store" })
      .then(async res => { const json = await res.json(); if (!res.ok) throw new Error(json.error); return json; })
      .then((data: { repositories: Repo[] }) => {
        if (!active) return;
        const privateRepos = data.repositories.filter(repo => repo.private);
        setRepos(privateRepos);
        setSelected(privateRepos[0]?.fullName || "");
      }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Could not load repositories."); });
    return () => { active = false; };
  }, [status?.connected]);

  async function disconnect() {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/github/logout", { method: "POST" });
      if (!r.ok) throw new Error("Disconnect failed.");
      setStatus({ configured: true, connected: false, login: null });
      setRepos([]); setSelected("");
    } catch { setError("Couldn't disconnect. Please retry."); }
    finally { setBusy(false); }
  }

  if (!status?.configured) return (
    <>
      <button className="assess-primary" type="button" onClick={onUnavailable}>
        <Github size={20}/><span>Connect with GitHub</span><ArrowRight size={18}/>
      </button>
      <p className="assess-availability">Private GitHub App requires deployment configuration. No private repository is accessed in this state.</p>
    </>
  );

  if (!status.connected) return (
    <div className="assess-private-panel">
      <p><LockKeyhole size={15}/> Sign in through GitHub to approve access to your selected private repositories. ShipSafe never asks for your GitHub password.</p>
      <a href="/api/auth/github/start" className="assess-primary">
        <Github size={20}/><span>Authorize with GitHub</span><ArrowRight size={18}/>
      </a>
    </div>
  );

  return (
    <div className="assess-private-panel">
      <div className="assess-identity"><span><Check size={15}/> Signed in as <strong>{status.login}</strong></span>
        <button type="button" onClick={() => void disconnect()} disabled={busy}>Disconnect</button></div>
      <label className="assess-private-label" htmlFor="assess-private-repo">Authorized private repository</label>
      <select id="assess-private-repo" value={selected} onChange={e => setSelected(e.target.value)}
        className="assess-private-select" disabled={!repos.length}>
        {repos.length === 0 ? <option value="">No authorized private repositories found</option> :
          repos.map(repo => <option key={repo.fullName} value={repo.fullName}>{repo.fullName}</option>)}
      </select>
      <button className="assess-primary" disabled={!selected} type="button"
        onClick={() => router.push("/assess/scanning?private=" + encodeURIComponent(selected))}>
        <ShieldCheck size={18}/><span>Scan selected private repository</span><ArrowRight size={18}/>
      </button>
      <div className="assess-private-links">
        <Link href="/assess/history">My saved reports</Link>
        {process.env.NEXT_PUBLIC_GITHUB_APP_SLUG && <a rel="noopener noreferrer"
          href={"https://github.com/apps/" + encodeURIComponent(process.env.NEXT_PUBLIC_GITHUB_APP_SLUG) + "/installations/new"}>
          Install / manage repository access
        </a>}
      </div>
      <p className="assess-availability">Only repositories authorized through your GitHub App installation appear. Reports are encrypted and retained for up to seven days when storage is configured.</p>
      {error && <p role="alert" className="assess-public-error">{error}</p>}
    </div>
  );
}
