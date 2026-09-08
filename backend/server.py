from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Header, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import base64
import json
import logging
import re
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

OWNER_EMAIL = "mamon.key.2020.12@gmail.com"
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============== MATERI & KUIS ==============
QUIZ_QUESTIONS = [
    {
        "id": "q1",
        "question": "Di organ manakah proses pencernaan makanan pertama kali dimulai?",
        "options": [
            {"key": "a", "text": "Lambung"},
            {"key": "b", "text": "Mulut"},
            {"key": "c", "text": "Usus halus"},
            {"key": "d", "text": "Kerongkongan"},
        ],
        "correct": "b",
        "concept": "lokasi_awal_pencernaan",
        "explanation": "Pencernaan dimulai di MULUT lewat kunyahan gigi (mekanik) & enzim ptialin dalam air liur (kimiawi).",
    },
    {
        "id": "q2",
        "question": "Enzim apa yang membantu mencerna protein di dalam lambung?",
        "options": [
            {"key": "a", "text": "Amilase"},
            {"key": "b", "text": "Lipase"},
            {"key": "c", "text": "Pepsin"},
            {"key": "d", "text": "Ptialin"},
        ],
        "correct": "c",
        "concept": "peran_enzim",
        "explanation": "Pepsin di lambung memecah PROTEIN menjadi bagian kecil (pepton). Amilase untuk karbo, lipase untuk lemak.",
    },
    {
        "id": "q3",
        "question": "Fungsi utama usus besar dalam sistem pencernaan adalah…",
        "options": [
            {"key": "a", "text": "Menyerap sari makanan"},
            {"key": "b", "text": "Menghancurkan makanan"},
            {"key": "c", "text": "Menyerap air & membentuk feses"},
            {"key": "d", "text": "Menghasilkan enzim"},
        ],
        "correct": "c",
        "concept": "fungsi_usus_besar",
        "explanation": "Usus besar menyerap AIR & mineral sisa, lalu membentuk feses. Serat membantu proses ini agar BAB lancar.",
    },
]

DEFAULT_SLIDES = [
    {
        "no": 1,
        "title": "Selamat Pagi, Petualang IPAS! 🚀",
        "subtitle": "Kelas 6 SD — Sistem Pencernaan Manusia",
        "bullets": [
            "Kemarin malam kalian sudah baca rangkuman dari Kak Bintang.",
            "Hari ini kita bedah bareng: dari mulut sampai ke usus besar.",
            "Tujuan: kalian bisa jelaskan alur makanan dengan bahasa sendiri.",
        ],
        "accent": "sky",
    },
    {
        "no": 2,
        "title": "Peta Perjalanan Makanan 🍎➡️",
        "bullets": [
            "Mulut → Kerongkongan → Lambung → Usus Halus → Usus Besar → Anus.",
            "Di setiap 'pos' ada tugas berbeda: mekanik (dihaluskan) & kimiawi (dipecah enzim).",
            "Ingat: pencernaan BUKAN cuma di lambung, tapi sejak gigitan pertama!",
        ],
        "accent": "teal",
    },
    {
        "no": 3,
        "title": "Tim Enzim, Sang Pahlawan Tak Terlihat 🧪",
        "bullets": [
            "Ptialin (mulut) memecah karbohidrat jadi gula sederhana.",
            "Pepsin (lambung) memecah protein.",
            "Lipase (usus halus) memecah lemak jadi asam lemak.",
        ],
        "accent": "amber",
    },
    {
        "no": 4,
        "title": "Usus Besar & Sahabat Bernama Serat 🥦💧",
        "bullets": [
            "Usus besar menyerap air sisa & membentuk feses.",
            "Cukup minum air + makan serat = BAB lancar, badan sehat.",
            "Kurang serat? Feses jadi keras → sembelit.",
        ],
        "accent": "emerald",
    },
    {
        "no": 5,
        "title": "Refleksi & Aksi Nyata 💡",
        "bullets": [
            "Ceritakan ke teman sebangku 1 organ pencernaan favorit kalian.",
            "Tulis 1 kebiasaan baru minggu ini (misal: minum 6 gelas/hari).",
            "PR: gambar peta alur pencernaan di buku IPAS kalian.",
        ],
        "accent": "sky",
    },
]

