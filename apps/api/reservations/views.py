from __future__ import annotations

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from drf_spectacular.utils import extend_schema
from rest_framework import generics, response, status, views
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Reservation, Resource, Unit, UnitStaffMembership
from .permissions import (
    IsAuthenticatedProfile,
    IsStaffOrAdmin,
    can_manage_unit,
    is_admin,
    staff_unit_ids,
)
from .serializers import (
    AuthSessionSerializer,
    AvailabilitySerializer,
    EmptySerializer,
    MeSerializer,
    ReservationCreateSerializer,
    ReservationSerializer,
    ResourceSerializer,
    ResourceWriteSerializer,
    SigninSerializer,
    SignupSerializer,
    UnitSerializer,
    UnitStaffMembershipSerializer,
    UnitStaffMembershipWriteSerializer,
)
from .services import (
    approve_reservation,
    availability_for_resource,
    cancel_reservation,
    deny_reservation,
    resource_search_query,
)


class SignupView(views.APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(request=SignupSerializer, responses={201: AuthSessionSerializer})
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        return response.Response(AuthSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class SigninView(views.APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(request=SigninSerializer, responses=AuthSessionSerializer)
    def post(self, request):
        serializer = SigninSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        return response.Response(AuthSessionSerializer(session).data)


class SignoutView(views.APIView):
    permission_classes = [IsAuthenticatedProfile]

    @extend_schema(request=EmptySerializer, responses={204: None})
    def post(self, request):
        if request.auth:
            request.auth.revoked_at = timezone.now()
            request.auth.save(update_fields=["revoked_at", "updated_at"])
        return response.Response(status=status.HTTP_204_NO_CONTENT)


class ResourceListView(generics.ListAPIView):
    serializer_class = ResourceSerializer

    def get_queryset(self):
        queryset = (
            Resource.objects.select_related("unit")
            .prefetch_related("opening_hours")
            .order_by(
                "unit__name",
                "name",
            )
        )
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(resource_search_query(search))
        return queryset


class ResourceDetailView(generics.RetrieveAPIView):
    serializer_class = ResourceSerializer
    queryset = Resource.objects.select_related("unit").prefetch_related("opening_hours")


class ResourceAvailabilityView(views.APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(responses=AvailabilitySerializer)
    def get(self, request, pk):
        resource = get_object_or_404(Resource.objects.all(), pk=pk)
        requested_date = parse_date(request.query_params.get("date", ""))
        if not requested_date:
            raise ValidationError({"date": ["Expected YYYY-MM-DD."]})

        slots = availability_for_resource(resource, requested_date)
        return response.Response(
            {
                "resourceId": str(resource.id),
                "date": requested_date.isoformat(),
                "slots": [
                    {"start": slot.start.isoformat(), "end": slot.end.isoformat(), "available": slot.available}
                    for slot in slots
                ],
            },
        )


class MeView(views.APIView):
    permission_classes = [IsAuthenticatedProfile]

    @extend_schema(responses=MeSerializer)
    def get(self, request):
        return response.Response(MeSerializer(request.user).data)


class ReservationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedProfile]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReservationCreateSerializer
        return ReservationSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Reservation.objects.none()
        return Reservation.objects.filter(user=self.request.user).select_related("resource__unit", "user__user")

    def perform_create(self, serializer):
        reservation = serializer.save()
        self.created_reservation = reservation

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save()
        return response.Response(ReservationSerializer(reservation).data, status=status.HTTP_201_CREATED)


class ReservationCancelView(views.APIView):
    permission_classes = [IsAuthenticatedProfile]

    @extend_schema(request=EmptySerializer, responses=ReservationSerializer)
    def post(self, request, pk):
        reservation = get_object_or_404(Reservation, pk=pk, user=request.user)
        return response.Response(ReservationSerializer(cancel_reservation(reservation)).data)


class StaffUnitsView(generics.ListAPIView):
    permission_classes = [IsStaffOrAdmin]
    pagination_class = None
    serializer_class = UnitSerializer

    def get_queryset(self):
        if is_admin(self.request.user):
            return Unit.objects.all().order_by("name")
        return Unit.objects.filter(id__in=staff_unit_ids(self.request.user)).order_by("name")


class StaffResourceCreateView(generics.CreateAPIView):
    permission_classes = [IsStaffOrAdmin]
    serializer_class = ResourceWriteSerializer

    def perform_create(self, serializer):
        unit = serializer.validated_data["unit"]
        if not can_manage_unit(self.request.user, unit.id):
            raise PermissionDenied("You cannot manage this unit.")
        self.resource = serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return response.Response(ResourceSerializer(self.resource).data, status=status.HTTP_201_CREATED)


class StaffResourceUpdateView(generics.UpdateAPIView):
    permission_classes = [IsStaffOrAdmin]
    serializer_class = ResourceWriteSerializer
    queryset = Resource.objects.select_related("unit")
    http_method_names = ["patch"]

    def perform_update(self, serializer):
        instance = self.get_object()
        target_unit = serializer.validated_data.get("unit", instance.unit)
        if not can_manage_unit(self.request.user, instance.unit.id) or not can_manage_unit(
            self.request.user,
            target_unit.id,
        ):
            raise PermissionDenied("You cannot manage this resource.")
        self.resource = serializer.save()

    def patch(self, request, *args, **kwargs):
        partial = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return response.Response(ResourceSerializer(self.resource).data)


class StaffReservationListView(generics.ListAPIView):
    permission_classes = [IsStaffOrAdmin]
    serializer_class = ReservationSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Reservation.objects.none()
        queryset = Reservation.objects.select_related("resource__unit", "user__user")
        if not is_admin(self.request.user):
            queryset = queryset.filter(resource__unit_id__in=staff_unit_ids(self.request.user))
        unit_id = self.request.query_params.get("unit")
        if unit_id:
            if not can_manage_unit(self.request.user, unit_id):
                raise PermissionDenied("You cannot view this unit.")
            queryset = queryset.filter(resource__unit_id=unit_id)
        return queryset


class StaffReservationActionView(views.APIView):
    permission_classes = [IsStaffOrAdmin]
    action = None

    @extend_schema(request=EmptySerializer, responses=ReservationSerializer)
    def post(self, request, pk):
        reservation = get_object_or_404(Reservation.objects.select_related("resource__unit"), pk=pk)
        if not can_manage_unit(request.user, reservation.resource.unit_id):
            raise PermissionDenied("You cannot manage this reservation.")
        if self.action == "approve":
            reservation = approve_reservation(reservation)
        elif self.action == "deny":
            reservation = deny_reservation(reservation)
        elif self.action == "cancel":
            reservation = cancel_reservation(reservation)
        else:
            raise ValidationError({"action": ["Unsupported action."]})
        return response.Response(ReservationSerializer(reservation).data)


class StaffMembershipListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsStaffOrAdmin]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UnitStaffMembershipWriteSerializer
        return UnitStaffMembershipSerializer

    def get_queryset(self):
        queryset = UnitStaffMembership.objects.select_related("unit", "user__user")
        if not is_admin(self.request.user):
            queryset = queryset.filter(unit_id__in=staff_unit_ids(self.request.user))
        unit_id = self.request.query_params.get("unit")
        if unit_id:
            if not can_manage_unit(self.request.user, unit_id):
                raise PermissionDenied("You cannot manage this unit.")
            queryset = queryset.filter(unit_id=unit_id)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        unit = serializer.validated_data["unit"]
        if not can_manage_unit(request.user, unit.id):
            raise PermissionDenied("You cannot manage this unit.")
        membership = serializer.save()
        return response.Response(
            UnitStaffMembershipSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )


class StaffMembershipDeleteView(generics.DestroyAPIView):
    permission_classes = [IsStaffOrAdmin]
    serializer_class = UnitStaffMembershipSerializer
    queryset = UnitStaffMembership.objects.select_related("unit", "user__user")

    def delete(self, request, *args, **kwargs):
        membership = self.get_object()
        if not can_manage_unit(request.user, membership.unit_id):
            raise PermissionDenied("You cannot manage this unit.")

        final_self_membership = (
            membership.user_id == request.user.id
            and not is_admin(request.user)
            and UnitStaffMembership.objects.filter(unit=membership.unit).count() == 1
        )
        if final_self_membership:
            raise ValidationError({"non_field_errors": ["You cannot remove your final unit staff role."]})

        membership.delete()
        return response.Response(status=status.HTTP_204_NO_CONTENT)
