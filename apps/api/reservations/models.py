from __future__ import annotations

import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone


def empty_localized_text() -> dict[str, str]:
    return {"fi": "", "en": ""}


def validate_localized_text(value: object, *, require_all: bool = False) -> None:
    if not isinstance(value, dict):
        raise ValidationError("Localized text must be an object.")

    missing_keys = {"fi", "en"} - set(value.keys())
    if missing_keys:
        raise ValidationError(f"Localized text is missing keys: {', '.join(sorted(missing_keys))}.")

    for locale in ("fi", "en"):
        if not isinstance(value.get(locale), str):
            raise ValidationError(f"Localized text value for {locale} must be a string.")
        if require_all and not value[locale].strip():
            raise ValidationError(f"Localized text value for {locale} is required.")


class TimestampedUUIDModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UserProfile(TimestampedUUIDModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="reservation_profile",
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=255)
    is_admin = models.BooleanField(default=False)

    @property
    def email(self) -> str:
        return self.user.email

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"


class UserAccessToken(TimestampedUUIDModel):
    user_profile = models.ForeignKey(UserProfile, related_name="access_tokens", on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["token_hash"]),
            models.Index(fields=["expires_at"]),
            models.Index(fields=["revoked_at"]),
        ]

    @property
    def is_active(self) -> bool:
        return self.revoked_at is None and self.expires_at > timezone.now()

    def __str__(self) -> str:
        return f"access token for {self.user_profile}"


class Unit(TimestampedUUIDModel):
    name = models.JSONField()
    address = models.JSONField(default=empty_localized_text, blank=True)

    def clean(self) -> None:
        validate_localized_text(self.name, require_all=True)
        validate_localized_text(self.address)

    def __str__(self) -> str:
        return self.name.get("fi") or self.name.get("en") or str(self.id)


class Resource(TimestampedUUIDModel):
    unit = models.ForeignKey(Unit, related_name="resources", on_delete=models.CASCADE)
    name = models.JSONField()
    description = models.JSONField(default=empty_localized_text, blank=True)
    reservation_instructions = models.JSONField(default=empty_localized_text, blank=True)
    capacity = models.PositiveIntegerField(default=1)
    slot_minutes = models.PositiveIntegerField(default=60)
    requires_approval = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["unit"]),
            models.Index(fields=["requires_approval"]),
        ]

    def clean(self) -> None:
        validate_localized_text(self.name, require_all=True)
        validate_localized_text(self.description)
        validate_localized_text(self.reservation_instructions)
        if self.slot_minutes not in {15, 30, 45, 60, 90, 120}:
            raise ValidationError({"slot_minutes": "Unsupported slot length."})

    def __str__(self) -> str:
        return self.name.get("fi") or self.name.get("en") or str(self.id)


class OpeningHours(TimestampedUUIDModel):
    resource = models.ForeignKey(Resource, related_name="opening_hours", on_delete=models.CASCADE)
    weekday = models.PositiveSmallIntegerField()
    opens = models.TimeField()
    closes = models.TimeField()

    class Meta:
        ordering = ["weekday", "opens"]
        constraints = [
            models.CheckConstraint(
                condition=Q(weekday__gte=0) & Q(weekday__lte=6),
                name="opening_hours_weekday_valid",
            ),
            models.CheckConstraint(condition=Q(opens__lt=models.F("closes")), name="opens_before_closes"),
        ]

    def __str__(self) -> str:
        return f"{self.resource} {self.weekday} {self.opens}-{self.closes}"


class Reservation(TimestampedUUIDModel):
    class State(models.TextChoices):
        REQUESTED = "requested", "Requested"
        CONFIRMED = "confirmed", "Confirmed"
        DENIED = "denied", "Denied"
        CANCELLED = "cancelled", "Cancelled"

    resource = models.ForeignKey(Resource, related_name="reservations", on_delete=models.CASCADE)
    user = models.ForeignKey(UserProfile, related_name="reservations", on_delete=models.CASCADE)
    begin = models.DateTimeField()
    end = models.DateTimeField()
    state = models.CharField(max_length=20, choices=State.choices, default=State.REQUESTED)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["-begin"]
        indexes = [
            models.Index(fields=["resource", "begin", "end"]),
            models.Index(fields=["user", "begin"]),
            models.Index(fields=["state"]),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(begin__lt=models.F("end")), name="reservation_begin_before_end"),
        ]

    @property
    def blocks_availability(self) -> bool:
        return self.state in {self.State.REQUESTED, self.State.CONFIRMED}

    def __str__(self) -> str:
        return f"{self.resource} {self.begin.isoformat()}-{self.end.isoformat()}"


class UnitStaffMembership(TimestampedUUIDModel):
    unit = models.ForeignKey(Unit, related_name="staff_memberships", on_delete=models.CASCADE)
    user = models.ForeignKey(UserProfile, related_name="staff_memberships", on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["unit", "user"], name="unique_unit_staff_membership"),
        ]

    def __str__(self) -> str:
        return f"{self.user} staff for {self.unit}"
