import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Users, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, RefreshCw,
  Presentation, ClipboardList, Copy, Printer, RotateCcw
} from "lucide-react";
import {
  listSubmissions, getMisconceptions, getDefaultSlides, getLatestSlides, generateSlides, seedDemo
} from "@/lib/api";
import SlideViewer from "@/components/SlideViewer";
import JurnalTable from "@/components/JurnalTable";

const StatCard = ({ icon: Icon, label, value, sub, tint, testid }) => (
  <div
    data-testid={testid}
    className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-3`}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white ${tint}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-display font-extrabold text-slate-900 leading-tight">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  </div>
);

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function statusBadge(score, total) {
  const pct = (score / total) * 100;
  if (pct >= 100) return { label: "Paham Utuh", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (pct >= 67)  return { label: "Cukup Paham", cls: "bg-sky-100 text-sky-700 border-sky-200" };
  return { label: "Miskonsepsi", cls: "bg-amber-100 text-amber-700 border-amber-200" };
}

export default function ModeGuru() {
  const [tab, setTab] = useState("rekap"); // rekap | slide | jurnal
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState({ total_students: 0, avg_score: 0, max_score: 3, misconceptions: [] });
  const [slides, setSlides] = useState([]);
  const [slideSource, setSlideSource] = useState("default");
  const [slideAt, setSlideAt] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [subs, ana, slid] = await Promise.all([
        listSubmissions(),
        getMisconceptions(),
        getLatestSlides(),
      ]);
      setSubmissions(subs);
      setAnalytics(ana);
      setSlides(slid.slides || []);
      setSlideSource(slid.source || "default");
      setSlideAt(slid.generated_at || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const kelasTotal = 30;
  const pahamCount = useMemo(() =>
    submissions.filter((s) => s.score === s.total).length, [submissions]);

  const handleGenerate = async () => {
    setAiLoading(true);
    toast.info("Kak Bintang sedang menyiapkan slide adaptif…");
    try {
      const res = await generateSlides();
      setSlides(res.slides || []);
      setSlideSource(res.source || "ai");
      setSlideAt(new Date().toISOString());
      if (res.source === "ai") toast.success("Slide adaptif diperbarui oleh AI!");
      else toast.warning("AI tidak tersedia, memakai slide bawaan.");
    } catch {
      toast.error("Gagal memperbarui slide.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleResetDemo = async () => {
    // clear & reseed
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/submissions`, { method: "DELETE" });
      await seedDemo();
      toast.success("Data demo di-reset.");
      load();
    } catch { toast.error("Gagal reset."); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8" data-testid="mode-guru-container">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-teal-600 font-semibold">Dashboard KBM</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Selamat pagi, Bu Guru <span className="text-teal-600">✨</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Rekap belajar semalam · Materi <span className="font-semibold text-slate-700">Sistem Pencernaan Manusia</span>
          </p>
        </div>
        <button
          data-testid="btn-reset-demo"
          onClick={handleResetDemo}
          className="self-start sm:self-auto inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Data Demo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard testid="stat-total" icon={Users} label="Siswa Akses"
          value={`${analytics.total_students}/${kelasTotal}`} sub={`${Math.round((analytics.total_students/kelasTotal)*100)}% kelas`}
          tint="bg-gradient-to-br from-sky-500 to-sky-600" />
        <StatCard testid="stat-avg" icon={TrendingUp} label="Rata-rata Skor"
          value={`${analytics.avg_score}/${analytics.max_score}`} sub="Kuis diagnostik 3 soal"
          tint="bg-gradient-to-br from-teal-500 to-teal-600" />
        <StatCard testid="stat-misconception" icon={AlertTriangle} label="Miskonsepsi"
          value={analytics.misconceptions.filter(m => m.wrong_percent >= 30).length}
          sub="Topik perlu dibedah"
          tint="bg-gradient-to-br from-amber-500 to-amber-600" />
        <StatCard testid="stat-paham" icon={CheckCircle2} label="Paham Utuh"
          value={pahamCount} sub={`dari ${analytics.total_students} siswa`}
          tint="bg-gradient-to-br from-emerald-500 to-emerald-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
        {[
          { k: "rekap", label: "Rekap & Miskonsepsi", icon: ClipboardList },
          { k: "slide", label: "Slide KBM", icon: Presentation },
          { k: "jurnal", label: "Jurnal Harian", icon: ClipboardList },
        ].map((t) => (
          <button
            key={t.k}
            data-testid={`tab-${t.k}`}
            onClick={() => setTab(t.k)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
              tab === t.k ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-slate-500 text-sm">Memuat data kelas…</div>}

      {!loading && tab === "rekap" && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-display font-bold text-slate-900">Rekap Penyelesaian Kuis</div>
                <div className="text-xs text-slate-500">Diurutkan berdasarkan waktu kirim terbaru</div>
              </div>
              <span className="text-xs text-slate-500">{submissions.length} entri</span>
            </div>
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-sm" data-testid="submissions-table">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Absen</th>
                    <th className="text-left px-4 py-2 font-semibold">Nama Siswa</th>
                    <th className="text-left px-4 py-2 font-semibold">Waktu Kirim</th>
                    <th className="text-center px-4 py-2 font-semibold">Skor</th>
                    <th className="text-left px-4 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((s) => {
                    const b = statusBadge(s.score, s.total);
                    return (
                      <tr key={s.id} className="hover:bg-sky-50/40" data-testid={`row-sub-${s.absen_no}`}>
                        <td className="px-4 py-2.5 text-slate-500 font-mono">{s.absen_no}</td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium">{s.student_name}</td>
                        <td className="px-4 py-2.5 text-slate-500">{formatTime(s.submitted_at)}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-slate-900">{s.score}/{s.total}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${b.cls}`}>{b.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {submissions.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-slate-400 py-8">Belum ada siswa yang mengirim.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Misconceptions */}
          <div className="space-y-3" data-testid="misconception-cards">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <div className="font-display font-bold text-amber-900">Analisis Miskonsepsi</div>
              </div>
              <p className="text-xs text-amber-800/80">Soal dengan tingkat kesalahan tertinggi. Fokus bedah ini di KBM pagi.</p>
            </div>
            {analytics.misconceptions.map((m, i) => (
              <div key={m.question_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4" data-testid={`miscon-${m.question_id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">{`Soal #${i+1} · ${m.concept.replaceAll("_"," ")}`}</div>
                  <div className={`text-xs font-bold ${m.wrong_percent >= 50 ? "text-rose-600" : m.wrong_percent >= 30 ? "text-amber-600" : "text-emerald-600"}`}>
                    {m.wrong_percent}% salah
                  </div>
                </div>
                <div className="text-sm text-slate-800 leading-snug mb-2">{m.question}</div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${m.wrong_percent >= 50 ? "bg-rose-500" : m.wrong_percent >= 30 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${m.wrong_percent}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {m.wrong_count} dari {m.total_count} siswa menjawab salah
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === "slide" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-display font-bold text-slate-900 flex items-center gap-2">
                <Presentation className="w-4 h-4 text-teal-600" />
                Slide Presentasi Adaptif (5 Slide)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Sumber: <span className={`font-semibold ${slideSource === "ai" ? "text-teal-600" : "text-slate-600"}`}>
                  {slideSource === "ai" ? "AI (fokus miskonsepsi terbaru)" : "Bawaan (siap tayang)"}
                </span>
                {slideAt && <> · {formatTime(slideAt)}</>}
              </div>
            </div>
            <button
              data-testid="btn-generate-slides"
              onClick={handleGenerate}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-sky-500 text-white text-sm font-semibold shadow disabled:opacity-60"
            >
              {aiLoading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Menganalisis miskonsepsi…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Perbarui Slide dengan AI</>
              )}
            </button>
          </div>
          <div className="p-5">
            <SlideViewer slides={slides} />
          </div>
        </div>
      )}

      {!loading && tab === "jurnal" && (
        <JurnalTable analytics={analytics} submissions={submissions} />
      )}
    </div>
  );
}
