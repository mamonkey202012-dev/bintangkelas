import { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { Star, GraduationCap, Smartphone, LogOut } from "lucide-react";
import ModeSiswa from "@/components/ModeSiswa";
import ModeGuru from "@/components/ModeGuru";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function Shell() {
  const [mode, setMode] = useState("siswa");
  const { user, logout } = useAuth();

  return (
    <div className="App min-h-screen bg-sky-50">
      <header
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm"
        data-testid="app-header"
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
              <Star className="w-5 h-5 text-white fill-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-display font-extrabold text-slate-900 text-lg tracking-tight">
                Bintang<span className="text-sky-600">Kelas</span>
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block truncate">
                IPAS Kelas 6 · Sistem Pencernaan Manusia
              </div>
            </div>
          </div>

          <div
            className="inline-flex bg-slate-100 rounded-full p-1 border border-slate-200"
            data-testid="header-mode-toggle-switch"
          >
            <button
              data-testid="mode-toggle-siswa"
              onClick={() => setMode("siswa")}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                mode === "siswa" ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow" : "text-slate-600 hover:text-slate-900"
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
                mode === "guru" ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Mode Guru</span>
              <span className="sm:hidden">Guru</span>
            </button>
          </div>

          {/* User chip */}
          {user && (
            <div className="flex items-center gap-2" data-testid="user-chip">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="hidden md:block leading-tight">
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">{user.name}</div>
                <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                  {user.is_owner ? "Owner" : user.email}
                </div>
              </div>
              <button
                data-testid="btn-logout"
                onClick={logout}
                title="Keluar"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="pt-16">
        {mode === "siswa" ? <ModeSiswa /> : <ModeGuru />}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50" data-testid="auth-loading">
        <div className="text-slate-500 text-sm">Memuat…</div>
      </div>
    );
  }
  if (!user && !location.state?.user) return <Navigate to="/login" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  // Detect session_id in URL fragment SYNCHRONOUSLY during render
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Shell /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
