from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user with the extra profile fields SkillSwap+ needs."""

    bio = models.TextField(blank=True, default="")
    avatar_url = models.URLField(blank=True, default="")
    location = models.CharField(max_length=120, blank=True, default="")
    skill_coins = models.PositiveIntegerField(default=100)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username


class Skill(models.Model):
    CATEGORY_CHOICES = [
        ("technology", "Technology"),
        ("design", "Design"),
        ("business", "Business"),
        ("language", "Language"),
        ("music", "Music"),
        ("lifestyle", "Lifestyle"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class UserSkill(models.Model):
    TYPE_CHOICES = [("teach", "Can Teach"), ("learn", "Wants to Learn")]
    PROFICIENCY_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
        ("expert", "Expert"),
    ]

    user = models.ForeignKey(User, related_name="user_skills", on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, related_name="user_skills", on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    proficiency = models.CharField(max_length=15, choices=PROFICIENCY_CHOICES, default="beginner")
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "skill", "type")

    def __str__(self):
        return f"{self.user.username} - {self.skill.name} ({self.type})"


class SkillSwapRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    requester = models.ForeignKey(User, related_name="sent_requests", on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, related_name="received_requests", on_delete=models.CASCADE)
    offered_skill = models.ForeignKey(
        Skill, related_name="offered_in_requests", on_delete=models.CASCADE
    )
    requested_skill = models.ForeignKey(
        Skill, related_name="requested_in_requests", on_delete=models.CASCADE
    )
    message = models.TextField(blank=True, default="")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    coin_stake = models.PositiveIntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.requester.username} -> {self.recipient.username} ({self.status})"


class Message(models.Model):
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, related_name="received_messages", on_delete=models.CASCADE)
    swap_request = models.ForeignKey(
        SkillSwapRequest, related_name="messages", null=True, blank=True, on_delete=models.SET_NULL
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.content[:30]}"


class Team(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, default="")
    owner = models.ForeignKey(User, related_name="owned_teams", on_delete=models.CASCADE)
    focus_skill = models.ForeignKey(
        Skill, related_name="teams", null=True, blank=True, on_delete=models.SET_NULL
    )
    max_members = models.PositiveIntegerField(default=6)
    created_at = models.DateTimeField(auto_now_add=True)
    members = models.ManyToManyField(User, through="TeamMembership", related_name="teams")

    def __str__(self):
        return self.name


class TeamMembership(models.Model):
    ROLE_CHOICES = [("owner", "Owner"), ("member", "Member")]

    team = models.ForeignKey(Team, related_name="memberships", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="team_memberships", on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("team", "user")


class Badge(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default="")
    icon = models.CharField(max_length=50, default="award")
    criteria = models.CharField(max_length=255, blank=True, default="")

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    user = models.ForeignKey(User, related_name="badges", on_delete=models.CASCADE)
    badge = models.ForeignKey(Badge, related_name="awarded_to", on_delete=models.CASCADE)
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "badge")


class SkillCoinTransaction(models.Model):
    TYPE_CHOICES = [("earned", "Earned"), ("spent", "Spent")]

    user = models.ForeignKey(User, related_name="transactions", on_delete=models.CASCADE)
    amount = models.IntegerField()
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    reason = models.CharField(max_length=255)
    related_swap = models.ForeignKey(
        SkillSwapRequest, related_name="transactions", null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class AdminFlag(models.Model):
    STATUS_CHOICES = [("open", "Open"), ("reviewing", "Reviewing"), ("resolved", "Resolved")]

    reporter = models.ForeignKey(User, related_name="filed_flags", on_delete=models.CASCADE)
    target_user = models.ForeignKey(
        User, related_name="flags_against", null=True, blank=True, on_delete=models.CASCADE
    )
    target_message = models.ForeignKey(
        Message, related_name="flags", null=True, blank=True, on_delete=models.SET_NULL
    )
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="open")
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
