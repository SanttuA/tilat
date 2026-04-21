from datetime import UTC, date, datetime, time
from zoneinfo import ZoneInfo

import pytest
from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError

from reservations.models import OpeningHours, Resource, Unit
from reservations.services import availability_for_resource, create_reservation


@pytest.fixture
def unit(db):
    return Unit.objects.create(
        name={"fi": "Kirjasto", "en": "Library"},
        address={"fi": "Katu 1", "en": "Street 1"},
    )


@pytest.fixture
def resource(unit):
    resource = Resource.objects.create(
        unit=unit,
        name={"fi": "Huone", "en": "Room"},
        description={"fi": "", "en": ""},
        reservation_instructions={"fi": "", "en": ""},
        capacity=4,
        slot_minutes=60,
        requires_approval=False,
    )
    OpeningHours.objects.create(resource=resource, weekday=0, opens=time(9), closes=time(11))
    return resource


@pytest.fixture
def user(profile_factory):
    return profile_factory()


def aware(day: date, hour: int):
    return datetime(day.year, day.month, day.day, hour, tzinfo=ZoneInfo("Europe/Helsinki")).astimezone(UTC)


def test_localized_names_require_finnish_and_english(db):
    unit = Unit(name={"fi": "Vain suomeksi"}, address={"fi": "", "en": ""})

    with pytest.raises(ValidationError):
        unit.clean()


def test_availability_uses_opening_hours(resource):
    slots = availability_for_resource(resource, date(2026, 4, 20))

    assert len(slots) == 2
    assert all(slot.available for slot in slots)


def test_overlapping_reservation_is_rejected(resource, user):
    day = date(2026, 4, 20)
    create_reservation(user=user, resource=resource, begin=aware(day, 9), end=aware(day, 10))

    with pytest.raises(DRFValidationError):
        create_reservation(user=user, resource=resource, begin=aware(day, 9), end=aware(day, 10))
