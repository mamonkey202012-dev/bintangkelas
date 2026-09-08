import { useState } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import { Star, GraduationCap, Smartphone } from "lucide-react";
import ModeSiswa from "@/components/ModeSiswa";
import ModeGuru from "@/components/ModeGuru";

function App() {
  const [mode, setMode] = useState("siswa"); // 'siswa' | 'guru'

  return (
    <div className="App min-h-screen bg-sky-50">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm"
        data-testid="app-header"
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-md">
              <Star className="w-5 h-5 text-white fill-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-display font-extrabold text-slate-900 text-lg tracking-tight">
                Bintang<span className="text-sky-600">Kelas</span>
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                IPAS Kelas 6 · Sistem Pencernaan Manusia
              </div>
            </div>
          </div>

          {/* Mode toggle */}
          <div
            className="inline-flex bg-slate-100 rounded-full p-1 border border-slate-200"
            data-testid="header-mode-toggle-switch"
          >
            <button
              data-testid="mode-toggle-siswa"
              onClick={() => setMode("siswa")}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                mode === "siswa"
                  ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Mode Siswa</span>
              <span className="sm:hidden">Siswa</span>
            </button>
            <button
              data-testid="mode-toggle-guru"
              onClick={() => setMode("guru")}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                mode === "guru"
                  ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Mode Guru</span>
              <span className="sm:hidden">Guru</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {mode === "siswa" ? <ModeSiswa /> : <ModeGuru />}
      </main>
    </div>
  );
}

export default App;
