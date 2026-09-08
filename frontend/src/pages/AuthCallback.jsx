import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Star } from "lucide-react";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : null;

    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const r = await api.post("/auth/session", { session_id: sessionId }, { withCredentials: true });
        setUser(r.data.user);
        // clean hash then navigate
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/", { replace: true, state: { user: r.data.user } });
      } catch (e) {
        console.error("Auth exchange failed", e);
        navigate("/login", { replace: true });
      }
    })();
  }, [location.hash, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-md mx-auto animate-pulse">
          <Star className="w-7 h-7 text-white fill-white" />
        </div>
        <div className="mt-3 font-display font-bold text-slate-800">Menyiapkan kelasmu…</div>
        <div className="text-xs text-slate-500">Sebentar ya ✨</div>
      </div>
    </div>
  );
}
