from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView

from . import views

router = DefaultRouter()
router.register("skills", views.SkillViewSet, basename="skill")
router.register("user-skills", views.UserSkillViewSet, basename="userskill")
router.register("swap-requests", views.SkillSwapRequestViewSet, basename="swaprequest")
router.register("messages", views.MessageViewSet, basename="message")
router.register("teams", views.TeamViewSet, basename="team")
router.register("badges", views.BadgeViewSet, basename="badge")
router.register("user-badges", views.UserBadgeViewSet, basename="userbadge")
router.register("wallet/transactions", views.TransactionViewSet, basename="transaction")
router.register("admin/flags", views.AdminFlagViewSet, basename="adminflag")
router.register("admin/users", views.AdminUserViewSet, basename="adminuser")

urlpatterns = [
    # Auth
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("auth/forgot-password/", views.ForgotPasswordView.as_view(), name="forgot_password"),
    path("auth/reset-password/", views.ResetPasswordView.as_view(), name="reset_password"),
    # Feature endpoints
    path("marketplace/", views.MarketplaceView.as_view(), name="marketplace"),
    path("matchmaking/", views.MatchmakingView.as_view(), name="matchmaking"),
    path("leaderboard/", views.LeaderboardView.as_view(), name="leaderboard"),
    path("skill-dna/", views.SkillDNAView.as_view(), name="skill_dna"),
    path("skill-gap/", views.SkillGapView.as_view(), name="skill_gap"),
    path("analytics/", views.AnalyticsView.as_view(), name="analytics"),
    path("", include(router.urls)),
]
