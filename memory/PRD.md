# BintangKelas — Flipped Classroom IPAS Kelas 6 SD

## Original Problem Statement
Web app "BintangKelas" for Grade 6 SD (Materi IPAS - Sistem Pencernaan Manusia) with:
- Toggle Mode Siswa (WhatsApp-style Chat) vs Mode Guru (Dashboard KBM)
- Mode Siswa: chat with Kak Bintang, 3 materi bertahap, kuis 3 soal diagnostik, form nama+absen
- Mode Guru: rekap kelas, analisis miskonsepsi, generator slide adaptif (5 slide), jurnal harian Kurikulum Merdeka
- Palette: biru ceria + toska, data dummy realistis

## User Choices
- MongoDB persistence for submissions
- AI slide generation (Claude Sonnet 4.6 via Emergent LLM key) with **default slides pre-loaded** + "Perbarui Slide dengan AI" button + loading indicator
- Export jurnal: copy to clipboard + print

## Architecture
- Backend FastAPI + MongoDB (motor). Endpoints under /api: /quiz, /submissions (CRUD), /analytics/misconceptions, /slides/default, /slides/latest, /slides/generate, /seed
- Auto-seed 18 realistic student submissions on startup if DB empty
- AI slides via emergentintegrations LlmChat → Claude Sonnet 4.6, cached in `slide_cache` collection
- Frontend React (single App, no router needed). Components: App (header+toggle), ModeSiswa, ModeGuru, SlideViewer, JurnalTable
- Fonts: Outfit (display) + Inter (body) + Segoe UI (chat)

## Implemented (Feb 2026)
- [x] Header with dual-pill mode toggle
- [x] Mode Siswa: WhatsApp UI, Kak Bintang avatar, online status, 3 materi bertahap, quiz w/ instant feedback, form submit
- [x] Mode Guru: stats cards, student recap table, misconception cards w/ progress bars
- [x] Slide viewer: 5 slides, fullscreen, keyboard nav, dot indicators
- [x] AI Perbarui Slide dengan AI (Claude Sonnet 4.6) + loading spinner
- [x] Jurnal Kurikulum Merdeka table + copy/print buttons
- [x] Auto-seed demo data

## Backlog / Next
- P1: Chart visualisasi tren skor per soal (recharts)
- P1: Voice-note simulation di chat siswa
- P2: Export jurnal ke PDF/DOCX
- P2: Multi-materi / topik lain
