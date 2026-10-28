"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, FileCode2, Trash2, ShieldCheck, RefreshCw } from "lucide-react";
type ReportItem = { runId: string; appName: string; finishedAt: string; findings: number; revision?: string };
export default function SavedReports() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/reports", { cache: "no-store" });
      const data = await r.json() as { reports?: ReportItem[]; error?: string };
      if (!r.ok) throw new Error(data.error || "Could not load your reports.");
      setItems(data.reports || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load reports."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function remove(item: ReportItem) {
    if (!window.confirm("Delete the saved security report for " + item.appName + "? This cannot be undone.")) return;
    setDeleting(item.runId);
    try {
      const response = await fetch("/api/assessments/" + encodeURIComponent(item.runId) + "/report",
        { method: "DELETE", credentials: "same-origin" });
      if (!response.ok) throw new Error("Delete failed. Retry later.");
      setItems(current => current.filter(x => x.runId !== item.runId));
    } catch(e) { setError(e instanceof Error ? e.message : "Delete failed."); }
    finally { setDeleting(null); }
  }

  return <div className="assess-page">
    <header className="assess-header"><div className="assess-container assess-header-inner">
      <Link href="/" className="brand">shipsafe<span>.</span></Link>
      <Link className="assess-back" href="/assess"><ArrowLeft size={15}/> Back to assessment</Link>
    </div></header>
    <main className="assess-container" style={{padding:"70px 0 110px", maxWidth:840}}>
      <p className="assess-eyebrow">PRIVATE / ENCRYPTED / TIME LIMITED</p>
      <h1 style={{fontSize:"clamp(42px,6vw,68px)",letterSpacing:"-.07em",lineHeight:1.08,margin:"13px 0 17px"}}>Your saved reports<span style={{color:"#779ccc"}}>.</span></h1>
      <p className="assess-lead">Reports from authorized private scans are encrypted at rest and recoverable for up to seven days. You can remove them earlier. Public reports stay in the browser tab unless exported.</p>
      <button onClick={() => void load()} disabled={loading} type="button" className="assess-flow-toggle">
        <RefreshCw size={14}/> Refresh reports
      </button>
      {loading && <p role="status" style={{marginTop:26}}>Checking your saved reports…</p>}
      {error && <div role="alert" style={{padding:18,marginTop:25,border:"1px solid #e7e0dc",borderRadius:12}}>{error} <Link href="/assess">Connect with GitHub</Link></div>}
      {!loading && !error && items.length===0 && <div className="assess-flow-inner" style={{marginTop:25}}>
        <ShieldCheck size={23}/><div><strong>No saved reports yet</strong><p>Once an authorized private scan finishes, its complete report will appear here.</p></div>
      </div>}
      <div style={{display:"grid",gap:12,marginTop:27}}>
        {items.map(item => <div key={item.runId} className="assess-connect-card" style={{display:"flex",alignItems:"center",gap:15,flexWrap:"wrap",padding:19}}>
          <div className="assess-github-icon"><FileCode2 size={21}/></div>
          <div style={{flex:"1 1 190px",minWidth:0}}>
            <strong style={{fontSize:13,overflowWrap:"anywhere"}}>{item.appName}</strong>
            <p className="assess-card-description" style={{margin:"6px 0 0"}}>{item.findings} candidate findings · {new Date(item.finishedAt).toLocaleDateString()}</p>
          </div>
          <Link className="assess-flow-toggle" href={"/assess/results?run=" + encodeURIComponent(item.runId)}>Open <ArrowRight size={14}/></Link>
          <button className="assess-flow-toggle" onClick={() => void remove(item)} disabled={deleting===item.runId} aria-label={"Delete report for "+item.appName}>
            <Trash2 size={14}/> Delete
          </button>
        </div>)}
      </div>
    </main>
  </div>;
}
