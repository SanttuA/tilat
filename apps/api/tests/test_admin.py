from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib import admin
from django.test import RequestFactory
from django.utils import timezone

from reservations.admin import ReservationAdmin
from reservations.models import Reservation, Resource, Unit


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
