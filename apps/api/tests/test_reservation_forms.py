from __future__ import annotations

from datetime import UTC, date, datetime, time
from zoneinfo import ZoneInfo

import pytest
from rest_framework.test import APIClient

from reservations.models import OpeningHours, Resource, Unit, UnitStaffMembership
from reservations.services import create_reservation


def authorized_client(profile, *, password: str = "Local-test-12345") -> APIClient:
    signin = APIClient().post(
        "/api/v1/auth/signin",
        {"email": profile.email, "password": password},
        format="json",
    )
    token = signin.data["token"]
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


def aware(day: date, hour: int):
    return datetime(day.year, day.month, day.day, hour, tzinfo=ZoneInfo("Europe/Helsinki")).astimezone(UTC)


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


@pytest.mark.django_db
def test_create_reservation_requires_configured_required_answers(resource, profile_factory):
    user = profile_factory()

    response = authorized_client(user).post(
        "/api/v1/reservations",
        {
            "resourceId": str(resource.id),
            "begin": aware(date(2026, 4, 20), 9).isoformat(),
            "end": aware(date(2026, 4, 20), 10).isoformat(),
            "formAnswers": {"name": "User"},
        },
        format="json",
    )

    assert response.status_code == 400
    assert "formAnswers" in response.data


@pytest.mark.django_db
def test_create_reservation_rejects_unconfigured_answer_keys(resource, profile_factory):
    user = profile_factory()

    response = authorized_client(user).post(
        "/api/v1/reservations",
        {
            "resourceId": str(resource.id),
            "begin": aware(date(2026, 4, 20), 9).isoformat(),
            "end": aware(date(2026, 4, 20), 10).isoformat(),
            "formAnswers": {
                "name": "User",
                "email": "user@example.com",
                "phoneNumber": "040 123 4567",
            },
        },
        format="json",
    )

    assert response.status_code == 400
    assert "formAnswers" in response.data


@pytest.mark.django_db
def test_create_reservation_stores_form_answers(resource, profile_factory):
    user = profile_factory()
    resource.reservation_form = {
        "fields": [
            {"key": "name", "required": True},
            {"key": "email", "required": True},
            {"key": "additionalInfo", "required": False},
        ],
    }
    resource.save(update_fields=["reservation_form"])

    response = authorized_client(user).post(
        "/api/v1/reservations",
        {
            "resourceId": str(resource.id),
            "begin": aware(date(2026, 4, 20), 9).isoformat(),
            "end": aware(date(2026, 4, 20), 10).isoformat(),
            "formAnswers": {
                "name": "User",
                "email": "user@example.com",
                "additionalInfo": "Needs a projector",
            },
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["formAnswers"] == {
        "name": "User",
        "email": "user@example.com",
        "additionalInfo": "Needs a projector",
    }


@pytest.mark.django_db
def test_owner_and_staff_reservation_lists_include_form_answers(resource, profile_factory):
    user = profile_factory(email="user@example.com", name="User")
    staff = profile_factory(email="staff@example.com", name="Staff")
    UnitStaffMembership.objects.create(unit=resource.unit, user=staff)
    reservation = create_reservation(
        user=user,
        resource=resource,
        begin=aware(date(2026, 4, 20), 9),
        end=aware(date(2026, 4, 20), 10),
        form_answers={"name": "User", "email": "user@example.com"},
    )

    owner_response = authorized_client(user).get("/api/v1/reservations")
    staff_response = authorized_client(staff).get("/api/v1/staff/reservations")

    assert owner_response.status_code == 200
    assert staff_response.status_code == 200
    assert owner_response.data["results"][0]["id"] == str(reservation.id)
    assert owner_response.data["results"][0]["formAnswers"] == {
        "name": "User",
        "email": "user@example.com",
    }
    assert staff_response.data["results"][0]["formAnswers"] == {
        "name": "User",
        "email": "user@example.com",
    }
