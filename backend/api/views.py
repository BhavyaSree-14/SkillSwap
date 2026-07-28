from django.contrib.auth.tokens import default_token_generator
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    AdminFlag,
    Badge,
    Message,
    Skill,
    SkillCoinTransaction,
    SkillSwapRequest,
    Team,
    TeamMembership,
    User,
    UserBadge,
    UserSkill,
)
from .serializers import (
    AdminFlagSerializer,
    BadgeSerializer,
    MessageSerializer,
    RegisterSerializer,
    SkillCoinTransactionSerializer,
    SkillSerializer,
    SkillSwapRequestSerializer,
    TeamMembershipSerializer,
    TeamSerializer,
    UserBadgeSerializer,
    UserProfileSerializer,
    UserPublicSerializer,
    UserSkillSerializer,
)


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def award_coins(user, amount, reason, swap=None):
    txn_type = "earned" if amount >= 0 else "spent"
    SkillCoinTransaction.objects.create(
        user=user, amount=amount, type=txn_type, reason=reason, related_swap=swap
    )
    user.skill_coins = max(0, user.skill_coins + amount)
    user.save(update_fields=["skill_coins"])


def maybe_award_badge(user, name, description="", icon="award", criteria=""):
    badge, _ = Badge.objects.get_or_create(
        name=name, defaults={"description": description, "icon": icon, "criteria": criteria}
    )
    UserBadge.objects.get_or_create(user=user, badge=badge)


