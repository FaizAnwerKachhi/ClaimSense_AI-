"use client";
import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { ClaimData, AnalysisResult } from "@/lib/schemas";

interface BatchResult {
  claim: ClaimData;
  result: AnalysisResult | null;
  error?: string;
  rowNum: number;
}

interface BatchUploadProps {
  onResults: (results: Array<{ claim: ClaimData; result: AnalysisResult }>) => void;
  onViewClaim?: (claim: ClaimData, result: AnalysisResult) => void;
}

const defaultClaim: ClaimData = {
  patient_id: "", dob: "", member_id: "", npi: "",
  pos: "", dos: "", cpt: "", icd: "", icd2: "",
  modifier: "", units: "1", billed_amount: "0",
  payer: "bcbs", prior_auth: "", clinical_notes: "",
};

function mapRowToClaimData(row: Record<string, string>): ClaimData {
  const get = (key: string) => (row[key] ?? "").trim();
  return {
    ...defaultClaim,
    patient_id: get("patient_id"),
    dob: get("dob"),
    member_id: get("member_id"),
    npi: get("npi"),
    pos: get("pos"),
    dos: get("dos"),
    cpt: get("cpt"),
    icd: get("icd"),
    icd2: get("icd2"),
    modifier: get("modifier"),
    units: get("units") || "1",
    billed_amount: get("billed_amount") || "0",
    payer: get("payer") || "bcbs",
    prior_auth: get("prior_auth"),
    clinical_notes: get("clinical_notes"),
  };
}

