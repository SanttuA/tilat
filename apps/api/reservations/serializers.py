from __future__ import annotations

from rest_framework import serializers

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


class LocalizedTextField(serializers.JSONField):
    def __init__(self, *args, require_all: bool = False, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.require_all = require_all

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        validate_localized_text(value, require_all=self.require_all)
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    isAdmin = serializers.BooleanField(source="is_admin_claim")

    class Meta:
        model = UserProfile
        fields = ["id", "subject", "email", "name", "isAdmin"]


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