# ---------------------------------------------------------------- Auth ----

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": UserProfileSerializer(user).data, **tokens_for_user(user)},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ForgotPasswordView(APIView):
    """Issues a reset token. In production this would email the link; here
    it is returned directly so the frontend / QA can use it without an
    email backend configured."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "")
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "If that email exists, a reset link was generated."})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        return Response(
            {
                "detail": "Reset token generated.",
                "uid": uid,
                "token": token,
            }
        )


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("password")
        if not (uid and token and new_password):
            return Response({"detail": "uid, token and password are required."}, status=400)
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Invalid reset link."}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password has been reset."})


# -------------------------------------------------------------- Skills ----

class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    filterset_fields = ["category"]
    search_fields = ["name"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


class UserSkillViewSet(viewsets.ModelViewSet):
    serializer_class = UserSkillSerializer
    filterset_fields = ["type", "skill", "user"]

    def get_queryset(self):
        qs = UserSkill.objects.select_related("skill", "user")
        user_id = self.request.query_params.get("user")
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ---------------------------------------------------------- Marketplace ----

class MarketplaceView(generics.ListAPIView):
    """Browse users offering skills to teach, optionally filtered by skill/category."""

    serializer_class = UserSkillSerializer

    def get_queryset(self):
        qs = UserSkill.objects.filter(type="teach").select_related("skill", "user").exclude(
            user=self.request.user
        )
        category = self.request.query_params.get("category")
        skill = self.request.query_params.get("skill")
        search = self.request.query_params.get("search")
        if category:
            qs = qs.filter(skill__category=category)
        if skill:
            qs = qs.filter(skill_id=skill)
        if search:
            qs = qs.filter(Q(skill__name__icontains=search) | Q(user__username__icontains=search))
        return qs.order_by("-created_at")


# ---------------------------------------------------------- Matchmaking ----

class MatchmakingView(APIView):
    """Suggests other users whose 'teach' skills overlap with what the
    current user wants to learn, and vice versa (mutual-benefit score)."""

    def get(self, request):
        user = request.user
        my_learn_skill_ids = set(
            UserSkill.objects.filter(user=user, type="learn").values_list("skill_id", flat=True)
        )
        my_teach_skill_ids = set(
            UserSkill.objects.filter(user=user, type="teach").values_list("skill_id", flat=True)
        )

        candidates = (
            UserSkill.objects.filter(type="teach", skill_id__in=my_learn_skill_ids)
            .exclude(user=user)
            .select_related("user", "skill")
        )

        scored = {}
        for us in candidates:
            entry = scored.setdefault(
                us.user_id,
                {"user": us.user, "they_teach": [], "score": 0},
            )
            entry["they_teach"].append(us.skill.name)
            entry["score"] += 1

        # bonus point if that candidate also wants something we teach
        their_wants = UserSkill.objects.filter(
            type="learn", user_id__in=scored.keys(), skill_id__in=my_teach_skill_ids
        ).select_related("skill", "user")
        for us in their_wants:
            if us.user_id in scored:
                scored[us.user_id]["score"] += 2
                scored[us.user_id].setdefault("they_want_from_you", []).append(us.skill.name)

        results = sorted(scored.values(), key=lambda e: e["score"], reverse=True)
        data = [
            {
                "user": UserPublicSerializer(e["user"]).data,
                "match_score": e["score"],
                "they_can_teach_you": e["they_teach"],
                "they_want_from_you": e.get("they_want_from_you", []),
            }
            for e in results
        ]
        return Response(data)


# --------------------------------------------------------- Swap requests ----

class SkillSwapRequestViewSet(viewsets.ModelViewSet):
    serializer_class = SkillSwapRequestSerializer

    def get_queryset(self):
        user = self.request.user
        qs = SkillSwapRequest.objects.filter(Q(requester=user) | Q(recipient=user))
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs.select_related("requester", "recipient", "offered_skill", "requested_skill")

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        swap = self.get_object()
        if swap.recipient_id != request.user.id:
            return Response({"detail": "Only the recipient can accept."}, status=403)
        swap.status = "accepted"
        swap.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(swap).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        swap = self.get_object()
        if swap.recipient_id != request.user.id:
            return Response({"detail": "Only the recipient can reject."}, status=403)
        swap.status = "rejected"
        swap.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(swap).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        swap = self.get_object()
        if request.user.id not in (swap.requester_id, swap.recipient_id):
            return Response({"detail": "Not part of this swap."}, status=403)
        swap.status = "cancelled"
        swap.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(swap).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        swap = self.get_object()
        if request.user.id not in (swap.requester_id, swap.recipient_id):
            return Response({"detail": "Not part of this swap."}, status=403)
        if swap.status != "accepted":
            return Response({"detail": "Only accepted swaps can be completed."}, status=400)
        swap.status = "completed"
        swap.save(update_fields=["status", "updated_at"])

        award_coins(swap.requester, swap.coin_stake, f"Completed swap #{swap.id}", swap)
        award_coins(swap.recipient, swap.coin_stake, f"Completed swap #{swap.id}", swap)

        for u in (swap.requester, swap.recipient):
            completed_count = SkillSwapRequest.objects.filter(
                Q(requester=u) | Q(recipient=u), status="completed"
            ).count()
            if completed_count == 1:
                maybe_award_badge(u, "First Swap", "Completed your first skill swap!", "sparkles")
            if completed_count == 10:
                maybe_award_badge(u, "Swap Veteran", "Completed 10 skill swaps.", "trophy")

        return Response(self.get_serializer(swap).data)


# --------------------------------------------------------------- Messages ----

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.filter(Q(sender=user) | Q(recipient=user))
        other = self.request.query_params.get("with")
        if other:
            qs = qs.filter(Q(sender_id=other) | Q(recipient_id=other))
        return qs.select_related("sender", "recipient")

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=["get"])
    def conversations(self, request):
        user = request.user
        msgs = Message.objects.filter(Q(sender=user) | Q(recipient=user)).select_related(
            "sender", "recipient"
        )
        partners = {}
        for m in msgs:
            partner = m.recipient if m.sender_id == user.id else m.sender
            existing = partners.get(partner.id)
            if not existing or m.created_at > existing["last_message"].created_at:
                partners[partner.id] = {"user": partner, "last_message": m}

        unread_counts = {
            row["sender"]: row["count"]
            for row in Message.objects.filter(recipient=user, is_read=False)
            .values("sender")
            .annotate(count=Count("id"))
        }

        data = [
            {
                "user": UserPublicSerializer(v["user"]).data,
                "last_message": MessageSerializer(v["last_message"]).data,
                "unread_count": unread_counts.get(v["user"].id, 0),
            }
            for v in sorted(partners.values(), key=lambda x: x["last_message"].created_at, reverse=True)
        ]
        return Response(data)

    @action(detail=False, methods=["post"])
    def mark_read(self, request):
        other = request.data.get("with")
        Message.objects.filter(sender_id=other, recipient=request.user, is_read=False).update(
            is_read=True
        )
        return Response({"detail": "marked read"})


# ------------------------------------------------------------------ Teams ----

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.select_related("owner", "focus_skill").all()
    serializer_class = TeamSerializer
    search_fields = ["name", "description"]

    def perform_create(self, serializer):
        team = serializer.save(owner=self.request.user)
        TeamMembership.objects.create(team=team, user=self.request.user, role="owner")

    @action(detail=True, methods=["post"])
    def join(self, request, pk=None):
        team = self.get_object()
        if team.memberships.count() >= team.max_members:
            return Response({"detail": "Team is full."}, status=400)
        membership, created = TeamMembership.objects.get_or_create(
            team=team, user=request.user, defaults={"role": "member"}
        )
        if not created:
            return Response({"detail": "Already a member."}, status=400)
        return Response(TeamSerializer(team).data)

    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        team = self.get_object()
        TeamMembership.objects.filter(team=team, user=request.user).exclude(role="owner").delete()
        return Response(TeamSerializer(team).data)


# ------------------------------------------------------------- Leaderboard ----

class LeaderboardView(APIView):
    def get(self, request):
        completed = SkillSwapRequest.objects.filter(status="completed")
        counts = {}
        for swap in completed:
            counts[swap.requester_id] = counts.get(swap.requester_id, 0) + 1
            counts[swap.recipient_id] = counts.get(swap.recipient_id, 0) + 1

        users = list(User.objects.order_by("-skill_coins")[:50])
        data = [
            {
                **UserPublicSerializer(u).data,
                "completed_swaps": counts.get(u.id, 0),
                "badge_count": u.badges.count(),
            }
            for u in users
        ]
        return Response(data)


# ------------------------------------------------------------------ Badges ----

class BadgeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer


class UserBadgeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserBadgeSerializer

    def get_queryset(self):
        qs = UserBadge.objects.select_related("badge", "user")
        user_id = self.request.query_params.get("user")
        if user_id:
            qs = qs.filter(user_id=user_id)
        else:
            qs = qs.filter(user=self.request.user)
        return qs


# ------------------------------------------------------------------ Wallet ----

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SkillCoinTransactionSerializer

    def get_queryset(self):
        return SkillCoinTransaction.objects.filter(user=self.request.user)


# --------------------------------------------------------------- Skill DNA ----

class SkillDNAView(APIView):
    """Radar-chart friendly breakdown of a user's skill proficiency by category."""

    PROFICIENCY_SCORE = {"beginner": 25, "intermediate": 50, "advanced": 75, "expert": 100}

    def get(self, request):
        user_id = request.query_params.get("user", request.user.id)
        skills = UserSkill.objects.filter(user_id=user_id, type="teach").select_related("skill")
        by_category = {}
        for us in skills:
            cat = us.skill.category
            score = self.PROFICIENCY_SCORE.get(us.proficiency, 25)
            by_category[cat] = max(by_category.get(cat, 0), score)
        data = [{"category": cat, "score": score} for cat, score in by_category.items()]
        return Response({"user": int(user_id), "dna": data})


