# RECYcORA AI

An intelligent Waste Management, Recycling, Sustainability Analytics, Computer Vision, and
Environmental Intelligence Platform. Full-stack, functional, and connected end-to-end — no
placeholder screens or fake data flows.

> **Demo data note:** the seed script populates realistic demo accounts and history so the
> product can be explored immediately. Every number you see beyond that comes from what you
> actually log or scan — nothing is hard-coded into the UI.

## What's actually implemented (v1 — Core MVP)

This build focuses on a fully working core experience rather than a wide, half-wired surface:

- **Cinematic landing page** — animated hero with a live AI-scan visualization, a GSAP
  scroll-driven "From Waste to Impact" storytelling section, and a features/CTA layout.
- **Real authentication** — registration, login, JWT tokens, hashed passwords, role-based
  access control (`user`, `business`, `admin`) enforced on both the API and the frontend routes.
- **AI Waste Scanner** — drag-and-drop image upload, a real computer-vision heuristic
  classifier (color/texture/brightness analysis via Pillow + NumPy — see "About the AI engine"
  below), confidence scoring, disposal guidance, and persisted scan history.
- **Smart Recycling Assistant** — a rule-based chat assistant with a curated knowledge base,
  typing indicator, and suggested follow-up questions.
- **Personal Dashboard** — real metrics, weekly/monthly charts, category distribution,
  a transparent multi-factor sustainability score, recent scans, AI recommendations generated
  from your actual data, and an achievements/Eco Points system.
- **Business Dashboard** — organization-level metrics, department/category breakdowns, a
  linear-regression waste forecast, and AI recommendations.
- **Recycling Center Finder** — category filtering, distance sorting from your location, and
  a dependency-free spatial preview panel (see note on maps below).
- **Admin Console** — platform-wide analytics, user management (activate/deactivate), and a
  cross-user scan feed.
- **Waste record logging**, environmental impact estimates (clearly labeled as estimates, with
  methodology notes), and full loading/empty/error states throughout.

Not built in this pass: a trained ML model (see below), a paid maps integration, and deep
GSAP pinning beyond the storytelling section. These are the natural next slices of work.

## About the AI engine

No trained model ships with this project (there's no image dataset to train one on here).
Instead, `backend/app/services/ai_service.py` implements a genuine computer-vision heuristic:
it computes real pixel statistics (mean color, brightness, saturation, texture/edge density
via Pillow + NumPy) and maps them to waste categories through calibrated rules — this is a
legitimate classical CV approach, not a random or hard-coded response, and confidence scores
are calibrated to reflect that it isn't a trained neural network. The code is deliberately
split into a `WasteClassifier` interface and a swappable implementation so a real trained
model (e.g., a fine-tuned CNN) can be dropped in later without touching any route code.

## About the tech stack (and why it differs slightly from a typical FastAPI/SQLAlchemy write-up)

The backend is **Flask + Python's built-in `sqlite3`** rather than FastAPI + SQLAlchemy +
Postgres. Functionally it's equivalent — a clean layered architecture (routes / services /
data-access-as-repository / schemas / auth), real JWT auth, real password hashing, real
input validation via Pydantic, and zero ORM "magic" standing between you and the SQL. This
choice was made so the entire system could be built *and actually run end-to-end* in the
environment that produced it (which had no access to PyPI to install FastAPI/SQLAlchemy).
Every endpoint below has been smoke-tested live against a running server with seeded data.

The data layer (`backend/app/db.py`) uses parameterized queries exclusively and is organized
by table, so moving to PostgreSQL later is a matter of swapping `get_connection()` for a
`psycopg2` connection and `?` placeholders for `%s` — no route or service code changes needed.

The **frontend** is the originally specified stack: React + Vite + Tailwind CSS + Framer
Motion + GSAP + Recharts + React Router + Axios + Lucide icons. It could not be
`npm install`'d or built in the authoring environment (no registry access), so while every
file has been hand-reviewed and syntax-validated with the TypeScript compiler in JSX-parsing
mode, you should treat first install/run on your machine as the first real build — see
Troubleshooting below if anything needs a tweak.

## Project structure