DEFAULT_INTRO = "Halo! Besok di kelas kita akan belajar serunya *sistem pencernaan manusia* bareng Bu Guru. Yuk baca rangkuman 3 menit ini dulu biar besok makin paham! Siap?"

DEFAULT_MATERI = [
    {
        "id": "materi1",
        "title": "🍎 Materi 1 — Perjalanan Makanan",
        "text": "Makanan yang kamu kunyah akan lewat *mulut → kerongkongan → lambung → usus halus*. Di mulut, gigi menghaluskan makanan (mekanik) dan air liur mulai memecah karbohidrat. Di lambung diaduk & disiram asam. Di usus halus, sari makanan diserap masuk ke darah.",
    },
    {
        "id": "materi2",
        "title": "🧪 Materi 2 — Tim Enzim",
        "text": "*Enzim* adalah pahlawan mini yang memecah nutrisi:\n• Ptialin (mulut) → karbohidrat\n• Pepsin (lambung) → protein\n• Lipase (usus halus) → lemak\nTanpa enzim, tubuh sulit menyerap gizi dari makanan.",
    },
    {
        "id": "materi3",
        "title": "💧 Materi 3 — Air & Serat",
        "text": "Di *usus besar*, air & mineral sisa diserap kembali, lalu sisa makanan dibentuk jadi feses. Rajin minum air + makan buah-sayur (serat) = BAB lancar dan perut sehat. Kurang serat? Bisa sembelit.",
    },
]

SAMPLE_BOOK_TEXT = """BAB 3 - SISTEM PENCERNAAN MANUSIA
(Contoh cuplikan buku IPAS Kelas 6 SD Kurikulum Merdeka)

Sistem pencernaan adalah sistem organ dalam tubuh manusia yang bertugas mengolah makanan menjadi zat gizi yang dapat diserap oleh darah dan mengubah sisa makanan menjadi kotoran.

A. Organ Pencernaan
Organ pencernaan terdiri dari: mulut, kerongkongan (esofagus), lambung, usus halus, usus besar, dan anus. Di dalam mulut, terjadi pencernaan mekanik oleh gigi dan pencernaan kimiawi oleh enzim ptialin yang terkandung di air liur. Ptialin memecah karbohidrat menjadi gula sederhana.

Setelah dikunyah, makanan didorong oleh gerak peristaltik melewati kerongkongan menuju lambung. Di lambung, makanan diaduk-aduk oleh otot lambung dan disiram asam lambung (HCl) serta enzim pepsin yang memecah protein.

Selanjutnya makanan masuk ke usus halus. Di usus halus, sari-sari makanan diserap masuk ke pembuluh darah. Enzim lipase membantu memecah lemak. Panjang usus halus manusia dewasa bisa mencapai 6 meter!

B. Peran Usus Besar
Sisa makanan yang tidak diserap masuk ke usus besar. Fungsi utama usus besar adalah menyerap air dan mineral, lalu membentuk feses (kotoran). Bakteri baik di usus besar juga membantu proses ini.

C. Menjaga Kesehatan Pencernaan
Untuk menjaga sistem pencernaan tetap sehat, kita perlu:
1. Minum air putih minimal 6-8 gelas per hari.
2. Makan makanan berserat (buah, sayur, biji-bijian).
3. Mengunyah makanan hingga halus.
4. Menghindari makanan terlalu pedas atau asam berlebihan.
5. Rutin BAB setiap hari agar tidak sembelit.

Kekurangan serat dan air menyebabkan feses menjadi keras sehingga sulit dikeluarkan (sembelit). Sebaliknya, makan makanan tidak higienis dapat menyebabkan diare."""

# ============== MODELS ==============
class QuizAnswer(BaseModel):
    question_id: str
    selected: str
    correct: bool

class SubmissionCreate(BaseModel):
    student_name: str
    absen_no: str
    answers: List[QuizAnswer]

