import { useState } from "react";
import { toast } from "sonner";
import { Smartphone, GraduationCap, ArrowRight, Star, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const options = [
  {
    key: "siswa",
    title: "Saya Siswa",
    subtitle: "Kelas 6 SD",
    desc: "Chat ramah bareng Kak Bintang, baca rangkuman singkat, dan kerjakan kuis kilat sebelum pelajaran besok.",
    icon: Smartphone,
    grad: "from-sky-500 to-sky-600",
    ring: "ring-sky-200 hover:ring-sky-400",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    key: "guru",
    title: "Saya Guru",
    subtitle: "Wali kelas / pengampu IPAS",
    desc: "Dashboard rekap kelas, analisis miskonsepsi otomatis, slide adaptif AI, dan jurnal Kurikulum Merdeka siap cetak.",
    icon: GraduationCap,
    grad: "from-teal-500 to-teal-600",
    ring: "ring-teal-200 hover:ring-teal-400",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
  },
];

export default function RoleSelect() {
  const { user, setUser, logout } = useAuth();
  const [saving, setSaving] = useState(null);

  const pick = async (role) => {
    setSaving(role);
    try {
      const r = await api.post("/auth/role", { role }, { withCredentials: true });
      setUser(r.data);
      toast.success(role === "siswa" ? "Selamat belajar! 🚀" : "Selamat mengajar, Bu/Pak Guru! ✨");
    } catch {
      toast.error("Gagal menyimpan peran.");
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center p-4 sm:p-8" data-testid="role-select-page">
      <div className="w-full max-w-4xl">
        {/* Top */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-md">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-extrabold text-slate-900 text-lg">
                Bintang<span className="text-sky-600">Kelas</span>
              </div>
              <div className="text-[11px] text-slate-500">Halo, {user?.name?.split(" ")[0]} 👋</div>
            </div>
          </div>
          <button
            data-testid="btn-logout-roleselect"
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-3">
            Sekali pilih saja
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Kamu masuk sebagai…?
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-lg mx-auto">
            Pilih peran biar aku bisa tunjukkan halaman yang paling pas buat kamu. Peran ini bisa diubah kapan saja lewat menu.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {options.map((o) => (
            <button
              key={o.key}
              data-testid={`role-card-${o.key}`}
              onClick={() => pick(o.key)}
              disabled={saving !== null}
              className={`group text-left bg-white rounded-3xl p-6 border border-slate-100 shadow-sm ring-2 ring-transparent ${o.ring} transition-shadow disabled:opacity-60`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${o.grad} flex items-center justify-center shadow-md`}>
                <o.icon className="w-7 h-7 text-white" />
              </div>
              <div className={`inline-block mt-4 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${o.badge}`}>
                {o.subtitle}
              </div>
              <div className="mt-2 font-display text-xl font-bold text-slate-900">{o.title}</div>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{o.desc}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 group-hover:text-slate-950">
                {saving === o.key ? "Menyimpan…" : "Mulai"} <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>

        {user?.is_owner && (
          <div className="mt-6 text-center text-xs text-slate-400">
            Kamu adalah <span className="font-semibold text-slate-600">Owner</span>. Kamu boleh masuk sebagai Guru untuk demo,
            atau sebagai Siswa untuk melihat pengalaman siswa.
          </div>
        )}
      </div>
    </div>
  );
}
