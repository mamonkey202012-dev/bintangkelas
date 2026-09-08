import { toast } from "sonner";
import { Copy, Printer } from "lucide-react";

export default function JurnalTable({ analytics, submissions }) {
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const misc = analytics.misconceptions.filter((m) => m.wrong_percent >= 30);
  const miscText = misc.length
    ? misc.map((m) => `• ${m.question} — ${m.wrong_percent}% siswa salah`).join("\n")
    : "Sebagian besar siswa sudah memahami konsep dasar. Perlu penguatan aplikasi konsep dalam kehidupan sehari-hari.";

  const rows = [
    ["Hari / Tanggal", today],
    ["Kelas / Fase", "6 SD / Fase C"],
    ["Mata Pelajaran", "IPAS (Ilmu Pengetahuan Alam dan Sosial)"],
    ["Materi", "Sistem Pencernaan Manusia"],
    ["Model Pembelajaran", "Flipped Classroom + Diskusi Terbimbing"],
    ["Tujuan Pembelajaran (TP)",
      "Peserta didik dapat mengidentifikasi organ pencernaan manusia, menjelaskan peran enzim pencernaan, serta mengaitkan pola makan sehat (air & serat) dengan kesehatan sistem pencernaan."],
    ["Alur Kegiatan Semalam (Pra-Kelas)",
      "Siswa membaca 3 pesan materi via chatbot 'Kak Bintang' & mengerjakan kuis diagnostik 3 soal (tautan chat BintangKelas)."],
    ["Hasil Diagnostik Semalam",
      `Total siswa akses: ${analytics.total_students}/30\nRata-rata skor: ${analytics.avg_score}/${analytics.max_score}\nMiskonsepsi utama:\n${miscText}`],
    ["Kegiatan Pembuka (10')",
      "Presensi & recall lewat pertanyaan pemantik: 'Apa yang terjadi pada roti setelah dikunyah?'"],
    ["Kegiatan Inti (50')",
      "Tayangan slide adaptif (5 slide) fokus membedah miskonsepsi. Diskusi kelompok: gambar peta perjalanan makanan. Praktik: uji amilum sederhana."],
    ["Kegiatan Penutup (10')",
      "Refleksi 1 kalimat, rencana kebiasaan sehat (minum 6 gelas/hari, tambah buah)."],
    ["Asesmen Formatif",
      "Observasi diskusi kelompok, produk peta konsep, kuis lisan 2 pertanyaan aplikatif."],
    ["Refleksi Guru",
      "________________________________________________________________"],
  ];

  const asText = () =>
    "JURNAL HARIAN GURU — KURIKULUM MERDEKA\n" +
    rows.map(([k, v]) => `${k}:\n${v}\n`).join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      toast.success("Jurnal disalin ke clipboard!");
    } catch { toast.error("Gagal menyalin."); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" data-testid="jurnal-panel">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-2 no-print">
        <div>
          <div className="font-display font-bold text-slate-900">Jurnal Harian Guru — Kurikulum Merdeka</div>
          <div className="text-xs text-slate-500">Format resmi, siap salin & cetak.</div>
        </div>
        <div className="flex gap-2">
          <button
            data-testid="btn-copy-jurnal"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Copy className="w-4 h-4" /> Salin
          </button>
          <button
            data-testid="btn-print-jurnal"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-sky-500 text-white text-sm font-semibold shadow"
          >
            <Printer className="w-4 h-4" /> Cetak
          </button>
        </div>
      </div>
      <div className="p-5 overflow-x-auto">
        <table className="w-full text-sm border border-slate-200" data-testid="jurnal-table">
          <tbody className="divide-y divide-slate-200">
            {rows.map(([k, v]) => (
              <tr key={k} className="align-top">
                <th className="w-56 text-left px-4 py-3 font-semibold text-slate-700 bg-slate-50 border-r border-slate-200">
                  {k}
                </th>
                <td className="px-4 py-3 text-slate-800 whitespace-pre-wrap">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-slate-400 mt-3">
          *Data hasil diagnostik terisi otomatis dari kuis semalam. Bagian refleksi dapat ditulis tangan setelah mengajar.
        </div>
      </div>
    </div>
  );
}