class Submission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_name: str
    absen_no: str
    answers: List[QuizAnswer]
    score: int
    total: int
    submitted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MisconceptionItem(BaseModel):
    concept: str
    question_id: str
    question: str
    wrong_percent: float
    wrong_count: int
    total_count: int

class Slide(BaseModel):
    no: int
    title: str
    subtitle: Optional[str] = None
    bullets: List[str]
    accent: Optional[str] = "sky"

# ============== ROUTES ==============
@api_router.get("/")
async def root():
    return {"message": "BintangKelas API", "status": "ready"}

@api_router.get("/quiz")
async def get_quiz():
    mat = await db.materials.find_one({"_id": "current"}, {"_id": 0})
    if mat and mat.get("quiz"):
        return {"questions": mat["quiz"], "topic": mat.get("topic", "Sistem Pencernaan Manusia")}
    return {"questions": QUIZ_QUESTIONS, "topic": "Sistem Pencernaan Manusia"}

@api_router.get("/materials/current")
async def get_current_materials():
    mat = await db.materials.find_one({"_id": "current"}, {"_id": 0})
    if mat:
        return {**mat, "source": mat.get("source", "custom")}
    return {
        "topic": "Sistem Pencernaan Manusia",
        "intro": DEFAULT_INTRO,
        "materi": DEFAULT_MATERI,
        "quiz": QUIZ_QUESTIONS,
        "source": "default",
    }

@api_router.get("/materials/sample")
async def get_sample_text():
    return {"source_text": SAMPLE_BOOK_TEXT}

