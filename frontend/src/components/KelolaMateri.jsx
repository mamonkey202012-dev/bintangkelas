import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen, Download, Sparkles, FileText, ExternalLink, CheckCircle2,
  RefreshCw, Wand2, Save, RotateCcw, Info, Share2, Link as LinkIcon,
  Copy, History, Trash2, RotateCw, Smile, Zap, Flame, Upload, FileUp
} from "lucide-react";
import {
  getCurrentMaterials, getSampleText, generateMaterials, applyMaterials, resetMaterials,
  listHistory, applyFromHistory, deleteHistory, extractFile,
} from "@/lib/api";

const DIFFICULTIES = [
  { key: "mudah",  label: "Mudah",   sub: "Ingat & sebut ulang", icon: Smile, cls: "from-emerald-400 to-emerald-600" },
  { key: "sedang", label: "Sedang",  sub: "Paham konsep",        icon: Zap,   cls: "from-sky-400 to-teal-500" },
  { key: "susah",  label: "Susah",   sub: "Terapkan & analisis", icon: Flame, cls: "from-amber-500 to-rose-500" },
];

function ShareCard({ topic }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.origin + "/";
  const text =
    `Halo teman-teman & Bapak/Ibu Wali 🌟\n` +
    `Malam ini Kak Bintang akan menemani belajar *${topic}*.\n` +
    `Yuk buka: ${shareUrl}\n(Pilih *Saya Siswa* setelah login Google, cukup 3 menit ya!)`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast.success("Link disalin!");
    } catch { toast.error("Gagal menyalin."); }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 rounded-2xl p-4 sm:p-5" data-testid="share-card">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-200/60 text-emerald-700 flex items-center justify-center flex-shrink-0">
          <Share2 className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-emerald-900 text-[15px]">
            Bagikan Kuis ke Grup Wali Kelas 💬
          </div>
          <div className="text-sm text-emerald-900/80 mt-0.5">
            Kirim link ini ke grup WhatsApp orang tua siswa. Anak-anak akan diarahkan otomatis ke chat Kak Bintang.
          </div>

          <div className="mt-3 flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex-1 bg-white border border-emerald-100 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono truncate flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate" data-testid="share-url">{shareUrl}</span>
            </div>
            <button
              data-testid="btn-copy-link"
              onClick={copy}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Copy className="w-4 h-4" /> {copied ? "Tersalin" : "Salin"}
            </button>
            <a
              data-testid="btn-share-whatsapp"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1FB758] text-white text-sm font-bold shadow whitespace-nowrap"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
              </svg>
              Bagikan lewat WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistorySection({ onApplied }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await listHistory();
      setItems(r.items || []);
    } catch {
      setItems([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const reapply = async (id) => {
    setBusyId(id);
    try {
      await applyFromHistory(id);
      toast.success("Materi dipakai ulang! Siswa akan lihat materi ini.");
      onApplied && onApplied();
    } catch { toast.error("Gagal memakai ulang."); }
    finally { setBusyId(null); }
  };

  const remove = async (id) => {
    if (!window.confirm("Hapus materi ini dari riwayat?")) return;
    setBusyId(id);
    try {
      await deleteHistory(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      toast.success("Dihapus dari riwayat.");
    } catch { toast.error("Gagal menghapus."); }
    finally { setBusyId(null); }
  };

  const badge = (d) => {
    const map = { mudah: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  sedang:"bg-sky-50 text-sky-700 border-sky-200",
                  susah: "bg-rose-50 text-rose-700 border-rose-200" };
    return map[d] || "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm" data-testid="history-panel">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <div>
            <div className="font-display font-bold text-slate-900">Riwayat Materi Bapak/Ibu</div>
            <div className="text-xs text-slate-500">Materi yang pernah dibuat — pakai lagi di semester berikutnya.</div>
          </div>
        </div>
        <span className="text-xs text-slate-500">{items.length} tersimpan</span>
      </div>
      <div className="p-4">
        {loading && <div className="text-slate-500 text-sm">Memuat…</div>}
        {!loading && items.length === 0 && (
          <div className="text-sm text-slate-500 text-center py-6">
            Belum ada riwayat. Setiap materi yang Bapak/Ibu terapkan akan otomatis tersimpan di sini.
          </div>
        )}
        <div className="grid gap-2">
          {items.map((it) => (
            <div key={it.id} data-testid={`history-item-${it.id}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/60">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm truncate">{it.topic}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>{new Date(it.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <span>·</span>
                  <span>{it.materi?.length || 0} materi</span>
                  <span>·</span>
                  <span>{it.quiz?.length || 0} soal</span>
                  {it.difficulty && (
                    <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${badge(it.difficulty)}`}>
                      {it.difficulty}
                    </span>
                  )}
                </div>
              </div>
              <button
                data-testid={`btn-reuse-${it.id}`}
                onClick={() => reapply(it.id)}
                disabled={busyId === it.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold disabled:opacity-60"
              >
                <RotateCw className="w-3.5 h-3.5" /> Pakai Lagi
              </button>
              <button
                data-testid={`btn-delete-${it.id}`}
                onClick={() => remove(it.id)}
                disabled={busyId === it.id}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function KelolaMateri({ onApplied }) {
  const [current, setCurrent] = useState(null);
  const [sourceText, setSourceText] = useState("");
  const [difficulty, setDifficulty] = useState("sedang");
  const [loadingSample, setLoadingSample] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState(null);

  const refresh = async () => {
    const fresh = await getCurrentMaterials();
    setCurrent(fresh);
    setHistoryKey((k) => k + 1);
    onApplied && onApplied();
  };

  useEffect(() => { getCurrentMaterials().then(setCurrent); }, []);

  const handleFile = async (file) => {
    if (!file) return;
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      toast.warning(`File terlalu besar (${mb} MB). Maksimal 5 MB — coba kompres dulu.`);
      return;
    }
    const ok = /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name) || file.type.startsWith("image/") || file.type === "application/pdf";
    if (!ok) {
      toast.error("Format tidak didukung. Gunakan PDF atau gambar (JPG/PNG).");
      return;
    }
    setUploading(true);
    setUploadedName(null);
    const isPdf = /pdf/i.test(file.type) || /\.pdf$/i.test(file.name);
    toast.info(isPdf ? "Membaca isi PDF…" : "AI sedang membaca gambar halaman buku…");
    try {
      const r = await extractFile(file);
      const prev = sourceText.trim();
      setSourceText(prev ? `${prev}\n\n${r.text}` : r.text);
      setUploadedName(file.name);
      toast.success(`Berhasil! ${r.text.length} karakter berhasil diambil dari ${isPdf ? "PDF" : "gambar"}.`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal membaca file.");
    } finally { setUploading(false); }
  };

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
    toast.info(`AI membuat kuis tingkat ${difficulty}… mohon tunggu 20-40 detik.`);
    try {
      const r = await generateMaterials(sourceText, difficulty);
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
        difficulty: preview.difficulty || difficulty,
      });
      await refresh();
      setPreview(null);
      toast.success("Materi diterapkan! Otomatis tersimpan ke riwayat.");
    } catch { toast.error("Gagal menerapkan materi."); }
    finally { setApplying(false); }
  };

  const doReset = async () => {
    if (!window.confirm("Kembali ke materi bawaan dan hapus jawaban siswa?")) return;
    try {
      await resetMaterials();
      await refresh();
      setPreview(null);
      setSourceText("");
      toast.success("Materi dikembalikan ke bawaan.");
    } catch { toast.error("Gagal reset."); }
  };

  const activeTopic = current?.topic || "Sistem Pencernaan Manusia";
  const isDefault = current?.source === "default";

  return (
    <div className="space-y-5" data-testid="kelola-materi-panel">
      {/* Share to WhatsApp */}
      <ShareCard topic={activeTopic} />

      {/* Info Kemdikbud */}
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

      {/* Current active */}
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
              {" · "}{current?.materi?.length || 0} materi{" · "}{current?.quiz?.length || 0} soal
              {current?.difficulty && <> · tingkat <span className="font-semibold text-slate-700">{current.difficulty}</span></>}
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
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-start gap-2">
            <FileText className="w-5 h-5 text-slate-500 mt-0.5" />
            <div>
              <div className="font-display font-bold text-slate-900">Tempel Materi dari Buku</div>
              <div className="text-xs text-slate-500">Salin 1-2 halaman materi dari buku Kurikulum Merdeka, lalu tempel di sini.</div>
            </div>
          </div>

          {/* Upload button next to title */}
          <label
            data-testid="btn-upload-file"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-dashed text-sm font-semibold cursor-pointer whitespace-nowrap ${
              uploading
                ? "border-teal-300 bg-teal-50 text-teal-700"
                : "border-teal-400 bg-white text-teal-700 hover:bg-teal-50"
            }`}
          >
            {uploading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Mengekstrak…</>
            ) : (
              <><FileUp className="w-4 h-4" /> Unggah PDF / Foto Buku</>
            )}
            <input
              data-testid="input-file-upload"
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                handleFile(f);
              }}
            />
          </label>
        </div>

        {uploadedName && !uploading && (
          <div className="mb-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5" data-testid="uploaded-badge">
            <CheckCircle2 className="w-3.5 h-3.5" /> Teks dari <strong className="mx-0.5">{uploadedName}</strong> ditambahkan ke kotak di bawah.
          </div>
        )}

        <textarea
          data-testid="input-source-text"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={9}
          placeholder="Tempel cuplikan bab buku di sini… (contoh: BAB 3 Sistem Pencernaan Manusia)"
          className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 resize-y font-mono leading-relaxed"
        />

        {/* Difficulty selector */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
            🎯 Pilih Tingkat Kesulitan Kuis
          </div>
          <div className="grid grid-cols-3 gap-2" data-testid="difficulty-selector">
            {DIFFICULTIES.map((d) => {
              const active = difficulty === d.key;
              return (
                <button
                  key={d.key}
                  data-testid={`difficulty-${d.key}`}
                  onClick={() => setDifficulty(d.key)}
                  disabled={generating}
                  className={`p-3 rounded-xl border-2 text-left transition-colors ${
                    active
                      ? "border-transparent shadow-md text-white bg-gradient-to-br " + d.cls
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <d.icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-500"}`} />
                  <div className="font-bold text-sm mt-1">{d.label}</div>
                  <div className={`text-[11px] ${active ? "text-white/85" : "text-slate-500"}`}>{d.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
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

      {/* Preview */}
      {preview && (
        <div className="bg-gradient-to-br from-teal-50 to-sky-50 border-2 border-teal-200 rounded-2xl p-5 space-y-4" data-testid="preview-generated">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 flex items-center gap-2">
                Pratinjau Hasil AI
                {preview.difficulty && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/70 text-slate-700 border border-teal-200 text-[10px]">
                    tingkat {preview.difficulty}
                  </span>
                )}
              </div>
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

      {/* History */}
      <HistorySection key={historyKey} onApplied={refresh} />
    </div>
  );
}
