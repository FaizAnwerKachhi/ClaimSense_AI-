"use client";
import { ClaimData } from "@/lib/schemas";

interface ClaimFormProps {
  claimData: ClaimData;
  onChange: (data: ClaimData) => void;
  onAnalyze: () => void;
  onLoadSample: () => void;
  onClear: () => void;
  isLoading: boolean;
}

const sectionCardStyle = {
  background: "var(--surface)",
  border: "1px solid var(--rule)",
  borderRadius: "8px",
  padding: "28px 32px",
  marginBottom: "20px",
};

const sectionTitleStyle = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "9px",
  letterSpacing: "2.5px",
  textTransform: "uppercase" as const,
  color: "var(--muted)",
  marginBottom: "18px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "#444",
  marginBottom: "5px",
  letterSpacing: "0.2px",
};

const inputStyle = {
  width: "100%",
  padding: "8px 11px",
  border: "1px solid var(--rule)",
  borderRadius: "4px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "13px",
  background: "var(--paper)",
  color: "var(--ink)",
  outline: "none",
};

const hintStyle = {
  fontSize: "10px",
  color: "var(--muted)",
  marginBottom: "4px",
  fontFamily: "'IBM Plex Mono', monospace",
};

export default function ClaimForm({ claimData, onChange, onAnalyze, onLoadSample, onClear, isLoading }: ClaimFormProps) {
  const update = (field: keyof ClaimData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange({ ...claimData, [field]: e.target.value });
  };

  const SectionDivider = ({ title }: { title: string }) => (
    <div style={sectionTitleStyle}>
      {title}
      <span style={{ flex: 1, height: "1px", background: "var(--rule)", display: "block" }} />
    </div>
  );

  return (
    <div>
      {/* Patient / Provider Info */}
      <div style={sectionCardStyle}>
        <SectionDivider title="Patient & Provider" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Patient ID</label>
            <div style={hintStyle}>Internal ref</div>
            <input style={inputStyle} value={claimData.patient_id} onChange={update("patient_id")} placeholder="PT-001" />
          </div>
          <div>
            <label style={labelStyle}>Date of Birth</label>
            <div style={hintStyle}>YYYY-MM-DD</div>
            <input style={inputStyle} type="date" value={claimData.dob} onChange={update("dob")} />
          </div>
          <div>
            <label style={labelStyle}>Member ID</label>
            <div style={hintStyle}>Insurance member</div>
            <input style={inputStyle} value={claimData.member_id} onChange={update("member_id")} placeholder="MBR-123456" />
          </div>
          <div>
            <label style={labelStyle}>Provider NPI</label>
            <div style={hintStyle}>10-digit NPI</div>
            <input style={inputStyle} value={claimData.npi} onChange={update("npi")} placeholder="1234567890" maxLength={10} />
          </div>
        </div>
      </div>

      {/* Encounter Info */}
      <div style={sectionCardStyle}>
        <SectionDivider title="Encounter Details" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Place of Service</label>
            <div style={hintStyle}>POS code</div>
            <select style={inputStyle} value={claimData.pos} onChange={update("pos")}>
              <option value="">— Select —</option>
              <option value="11">11 — Office</option>
              <option value="12">12 — Home</option>
              <option value="21">21 — Inpatient Hospital</option>
              <option value="22">22 — Outpatient Hospital</option>
              <option value="23">23 — Emergency Room</option>
              <option value="24">24 — Ambulatory Surgical Center</option>
              <option value="31">31 — Skilled Nursing Facility</option>
              <option value="32">32 — Nursing Facility</option>
              <option value="02">02 — Telehealth</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date of Service</label>
            <div style={hintStyle}>YYYY-MM-DD</div>
            <input style={inputStyle} type="date" value={claimData.dos} onChange={update("dos")} />
          </div>
          <div>
            <label style={labelStyle}>Payer</label>
            <div style={hintStyle}>Insurance carrier</div>
            <select style={inputStyle} value={claimData.payer} onChange={update("payer")}>
              <option value="">— Select —</option>
              <option value="bcbs">Blue Cross Blue Shield</option>
              <option value="medicare">Medicare</option>
              <option value="medicaid">Medicaid</option>
              <option value="aetna">Aetna</option>
              <option value="cigna">Cigna</option>
              <option value="united">UnitedHealth</option>
              <option value="humana">Humana</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Billing Codes */}
      <div style={sectionCardStyle}>
        <SectionDivider title="Billing Codes" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div>
            <label style={labelStyle}>CPT Code <span style={{ color: "var(--red)" }}>*</span></label>
            <div style={hintStyle}>Procedure code</div>
            <input style={inputStyle} value={claimData.cpt} onChange={update("cpt")} placeholder="99213" required />
          </div>
          <div>
            <label style={labelStyle}>Primary ICD-10 <span style={{ color: "var(--red)" }}>*</span></label>
            <div style={hintStyle}>Diagnosis code</div>
            <input style={inputStyle} value={claimData.icd} onChange={update("icd")} placeholder="J06.9" required />
          </div>
          <div>
            <label style={labelStyle}>Secondary ICD-10</label>
            <div style={hintStyle}>Additional diagnosis</div>
            <input style={inputStyle} value={claimData.icd2} onChange={update("icd2")} placeholder="Optional" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Modifier</label>
            <div style={hintStyle}>2-char modifier</div>
            <input style={inputStyle} value={claimData.modifier} onChange={update("modifier")} placeholder="25, GT, 59..." maxLength={2} />
          </div>
          <div>
            <label style={labelStyle}>Units</label>
            <div style={hintStyle}>Service units</div>
            <input style={inputStyle} type="number" min="1" value={claimData.units} onChange={update("units")} placeholder="1" />
          </div>
          <div>
            <label style={labelStyle}>Billed Amount ($)</label>
            <div style={hintStyle}>Charge amount</div>
            <input style={inputStyle} type="number" min="0" step="0.01" value={claimData.billed_amount} onChange={update("billed_amount")} placeholder="150.00" />
          </div>
        </div>
      </div>

      {/* Authorization + Notes */}
      <div style={sectionCardStyle}>
        <SectionDivider title="Authorization & Clinical Notes" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Prior Authorization #</label>
            <div style={hintStyle}>Auth number if required</div>
            <input style={inputStyle} value={claimData.prior_auth} onChange={update("prior_auth")} placeholder="AUTH-123456" />
          </div>
          <div>
            <label style={labelStyle}>Clinical Notes</label>
            <div style={hintStyle}>Brief clinical context</div>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }}
              value={claimData.clinical_notes}
              onChange={update("clinical_notes")}
              placeholder="Patient presents with... Chief complaint... Medical necessity..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button
          onClick={onAnalyze}
          disabled={isLoading || !claimData.cpt || !claimData.icd}
          style={{
            background: isLoading || !claimData.cpt || !claimData.icd ? "#9ba8c9" : "var(--accent)",
            color: "#fff",
            border: "none",
            padding: "11px 28px",
            borderRadius: "4px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            cursor: isLoading || !claimData.cpt || !claimData.icd ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {isLoading ? (
            <>
              <span style={{
                width: "12px", height: "12px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.8s linear infinite",
              }} />
              Analyzing...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Analyze Claim
            </>
          )}
        </button>
        <button
          onClick={onLoadSample}
          style={{
            background: "transparent",
            color: "var(--accent)",
            border: "1px solid var(--accent)",
            padding: "9px 20px",
            borderRadius: "4px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Load Sample
        </button>
        <button
          onClick={onClear}
          style={{
            background: "transparent",
            color: "var(--muted)",
            border: "1px solid var(--rule)",
            padding: "9px 20px",
            borderRadius: "4px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
