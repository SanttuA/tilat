from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import exceptions

from .models import OpeningHours, Reservation, Resource, UserProfile

HELSINKI = ZoneInfo("Europe/Helsinki")
BLOCKING_STATES = [Reservation.State.REQUESTED, Reservation.State.CONFIRMED]


@dataclass(frozen=True)
class Slot:
    start: datetime
    end: datetime
    available: bool


def localized_fallback(value: dict[str, str], locale: str) -> str:
    return value.get(locale) or value.get("fi") or value.get("en") or ""


def overlaps(resource: Resource, begin: datetime, end: datetime, exclude_id=None) -> bool:
    query = Reservation.objects.filter(
        resource=resource,
        state__in=BLOCKING_STATES,
        begin__lt=end,
        end__gt=begin,
    )
    if exclude_id:
        query = query.exclude(id=exclude_id)
    return query.exists()


def _aware_local(day: date, value: time) -> datetime:
    return timezone.make_aware(datetime.combine(day, value), HELSINKI)


def availability_for_resource(resource: Resource, day: date) -> list[Slot]:
    slots: list[Slot] = []
    opening_hours = OpeningHours.objects.filter(resource=resource, weekday=day.weekday())
    duration = timedelta(minutes=resource.slot_minutes)

    for opening in opening_hours:
        cursor = _aware_local(day, opening.opens)
        close = _aware_local(day, opening.closes)
        while cursor + duration <= close:
            start = cursor.astimezone(UTC)
            end = (cursor + duration).astimezone(UTC)
            slots.append(Slot(start=start, end=end, available=not overlaps(resource, start, end)))
            cursor += duration

    return slots


def ensure_slot_available(resource: Resource, begin: datetime, end: datetime) -> None:
    if begin >= end:
        raise exceptions.ValidationError({"end": ["End must be after begin."]})
    if overlaps(resource, begin, end):
        raise exceptions.ValidationError({"non_field_errors": ["The selected time is not available."]})

    local_day = begin.astimezone(HELSINKI).date()
    slots = availability_for_resource(resource, local_day)
    if not any(slot.start == begin and slot.end == end and slot.available for slot in slots):
        raise exceptions.ValidationError({"non_field_errors": ["The selected time is outside opening hours."]})


@transaction.atomic
def create_reservation(
    *,
    user: UserProfile,
    resource: Resource,
    begin: datetime,
    end: datetime,
    note: str = "",
) -> Reservation:
    ensure_slot_available(resource, begin, end)
    state = Reservation.State.REQUESTED if resource.requires_approval else Reservation.State.CONFIRMED
    return Reservation.objects.create(
        user=user,
        resource=resource,
        begin=begin,
        end=end,
        note=note,
        state=state,
    )


def cancel_reservation(reservation: Reservation) -> Reservation:
    if reservation.state == Reservation.State.CANCELLED:
        return reservation
    reservation.state = Reservation.State.CANCELLED
    reservation.save(update_fields=["state", "updated_at"])
    return reservation


def approve_reservation(reservation: Reservation) -> Reservation:
    if overlaps(reservation.resource, reservation.begin, reservation.end, exclude_id=reservation.id):
        raise exceptions.ValidationError({"non_field_errors": ["This reservation overlaps another booking."]})
    reservation.state = Reservation.State.CONFIRMED
    reservation.save(update_fields=["state", "updated_at"])
    return reservation


def deny_reservation(reservation: Reservation) -> Reservation:
    reservation.state = Reservation.State.DENIED
    reservation.save(update_fields=["state", "updated_at"])
    return reservation


def resource_search_query(search: str) -> Q:
    return (
        Q(name__fi__icontains=search)
        | Q(name__en__icontains=search)
        | Q(description__fi__icontains=search)
        | Q(description__en__icontains=search)
        | Q(unit__name__fi__icontains=search)
        | Q(unit__name__en__icontains=search)
    )
