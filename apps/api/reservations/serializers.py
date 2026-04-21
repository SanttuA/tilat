from __future__ import annotations

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .auth import create_access_token
from .models import (
    OpeningHours,
    Reservation,
    Resource,
    Unit,
    UnitStaffMembership,
    UserProfile,
    validate_localized_text,
)
from .services import create_reservation


def normalize_email(value: str) -> str:
    return value.strip().lower()


class LocalizedTextField(serializers.JSONField):
    def __init__(self, *args, require_all: bool = False, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.require_all = require_all

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        validate_localized_text(value, require_all=self.require_all)
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    isAdmin = serializers.BooleanField(source="is_admin")

    class Meta:
        model = UserProfile
        fields = ["id", "email", "name", "isAdmin"]


class AuthSessionSerializer(serializers.Serializer):
    token = serializers.CharField(read_only=True)
    user = UserProfileSerializer(read_only=True)


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255, allow_blank=False, trim_whitespace=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value: str) -> str:
        email = normalize_email(value)
        if get_user_model().objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def validate(self, attrs):
        User = get_user_model()
        user = User(username=attrs["email"], email=attrs["email"])
        try:
            validate_password(attrs["password"], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": exc.messages}) from exc
        return attrs

    def create(self, validated_data):
        User = get_user_model()
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        profile = UserProfile.objects.create(user=user, name=validated_data["name"], is_admin=False)
        token, _ = create_access_token(profile)
        return {"token": token, "user": profile}


class SigninSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        email = normalize_email(attrs["email"])
        user = get_user_model().objects.filter(email__iexact=email, is_active=True).first()
        if not user or not user.check_password(attrs["password"]):
            raise serializers.ValidationError("Invalid email or password.")
        try:
            profile = user.reservation_profile
        except UserProfile.DoesNotExist as exc:
            raise serializers.ValidationError("User profile is missing.") from exc
        attrs["profile"] = profile
        return attrs

    def create(self, validated_data):
        token, _ = create_access_token(validated_data["profile"])
        return {"token": token, "user": validated_data["profile"]}


class UnitSerializer(serializers.ModelSerializer):
    name = LocalizedTextField(require_all=True)
    address = LocalizedTextField(required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Unit
        fields = ["id", "name", "address", "createdAt", "updatedAt"]


class OpeningHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpeningHours
        fields = ["id", "weekday", "opens", "closes"]


class ResourceSerializer(serializers.ModelSerializer):
    unit = UnitSerializer(read_only=True)
    name = LocalizedTextField(require_all=True)
    description = LocalizedTextField(required=False)
    reservationInstructions = LocalizedTextField(
        source="reservation_instructions",
        required=False,
    )
    slotMinutes = serializers.IntegerField(source="slot_minutes")
    requiresApproval = serializers.BooleanField(source="requires_approval")
    openingHours = OpeningHoursSerializer(source="opening_hours", many=True, read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Resource
        fields = [
            "id",
            "unit",
            "name",
            "description",
            "reservationInstructions",
            "capacity",
            "slotMinutes",
            "requiresApproval",
            "openingHours",
            "createdAt",
            "updatedAt",
        ]


class ResourceWriteSerializer(serializers.ModelSerializer):
    unitId = serializers.PrimaryKeyRelatedField(source="unit", queryset=Unit.objects.all())
    name = LocalizedTextField(require_all=True)
    description = LocalizedTextField(required=False)
    reservationInstructions = LocalizedTextField(
        source="reservation_instructions",
        required=False,
    )
    slotMinutes = serializers.IntegerField(source="slot_minutes")
    requiresApproval = serializers.BooleanField(source="requires_approval")

    class Meta:
        model = Resource
        fields = [
            "unitId",
            "name",
            "description",
            "reservationInstructions",
            "capacity",
            "slotMinutes",
            "requiresApproval",
        ]

    def validate_slotMinutes(self, value: int) -> int:
        if value not in {15, 30, 45, 60, 90, 120}:
            raise serializers.ValidationError("Unsupported slot length.")
        return value


class ReservationSerializer(serializers.ModelSerializer):
    resource = ResourceSerializer(read_only=True)
    user = UserProfileSerializer(read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Reservation
        fields = ["id", "resource", "user", "begin", "end", "state", "note", "createdAt", "updatedAt"]


class ReservationCreateSerializer(serializers.Serializer):
    resourceId = serializers.PrimaryKeyRelatedField(source="resource", queryset=Resource.objects.all())
    begin = serializers.DateTimeField()
    end = serializers.DateTimeField()
    note = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        return create_reservation(user=self.context["request"].user, **validated_data)


class AvailabilitySlotSerializer(serializers.Serializer):
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()
    available = serializers.BooleanField()


class AvailabilitySerializer(serializers.Serializer):
    resourceId = serializers.UUIDField()
    date = serializers.DateField()
    slots = AvailabilitySlotSerializer(many=True)


class EmptySerializer(serializers.Serializer):
    pass


class MeSerializer(UserProfileSerializer):
    staffUnitIds = serializers.SerializerMethodField()

    class Meta(UserProfileSerializer.Meta):
        fields = UserProfileSerializer.Meta.fields + ["staffUnitIds"]

    def get_staffUnitIds(self, obj: UserProfile) -> list[str]:
        return [str(unit_id) for unit_id in obj.staff_memberships.values_list("unit_id", flat=True)]


class UnitStaffMembershipSerializer(serializers.ModelSerializer):
    unit = UnitSerializer(read_only=True)
    user = UserProfileSerializer(read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = UnitStaffMembership
        fields = ["id", "unit", "user", "createdAt"]


class UnitStaffMembershipWriteSerializer(serializers.ModelSerializer):
    unitId = serializers.PrimaryKeyRelatedField(source="unit", queryset=Unit.objects.all())
    userId = serializers.PrimaryKeyRelatedField(source="user", queryset=UserProfile.objects.all())

    class Meta:
        model = UnitStaffMembership
        fields = ["unitId", "userId"]
