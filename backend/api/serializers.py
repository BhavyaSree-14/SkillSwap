from django.contrib.auth import password_validation
from rest_framework import serializers

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


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name", "category"]


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "bio",
            "avatar_url",
            "location",
            "rating_avg",
            "rating_count",
            "is_verified",
            "skill_coins",
            "created_at",
        ]
        read_only_fields = fields


class UserSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source="skill.name", read_only=True)
    skill_category = serializers.CharField(source="skill.category", read_only=True)

    class Meta:
        model = UserSkill
        fields = [
            "id",
            "user",
            "skill",
            "skill_name",
            "skill_category",
            "type",
            "proficiency",
            "description",
            "created_at",
        ]
        read_only_fields = ["user", "created_at"]


class UserProfileSerializer(serializers.ModelSerializer):
    """Full profile of the logged-in user, including their skills."""

    teach_skills = serializers.SerializerMethodField()
    learn_skills = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "bio",
            "avatar_url",
            "location",
            "skill_coins",
            "rating_avg",
            "rating_count",
            "is_verified",
            "is_staff",
            "is_active",
            "created_at",
            "teach_skills",
            "learn_skills",
        ]
        read_only_fields = ["id", "username", "skill_coins", "rating_avg", "rating_count", "is_verified", "is_staff", "created_at"]

    def get_teach_skills(self, obj):
        qs = obj.user_skills.filter(type="teach")
        return UserSkillSerializer(qs, many=True).data

    def get_learn_skills(self, obj):
        qs = obj.user_skills.filter(type="learn")
        return UserSkillSerializer(qs, many=True).data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name"]

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def create(self, validated_data):
        from django.conf import settings

        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.skill_coins = settings.SIGNUP_BONUS_COINS
        user.save()
        return user


class SkillSwapRequestSerializer(serializers.ModelSerializer):
    requester_detail = UserPublicSerializer(source="requester", read_only=True)
    recipient_detail = UserPublicSerializer(source="recipient", read_only=True)
    offered_skill_name = serializers.CharField(source="offered_skill.name", read_only=True)
    requested_skill_name = serializers.CharField(source="requested_skill.name", read_only=True)

    class Meta:
        model = SkillSwapRequest
        fields = [
            "id",
            "requester",
            "requester_detail",
            "recipient",
            "recipient_detail",
            "offered_skill",
            "offered_skill_name",
            "requested_skill",
            "requested_skill_name",
            "message",
            "status",
            "coin_stake",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["requester", "status", "created_at", "updated_at"]


class MessageSerializer(serializers.ModelSerializer):
    sender_detail = UserPublicSerializer(source="sender", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "sender_detail",
            "recipient",
            "swap_request",
            "content",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["sender", "is_read", "created_at"]


class TeamMembershipSerializer(serializers.ModelSerializer):
    user_detail = UserPublicSerializer(source="user", read_only=True)

    class Meta:
        model = TeamMembership
        fields = ["id", "team", "user", "user_detail", "role", "joined_at"]
        read_only_fields = ["joined_at"]


class TeamSerializer(serializers.ModelSerializer):
    owner_detail = UserPublicSerializer(source="owner", read_only=True)
    focus_skill_name = serializers.CharField(source="focus_skill.name", read_only=True, default="")
    member_count = serializers.SerializerMethodField()
    members_detail = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "description",
            "owner",
            "owner_detail",
            "focus_skill",
            "focus_skill_name",
            "max_members",
            "member_count",
            "members_detail",
            "created_at",
        ]
        read_only_fields = ["owner", "created_at"]

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_members_detail(self, obj):
        return TeamMembershipSerializer(obj.memberships.select_related("user"), many=True).data


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ["id", "name", "description", "icon", "criteria"]


class UserBadgeSerializer(serializers.ModelSerializer):
    badge_detail = BadgeSerializer(source="badge", read_only=True)

    class Meta:
        model = UserBadge
        fields = ["id", "user", "badge", "badge_detail", "awarded_at"]


class SkillCoinTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillCoinTransaction
        fields = ["id", "user", "amount", "type", "reason", "related_swap", "created_at"]
        read_only_fields = fields


class AdminFlagSerializer(serializers.ModelSerializer):
    reporter_detail = UserPublicSerializer(source="reporter", read_only=True)
    target_user_detail = UserPublicSerializer(source="target_user", read_only=True)

    class Meta:
        model = AdminFlag
        fields = [
            "id",
            "reporter",
            "reporter_detail",
            "target_user",
            "target_user_detail",
            "target_message",
            "reason",
            "status",
            "created_at",
            "resolved_at",
        ]
        read_only_fields = ["reporter", "created_at", "resolved_at"]
