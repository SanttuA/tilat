import pytest

from reservations.models import Unit, UnitStaffMembership, UserProfile
from reservations.permissions import can_manage_unit


@pytest.mark.django_db
def test_admin_can_manage_every_unit():
    unit = Unit.objects.create(name={"fi": "Yksikko", "en": "Unit"}, address={"fi": "", "en": ""})
    admin = UserProfile.objects.create(
        subject="admin",
        email="admin@example.com",
        name="Admin",
        is_admin_claim=True,
    )

    assert can_manage_unit(admin, str(unit.id))


@pytest.mark.django_db
def test_unit_staff_is_scoped_to_own_units():
    own = Unit.objects.create(name={"fi": "Oma", "en": "Own"}, address={"fi": "", "en": ""})
    other = Unit.objects.create(name={"fi": "Muu", "en": "Other"}, address={"fi": "", "en": ""})
    staff = UserProfile.objects.create(subject="staff", email="staff@example.com", name="Staff")
    UnitStaffMembership.objects.create(unit=own, user=staff)

    assert can_manage_unit(staff, str(own.id))
    assert not can_manage_unit(staff, str(other.id))
