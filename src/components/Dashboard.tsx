"use client";
import { AnalysisResult, ClaimData } from "@/lib/schemas";

interface HistoryItem {
  result: AnalysisResult;
  claimData: ClaimData;
  time: string;
}

interface DashboardProps {
  stats: {
    claimsAnalysed: number;
    totalErrors: number;
    fixesApplied: number;
    totalSuggestions: number;
  };
  history: HistoryItem[];
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--rule)",
      borderRadius: "8px",
      padding: "24px",
    }}>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "36px",
        fontWeight: 700,
        color: color ?? "var(--ink)",
        lineHeight: 1,
        marginBottom: "6px",
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "9px",
        letterSpacing: "2px",
        textTransform: "uppercase",
        color: "var(--muted)",
        marginBottom: sub ? "4px" : 0,
      }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: "11px", color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}

function riskBadge(level: string) {
  const colors: Record<string, { bg: string; text: string }> = {
    High: { bg: "var(--red-bg)", text: "var(--red)" },
    Medium: { bg: "var(--amber-bg)", text: "var(--amber)" },
    Low: { bg: "var(--green-bg)", text: "var(--green)" },
  };
  const c = colors[level] ?? colors.Low;
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: "9px",
      letterSpacing: "1px",
      textTransform: "uppercase",
      background: c.bg,
      color: c.text,
      padding: "2px 8px",
      borderRadius: "3px",
      fontWeight: 500,
    }}>{level}</span>
  );
}

export default function Dashboard({ stats, history }: DashboardProps) {
  const highRiskCount = history.filter(h => h.result.risk_level === "High").length;
  const avgScore = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.result.risk_score, 0) / history.length)
    : 0;

  return (
    <div>
      {/* Stats grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: "16px",
        marginBottom: "32px",
      }}>
        <StatCard label="Claims Analysed" value={stats.claimsAnalysed} sub="This session" />
        <StatCard label="Total Errors Found" value={stats.totalErrors} color={stats.totalErrors > 0 ? "var(--red)" : "var(--green)"} />
        <StatCard label="Fix Suggestions" value={stats.totalSuggestions} />
        <StatCard label="Fixes Applied" value={stats.fixesApplied} color="var(--green)" />
      </div>

      {/* Secondary stats */}
      {history.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "32px",
        }}>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--rule)",
            borderRadius: "8px",
            padding: "20px 24px",
          }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "9px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: "16px",
            }}>Risk Distribution</div>
            {["High", "Medium", "Low"].map(level => {
              const count = history.filter(h => h.result.risk_level === level).length;
              const pct = history.length > 0 ? Math.round((count / history.length) * 100) : 0;
              const colors: Record<string, string> = { High: "var(--red)", Medium: "var(--amber)", Low: "var(--green)" };
              return (
                <div key={level} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: colors[level], fontWeight: 500 }}>{level}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "var(--muted)" }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ background: "var(--rule)", borderRadius: "2px", height: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: colors[level], transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--rule)",
            borderRadius: "8px",
            padding: "20px 24px",
          }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "9px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: "16px",
            }}>Session Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 700, color: "var(--accent)" }}>{avgScore}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muted)" }}>Avg Risk Score</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: 700, color: "var(--red)" }}>{highRiskCount}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muted)" }}>High Risk Claims</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--rule)",
        borderRadius: "8px",
        overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--rule)" }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "16px",
            fontWeight: 600,
          }}>Claim History</div>
        </div>
        {history.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
            <div style={{ marginBottom: "8px", fontSize: "24px" }}>📋</div>
            No claims analyzed yet. Analyze a claim to see history here.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
                  {["Claim ID", "CPT", "ICD-10", "Risk", "Score", "Errors", "Confidence", "Time"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "9px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontWeight: 500,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "var(--accent)" }}>
                      {item.result.claim_id}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", fontWeight: 500 }}>
                      {item.claimData.cpt}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px" }}>
                      {item.claimData.icd}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {riskBadge(item.result.risk_level)}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px" }}>
                      {item.result.risk_score}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "12px" }}>
                      {item.result.errors.length}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px" }}>
                      {item.result.avg_confidence}%
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "11px", color: "var(--muted)" }}>
                      {item.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
