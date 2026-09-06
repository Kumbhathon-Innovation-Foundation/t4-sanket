# Kumbhathon SPRINT 2026 — Submission Checklist

**Project Name:** ANUBHAV (अनुभव)  
**Tower:** Tower 4 - Pilgrim Experience  
**Team:** Sanket  
**Repository:** `https://github.com/Kumbhathon-Innovation-Foundation/t4-sanket/`  
**Target Branch:** `main`

---

## 📋 Submission Requirements Checklist

- [x] **Source code / build files**:
  - Full Python FastAPI backend with Dual LLM agent (Gemini 3.6 Flash + Groq fallback), OSRM routing, tool executor, and real-time watcher in `backend/`.
  - Full Flutter native cross-platform application (Web, Android, Windows) with native map stack, live simulation, tactical timeline, and voice navigation in `flutter_app/`.
  - 3,266 pre-seeded master Kumbh Mela geo-records in `data/`.
  - Architecture specifications in `docs/`.

- [x] **README updated: what it does, how to run it**:
  - `README.md` at root contains comprehensive project summary, architecture diagrams, 8 domain tools, feature descriptions, and copy-paste run instructions for backend and frontend.

- [x] **DEMO.md - live demo guide, 3-minute video/flow, and screenshots**:
  - `DEMO.md` provides a timed 3-minute, 4-scene live presentation script:
    1. Highway arrival & outer-zone feeder shuttle leg
    2. Proactive heritage audio alerts & walk simulation
    3. In-journey sanitation / food detours (<0.5s sub-second rerouting)
    4. "Way Back to Your Parking" return navigation
  - Visual descriptions of all 4 core UI screens and a quick test matrix for judges.

- [x] **Team + tower confirmed at the top of the README**:
  - Confirmed at the very top of `README.md`, `DEMO.md`, and `SUBMISSION.md`:
    - **Team:** Sanket
    - **Tower:** 4 - Pilgrim Experience

- [x] **Anything judges need to test it**:
  - **Online Supabase Database**: Pre-configured in `backend/.env` and `flutter_app/lib/config.dart` with all 3,266 POIs pre-seeded.
  - **Sample Test Queries**: Included in `README.md` and `DEMO.md` across Hindi, Marathi, and English.
  - **Automated Verification Scripts**:
    - `python backend/test_return_and_multi.py` (Validates 7-stop family plan and return to parking).
    - `python backend/test_stage9.py` (Validates outer transit and multilingual schema).
    - `flutter analyze` (0 issues).
    - `flutter test` (11 passing unit and widget tests).
  - **Hardware / Software Requirements**:
    - Backend: Any machine with Python 3.10+ (Windows, macOS, or Linux).
    - Frontend: Any web browser (Google Chrome recommended for Web Audio TTS), Android device (Android 8.0+), or Windows desktop.

---

*All code, documentation, and assets are pushed to `main` before the deadline.*