function severityBadge(level: string) {
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

export default function BatchUpload({ onResults, onViewClaim }: BatchUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setResults([]);
    setProcessing(true);
    setProgress(0);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        const rows = parsed.data;
        if (rows.length === 0) {
          setError("CSV file is empty or has no valid rows.");
          setProcessing(false);
          return;
        }
        const firstRow = rows[0];
        if (!("cpt" in firstRow) || !("icd" in firstRow)) {
          setError("CSV must have 'cpt' and 'icd' columns.");
          setProcessing(false);
          return;
        }

        setTotal(rows.length);
        const batchResults: BatchResult[] = [];

        for (let i = 0; i < rows.length; i++) {
          const claim = mapRowToClaimData(rows[i]);
          if (!claim.cpt || !claim.icd) {
            batchResults.push({ claim, result: null, error: "Missing required CPT or ICD code", rowNum: i + 1 });
            setProgress(i + 1);
            setResults([...batchResults]);
            continue;
          }
          try {
            const res = await fetch("/api/claims/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(claim),
            });
            if (!res.ok) {
              const data = await res.json() as { error?: string };
              batchResults.push({ claim, result: null, error: data.error ?? `HTTP ${res.status}`, rowNum: i + 1 });
            } else {
              const data = await res.json() as AnalysisResult;
              batchResults.push({ claim, result: data, rowNum: i + 1 });
            }
          } catch (e) {
            batchResults.push({ claim, result: null, error: e instanceof Error ? e.message : "Network error", rowNum: i + 1 });
          }
          setProgress(i + 1);
          setResults([...batchResults]);
          if (i < rows.length - 1) await new Promise(r => setTimeout(r, 300));
        }

        const successful = batchResults.filter((r): r is BatchResult & { result: AnalysisResult } => r.result !== null);
        onResults(successful.map(r => ({ claim: r.claim, result: r.result })));
        setProcessing(false);
      },
      error: (e) => {
        setError(`CSV parse error: ${e.message}`);
        setProcessing(false);
      },
    });
  }, [onResults]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      processFile(file);
    } else {
      setError("Please upload a .csv file");
    }
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const successful = results.filter(r => r.result !== null);
  const failed = results.filter(r => r.result === null);
  const highRisk = results.filter(r => r.result?.risk_level === "High").length;

  const dropZoneStyle: React.CSSProperties = {
    background: isDragging ? "var(--accent-light)" : "var(--surface)",
    border: `2px dashed ${isDragging ? "var(--accent)" : "var(--rule)"}`,
    borderRadius: "8px",
    padding: "48px 32px",
    textAlign: "center",
    marginBottom: "20px",
    transition: "all 0.2s",
    cursor: "pointer",
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        style={dropZoneStyle}
        onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFileChange} />
        <div style={{ marginBottom: "16px" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" style={{ margin: "0 auto" }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "18px",
          fontWeight: 600,
          marginBottom: "8px",
        }}>
          Drop your CSV file here
        </div>
        <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
          or click to browse — accepts .csv files
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          color: "var(--muted)",
          background: "var(--paper)",
          padding: "8px 16px",
          borderRadius: "4px",
          display: "inline-block",
        }}>
          Required columns: cpt, icd · Optional: icd2, modifier, patient_id, member_id, dos, payer, billed_amount, prior_auth, clinical_notes, npi, pos
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "var(--red-bg)",
          border: "1px solid var(--red-border)",
          borderRadius: "8px",
          padding: "14px 18px",
          marginBottom: "16px",
          color: "var(--red)",
          fontSize: "13px",
        }}>
          {error}
        </div>
      )}

      {/* Progress */}
      {processing && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--rule)",
          borderRadius: "8px",
          padding: "20px 24px",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}>
              Processing Claims...
            </div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: "var(--accent)",
            }}>
              {progress} / {total}
            </div>
          </div>
          <div style={{
            background: "var(--rule)",
            borderRadius: "4px",
            height: "6px",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${total > 0 ? (progress / total) * 100 : 0}%`,
              height: "100%",
              background: "var(--accent)",
              transition: "width 0.3s ease",
            }} />
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>
            Analyzing claim {progress} of {total}...
          </div>
        </div>
      )}

      {/* Summary stats */}
      {results.length > 0 && !processing && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "12px",
          marginBottom: "20px",
        }}>
          {[
            { label: "Total Claims", value: results.length, color: "var(--ink)" },
            { label: "Processed", value: successful.length, color: "var(--green)" },
            { label: "Errors", value: failed.length, color: failed.length > 0 ? "var(--red)" : "var(--muted)" },
            { label: "High Risk", value: highRisk, color: highRisk > 0 ? "var(--red)" : "var(--green)" },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "var(--surface)",
              border: "1px solid var(--rule)",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "28px",
                fontWeight: 700,
                color: stat.color,
                lineHeight: 1,
                marginBottom: "4px",
              }}>{stat.value}</div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "9px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--rule)",
          borderRadius: "8px",
          overflow: "hidden",
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--rule)" }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "9px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}>Batch Results</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
                  {["Row", "CPT", "ICD-10", "Payer", "Risk", "Score", "Errors", "Action"].map(h => (
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
                {results.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "var(--muted)" }}>
                      #{r.rowNum}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", fontWeight: 500 }}>
                      {r.claim.cpt}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px" }}>
                      {r.claim.icd}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "var(--muted)" }}>
                      {r.claim.payer || "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {r.result ? severityBadge(r.result.risk_level) : (
                        <span style={{ color: "var(--red)", fontSize: "11px" }}>Error</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px" }}>
                      {r.result ? r.result.risk_score : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "12px" }}>
                      {r.result ? r.result.errors.length : (
                        <span style={{ color: "var(--muted)", fontSize: "11px" }}>{r.error}</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {r.result && onViewClaim && (
                        <button
                          onClick={() => onViewClaim(r.claim, r.result!)}
                          style={{
                            background: "transparent",
                            color: "var(--accent)",
                            border: "1px solid var(--accent)",
                            padding: "4px 10px",
                            borderRadius: "3px",
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "9px",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sample CSV format */}
      {results.length === 0 && !processing && (
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
            marginBottom: "12px",
          }}>Sample CSV Format</div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            background: "var(--ink)",
            color: "#e2e0d9",
            padding: "16px",
            borderRadius: "6px",
            overflowX: "auto",
            lineHeight: 1.8,
          }}>
            <div style={{ color: "#6b9bff" }}>cpt,icd,icd2,modifier,patient_id,member_id,dos,payer,billed_amount,pos,npi</div>
            <div>99213,J06.9,,25,PT-001,MBR-123,2024-01-15,bcbs,150.00,11,1234567890</div>
            <div>99214,M54.5,,,,,,medicare,200.00,11,</div>
            <div>99232,J18.9,Z87.891,,PT-003,,2024-01-16,united,180.00,21,</div>
          </div>
        </div>
      )}
    </div>
  );
}
