from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from reservations.models import Resource, Unit, UnitStaffMembership


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


def create_unit(name: str) -> Unit:
    return Unit.objects.create(
        name={"fi": name, "en": name},
        address={"fi": "", "en": ""},
    )


def create_resource(unit: Unit, name: str) -> Resource:
    return Resource.objects.create(
        unit=unit,
        name={"fi": name, "en": name},
        description={"fi": "", "en": ""},
        reservation_instructions={"fi": "", "en": ""},
        capacity=4,
        slot_minutes=60,
        requires_approval=False,
    )


@pytest.mark.django_db
def test_staff_units_returns_unpaginated_array_scoped_to_staff_units(profile_factory):
    own_unit = create_unit("Own unit")
    other_unit = create_unit("Other unit")
    staff = profile_factory(email="staff@example.com", name="Staff")
    UnitStaffMembership.objects.create(unit=own_unit, user=staff)

    response = authorized_client(staff).get("/api/v1/staff/units")

    assert response.status_code == 200
    assert isinstance(response.data, list)
    assert not isinstance(response.data, dict)
    assert {unit["id"] for unit in response.data} == {str(own_unit.id)}
    assert str(other_unit.id) not in {unit["id"] for unit in response.data}


@pytest.mark.django_db
def test_admin_staff_units_returns_unpaginated_array_for_all_units(profile_factory):
    first_unit = create_unit("First unit")
    second_unit = create_unit("Second unit")
    admin = profile_factory(email="admin@example.com", name="Admin", is_admin=True)

    response = authorized_client(admin).get("/api/v1/staff/units")

    assert response.status_code == 200
    assert isinstance(response.data, list)
    assert not isinstance(response.data, dict)
    assert {unit["id"] for unit in response.data} == {str(first_unit.id), str(second_unit.id)}


@pytest.mark.django_db
def test_staff_memberships_returns_unpaginated_array_scoped_to_staff_units(profile_factory):
    own_unit = create_unit("Own unit")
    other_unit = create_unit("Other unit")
    staff = profile_factory(email="staff@example.com", name="Staff")
    other_staff = profile_factory(email="other-staff@example.com", name="Other Staff")
    own_membership = UnitStaffMembership.objects.create(unit=own_unit, user=staff)
    UnitStaffMembership.objects.create(unit=other_unit, user=other_staff)

    response = authorized_client(staff).get("/api/v1/staff/memberships")

    assert response.status_code == 200
    assert isinstance(response.data, list)
    assert not isinstance(response.data, dict)
    assert {membership["id"] for membership in response.data} == {str(own_membership.id)}


@pytest.mark.django_db
def test_admin_staff_memberships_returns_unpaginated_array_for_all_units(profile_factory):
    first_unit = create_unit("First unit")
    second_unit = create_unit("Second unit")
    admin = profile_factory(email="admin@example.com", name="Admin", is_admin=True)
    first_staff = profile_factory(email="first-staff@example.com", name="First Staff")
    second_staff = profile_factory(email="second-staff@example.com", name="Second Staff")
    first_membership = UnitStaffMembership.objects.create(unit=first_unit, user=first_staff)
    second_membership = UnitStaffMembership.objects.create(unit=second_unit, user=second_staff)

    response = authorized_client(admin).get("/api/v1/staff/memberships")

    assert response.status_code == 200
    assert isinstance(response.data, list)
    assert not isinstance(response.data, dict)
    assert {membership["id"] for membership in response.data} == {
        str(first_membership.id),
        str(second_membership.id),
    }


@pytest.mark.django_db
def test_staff_resources_are_scoped_to_staff_units(profile_factory):
    own_unit = create_unit("Own unit")
    other_unit = create_unit("Other unit")
    own_resource = create_resource(own_unit, "Own resource")
    create_resource(other_unit, "Other resource")
    staff = profile_factory(email="staff@example.com", name="Staff")
    UnitStaffMembership.objects.create(unit=own_unit, user=staff)

    response = authorized_client(staff).get("/api/v1/staff/resources")

    assert response.status_code == 200
    assert {resource["id"] for resource in response.data["results"]} == {str(own_resource.id)}


@pytest.mark.django_db
def test_staff_can_update_resource_reservation_form(profile_factory):
    unit = create_unit("Own unit")
    resource = create_resource(unit, "Own resource")
    staff = profile_factory(email="staff@example.com", name="Staff")
    UnitStaffMembership.objects.create(unit=unit, user=staff)

    response = authorized_client(staff).patch(
        f"/api/v1/staff/resources/{resource.id}",
        {
            "reservationForm": {
                "fields": [
                    {"key": "phoneNumber", "required": False},
                    {"key": "name", "required": True},
                ],
            },
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["reservationForm"] == {
        "fields": [
            {"key": "name", "required": True},
            {"key": "phoneNumber", "required": False},
        ],
    }
