import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { Star, GraduationCap, Smartphone, LogOut, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import ModeSiswa from "@/components/ModeSiswa";
import ModeGuru from "@/components/ModeGuru";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import RoleSelect from "@/pages/RoleSelect";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function RoleBadge({ role }) {
  if (role === "guru") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-semibold">
        <GraduationCap className="w-3 h-3" /> Guru
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold">
      <Smartphone className="w-3 h-3" /> Siswa
    </span>
  );
}

function Shell() {
  const { user, setUser, logout } = useAuth();

  const switchRole = async () => {
    const next = user.role === "guru" ? "siswa" : "guru";
    try {
      const r = await api.post("/auth/role", { role: next }, { withCredentials: true });
      setUser(r.data);
      toast.success(`Sekarang masuk sebagai ${next === "guru" ? "Guru" : "Siswa"}`);
    } catch { toast.error("Gagal ganti peran."); }
  };

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

          {/* Right cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {(user?.is_owner || user?.role) && (
              <button
                data-testid="btn-switch-role"
                onClick={switchRole}
                title="Ganti peran"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Ganti Peran
              </button>
            )}
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
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="truncate max-w-[120px]">{user.name}</span>
                    <RoleBadge role={user.role} />
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                    {user.is_owner ? "Owner · " : ""}{user.email}
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
        </div>
      </header>

      <main className="pt-16" data-testid={`mode-${user?.role || "none"}`}>
        {user?.role === "guru" ? <ModeGuru /> : <ModeSiswa />}
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

function RoleGate({ children }) {
  const { user } = useAuth();
  if (user && !user.role) return <RoleSelect />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleGate>
              <Shell />
            </RoleGate>
          </ProtectedRoute>
        }
      />
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
