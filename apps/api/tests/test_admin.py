from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib import admin
from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory
from django.utils import timezone

from reservations.admin import ReservationAdmin, ResourceAdmin, ResourceAdminForm
from reservations.models import Reservation, Resource, Unit


def resource_form_data(unit: Unit, **reservation_form_controls: str) -> dict[str, object]:
    return {
        "unit": str(unit.id),
        "name": {"fi": "Huone", "en": "Room"},
        "description": {"fi": "", "en": ""},
        "reservation_instructions": {"fi": "", "en": ""},
        "capacity": "4",
        "slot_minutes": "60",
        **reservation_form_controls,
    }


@pytest.mark.django_db
def test_reservation_admin_searches_linked_django_user_email(profile_factory):
    unit = Unit.objects.create(name={"fi": "Yksikko", "en": "Unit"}, address={"fi": "", "en": ""})
    resource = Resource.objects.create(
        unit=unit,
        name={"fi": "Huone", "en": "Room"},
        description={"fi": "", "en": ""},
        reservation_instructions={"fi": "", "en": ""},
    )
    profile = profile_factory(email="booker@example.com", name="Booker")
    reservation = Reservation.objects.create(
        resource=resource,
        user=profile,
        begin=timezone.now(),
        end=timezone.now() + timedelta(hours=1),
    )
    request = RequestFactory().get("/admin/reservations/reservation/", {"q": "booker@example.com"})
    model_admin = ReservationAdmin(Reservation, admin.site)

    queryset, _ = model_admin.get_search_results(request, Reservation.objects.all(), "booker@example.com")

    assert list(queryset) == [reservation]


@pytest.mark.django_db
def test_resource_admin_form_does_not_expose_raw_reservation_form_json():
    request = RequestFactory().get("/admin/reservations/resource/add/")
    request.user = AnonymousUser()
    model_admin = ResourceAdmin(Resource, admin.site)

    form_class = model_admin.get_form(request)

    assert "reservation_form" not in form_class.base_fields
    assert "reservation_form_include_name" in form_class.base_fields
    assert "reservation_form_required_name" in form_class.base_fields


@pytest.mark.django_db
def test_resource_admin_form_initializes_reservation_form_controls():
    unit = Unit.objects.create(name={"fi": "Yksikko", "en": "Unit"}, address={"fi": "", "en": ""})
    resource = Resource.objects.create(
        unit=unit,
        name={"fi": "Huone", "en": "Room"},
        description={"fi": "", "en": ""},
        reservation_instructions={"fi": "", "en": ""},
        reservation_form={
            "fields": [
                {"key": "phoneNumber", "required": False},
                {"key": "name", "required": True},
            ],
        },
    )

    form = ResourceAdminForm(instance=resource)

    assert form.initial["reservation_form_include_name"] is True
    assert form.initial["reservation_form_required_name"] is True
    assert form.initial["reservation_form_include_phoneNumber"] is True
    assert form.initial["reservation_form_required_phoneNumber"] is False
    assert form.initial["reservation_form_include_email"] is False
    assert form.initial["reservation_form_required_email"] is False


@pytest.mark.django_db
def test_resource_admin_form_saves_normalized_reservation_form():
    unit = Unit.objects.create(name={"fi": "Yksikko", "en": "Unit"}, address={"fi": "", "en": ""})
    resource = Resource.objects.create(
        unit=unit,
        name={"fi": "Vanha", "en": "Old"},
        description={"fi": "", "en": ""},
        reservation_instructions={"fi": "", "en": ""},
    )
    form = ResourceAdminForm(
        data=resource_form_data(
            unit,
            reservation_form_include_additionalInfo="on",
            reservation_form_include_name="on",
            reservation_form_required_name="on",
            reservation_form_include_phoneNumber="on",
        ),
        instance=resource,
    )

    assert form.is_valid(), form.errors
    saved_resource = form.save()

    assert saved_resource.reservation_form == {
        "fields": [
            {"key": "name", "required": True},
            {"key": "phoneNumber", "required": False},
            {"key": "additionalInfo", "required": False},
        ],
    }


@pytest.mark.django_db
def test_resource_admin_form_required_control_implies_included_field():
    unit = Unit.objects.create(name={"fi": "Yksikko", "en": "Unit"}, address={"fi": "", "en": ""})
    form = ResourceAdminForm(
        data=resource_form_data(
            unit,
            reservation_form_required_address="on",
        ),
    )

    assert form.is_valid(), form.errors
    resource = form.save()

    assert resource.reservation_form == {
        "fields": [
            {"key": "address", "required": True},
        ],
    }