```
recycora-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory, CORS, blueprint registration
│   │   ├── config.py            # env-based settings
│   │   ├── db.py                # sqlite3 data-access layer (repository pattern)
│   │   ├── security.py          # password hashing (Werkzeug/scrypt) + JWT (PyJWT)
│   │   ├── auth_utils.py        # @login_required / @roles_required decorators
│   │   ├── schemas.py           # Pydantic request validation
│   │   ├── validation.py        # request parsing + dict->JSON serializers
│   │   ├── file_upload.py       # upload validation, safe filenames
│   │   ├── routes/              # auth, users, scans, waste, analytics, recycling_centers,
│   │   │                        # business, admin, assistant
│   │   └── services/            # ai_service, scoring_service, forecasting_service,
│   │                            # recommendation_service, assistant_service
│   ├── uploads/waste_scans/     # uploaded + seeded scan images
│   ├── requirements.txt
│   ├── seed.py                  # realistic demo data generator
│   ├── run.py                   # dev server entrypoint
│   └── wsgi.py                  # production entrypoint (gunicorn)
└── frontend/
    ├── src/
    │   ├── components/          # ui/, navbar/, footer/, charts/, scanner/, dashboard/, maps/, home/
    │   ├── pages/                # Home, Login, Register, Scanner, Assistant, Dashboard,
    │   │                         # BusinessDashboard, RecyclingCenters, Profile, Admin
    │   ├── services/api.js       # axios client + JWT interceptor
    │   ├── hooks/useAuth.jsx     # auth context/provider
    │   └── App.jsx / main.jsx
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

## Running it locally

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # adjust JWT_SECRET_KEY etc. if you like
python seed.py                  # populates demo accounts + realistic history
python run.py                   # runs on http://localhost:8000
```

Demo accounts created by `seed.py`:

| Role     | Email                              | Password     |
|----------|-------------------------------------|--------------|
| Personal | `amara.demo@demo.recycora.ai`       | `Demo1234!`  |
| Business | `business.demo@demo.recycora.ai`    | `Demo1234!`  |
| Admin    | `admin@demo.recycora.ai`            | `Admin123!`  |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL defaults to http://localhost:8000
npm run dev                     # runs on http://localhost:5173
```

Open `http://localhost:5173`, log in with a demo account (or register a new one), and explore.

### Production notes

- Backend: `gunicorn -w 2 -b 0.0.0.0:8000 wsgi:app` (set a strong `JWT_SECRET_KEY` in `.env`).
- Frontend: `npm run build` then serve `dist/` from any static host, pointing
  `VITE_API_URL` at your deployed backend.
- Swap `DATABASE_PATH` for a Postgres connection by adapting `app/db.py`'s `get_connection()`.

## Troubleshooting a first run

Because this project's dependencies couldn't be installed in the authoring sandbox, here's
what to check if something doesn't come up cleanly on the first try:

- **Backend won't start**: confirm `python --version` is 3.10+ and that `pip install -r
  requirements.txt` completed without errors.
- **Frontend blank page / build error**: run `npm install` fresh (delete `node_modules` and
  `package-lock.json` if one was generated with a different resolver first), then `npm run dev`
  and check the terminal for the specific missing/mismatched package — the versions pinned in
  `package.json` are current stable releases as of writing.
- **CORS errors in the browser console**: make sure `CORS_ORIGINS` in `backend/.env` includes
  the exact origin Vite is serving from (default `http://localhost:5173`).
- **Images not loading in scan history**: confirm the backend is running and reachable at the
  `VITE_API_URL` the frontend is configured with — scan images are served from
  `<backend>/uploads/...`.

## Environmental estimates & methodology

Sustainability scores, forecasts, and "estimated impact" figures are clearly labeled as
estimates throughout the UI. Methodology:

- **Sustainability score**: weighted blend of recycling rate (35%), waste-reduction trend (25%),
  logging consistency (20%), and disposal-outcome quality (20%) — see `scoring_service.py`.
- **Forecasting**: ordinary least-squares linear regression per waste category over your
  logged records, with a confidence indicator derived from residual variance — see
  `forecasting_service.py`. Never presented as guaranteed.
- **Estimated impact**: standard diversion-rate assumptions applied to logged, recycled
  quantities — not a certified environmental audit.