MAX_MATERIAL_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@api_router.post("/materials/extract-text")
async def extract_material_text(file: UploadFile = File(...)):
    """Extract readable text from uploaded PDF or Image file."""
    filename = file.filename or "buku"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    content_type = (file.content_type or "").lower()

    allowed_exts = {"pdf", "jpg", "jpeg", "png"}
    if ext not in allowed_exts and not ("pdf" in content_type or "image" in content_type):
        raise HTTPException(
            status_code=400,
            detail="Format file tidak didukung. Mohon unggah file PDF atau gambar (.jpg, .jpeg, .png)."
        )

    content = await file.read()
    if len(content) > MAX_MATERIAL_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="⚠️ Ukuran file maksimal 5 MB. Cukup pilih 1–2 halaman materi yang akan dipelajari saja ya, Bapak/Ibu Guru."
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File yang diunggah kosong.")

    extracted_text = ""

    # 1. Dokumen PDF
    if ext == "pdf" or "pdf" in content_type:
        try:
            try:
                from pypdf import PdfReader
            except ImportError:
                import pypdf
                PdfReader = pypdf.PdfReader

            reader = PdfReader(io.BytesIO(content))
            pages_text = []
            for page in reader.pages:
                txt = page.extract_text() or ""
                if txt.strip():
                    pages_text.append(txt.strip())

            extracted_text = "\n\n".join(pages_text).strip()
        except Exception as e:
            logging.warning(f"pypdf extraction failed: {e}")

        if not extracted_text:
            raise HTTPException(
                status_code=422,
                detail="Tidak ada teks digital yang terbaca dalam file PDF ini. Jika file adalah hasil pindaian/scan, silakan unggah dalam format foto/gambar (.jpg/.png) atau tempel teks secara manual."
            )

    # 2. Gambar / Foto Buku (JPG, JPEG, PNG)
    elif ext in {"jpg", "jpeg", "png"} or content_type.startswith("image/"):
        b64_data = base64.b64encode(content).decode("utf-8")
        media_type = content_type if content_type.startswith("image/") else ("image/png" if ext == "png" else "image/jpeg")

        api_key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("ANTHROPIC_API_KEY")

        # Vision AI via Anthropic Claude
        if api_key:
            try:
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                }
                payload = {
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 4096,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": media_type,
                                        "data": b64_data,
                                    },
                                },
                                {
                                    "type": "text",
                                    "text": (
                                        "Kamu adalah asisten pembaca buku pelajaran sekolah SD Kurikulum Merdeka. "
                                        "Tolong transkrip (salin) seluruh isi teks materi pelajaran dari foto/gambar halaman buku ini secara akurat dan lengkap. "
                                        "Pertahankan urutan paragraf, poin-poin, dan penjelasan penting. "
                                        "HANYA keluarkan isi teks materi buku tanpa salam, pengantar, atau komentar tambahan."
                                    ),
                                },
                            ],
                        }
                    ],
                }
                async with httpx.AsyncClient(timeout=60.0) as http_client:
                    res = await http_client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        text_chunks = [block["text"] for block in data.get("content", []) if block.get("type") == "text"]
                        extracted_text = "\n\n".join(text_chunks).strip()
                    else:
                        logging.warning(f"Anthropic Vision returned status {res.status_code}: {res.text}")
            except Exception as e:
                logging.exception(f"Anthropic Vision failed: {e}")

        # Fallback to Gemini if GEMINI_API_KEY is available
        gemini_key = os.environ.get("GEMINI_API_KEY")
        if not extracted_text and gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                g_payload = {
                    "contents": [
                        {
                            "parts": [
                                {
                                    "inline_data": {
                                        "mime_type": media_type,
                                        "data": b64_data,
                                    }
                                },
                                {
                                    "text": "Transkrip seluruh teks materi pelajaran pada foto halaman buku ini secara lengkap dan akurat. HANYA keluarkan isi teks materinya."
                                }
                            ]
                        }
                    ]
                }
                async with httpx.AsyncClient(timeout=60.0) as http_client:
                    res = await http_client.post(url, json=g_payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            extracted_text = "".join(p.get("text", "") for p in parts).strip()
            except Exception as ge:
                logging.exception(f"Gemini Vision failed: {ge}")

        if not extracted_text:
            raise HTTPException(
                status_code=502,
                detail="Layanan AI belum dapat membaca foto halaman buku ini. Pastikan foto cukup jelas dan terang, atau Bapak/Ibu dapat mengetik/menempel teks materi secara manual."
            )

    return {
        "text": extracted_text,
        "filename": filename,
        "size_bytes": len(content),
    }


class MaterialsGenerate(BaseModel):
    source_text: str
    difficulty: Optional[str] = "sedang"  # "mudah" | "sedang" | "susah"

DIFFICULTY_HINTS = {
    "mudah": "Buat soal SANGAT MUDAH: jawaban tersurat langsung di teks, bahasa sederhana, pertanyaan bertipe C1 (mengingat). Distraktor jelas beda.",
    "sedang": "Buat soal TINGKAT SEDANG: butuh pemahaman konsep (C2). Bahasa jelas untuk anak Kelas 6 SD. Distraktor masuk akal.",
    "susah": "Buat soal MENANTANG (C3-C4): siswa harus MENERAPKAN atau MENGANALISIS konsep pada situasi baru sehari-hari. Distraktor menggoda tapi tetap adil.",
}

@api_router.post("/materials/generate")
async def generate_materials(payload: MaterialsGenerate):
    """AI: from a raw book excerpt, generate topic + intro + 3 materi + 3 quiz questions."""
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Layanan AI belum tersedia")

    difficulty = payload.difficulty if payload.difficulty in DIFFICULTY_HINTS else "sedang"
    diff_hint = DIFFICULTY_HINTS[difficulty]

    system_msg = (
        "Kamu adalah asisten guru IPAS SD Kurikulum Merdeka. "
        "Dari cuplikan buku yang diberikan, buat materi ringkas + kuis untuk siswa Kelas 6 SD (usia 11-12 tahun). "
        f"TINGKAT KESULITAN KUIS: {difficulty.upper()}. Panduan: {diff_hint} "
        "WAJIB output JSON valid tanpa teks tambahan, format persis: "
        "{\"topic\":\"...\", \"intro\":\"pesan pembuka ramah anak (~30 kata) yang menyebut topik\", "
        "\"materi\":[{\"id\":\"materi1\",\"title\":\"emoji + Materi 1 — judul\",\"text\":\"1-2 paragraf ramah anak; tanda *bintang* untuk bold\"}, ... 3 materi], "
        "\"quiz\":[{\"id\":\"q1\",\"question\":\"...\",\"options\":[{\"key\":\"a\",\"text\":\"...\"},{\"key\":\"b\",\"text\":\"...\"},{\"key\":\"c\",\"text\":\"...\"},{\"key\":\"d\",\"text\":\"...\"}],\"correct\":\"b\",\"concept\":\"kata_kunci_singkat\",\"explanation\":\"kalimat penjelasan singkat\"}, ... 3 soal]}. "
        "Semua Bahasa Indonesia yang mudah dipahami anak SD. JANGAN keluar dari JSON."
    )
    user_text = f"Cuplikan buku:\n{payload.source_text[:6000]}\n\nBuat materi & kuis tingkat {difficulty}. Kembalikan HANYA JSON."

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=api_key,
            session_id=f"bintangkelas-materi-{uuid.uuid4().hex[:8]}",
            system_message=system_msg,
        ).with_model("anthropic", "claude-sonnet-4-6")

        raw = await chat.send_message(UserMessage(text=user_text))
        text = raw if isinstance(raw, str) else str(raw)
        match = re.search(r"\{[\s\S]*\}", text)
        parsed = json.loads(match.group(0) if match else text)

        topic = parsed.get("topic", "Materi IPAS")
        intro = parsed.get("intro", DEFAULT_INTRO)
        materi = parsed.get("materi", [])[:3]
        quiz = parsed.get("quiz", [])[:3]
        if len(materi) < 3 or len(quiz) < 3:
            raise ValueError("Materi/quiz tidak lengkap")

        # normalize
        for i, m in enumerate(materi, 1):
            m["id"] = m.get("id") or f"materi{i}"
        for i, q in enumerate(quiz, 1):
            q["id"] = q.get("id") or f"q{i}"

        return {
            "topic": topic,
            "intro": intro,
            "materi": materi,
            "quiz": quiz,
            "difficulty": difficulty,
            "source": "ai_preview",
        }
    except Exception as e:
        logging.exception("Materials generation failed")
        raise HTTPException(status_code=502, detail=f"AI gagal membuat materi: {e}")

