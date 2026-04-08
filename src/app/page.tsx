"use client";
import { useState, useCallback } from "react";
import Nav from "@/components/Nav";
import ClaimForm from "@/components/ClaimForm";
import ResultsPanel from "@/components/ResultsPanel";
import BatchUpload from "@/components/BatchUpload";
import Dashboard from "@/components/Dashboard";
import { ClaimData, AnalysisResult, PatchOp } from "@/lib/schemas";

type Tab = "single" | "batch" | "dashboard";

interface HistoryItem {
  result: AnalysisResult;
  claimData: ClaimData;
  time: string;
}

const EMPTY_CLAIM: ClaimData = {
  patient_id: "",
  dob: "",
  member_id: "",
  npi: "",
  pos: "",
  dos: "",
  cpt: "",
  icd: "",
  icd2: "",
  modifier: "",
  units: "1",
  billed_amount: "0",
  payer: "bcbs",
  prior_auth: "",
  clinical_notes: "",
};

const SAMPLE_CLAIM: ClaimData = {
  patient_id: "PT-0042",
  dob: "1975-06-15",
  member_id: "MBR-987654",
  npi: "1234567890",
  pos: "11",
  dos: new Date().toISOString().split("T")[0],
  cpt: "99213",
  icd: "J06.9",
  icd2: "",
  modifier: "",
  units: "1",
  billed_amount: "150.00",
  payer: "bcbs",
  prior_auth: "",
  clinical_notes: "Patient presents with acute upper respiratory infection. Prescribed amoxicillin. Follow-up in 2 weeks.",
};

function applyPatch(claimData: ClaimData, patches: PatchOp[]): ClaimData {
  const updated = { ...claimData };
  for (const patch of patches) {
    if (patch.op === "set" && patch.field in updated) {
      (updated as Record<string, string>)[patch.field] = patch.value;
    }
  }
  return updated;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("single");
  const [claimData, setClaimData] = useState<ClaimData>(EMPTY_CLAIM);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({
    claimsAnalysed: 0,
    totalErrors: 0,
    fixesApplied: 0,
    totalSuggestions: 0,
  });

  const analyze = useCallback(async (claim: ClaimData) => {
    if (!claim.cpt || !claim.icd) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/claims/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claim),
      });
      const data = await res.json() as AnalysisResult & { error?: string };
      if (!res.ok || data.error) {
        setErrorMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setAnalysisResult(data);
      const totalSugg = data.errors.reduce((s, e) => s + e.fixes.length, 0);
      const newHistoryItem: HistoryItem = {
        result: data,
        claimData: { ...claim },
        time: new Date().toLocaleTimeString(),
      };
      setHistory(prev => [...prev, newHistoryItem]);
      setStats(prev => ({
        claimsAnalysed: prev.claimsAnalysed + 1,
        totalErrors: prev.totalErrors + data.errors.length,
        fixesApplied: prev.fixesApplied,
        totalSuggestions: prev.totalSuggestions + totalSugg,
      }));
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAnalyze = () => analyze(claimData);

  const handleApplyFix = (patches: PatchOp[]) => {
    const updated = applyPatch(claimData, patches);
    setClaimData(updated);
    setStats(prev => ({ ...prev, fixesApplied: prev.fixesApplied + 1 }));
  };

  const handleReEvaluate = () => {
    setAnalysisResult(null);
    analyze(claimData);
  };

  const handleBatchResults = (results: Array<{ claim: ClaimData; result: AnalysisResult }>) => {
    const newHistoryItems = results.map(r => ({
      result: r.result,
      claimData: r.claim,
      time: new Date().toLocaleTimeString(),
    }));
    setHistory(prev => [...prev, ...newHistoryItems]);
    const totalErrors = results.reduce((s, r) => s + r.result.errors.length, 0);
    const totalSugg = results.reduce((s, r) => s + r.result.errors.reduce((ss, e) => ss + e.fixes.length, 0), 0);
    setStats(prev => ({
      claimsAnalysed: prev.claimsAnalysed + results.length,
      totalErrors: prev.totalErrors + totalErrors,
      fixesApplied: prev.fixesApplied,
      totalSuggestions: prev.totalSuggestions + totalSugg,
    }));
  };

  const handleViewBatchClaim = (claim: ClaimData, result: AnalysisResult) => {
    setClaimData(claim);
    setAnalysisResult(result);
    setActiveTab("single");
  };

  return (
    <>
      <Nav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); }} />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
            marginBottom: "6px",
          }}>
            Pre-Submission <span style={{ color: "var(--accent)" }}>Claim Validator</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: "560px" }}>
            AI-powered analysis of medical claims before submission — catch errors, reduce denials, maximize reimbursement.
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "4px",
          marginBottom: "24px",
          borderBottom: "1.5px solid var(--rule)",
        }}>
          {(["single", "batch", "dashboard"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: activeTab === tab ? "var(--accent)" : "var(--muted)",
                borderBottom: `2px solid ${activeTab === tab ? "var(--accent)" : "transparent"}`,
                marginBottom: "-1.5px",
                transition: "all 0.15s",
                fontWeight: activeTab === tab ? 500 : 400,
              }}
            >
              {tab === "single" ? "Single Claim" : tab === "batch" ? "Batch Upload" : "Dashboard"}
            </button>
          ))}
        </div>

        {/* Single Claim Tab */}
        {activeTab === "single" && (
          <div>
            {errorMessage && (
              <div style={{
                background: "var(--red-bg)",
                border: "1px solid var(--red-border)",
                borderRadius: "8px",
                padding: "14px 18px",
                marginBottom: "20px",
                color: "var(--red)",
                fontSize: "13px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span>{errorMessage}</span>
                <button onClick={() => setErrorMessage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)", fontSize: "16px" }}>×</button>
              </div>
            )}

            {isLoading ? (
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--rule)",
                borderRadius: "8px",
                padding: "48px 32px",
                textAlign: "center",
              }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  border: "2.5px solid var(--rule)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 16px",
                }} />
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}>Analyzing Claim...</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px" }}>
                  AI is checking for billing compliance issues
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : analysisResult ? (
              <ResultsPanel
                result={analysisResult}
                claimData={claimData}
                onApplyFix={handleApplyFix}
                onReEvaluate={handleReEvaluate}
                onNewClaim={() => { setAnalysisResult(null); setClaimData(EMPTY_CLAIM); }}
              />
            ) : (
              <ClaimForm
                claimData={claimData}
                onChange={setClaimData}
                onAnalyze={handleAnalyze}
                onLoadSample={() => setClaimData(SAMPLE_CLAIM)}
                onClear={() => setClaimData(EMPTY_CLAIM)}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {/* Batch Tab */}
        {activeTab === "batch" && (
          <BatchUpload onResults={handleBatchResults} onViewClaim={handleViewBatchClaim} />
        )}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <Dashboard stats={stats} history={history} />
        )}
      </div>
    </>
  );
}
