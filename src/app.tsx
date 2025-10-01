// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import HUD from "./ui/HUD";

export default function App() {
  // UI state
  const [isConnected, setIsConnected] = useState(false); // fake pulse
  const [leftOpen, setLeftOpen] = useState(true);
  const [hoveringDrop, setHoveringDrop] = useState(false);
  const [status, setStatus] = useState("Ready.");
  const [fps, setFps] = useState<number | null>(null);

  // Canvas + GL
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);

  // Fake a websocket connection pulse so the top bar has life
  useEffect(() => {
    const id = setInterval(() => setIsConnected((v) => !v), 2000);
    return () => clearInterval(id);
  }, []);

  // Initialize WebGL2, start a render loop, keep viewport sized
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", { antialias: true, alpha: false });
    glRef.current = gl;

    // If WebGL2 unavailable, draw a 2D placeholder so there's *something* visible
    if (!gl) {
      render2dPlaceholder();
      return;
    }

    // Initial size + viewport
    resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.04, 0.07, 0.16, 1.0); // deep slate background

    // Animation loop
    const loop = (t: number) => {
      // FPS (update ~2x/sec)
      frameCountRef.current++;
      if (!lastFpsUpdateRef.current) lastFpsUpdateRef.current = t;
      if (t - lastFpsUpdateRef.current >= 500) {
        const dt = (t - lastFpsUpdateRef.current) / 1000;
        setFps(Math.round(frameCountRef.current / dt));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = t;
      }

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // TODO: draw your 3DGS / SLAM content here.

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    // Keep canvas + viewport in sync with layout
    const ro = new ResizeObserver(() => {
      if (!gl || !canvas) return;
      if (resizeCanvasToDisplaySize(canvas)) {
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    });
    ro.observe(canvas.parentElement || canvas);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  // Drag & Drop / File input
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveringDrop(false);
    handleFiles(e.dataTransfer.files);
  };
  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setHoveringDrop(true);
  };
  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setHoveringDrop(false);
  };
  const onFilePick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!e.target.files) return;
    handleFiles(e.target.files);
    e.currentTarget.value = ""; // allow picking same file again
  };

  function handleFiles(fileList: FileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const names = files.map((f) => f.name).join(", ");
    setStatus(`Queued files: ${names}`);
    // TODO: parse / load into your renderer
  }

  const connectionPill = useMemo(
    () => (
      <span style={styles.pill} title={isConnected ? "Connected" : "Disconnected"}>
        <span
          style={{
            ...styles.dot,
            background: isConnected ? "#22c55e" : "#ef4444",
            boxShadow: isConnected
              ? "0 0 8px rgba(34,197,94,.6)"
              : "0 0 8px rgba(239,68,68,.6)",
          }}
        />
        {isConnected ? "ws: connected" : "ws: offline"}
      </span>
    ),
    [isConnected]
  );

  return (
    <div style={styles.shell}>
      {/* Top Bar */}
      <div style={styles.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <strong>3DGS SLAM Viewer (Dev)</strong>
          {connectionPill}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ ...styles.btn, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input
              type="file"
              multiple
              accept=".splat,.ply,.json"
              onChange={onFilePick}
              style={{ display: "none" }}
            />
            <span>Open…</span>
          </label>
          <button style={styles.btn} onClick={() => setLeftOpen((v) => !v)}>
            {leftOpen ? "Hide Panel" : "Show Panel"}
          </button>
          <button style={styles.btn} onClick={() => setStatus("Reset scene.")}>
            Reset Scene
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={styles.main} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
        {/* Left Panel */}
        {leftOpen && (
          <aside style={styles.left}>
            <Section title="Session">
              <Row label="Sequence" value="—" />
              <Row label="Frames" value="0" />
              <Row label="Coverage" value="0%" />
            </Section>
            <Section title="Controls">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={styles.btn} onClick={() => setStatus("Load clicked")}>
                  Load
                </button>
                <button style={styles.btn} onClick={() => setStatus("Pause clicked")}>
                  Pause
                </button>
                <button style={styles.btn} onClick={() => setStatus("Step clicked")}>
                  Step
                </button>
              </div>
            </Section>
            <Section title="Layers">
              <label style={styles.checkbox}>
                <input type="checkbox" defaultChecked /> 3DGS
              </label>
              <label style={styles.checkbox}>
                <input type="checkbox" defaultChecked /> Trajectory
              </label>
              <label style={styles.checkbox}>
                <input type="checkbox" /> Keypoints
              </label>
            </Section>
          </aside>
        )}

        {/* Canvas + HUD */}
        <div style={styles.canvasWrap}>
          <canvas ref={canvasRef} id="viewer-canvas" style={styles.canvas} />
          {/* Drag overlay */}
          {hoveringDrop && (
            <div style={styles.dropOverlay}>
              <div style={styles.dropCard}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Drop to load</div>
                <div style={{ opacity: 0.8, marginTop: 4 }}>.splat / .ply / .json</div>
              </div>
            </div>
          )}

          {/* HUD overlays the canvas */}
          <HUD
            connected={isConnected}               // or your real websocket state
            fps={fps}
            glLabel={glRef.current ? "WebGL2" : "—"}
            coveragePct={0}
            frames={0}
            onLoad={() => setStatus("Load clicked")}
            onPause={() => setStatus("Pause clicked")}
            onStep={() => setStatus("Step clicked")}
            onReset={() => setStatus("Reset scene")}
            onToggleLeftPanel={() => setLeftOpen((v) => !v)}
          />
        </div>
      </div>

      {/* Bottom Status */}
      <div style={styles.bottombar}>
        <div>{status}</div>
        <div style={{ opacity: 0.7 }}>FPS: {fps ?? "—"} | GL: {glRef.current ? "WebGL2" : "—"}</div>
      </div>
    </div>
  );
}