class MaterialsApply(BaseModel):
    topic: str
    intro: str
    materi: List[dict]
    quiz: List[dict]
    difficulty: Optional[str] = None

@api_router.post("/materials/apply")
async def apply_materials(
    payload: MaterialsApply,
    request: Request = None,
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
):
    """Save generated materials as current AND archive to teacher's history."""
    user = None
    try:
        user = await get_current_user(request, session_token, authorization)
    except HTTPException:
        pass  # allow anonymous demo apply

    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc["_id"] = "current"
    doc["source"] = "ai"
    doc["applied_at"] = now
    await db.materials.replace_one({"_id": "current"}, doc, upsert=True)
    await db.submissions.delete_many({})
    await db.slide_cache.delete_many({})

    if user:
        hist_id = uuid.uuid4().hex
        await db.materials_history.insert_one({
            "id": hist_id,
            "user_id": user.user_id,
            "topic": payload.topic,
            "intro": payload.intro,
            "materi": payload.materi,
            "quiz": payload.quiz,
            "difficulty": payload.difficulty,
            "created_at": now,
        })
    return {"ok": True, "applied_at": now}

@api_router.get("/materials/history")
async def list_history(
    request: Request = None,
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
):
    user = await get_current_user(request, session_token, authorization)
    docs = await db.materials_history.find(
        {"user_id": user.user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"items": docs}

@api_router.post("/materials/history/{hist_id}/apply")
async def apply_from_history(
    hist_id: str,
    request: Request = None,
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
):
    user = await get_current_user(request, session_token, authorization)
    hist = await db.materials_history.find_one({"id": hist_id, "user_id": user.user_id}, {"_id": 0})
    if not hist:
        raise HTTPException(status_code=404, detail="Materi tidak ditemukan di riwayat")
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "_id": "current",
        "topic": hist["topic"],
        "intro": hist["intro"],
        "materi": hist["materi"],
        "quiz": hist["quiz"],
        "difficulty": hist.get("difficulty"),
        "source": "history",
        "applied_at": now,
    }
    await db.materials.replace_one({"_id": "current"}, doc, upsert=True)
    await db.submissions.delete_many({})
    await db.slide_cache.delete_many({})
    return {"ok": True, "applied_at": now}

