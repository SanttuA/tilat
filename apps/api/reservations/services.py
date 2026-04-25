from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import exceptions

from .models import OpeningHours, Reservation, Resource, UserProfile, normalize_reservation_form

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


def validate_reservation_form_answers(resource: Resource, answers: object) -> dict[str, str]:
    form = normalize_reservation_form(resource.reservation_form)
    configured = {str(field["key"]): bool(field["required"]) for field in form["fields"]}
    if not isinstance(answers, dict):
        raise exceptions.ValidationError({"formAnswers": ["Reservation form answers must be an object."]})

    normalized: dict[str, str] = {}
    for key, value in answers.items():
        if key not in configured:
            raise exceptions.ValidationError({"formAnswers": [f"{key} is not configured for this resource."]})
        if not isinstance(value, str):
            raise exceptions.ValidationError({"formAnswers": [f"{key} must be a string."]})
        value = value.strip()
        if value:
            normalized[str(key)] = value

    missing = [key for key, required in configured.items() if required and key not in normalized]
    if missing:
        raise exceptions.ValidationError({"formAnswers": [f"Required fields are missing: {', '.join(missing)}."]})

    if email := normalized.get("email"):
        try:
            validate_email(email)
        except DjangoValidationError as exc:
            raise exceptions.ValidationError({"formAnswers": exc.messages}) from exc

    return normalized


@transaction.atomic
def create_reservation(
    *,
    user: UserProfile,
    resource: Resource,
    begin: datetime,
    end: datetime,
    note: str = "",
    form_answers: object | None = None,
) -> Reservation:
    normalized_answers = validate_reservation_form_answers(
        resource,
        {} if form_answers is None else form_answers,
    )
    ensure_slot_available(resource, begin, end)
    state = Reservation.State.REQUESTED if resource.requires_approval else Reservation.State.CONFIRMED
    deprecated_note = normalized_answers.get("additionalInfo", note)
    return Reservation.objects.create(
        user=user,
        resource=resource,
        begin=begin,
        end=end,
        note=deprecated_note,
        form_answers=normalized_answers,
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
