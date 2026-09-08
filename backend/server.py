from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
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
    # Send without correct answer to keep it simple for demo we send full
    return {"questions": QUIZ_QUESTIONS}

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
