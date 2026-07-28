from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

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


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["username", "email", "skill_coins", "is_verified", "is_staff"]
    fieldsets = UserAdmin.fieldsets + (
        ("SkillSwap+", {"fields": ("bio", "avatar_url", "location", "skill_coins", "is_verified")}),
    )


admin.site.register(Skill)
admin.site.register(UserSkill)
admin.site.register(SkillSwapRequest)
admin.site.register(Message)
admin.site.register(Team)
admin.site.register(TeamMembership)
admin.site.register(Badge)
admin.site.register(UserBadge)
admin.site.register(SkillCoinTransaction)
admin.site.register(AdminFlag)
