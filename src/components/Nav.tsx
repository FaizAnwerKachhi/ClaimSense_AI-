"use client";

interface NavProps {
  activeTab: "single" | "batch" | "dashboard";
  onTabChange: (tab: "single" | "batch" | "dashboard") => void;
}

export default function Nav({ activeTab, onTabChange }: NavProps) {
  return (
    <nav style={{
      background: "var(--ink)",
      padding: "0 32px",
      height: "56px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "18px",
          fontWeight: 700,
          color: "#fafaf7",
          letterSpacing: "-0.3px",
        }}>
          Claim<span style={{ color: "#6b9bff" }}>Sense</span> AI
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {(["single", "batch", "dashboard"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                padding: "8px 16px",
                border: "none",
                background: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent",
                cursor: "pointer",
                color: activeTab === tab ? "#fff" : "#888",
                borderRadius: "3px",
                transition: "all 0.15s",
              }}
            >
              {tab === "single" ? "Single Claim" : tab === "batch" ? "Batch Upload" : "Dashboard"}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          letterSpacing: "2px",
          color: "#888",
          textTransform: "uppercase",
        }}>
          Pre-Submission Validator
        </span>
        <span style={{
          background: "var(--accent)",
          color: "#fff",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "9px",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          padding: "3px 8px",
          borderRadius: "3px",
        }}>
          AI · Beta
        </span>
      </div>
    </nav>
  );
}
