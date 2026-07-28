import random

from django.core.management.base import BaseCommand

from api.models import Skill, SkillSwapRequest, Team, User, UserSkill

SKILLS = [
    ("Python", "technology"), ("React", "technology"), ("UI/UX Design", "design"),
    ("Photography", "design"), ("Public Speaking", "business"), ("Excel", "business"),
    ("Spanish", "language"), ("French", "language"), ("Guitar", "music"),
    ("Piano", "music"), ("Yoga", "lifestyle"), ("Cooking", "lifestyle"),
]

DEMO_USERS = [
    ("aisha", "Aisha Khan"), ("liam", "Liam Chen"), ("noor", "Noor Ahmed"),
    ("diego", "Diego Ramirez"), ("mei", "Mei Tanaka"), ("sara", "Sara Novak"),
]


class Command(BaseCommand):
    help = "Seed the database with demo skills, users, and swap requests."

    def handle(self, *args, **options):
        skill_objs = []
        for name, category in SKILLS:
            skill, _ = Skill.objects.get_or_create(name=name, defaults={"category": category})
            skill_objs.append(skill)

        users = []
        for username, full_name in DEMO_USERS:
            first, *last = full_name.split(" ")
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@example.com",
                    "first_name": first,
                    "last_name": " ".join(last),
                    "bio": f"Hi, I'm {first}! Excited to swap skills.",
                    "skill_coins": random.randint(80, 300),
                },
            )
            if created:
                user.set_password("password123")
                user.save()
            users.append(user)

        for user in users:
            teach = random.sample(skill_objs, 2)
            learn = random.sample([s for s in skill_objs if s not in teach], 2)
            for s in teach:
                UserSkill.objects.get_or_create(
                    user=user, skill=s, type="teach",
                    defaults={"proficiency": random.choice(["intermediate", "advanced", "expert"])},
                )
            for s in learn:
                UserSkill.objects.get_or_create(
                    user=user, skill=s, type="learn",
                    defaults={"proficiency": "beginner"},
                )

        if not Team.objects.exists() and users:
            Team.objects.create(
                name="Frontend Wizards", description="A team leveling up React & design skills.",
                owner=users[0], focus_skill=skill_objs[1], max_members=5,
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded. Login as any demo user with password: password123"))
