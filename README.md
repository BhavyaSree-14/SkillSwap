# SkillSwap

SkillSwap is an AI-powered skill exchange platform that enables users to connect, learn, and collaborate by matching individuals based on their skills, learning goals, and interests. The application provides an interactive marketplace for skill sharing, intelligent matchmaking, messaging, team collaboration, and gamification features to encourage continuous learning.

## Features

- AI-powered skill matchmaking and recommendations
- User authentication using JWT
- Skill marketplace for teaching and learning
- Skill swap requests and request management
- Real-time messaging between users
- Team creation and collaboration
- Skill DNA and skill gap analysis
- Leaderboard, badges, and SkillCoin reward system
- User profile and progress tracking
- Admin dashboard for user and content management

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios
- React Router

### Backend
- Django
- Django REST Framework
- JWT Authentication

### Database
- SQLite

### AI & Machine Learning
- Python
- Scikit-learn (Skill Matchmaking & Recommendation)

---

## Project Structure

```
skillswap-project/
├── backend/     Django REST Framework API
└── frontend/    React + Vite Application
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate

python manage.py createsuperuser

python manage.py runserver
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## Core Modules

- User Authentication
- User Profile Management
- Skill Marketplace
- AI Skill Matchmaking
- Skill Swap Requests
- Messaging System
- Team Collaboration
- Skill DNA Analysis
- Skill Gap Analysis
- Leaderboard & Rewards
- Admin Dashboard

---

## Future Enhancements

- Real-time chat using WebSockets
- Email verification and password recovery
- Cloud deployment
- AI-based personalized learning roadmap
- Video call integration for skill exchange sessions

---

## License

This project is developed for educational and portfolio purposes.
