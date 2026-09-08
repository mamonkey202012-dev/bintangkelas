import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen, Download, Sparkles, FileText, ExternalLink, CheckCircle2,
  RefreshCw, Wand2, Save, RotateCcw, Info
} from "lucide-react";
import {
  getCurrentMaterials, getSampleText, generateMaterials, applyMaterials, resetMaterials,
} from "@/lib/api";

export default function KelolaMateri({ onApplied }) {
  const [current, setCurrent] = useState(null);
  const [sourceText, setSourceText] = useState("");
  const [loadingSample, setLoadingSample] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState(null); // generated result awaiting apply

  useEffect(() => { getCurrentMaterials().then(setCurrent); }, []);

  const loadSample = async () => {
    setLoadingSample(true);
    try {
      const r = await getSampleText();
      setSourceText(r.source_text);
      toast.success("Contoh teks buku berhasil dimuat.");
    } catch { toast.error("Gagal memuat contoh."); }
    finally { setLoadingSample(false); }
  };

  const generate = async () => {
    if (!sourceText.trim() || sourceText.trim().length < 100) {
      toast.error("Teks materi terlalu pendek. Minimal 100 karakter atau gunakan contoh.");
      return;
    }
    setGenerating(true);
    setPreview(null);
    toast.info("AI sedang membaca materi… mohon tunggu 20-40 detik.");
    try {
      const r = await generateMaterials(sourceText);
      setPreview(r);
      toast.success("Materi & kuis berhasil dibuat! Cek pratinjaunya di bawah.");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI gagal membuat materi.");
    } finally { setGenerating(false); }
  };

  const apply = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      await applyMaterials({
        topic: preview.topic,
        intro: preview.intro,
        materi: preview.materi,
        quiz: preview.quiz,
      });
      const fresh = await getCurrentMaterials();
      setCurrent(fresh);
      setPreview(null);
      toast.success("Materi baru diterapkan! Siswa akan lihat materi ini malam ini.");
      onApplied && onApplied();
    } catch { toast.error("Gagal menerapkan materi."); }
    finally { setApplying(false); }
  };

  const doReset = async () => {
    if (!window.confirm("Kembali ke materi bawaan (Sistem Pencernaan) dan hapus jawaban siswa?")) return;
    try {
      await resetMaterials();
      const fresh = await getCurrentMaterials();
      setCurrent(fresh);
      setPreview(null);
      setSourceText("");
      toast.success("Materi dikembalikan ke bawaan.");
      onApplied && onApplied();
    } catch { toast.error("Gagal reset."); }
  };

  const activeTopic = current?.topic || "Sistem Pencernaan Manusia";
  const isDefault = current?.source === "default";

  return (
    <div className="space-y-5" data-testid="kelola-materi-panel">
      {/* Info Kemdikbud box */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-amber-200/60 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-amber-900 text-[15px]">
              💡 Belum punya buku Kurikulum Merdeka?
            </div>
            <div className="text-sm text-amber-800/90 mt-0.5">
              Bapak/Ibu bisa unduh resmi <strong>gratis</strong> langsung dari Kemdikbud. Salin bagian materi yang mau diajarkan, tempel di kotak isian di bawah.
            </div>
          </div>
        </div>
        <a
          data-testid="link-kemdikbud"
          href="https://buku.kemdikbud.go.id"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm whitespace-nowrap"
        >
          <Download className="w-4 h-4" /> Unduh Buku
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      {/* Current active materi status */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDefault ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-600"}`}>
            {isDefault ? <BookOpen className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Materi Aktif</div>
            <div className="font-display font-bold text-slate-900 text-lg leading-tight">{activeTopic}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Sumber:{" "}
              <span className={`font-semibold ${isDefault ? "text-slate-600" : "text-emerald-600"}`}>
                {isDefault ? "Contoh bawaan (Sistem Pencernaan)" : "Dibuat dari buku Bapak/Ibu"}
              </span>
              {" · "}{current?.materi?.length || 0} materi{" · "}{current?.quiz?.length || 0} soal kuis
            </div>
          </div>
        </div>
        {!isDefault && (
          <button
            data-testid="btn-reset-materi"
            onClick={doReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 bg-white"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Kembalikan ke bawaan
          </button>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-start gap-2 mb-3">
          <FileText className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <div className="font-display font-bold text-slate-900">Tempel Materi dari Buku</div>
            <div className="text-xs text-slate-500">Salin 1-2 halaman materi dari buku Kurikulum Merdeka, lalu tempel di sini.</div>
          </div>
        </div>

        <textarea
          data-testid="input-source-text"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={10}
          placeholder="Tempel cuplikan bab buku di sini… (contoh: BAB 3 Sistem Pencernaan Manusia)"
          className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 resize-y font-mono leading-relaxed"
        />

        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <button
            data-testid="btn-use-sample"
            onClick={loadSample}
            disabled={loadingSample || generating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-dashed border-sky-300 text-sky-700 hover:bg-sky-50 text-sm font-semibold disabled:opacity-60"
          >
            <BookOpen className="w-4 h-4" />
            {loadingSample ? "Memuat…" : "Gunakan Contoh Teks Buku"}
          </button>
          <button
            data-testid="btn-generate-materi"
            onClick={generate}
            disabled={generating || !sourceText.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white text-sm font-bold shadow-md disabled:opacity-60"
          >
            {generating ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> AI sedang membaca materi…</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Buatkan Materi & Kuis Otomatis</>
            )}
          </button>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Ditenagai AI. Bapak/Ibu tetap bisa periksa & sesuaikan sebelum menerapkan.
        </div>
      </div>

      {/* Preview generated */}
      {preview && (
        <div className="bg-gradient-to-br from-teal-50 to-sky-50 border-2 border-teal-200 rounded-2xl p-5 space-y-4" data-testid="preview-generated">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-600">Pratinjau Hasil AI</div>
              <div className="font-display font-extrabold text-2xl text-slate-900 mt-1">{preview.topic}</div>
              <div className="text-sm text-slate-600 mt-1 italic">"{preview.intro}"</div>
            </div>
            <button
              data-testid="btn-apply-materi"
              onClick={apply}
              disabled={applying}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {applying ? "Menerapkan…" : "Terapkan untuk Siswa"}
            </button>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">📚 Materi Bacaan ({preview.materi.length})</div>
            <div className="grid gap-2">
              {preview.materi.map((m) => (
                <div key={m.id} className="bg-white rounded-xl p-3 border border-teal-100">
                  <div className="font-semibold text-slate-800 text-sm">{m.title}</div>
                  <div className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{m.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">📝 Soal Kuis ({preview.quiz.length})</div>
            <div className="grid gap-2">
              {preview.quiz.map((q, i) => (
                <div key={q.id} className="bg-white rounded-xl p-3 border border-teal-100">
                  <div className="text-xs text-slate-400 font-semibold">Soal {i + 1}</div>
                  <div className="font-semibold text-slate-800 text-sm mt-0.5">{q.question}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
                    {q.options.map((o) => (
                      <div key={o.key} className={`text-xs px-2 py-1 rounded-md border ${o.key === q.correct ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                        <span className="font-bold mr-1">{o.key.toUpperCase()}.</span>{o.text}
                        {o.key === q.correct && <span className="ml-1">✓</span>}
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5 italic">Penjelasan: {q.explanation}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-white/60 rounded-lg p-2 border border-teal-100">
            ⚠️ Menerapkan materi baru akan <strong>menghapus jawaban siswa sebelumnya</strong> agar kuis dimulai bersih.
          </div>
        </div>
      )}
    </div>
  );
}
