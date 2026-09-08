import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

export default function SlideViewer({ slides = [] }) {
  const [i, setI] = useState(0);
  const [fs, setFs] = useState(false);

  useEffect(() => { setI(0); }, [slides]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") setI((v) => Math.min(v + 1, slides.length - 1));
      if (e.key === "ArrowLeft")  setI((v) => Math.max(v - 1, 0));
      if (e.key === "Escape") setFs(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  if (!slides.length) return <div className="text-slate-500 text-sm">Belum ada slide.</div>;

  const s = slides[i];
  const accentCls = {
    sky: "accent-sky",
    teal: "accent-teal",
    amber: "accent-amber",
    emerald: "accent-emerald",
  }[s.accent] || "accent-sky";

  return (
    <div className={fs ? "fixed inset-0 z-[100] bg-slate-950 flex flex-col p-6" : ""} data-testid="slide-viewer">
      {/* Slide canvas */}
      <div className={`relative rounded-2xl overflow-hidden shadow-xl ${fs ? "flex-1" : "aspect-[16/9]"} ${accentCls}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="relative h-full w-full p-8 sm:p-12 flex flex-col text-white">
          <div className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-white/80">
            Slide {s.no} / {slides.length} · KBM IPAS Kelas 6
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl mt-3 leading-tight tracking-tight">
            {s.title}
          </h2>
          {s.subtitle && (
            <div className="text-white/80 mt-1 text-base sm:text-lg font-medium">{s.subtitle}</div>
          )}
          <ul className="mt-6 space-y-3 text-base sm:text-lg lg:text-xl">
            {s.bullets.map((b, idx) => (
              <li key={idx} className="flex gap-3 items-start">
                <span className="mt-2 w-2 h-2 rounded-full bg-white/90 flex-shrink-0" />
                <span className="leading-snug">{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-6 flex items-center justify-between text-white/70 text-xs">
            <span>BintangKelas · Sistem Pencernaan Manusia</span>
            <span>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-3">
        <button
          data-testid="slide-prev"
          onClick={() => setI((v) => Math.max(v - 1, 0))}
          disabled={i === 0}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> Sebelumnya
        </button>
        <div className="flex gap-1.5" data-testid="slide-dots">
          {slides.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              data-testid={`slide-dot-${k}`}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${k === i ? "bg-teal-500" : "bg-slate-300 hover:bg-slate-400"}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            data-testid="slide-fullscreen"
            onClick={() => setFs((f) => !f)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700"
          >
            {fs ? <><Minimize2 className="w-4 h-4" /> Keluar</> : <><Maximize2 className="w-4 h-4" /> Layar Penuh</>}
          </button>
          <button
            data-testid="slide-next"
            onClick={() => setI((v) => Math.min(v + 1, slides.length - 1))}
            disabled={i === slides.length - 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-sky-500 text-white text-sm font-semibold disabled:opacity-40"
          >
            Berikutnya <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
