import React, { useEffect, useMemo, useState } from "react";

export type HUDProps = {
  connected?: boolean;
  fps?: number | null;
  glLabel?: string;
  coveragePct?: number; // 0..100
  frames?: number;
  onLoad?: () => void;
  onPause?: () => void;
  onStep?: () => void;
  onReset?: () => void;
  onToggleLeftPanel?: () => void;
};

/**
 * Barebones overlay HUD for your 3DGS SLAM viewer.
 * - Sits on top-right by default
 * - Minimal buttons for common actions
 * - Compact status readouts (ws, fps, gl, frames, coverage)
 * - Small Help popover with keyboard hints
 * Dependency-free, inline styles only.
 */
export default function HUD({
  connected = false,
  fps = null,
  glLabel = "—",
  coveragePct = 0,
  frames = 0,
  onLoad,
  onPause,
  onStep,
  onReset,
  onToggleLeftPanel,
}: HUDProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  // ESC toggles help
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?") setHelpOpen((v) => !v);
      if (e.key === "Escape") setHelpOpen(false);
      if (e.key.toLowerCase() === "l") onLoad?.();
      if (e.key.toLowerCase() === "p") onPause?.();
      if (e.key.toLowerCase() === "s") onStep?.();
      if (e.key.toLowerCase() === "r") onReset?.();
      if (e.key.toLowerCase() === "b") onToggleLeftPanel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onLoad, onPause, onStep, onReset, onToggleLeftPanel]);

  const wsPill = useMemo(
    () => (
      <span style={styles.pill} title={connected ? "Connected" : "Disconnected"}>
        <span
          style={{
            ...styles.dot,
            background: connected ? "#22c55e" : "#ef4444",
            boxShadow: connected
              ? "0 0 8px rgba(34,197,94,.6)"
              : "0 0 8px rgba(239,68,68,.6)",
          }}
        />
        {connected ? "ws: connected" : "ws: offline"}
      </span>
    ),
    [connected]
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.rowBetween}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <strong style={{ fontSize: 13 }}>HUD</strong>
            {wsPill}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={styles.btn} onClick={() => setHelpOpen((v) => !v)} title="?">?</button>
          </div>
        </div>

        <div style={{ height: 8 }} />

        <div style={styles.grid2}>
          <Stat label="FPS" value={fmt(fps)} />
          <Stat label="GL" value={glLabel} />
          <Stat label="Frames" value={String(frames)} />
          <Stat label="Coverage" value={`${Math.max(0, Math.min(100, coveragePct)).toFixed(0)}%`} />
        </div>

        <div style={{ height: 8 }} />

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button style={styles.btn} onClick={onLoad} title="L">Load</button>
          <button style={styles.btn} onClick={onPause} title="P">Pause</button>
          <button style={styles.btn} onClick={onStep} title="S">Step</button>
          <button style={styles.btn} onClick={onReset} title="R">Reset</button>
          <button style={styles.btn} onClick={onToggleLeftPanel} title="B">Panel</button>
        </div>
      </div>

      {helpOpen && <HelpCard onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function HelpCard({ onClose }: { onClose: () => void }) {
  return (
    <div style={styles.helpWrap}>
      <div style={styles.helpCard}>
        <div style={styles.rowBetween}>
          <strong>Shortcuts</strong>
          <button style={styles.btn} onClick={onClose}>Close</button>
        </div>
        <div style={{ height: 8 }} />
        <ul style={styles.ul}>
          <li><kbd style={styles.kbd}>L</kbd> Load</li>
          <li><kbd style={styles.kbd}>P</kbd> Pause / Resume</li>
          <li><kbd style={styles.kbd}>S</kbd> Step</li>
          <li><kbd style={styles.kbd}>R</kbd> Reset scene</li>
          <li><kbd style={styles.kbd}>B</kbd> Toggle left panel</li>
          <li><kbd style={styles.kbd}>?</kbd> Toggle this help</li>
          <li><kbd style={styles.kbd}>Esc</kbd> Close dialogs</li>
        </ul>
      </div>
    </div>
  );
}

function fmt(v: number | null | undefined) {
  if (v == null) return "—";
  return String(v);
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    top: 12,
    right: 12,
    pointerEvents: "none", // let clicks pass through except on cards
    zIndex: 20,
  },
  card: {
    pointerEvents: "auto",
    minWidth: 220,
    background: "rgba(15,23,42,0.9)",
    border: "1px solid #1f2937",
    borderRadius: 12,
    padding: 10,
    color: "#e5e7eb",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
  },
  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
  },
  stat: {
    padding: 8,
    border: "1px solid #243042",
    borderRadius: 8,
    background: "#0b1224",
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 14,
  },
  btn: {
    appearance: "none",
    border: "1px solid #334155",
    background: "#111827",
    color: "#e5e7eb",
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid #1f2937",
    background: "#0b1224",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  helpWrap: {
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    right: 0,
    insetInlineStart: "auto",
    marginTop: 8,
  },
  helpCard: {
    pointerEvents: "auto",
    marginTop: 8,
    minWidth: 260,
    background: "rgba(15,23,42,0.95)",
    border: "1px solid #1f2937",
    borderRadius: 12,
    padding: 12,
    color: "#e5e7eb",
    boxShadow: "0 10px 30px rgba(0,0,0,.45)",
  },
  ul: {
    margin: 0,
    paddingLeft: 16,
    lineHeight: 1.6,
    fontSize: 13,
  },
  kbd: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 12,
    padding: "1px 6px",
    border: "1px solid #475569",
    borderRadius: 6,
    background: "#0b1224",
    marginRight: 6,
  },
};
