import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Phone, Video, MoreVertical, ArrowLeft, Send, Smile, Paperclip, Check, CheckCheck, Star } from "lucide-react";
import { getQuiz, submitAnswers, getCurrentMaterials } from "@/lib/api";

function timeNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

const INITIAL_INTRO_TIME = "19.02";

const DEFAULT_INTRO = "Halo! Besok di kelas kita akan belajar serunya *sistem pencernaan manusia* bareng Bu Guru. Yuk baca rangkuman 3 menit ini dulu biar besok makin paham! Siap?";

const DEFAULT_MATERI = [
  {
    id: "materi1",
    title: "🍎 Materi 1 — Perjalanan Makanan",
    text:
      "Makanan yang kamu kunyah akan lewat *mulut → kerongkongan → lambung → usus halus*. Di mulut, gigi menghaluskan makanan (mekanik) dan air liur mulai memecah karbohidrat. Di lambung diaduk & disiram asam. Di usus halus, sari makanan diserap masuk ke darah.",
  },
  {
    id: "materi2",
    title: "🧪 Materi 2 — Tim Enzim",
    text:
      "*Enzim* adalah pahlawan mini yang memecah nutrisi:\n• Ptialin (mulut) → karbohidrat\n• Pepsin (lambung) → protein\n• Lipase (usus halus) → lemak\nTanpa enzim, tubuh sulit menyerap gizi dari makanan.",
  },
  {
    id: "materi3",
    title: "💧 Materi 3 — Air & Serat",
    text:
      "Di *usus besar*, air & mineral sisa diserap kembali, lalu sisa makanan dibentuk jadi feses. Rajin minum air + makan buah-sayur (serat) = BAB lancar dan perut sehat. Kurang serat? Bisa sembelit.",
  },
];