@api_router.delete("/materials/history/{hist_id}")
async def delete_history(
    hist_id: str,
    request: Request = None,
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
):
    user = await get_current_user(request, session_token, authorization)
    r = await db.materials_history.delete_one({"id": hist_id, "user_id": user.user_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tidak ditemukan")
    return {"ok": True}

@api_router.post("/materials/reset")
async def reset_materials():
    await db.materials.delete_many({})
    await db.submissions.delete_many({})
    await db.slide_cache.delete_many({})
    await seed_demo_data()
    return {"ok": True}

@api_router.post("/submissions", response_model=Submission)
async def create_submission(payload: SubmissionCreate):
    correct = sum(1 for a in payload.answers if a.correct)
    sub = Submission(
        student_name=payload.student_name.strip(),
        absen_no=payload.absen_no.strip(),
        answers=payload.answers,
        score=correct,
        total=len(payload.answers),
    )
    doc = sub.model_dump()
    await db.submissions.insert_one(doc)
    return sub

@api_router.get("/submissions", response_model=List[Submission])
async def list_submissions():
    docs = await db.submissions.find({}, {"_id": 0}).sort("submitted_at", -1).to_list(500)
    return docs

@api_router.delete("/submissions")
async def clear_submissions():
    result = await db.submissions.delete_many({})
    return {"deleted": result.deleted_count}

@api_router.get("/analytics/misconceptions")
async def get_misconceptions():
    docs = await db.submissions.find({}, {"_id": 0}).to_list(500)
    total_students = len(docs)
    avg_score = 0
    misconceptions: List[MisconceptionItem] = []
    if total_students > 0:
        avg_score = sum(d.get("score", 0) for d in docs) / total_students
        # tally wrong per question
        by_q = {q["id"]: {"wrong": 0, "total": 0, "concept": q["concept"], "question": q["question"]} for q in QUIZ_QUESTIONS}
        for d in docs:
            for ans in d.get("answers", []):
                qid = ans.get("question_id")
                if qid in by_q:
                    by_q[qid]["total"] += 1
                    if not ans.get("correct"):
                        by_q[qid]["wrong"] += 1
        for qid, v in by_q.items():
            if v["total"] > 0:
                misconceptions.append(MisconceptionItem(
                    concept=v["concept"],
                    question_id=qid,
                    question=v["question"],
                    wrong_percent=round(v["wrong"] / v["total"] * 100, 1),
                    wrong_count=v["wrong"],
                    total_count=v["total"],
                ))
    misconceptions.sort(key=lambda m: m.wrong_percent, reverse=True)
    return {
        "total_students": total_students,
        "avg_score": round(avg_score, 2),
        "max_score": len(QUIZ_QUESTIONS),
        "misconceptions": [m.model_dump() for m in misconceptions],
    }

@api_router.get("/slides/default")
async def get_default_slides():
    return {"slides": DEFAULT_SLIDES, "source": "default"}

@api_router.get("/slides/latest")
async def get_latest_slides():
    doc = await db.slide_cache.find_one({"_id": "latest"}, {"_id": 0})
    if doc and doc.get("slides"):
        return {"slides": doc["slides"], "source": "ai", "generated_at": doc.get("generated_at")}
    return {"slides": DEFAULT_SLIDES, "source": "default"}

@api_router.post("/slides/generate")
async def generate_slides():
    """Generate 5 adaptive slides using Claude based on top misconceptions."""
    analytics = await get_misconceptions()
    top_misses = [m for m in analytics["misconceptions"] if m["wrong_percent"] >= 30][:2]

    prompt_ctx = {
        "topic": "Sistem Pencernaan Manusia (IPAS Kelas 6 SD)",
        "avg_score": analytics["avg_score"],
        "max_score": analytics["max_score"],
        "total_students": analytics["total_students"],
        "top_misconceptions": top_misses if top_misses else [
            {"concept": "umum", "question": "Alur pencernaan umum", "wrong_percent": 0}
        ],
    }

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        return {"slides": DEFAULT_SLIDES, "source": "default_no_key"}

    system_msg = (
        "Kamu adalah asisten pengajar IPAS SD Kurikulum Merdeka. "
        "Tugas: bikin 5 slide singkat, ramah anak, bahasa Indonesia, yang MEMBEDAH miskonsepsi siswa. "
        "Slide 1 = pembuka semangat. Slide 2-4 = bedah 2 miskonsepsi teratas (jelaskan konsep benar, analogi, contoh sehari-hari). "
        "Slide 5 = refleksi & aksi nyata di kelas. "
        "Format WAJIB JSON valid: {\"slides\":[{\"no\":1,\"title\":\"...\",\"subtitle\":\"opsional\",\"bullets\":[\"...\",\"...\",\"...\"],\"accent\":\"sky|teal|amber|emerald\"}, ...]}. "
        "Setiap slide punya 2-4 bullets pendek. JANGAN keluar JSON."
    )
    user_text = (
        f"Data kelas semalam:\n{json.dumps(prompt_ctx, ensure_ascii=False, indent=2)}\n\n"
        "Buat 5 slide adaptif untuk KBM pagi ini. Kembalikan HANYA JSON."
    )

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=api_key,
            session_id=f"bintangkelas-slides-{uuid.uuid4().hex[:8]}",
            system_message=system_msg,
        ).with_model("anthropic", "claude-sonnet-4-6")

        raw = await chat.send_message(UserMessage(text=user_text))
        text = raw if isinstance(raw, str) else str(raw)

        # Extract JSON block
        match = re.search(r"\{[\s\S]*\}", text)
        json_str = match.group(0) if match else text
        parsed = json.loads(json_str)
        slides = parsed.get("slides", [])
        if not slides or len(slides) < 3:
            raise ValueError("Empty slides")

        # normalize
        norm = []
        for i, s in enumerate(slides[:5], start=1):
            norm.append({
                "no": i,
                "title": s.get("title", f"Slide {i}"),
                "subtitle": s.get("subtitle"),
                "bullets": s.get("bullets", [])[:5],
                "accent": s.get("accent", "sky"),
            })

        # cache
        await db.slide_cache.update_one(
            {"_id": "latest"},
            {"$set": {"slides": norm, "generated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        return {"slides": norm, "source": "ai", "context": prompt_ctx}
    except Exception as e:
        logging.exception("AI slide generation failed")
        return {"slides": DEFAULT_SLIDES, "source": "default_fallback", "error": str(e)}

@api_router.post("/seed")
async def seed_demo_data():
    """Populate demo submissions for a realistic dashboard on first run."""
    existing = await db.submissions.count_documents({})
    if existing > 0:
        return {"seeded": False, "existing": existing}

    demo = [
        # name, absen, answers pattern (a=correct)
        ("Alya Ramadhani",   "01", ["b", "c", "c"]),
        ("Bagas Prasetyo",   "02", ["b", "a", "c"]),  # miss q2
        ("Citra Larasati",   "03", ["a", "c", "c"]),  # miss q1
        ("Dimas Wicaksono",  "04", ["b", "c", "a"]),  # miss q3
        ("Elang Nugroho",    "05", ["a", "a", "c"]),  # miss q1,q2
        ("Fitri Handayani",  "06", ["b", "c", "c"]),
        ("Gilang Saputra",   "07", ["b", "a", "b"]),  # miss q2,q3
        ("Hana Salsabila",   "08", ["a", "c", "c"]),  # miss q1
        ("Indra Maulana",    "09", ["b", "c", "c"]),
        ("Jihan Nafisa",     "10", ["b", "c", "a"]),  # miss q3
        ("Kevin Ardiansyah", "11", ["a", "a", "c"]),  # miss q1,q2
        ("Laila Anindya",    "12", ["b", "c", "c"]),
        ("Miko Prabowo",     "13", ["b", "c", "c"]),
        ("Nayla Zahra",      "14", ["a", "c", "c"]),  # miss q1
        ("Oscar Adiwijaya",  "15", ["b", "a", "c"]),  # miss q2
        ("Putri Anggraini",  "16", ["b", "c", "c"]),
        ("Qori Ramadhan",    "17", ["a", "c", "c"]),  # miss q1
        ("Raka Firmansyah",  "18", ["b", "c", "c"]),
    ]
    # Times spread across previous evening
    base_hours = [19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 22, 22, 22, 6, 6, 6, 7, 7]
    now = datetime.now(timezone.utc)
    for i, (name, absen, sel) in enumerate(demo):
        answers = []
        for q, chosen in zip(QUIZ_QUESTIONS, sel):
            answers.append({
                "question_id": q["id"],
                "selected": chosen,
                "correct": chosen == q["correct"],
            })
        score = sum(1 for a in answers if a["correct"])
        ts = now.replace(hour=base_hours[i], minute=(i * 7) % 60, second=0, microsecond=0).isoformat()
        await db.submissions.insert_one({
            "id": str(uuid.uuid4()),
            "student_name": name,
            "absen_no": absen,
            "answers": answers,
            "score": score,
            "total": len(QUIZ_QUESTIONS),
            "submitted_at": ts,
        })
    return {"seeded": True, "count": len(demo)}

# ============== AUTH (Emergent-managed Google Auth) ==============
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_owner: bool = False
    role: Optional[str] = None  # "siswa" | "guru"
    created_at: str

class SessionExchange(BaseModel):
    session_id: str

class RoleUpdate(BaseModel):
    role: str  # "siswa" | "guru"

async def get_current_user(
    request: Request,
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> User:
    """Resolve current user from cookie OR Authorization: Bearer <token>."""
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")

    exp = sess.get("expires_at")
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp and exp < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": token})
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)

@api_router.post("/auth/session")
async def auth_session(payload: SessionExchange, response: Response):
    """Exchange Emergent session_id → session_token; set httpOnly cookie."""
    async with httpx.AsyncClient(timeout=15) as h:
        r = await h.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": payload.session_id})
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Emergent auth rejected session_id")
        data = r.json()

    email = data.get("email")
    name = data.get("name") or email
    picture = data.get("picture")
    session_token = data.get("session_token")
    if not email or not session_token:
        raise HTTPException(status_code=502, detail="Invalid Emergent auth response")

    # upsert user by email
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "is_owner": email == OWNER_EMAIL}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        # Owner defaults to guru; everyone else picks role on first visit
        default_role = "guru" if email == OWNER_EMAIL else None
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "is_owner": email == OWNER_EMAIL,
            "role": default_role,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {"$set": {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        expires=int(expires_at.timestamp()),
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc, "session_token": session_token}

@api_router.get("/auth/me", response_model=User)
async def auth_me(current: User = None, request: Request = None,
                  session_token: Optional[str] = Cookie(default=None),
                  authorization: Optional[str] = Header(default=None)):
    return await get_current_user(request, session_token, authorization)

@api_router.post("/auth/role", response_model=User)
async def set_role(payload: RoleUpdate,
                   request: Request = None,
                   session_token: Optional[str] = Cookie(default=None),
                   authorization: Optional[str] = Header(default=None)):
    if payload.role not in ("siswa", "guru"):
        raise HTTPException(status_code=400, detail="role must be 'siswa' or 'guru'")
    user = await get_current_user(request, session_token, authorization)
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"role": payload.role}})
    updated = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return User(**updated)

@api_router.post("/auth/logout")
async def auth_logout(response: Response,
                      session_token: Optional[str] = Cookie(default=None),
                      authorization: Optional[str] = Header(default=None)):
    token = session_token
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def on_startup():
    # auto-seed on empty DB so demo is instant
    existing = await db.submissions.count_documents({})
    if existing == 0:
        logger.info("Empty DB detected → seeding demo submissions")
        try:
            await seed_demo_data()
        except Exception:
            logger.exception("Seed failed")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
