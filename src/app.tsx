// src/app.tsx (snippet)
import { useEffect, useRef, useState } from "react";
import { NullRenderer } from "@render/null/NullRenderer";
import type { IRenderer } from "@render/IRenderer";


export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer] = useState<IRenderer>(() => new NullRenderer());

  useEffect(() => {
    const canvas = canvasRef.current!;
    renderer.init(canvas);
    const onResize = () => renderer.resize(canvas.clientWidth, canvas.clientHeight);
    onResize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); renderer.dispose(); };
  }, [renderer]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      renderer.beginFrame();
      // setCamera(view, proj); // supply your matrices here
      renderer.draw({ instanceCount: 123456, tileIds: [1, 2, 3] });
      renderer.endFrame();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [renderer]);

  const stats = renderer.getStats();
  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="hud">
        frame {stats.frame} · inst {stats.instancesDrawn} · tiles {stats.tilesResident} · gpu {stats.gpuMs} ms
      </div>
    </>
  );
}