export default function ModeSiswa() {
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [materi, setMateri] = useState(DEFAULT_MATERI);
  const [messages, setMessages] = useState([{ id: "m1", from: "bot", text: DEFAULT_INTRO, time: "19.02" }]);
  const [phase, setPhase] = useState("intro"); // intro | materi | quiz | form | done
  const [materiIdx, setMateriIdx] = useState(0);
  const [quiz, setQuiz] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [typing, setTyping] = useState(false);
  const [form, setForm] = useState({ student_name: "", absen_no: "" });
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const mat = await getCurrentMaterials();
        if (mat?.materi?.length) {
          setMateri(mat.materi);
          setIntro(mat.intro || DEFAULT_INTRO);
          setMessages([{ id: "m1", from: "bot", text: mat.intro || DEFAULT_INTRO, time: "19.02" }]);
        }
        if (mat?.quiz?.length) {
          setQuiz(mat.quiz);
        } else {
          const q = await getQuiz();
          setQuiz(q.questions || []);
        }
      } catch {
        const q = await getQuiz().catch(() => ({ questions: [] }));
        setQuiz(q.questions || []);
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const pushBot = (text, extra = {}) =>
    setMessages((m) => [...m, { id: `b-${Date.now()}-${Math.random()}`, from: "bot", text, time: timeNow(), ...extra }]);
  const pushUser = (text) =>
    setMessages((m) => [...m, { id: `u-${Date.now()}`, from: "user", text, time: timeNow() }]);

  const withTyping = async (delay, fn) => {
    setTyping(true);
    await new Promise((r) => setTimeout(r, delay));
    setTyping(false);
    fn();
  };

  const handleReady = async () => {
    pushUser("Siap, Kak! 🚀");
    setPhase("materi");
    await withTyping(700, () => pushBot(materi[0].title + "\n\n" + materi[0].text));
    setMateriIdx(1);
  };

  const handleLater = async () => {
    pushUser("Bentar lagi ya Kak 🙏");
    await withTyping(500, () =>
      pushBot("Siaap, aku tunggu 5 menit ya 😊. Ketuk *Siap, Kak!* kalau sudah bisa mulai.")
    );
  };

  const handleNextMateri = async () => {
    pushUser("Lanjut, Kak ✨");
    if (materiIdx < materi.length) {
      await withTyping(700, () => pushBot(materi[materiIdx].title + "\n\n" + materi[materiIdx].text));
      setMateriIdx((i) => i + 1);
    }
    if (materiIdx + 1 > materi.length) {
      setTimeout(async () => {
        await withTyping(900, () =>
          pushBot("Mantap! Sekarang cek pemahaman kamu dengan *soal kilat* ya. Santai aja, ini bukan ulangan 😉")
        );
        setPhase("quiz");
      }, 500);
    }
  };

  const handleAnswer = async (opt) => {
    const q = quiz[quizIdx];
    const correct = opt.key === q.correct;
    pushUser(`${opt.key.toUpperCase()}. ${opt.text}`);
    setAnswers((a) => [...a, { question_id: q.id, selected: opt.key, correct }]);

    await withTyping(600, () => {
      pushBot(
        (correct ? "✅ Tepat sekali!\n" : "❌ Belum tepat.\n") + `📘 ${q.explanation}`,
        { feedback: correct ? "correct" : "wrong" }
      );
    });

    if (quizIdx + 1 < quiz.length) {
      setQuizIdx((i) => i + 1);
    } else {
      await withTyping(700, () =>
        pushBot("Kerja bagus! Tinggal isi nama & nomor absen kamu ya, biar Bu Guru tahu kamu sudah belajar. 📝")
      );
      setPhase("form");
    }
  };

  const handleSubmit = async () => {
    if (!form.student_name.trim() || !form.absen_no.trim()) {
      toast.error("Isi nama & nomor absen dulu ya!");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitAnswers({ ...form, answers });
      pushUser(`Nama: ${form.student_name} · Absen: ${form.absen_no}`);
      await withTyping(700, () =>
        pushBot(
          `🎉 Berhasil dikirim ke Bu Guru! Skor kamu ${res.score}/${res.total}. Sampai jumpa besok di kelas ya, jangan lupa sarapan! ⭐`
        )
      );
      setPhase("done");
      toast.success("Jawaban terkirim ke Bu Guru!");
    } catch (e) {
      toast.error("Gagal kirim. Coba lagi ya.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderBubbleText = (t) =>
    t.split("\n").map((line, i) => (
      <div key={i}>
        {line.split(/\*(.+?)\*/g).map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="font-semibold">{part}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </div>
    ));

  const currentQ = quiz[quizIdx];

  return (
    <div
      className="min-h-[calc(100vh-4rem)] flex justify-center items-start bg-slate-900 py-4 sm:py-8 px-2 sm:px-6"
      data-testid="mode-siswa-container"
    >
      <div className="w-full max-w-[420px] h-[85vh] max-h-[820px] bg-[#E5DDD5] rounded-[36px] shadow-2xl overflow-hidden border-[10px] border-slate-800 relative flex flex-col font-chat">
        {/* Android status bar */}
        <div className="h-6 bg-[#075E54] text-white px-5 text-[10px] flex justify-between items-center font-mono">
          <span>{timeNow()}</span>
          <span className="tracking-tight">📶 📡 🔋 92%</span>
        </div>

        {/* Chat header */}
        <div className="h-16 bg-[#075E54] text-white px-3 flex items-center gap-3 shadow-md">
          <ArrowLeft className="w-5 h-5 opacity-80" />
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center border-2 border-white/30">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#075E54]" />
          </div>
          <div className="flex-1 leading-tight">
            <div className="font-semibold text-[15px]">Kak Bintang IPAS</div>
            <div className="text-[11px] text-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Online
            </div>
          </div>
          <Video className="w-5 h-5 opacity-80" />
          <Phone className="w-5 h-5 opacity-80" />
          <MoreVertical className="w-5 h-5 opacity-80" />
        </div>

        {/* Chat body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll chat-pattern p-3 space-y-2" data-testid="chat-body">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-pop`}>
              <div
                className={`${m.from === "user" ? "bubble-out" : "bubble-in"} max-w-[80%] px-2.5 py-1.5 text-[14px] text-slate-800 whitespace-pre-wrap`}
              >
                {renderBubbleText(m.text)}
                <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${m.from === "user" ? "justify-end text-slate-500" : "text-slate-400"}`}>
                  {m.time}
                  {m.from === "user" && <CheckCheck className="w-3 h-3 text-sky-500" />}
                </div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bubble-in px-3 py-2 flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot" style={{ animationDelay: "0s" }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot" style={{ animationDelay: ".2s" }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot" style={{ animationDelay: ".4s" }} />
              </div>
            </div>
          )}

          {/* Phase-specific interactive panels */}
          {phase === "intro" && !typing && (
            <div className="flex flex-wrap gap-2 justify-end pt-1" data-testid="intro-quick-replies">
              <button
                data-testid="quick-reply-ready"
                onClick={handleReady}
                className="px-3 py-1.5 rounded-full bg-white text-sky-700 border border-sky-200 text-sm font-medium shadow-sm hover:bg-sky-50"
              >
                Siap, Kak! 🚀
              </button>
              <button
                data-testid="quick-reply-later"
                onClick={handleLater}
                className="px-3 py-1.5 rounded-full bg-white text-slate-600 border border-slate-200 text-sm font-medium shadow-sm hover:bg-slate-50"
              >
                Bentar lagi
              </button>
            </div>
          )}

          {phase === "materi" && !typing && materiIdx <= materi.length && (
            <div className="flex justify-end pt-1">
              <button
                data-testid="btn-next-materi"
                onClick={handleNextMateri}
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-teal-500 text-white text-sm font-semibold shadow"
              >
                {materiIdx < materi.length ? `Lanjut Materi ${materiIdx + 1} →` : "Aku siap kuis 📝"}
              </button>
            </div>
          )}

          {phase === "quiz" && !typing && currentQ && (
            <div className="bubble-in p-3 mt-1 space-y-2" data-testid={`quiz-card-${currentQ.id}`}>
              <div className="text-[11px] font-semibold text-sky-600">
                Kuis {quizIdx + 1} / {quiz.length}
              </div>
              <div className="text-[14px] font-semibold text-slate-800">{currentQ.question}</div>
              <div className="grid gap-1.5 pt-1">
                {currentQ.options.map((o) => (
                  <button
                    key={o.key}
                    data-testid={`quiz-${currentQ.id}-option-${o.key}`}
                    onClick={() => handleAnswer(o)}
                    className="text-left px-3 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-100 text-[13.5px] text-slate-700 flex gap-2"
                  >
                    <span className="font-bold text-sky-600">{o.key.toUpperCase()}.</span>
                    <span>{o.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === "form" && !typing && (
            <div className="bubble-in p-3 mt-1 space-y-2" data-testid="submission-form">
              <div className="text-[13px] font-semibold text-slate-800">Isi Kehadiran</div>
              <input
                data-testid="input-student-name"
                value={form.student_name}
                onChange={(e) => setForm((f) => ({ ...f, student_name: e.target.value }))}
                placeholder="Nama Lengkap"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13.5px] outline-none focus:border-sky-400"
              />
              <input
                data-testid="input-absen-no"
                value={form.absen_no}
                onChange={(e) => setForm((f) => ({ ...f, absen_no: e.target.value }))}
                placeholder="Nomor Absen"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13.5px] outline-none focus:border-sky-400"
              />
              <button
                data-testid="btn-submit-answers"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-sky-500 to-teal-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? "Mengirim…" : "Kirim Jawaban ke Bu Guru"}
              </button>
            </div>
          )}

          {phase === "done" && !typing && (
            <div className="bubble-in p-3 mt-1 text-center" data-testid="done-banner">
              <div className="text-2xl">🎉⭐</div>
              <div className="text-[13px] font-semibold text-emerald-700 mt-1">Kehadiran Terkirim!</div>
              <div className="text-[12px] text-slate-500">Sampai jumpa besok di kelas ya.</div>
            </div>
          )}
        </div>

        {/* Input bar (visual only) */}
        <div className="p-2 bg-[#F0F0F0] border-t border-slate-300 flex items-center gap-2">
          <Smile className="w-5 h-5 text-slate-500" />
          <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[13px] text-slate-400">
            Ketik pesan…
          </div>
          <Paperclip className="w-5 h-5 text-slate-500" />
          <div className="w-9 h-9 rounded-full bg-[#075E54] flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