/* ------- tiny presentational helpers ------- */

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={styles.row}>
      <div style={{ opacity: 0.7 }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}

/* ------- canvas helpers ------- */

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const parent = canvas.parentElement || canvas;
  const width = parent.clientWidth | 0;
  const height = parent.clientHeight | 0;
  let changed = false;
  if (canvas.width !== width) {
    canvas.width = width;
    changed = true;
  }
  if (canvas.height !== height) {
    canvas.height = height;
    changed = true;
  }
  return changed;
}

function render2dPlaceholder() {
  const canvas = document.getElementById("viewer-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const resize = () => {
    const parent = canvas.parentElement || canvas;
    canvas.width = parent.clientWidth | 0;
    canvas.height = parent.clientHeight | 0;
    drawCheckerboard(ctx, canvas.width, canvas.height);
    drawCenterText(ctx, "3DGS SLAM Viewer", "(WebGL2 unavailable: 2D placeholder)");
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement || canvas);
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const size = 32;
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      const even = ((x / size) + (y / size)) % 2 === 0;
      ctx.fillStyle = even ? "#0f172a" : "#111827";
      ctx.fillRect(x, y, size, size);
    }
  }
}

function drawCenterText(ctx: CanvasRenderingContext2D, title: string, subtitle?: string) {
  const { width: w, height: h } = ctx.canvas;
  ctx.font = "600 22px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.fillStyle = "#e5e7eb";
  ctx.textAlign = "center";
  ctx.fillText(title, w / 2, h / 2 - 10);
  if (subtitle) {
    ctx.font = "400 13px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(subtitle, w / 2, h / 2 + 12);
  }
}

/* ------- inline styles (no external deps) ------- */

const styles: Record<string, React.CSSProperties> = {
  shell: {
    height: "100dvh",
    display: "grid",
    gridTemplateRows: "48px 1fr 28px",
    background: "#0b1020",
    color: "#e5e7eb",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    borderBottom: "1px solid #1f2937",
    background: "rgba(10, 15, 30, 0.9)",
    backdropFilter: "blur(6px)",
  },
  bottombar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    borderTop: "1px solid #1f2937",
    background: "rgba(10, 15, 30, 0.85)",
    fontSize: 12,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    minHeight: 0,
  },
  left: {
    width: 260,
    borderRight: "1px solid #1f2937",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  section: {
    background: "#0d142a",
    border: "1px solid #1f2937",
    borderRadius: 10,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    opacity: 0.7,
    marginBottom: 8,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 14,
    padding: "6px 0",
    borderBottom: "1px dashed rgba(148,163,184,.15)",
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
  canvasWrap: {
    position: "relative",
    minWidth: 0,
  },
  canvas: {
    width: "100%",
    height: "100%",
    display: "block",
  },
  dropOverlay: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "rgba(2,6,23,0.55)",
    outline: "2px dashed rgba(148,163,184,.6)",
    outlineOffset: -12,
  },
  dropCard: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #1f2937",
    background: "rgba(15,23,42,.9)",
    boxShadow: "0 8px 30px rgba(0,0,0,.35)",
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 0",
    fontSize: 14,
  },
};
