"use client";
import { useState } from "react";
import { AnalysisResult, ClaimData, PatchOp, Fix, ErrorItem } from "@/lib/schemas";

interface ResultsPanelProps {
  result: AnalysisResult;
  claimData: ClaimData;
  onApplyFix: (patch: PatchOp[]) => void;
  onReEvaluate: () => void;
  onNewClaim: () => void;
}

function severityColor(s: string) {
  if (s === "High") return { bg: "var(--red-bg)", border: "var(--red-border)", text: "var(--red)" };
  if (s === "Medium") return { bg: "var(--amber-bg)", border: "var(--amber-border)", text: "var(--amber)" };
  return { bg: "var(--green-bg)", border: "var(--green-border)", text: "var(--green)" };
}

function riskColor(level: string) {
  if (level === "High") return { bg: "var(--red-bg)", border: "var(--red-border)", text: "var(--red)" };
  if (level === "Medium") return { bg: "var(--amber-bg)", border: "var(--amber-border)", text: "var(--amber)" };
  return { bg: "var(--green-bg)", border: "var(--green-border)", text: "var(--green)" };
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "var(--green)" : value >= 50 ? "var(--amber)" : "var(--red)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{
        flex: 1, height: "4px",
        background: "var(--rule)",
        borderRadius: "2px",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${value}%`,
          height: "100%",
          background: color,
          transition: "width 0.4s ease",
        }} />
      </div>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        color: "var(--muted)",
        minWidth: "32px",
      }}>{value}%</span>
    </div>
  );
}

function FixCard({ fix, onApply }: { fix: Fix; onApply: () => void }) {
  const [applied, setApplied] = useState(false);
  return (
    <div style={{
      border: "1px solid var(--rule)",
      borderRadius: "6px",
      padding: "14px 16px",
      marginBottom: "10px",
      background: applied ? "var(--green-bg)" : "var(--paper)",
      borderColor: applied ? "var(--green-border)" : "var(--rule)",
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div style={{ fontWeight: 600, fontSize: "13px" }}>{fix.action}</div>
        <button
          onClick={() => { onApply(); setApplied(true); }}
          disabled={applied}
          style={{
            background: applied ? "var(--green)" : "var(--accent)",
            color: "#fff",
            border: "none",
            padding: "4px 12px",
            borderRadius: "3px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: applied ? "default" : "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {applied ? "✓ Applied" : "Apply Fix"}
        </button>
      </div>
      <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>{fix.explanation}</div>
      <ConfidenceBar value={fix.confidence} />
      {fix.patch && fix.patch.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: "6px",
          }}>Patch Operations</div>
          {fix.patch.map((p, i) => (
            <div key={i} style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              background: "var(--ink)",
              color: "#e2e0d9",
              padding: "4px 10px",
              borderRadius: "3px",
              marginBottom: "3px",
            }}>
              <span style={{ color: "#6b9bff" }}>set</span>
              {" "}<span style={{ color: "#fde68a" }}>{p.field}</span>
              {" → "}<span style={{ color: "#86efac" }}>{p.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorCard({ error, onApplyFix }: { error: ErrorItem; onApplyFix: (patch: PatchOp[]) => void }) {
  const [expanded, setExpanded] = useState(true);
  const colors = severityColor(error.severity);
  return (
    <div style={{
      border: `1px solid ${colors.border}`,
      borderRadius: "8px",
      marginBottom: "16px",
      overflow: "hidden",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          background: colors.bg,
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            fontWeight: 500,
            color: colors.text,
            background: "rgba(255,255,255,0.7)",
            padding: "2px 8px",
            borderRadius: "3px",
          }}>{error.id}</span>
          <span style={{ fontWeight: 600, fontSize: "13px" }}>{error.type}</span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            color: "var(--muted)",
            background: "rgba(255,255,255,0.6)",
            padding: "2px 6px",
            borderRadius: "2px",
          }}>{error.field}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: colors.text,
            fontWeight: 500,
          }}>{error.severity}</span>
          <span style={{ color: "var(--muted)", fontSize: "12px" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "16px 18px", background: "var(--surface)" }}>
          <p style={{ fontSize: "13px", marginBottom: "16px", lineHeight: 1.6 }}>{error.description}</p>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: "10px",
          }}>
            Suggested Fixes ({error.fixes.length})
          </div>
          {error.fixes.map((fix, i) => (
            <FixCard key={i} fix={fix} onApply={() => onApplyFix(fix.patch)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultsPanel({ result, claimData, onApplyFix, onReEvaluate, onNewClaim }: ResultsPanelProps) {
  const [patchApplied, setPatchApplied] = useState(false);
  const riskColors = riskColor(result.risk_level);

  // claimData is available for future use (e.g., display claim context)
  void claimData;

  const handleApplyFix = (patch: PatchOp[]) => {
    onApplyFix(patch);
    setPatchApplied(true);
  };

  return (
    <div>
      {/* Re-evaluate banner */}
      {patchApplied && (
        <div style={{
          background: "var(--accent-light)",
          border: "1px solid var(--accent)",
          borderRadius: "8px",
          padding: "14px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--accent)" }}>Fix applied to claim form</div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>Re-evaluate to see updated risk analysis</div>
          </div>
          <button
            onClick={onReEvaluate}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              padding: "8px 18px",
              borderRadius: "4px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Re-evaluate
          </button>
        </div>
      )}

      {/* Results header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "20px",
            fontWeight: 600,
            marginBottom: "4px",
          }}>
            Analysis Results
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "var(--muted)",
          }}>
            Claim ID: {result.claim_id}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onNewClaim}
            style={{
              background: "transparent",
              color: "var(--muted)",
              border: "1px solid var(--rule)",
              padding: "7px 14px",
              borderRadius: "4px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            New Claim
          </button>
        </div>
      </div>

      {/* Risk summary card */}
      <div style={{
        background: riskColors.bg,
        border: `1px solid ${riskColors.border}`,
        borderRadius: "8px",
        padding: "20px 24px",
        marginBottom: "24px",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: "24px",
        alignItems: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "36px",
            fontWeight: 700,
            color: riskColors.text,
            lineHeight: 1,
            marginBottom: "4px",
          }}>
            {result.risk_score}
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}>Risk Score</div>
        </div>
        <div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: riskColors.text,
            fontWeight: 600,
            marginBottom: "6px",
          }}>
            {result.risk_level} Risk
          </div>
          <div style={{ fontSize: "13px", lineHeight: 1.6 }}>{result.risk_summary}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: "4px",
          }}>Avg Confidence</div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "20px",
            fontWeight: 600,
            color: riskColors.text,
          }}>
            {result.avg_confidence}%
          </div>
        </div>
      </div>

      {/* Errors */}
      {result.errors.length === 0 ? (
        <div style={{
          background: "var(--green-bg)",
          border: "1px solid var(--green-border)",
          borderRadius: "8px",
          padding: "24px",
          textAlign: "center",
          marginBottom: "24px",
        }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>✓</div>
          <div style={{ fontWeight: 600, color: "var(--green)", marginBottom: "6px" }}>No errors detected</div>
          <div style={{ fontSize: "12px", color: "var(--muted)" }}>This claim appears to be ready for submission.</div>
        </div>
      ) : (
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: "14px",
          }}>
            Issues Found ({result.errors.length})
          </div>
          {result.errors.map((error) => (
            <ErrorCard key={error.id} error={error} onApplyFix={handleApplyFix} />
          ))}
        </div>
      )}

      {/* Overall assessment */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--rule)",
        borderRadius: "8px",
        padding: "20px 24px",
      }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "9px",
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: "12px",
        }}>Overall Assessment</div>
        <p style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--ink)" }}>{result.overall_assessment}</p>
      </div>
    </div>
  );
}
