# SkillSwap+

A full-stack rebuild of the SkillSwap+ app: **Django REST Framework** backend +
**React (Vite)** frontend, styled to match the original design (indigo accent,
Plus Jakarta Sans / Inter, rounded cards).

> The original frontend you uploaded was a compiled build from Base44 (a
> no-code app builder) — the minified JS was hard-wired to Base44's own hosted
> backend/auth, so it couldn't be repointed at a custom backend. This project
> reimplements the same feature set (marketplace, matchmaking, swap requests,
> messaging, teams, leaderboard, skill DNA, skill gap, analytics, admin) end
> to end with real, working code you own.

## Project structure

```
skillswap-project/
├── backend/     Django REST Framework API (JWT auth, SQLite by default)
└── frontend/    React + Vite + Tailwind SPA
```

## 1. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser   # for /admin/ and the app's Admin page (needs is_staff)
python manage.py seed_demo_data    # optional: adds demo users/skills (password: password123)

python manage.py runserver          # http://127.0.0.1:8000
```

Django admin is at `http://127.0.0.1:8000/admin/`.
The API is namespaced under `http://127.0.0.1:8000/api/`.

### Key endpoints

| Purpose | Endpoint |
|---|---|
| Register | `POST /api/auth/register/` |
| Login (JWT) | `POST /api/auth/login/` → `{access, refresh}` |
| Refresh token | `POST /api/auth/refresh/` |
| Current user / profile | `GET|PATCH /api/auth/me/` |
| Forgot / reset password | `POST /api/auth/forgot-password/`, `POST /api/auth/reset-password/` |
| Skills catalog | `/api/skills/` |
| My skills (teach/learn) | `/api/user-skills/` |
| Marketplace listings | `GET /api/marketplace/?category=&search=` |
| Matchmaking suggestions | `GET /api/matchmaking/` |
| Swap requests | `/api/swap-requests/` (+ `accept/`, `reject/`, `cancel/`, `complete/`) |
| Messages | `/api/messages/` (+ `conversations/`, `mark_read/`) |
| Teams | `/api/teams/` (+ `join/`, `leave/`) |
| Leaderboard | `GET /api/leaderboard/` |
| Badges | `/api/badges/`, `/api/user-badges/` |
| SkillCoin wallet | `GET /api/wallet/transactions/` |
| Skill DNA (radar data) | `GET /api/skill-dna/` |
| Skill gap analysis | `GET /api/skill-gap/` |
| Analytics (staff only) | `GET /api/analytics/` |
| Admin: flags | `/api/admin/flags/` (+ `resolve/`) |
| Admin: users | `/api/admin/users/` (+ `toggle_active/`, `toggle_verified/`) |

SkillCoins are awarded automatically (100 on signup, a stake back to both
sides when a swap is marked `complete`), and "First Swap" / "Swap Veteran"
badges are granted automatically as swaps complete.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8000`, so just run
the Django server alongside it — no CORS/env config needed for local dev.

For production, `npm run build` outputs static files in `frontend/dist/`
that you can serve from any static host or from Django's `staticfiles`.

## Notes / next steps

- Password reset currently returns the `uid`/`token` directly in the API
  response (and the frontend shows a dev-mode link) since no email backend
  is configured. Wire up `EMAIL_BACKEND` in `settings.py` and email the link
  instead for production.
- `DEBUG=True` and `SECRET_KEY` are dev defaults — set real environment
  variables before deploying.
- Data model lives in `backend/api/models.py`: `User`, `Skill`, `UserSkill`,
  `SkillSwapRequest`, `Message`, `Team`/`TeamMembership`, `Badge`/`UserBadge`,
  `SkillCoinTransaction`, `AdminFlag`.