class SkillGapView(APIView):
    """Compares what the user wants to learn against what's available in the
    marketplace, highlighting gaps (skills nobody nearby teaches yet)."""

    def get(self, request):
        wants = UserSkill.objects.filter(user=request.user, type="learn").select_related("skill")
        gaps = []
        covered = []
        for w in wants:
            teacher_count = UserSkill.objects.filter(type="teach", skill=w.skill).exclude(
                user=request.user
            ).count()
            entry = {
                "skill": SkillSerializer(w.skill).data,
                "desired_proficiency": w.proficiency,
                "available_teachers": teacher_count,
            }
            (covered if teacher_count > 0 else gaps).append(entry)
        return Response({"gaps": gaps, "covered": covered})


# --------------------------------------------------------------- Analytics ----

class AnalyticsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        return Response(
            {
                "total_users": User.objects.count(),
                "total_skills": Skill.objects.count(),
                "total_swap_requests": SkillSwapRequest.objects.count(),
                "swaps_by_status": {
                    row["status"]: row["count"]
                    for row in SkillSwapRequest.objects.values("status").annotate(count=Count("id"))
                },
                "total_teams": Team.objects.count(),
                "total_messages": Message.objects.count(),
                "total_coins_in_circulation": sum(User.objects.values_list("skill_coins", flat=True)),
                "open_flags": AdminFlag.objects.filter(status="open").count(),
                "top_categories": list(
                    UserSkill.objects.values("skill__category")
                    .annotate(count=Count("id"))
                    .order_by("-count")[:10]
                ),
            }
        )


# ----------------------------------------------------------------- Admin ----

class AdminFlagViewSet(viewsets.ModelViewSet):
    serializer_class = AdminFlagSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return AdminFlag.objects.select_related("reporter", "target_user").all()
        return AdminFlag.objects.filter(reporter=self.request.user)

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def resolve(self, request, pk=None):
        flag = self.get_object()
        flag.status = "resolved"
        flag.resolved_at = timezone.now()
        flag.save(update_fields=["status", "resolved_at"])
        return Response(self.get_serializer(flag).data)


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin-only management of all users."""

    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAdminUser]
    search_fields = ["username", "email"]

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["post"])
    def toggle_verified(self, request, pk=None):
        user = self.get_object()
        user.is_verified = not user.is_verified
        user.save(update_fields=["is_verified"])
        return Response(self.get_serializer(user).data)
