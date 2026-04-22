from __future__ import annotations

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from reservations.management.commands.seed_demo import DEMO_PASSWORD


@pytest.mark.django_db
def test_seeded_admin_can_use_email_as_django_admin_username():
    call_command("seed_demo")

    user = get_user_model().objects.get(email="admin@example.com")

    assert user.username == "admin@example.com"
    assert user.is_staff
    assert user.is_superuser
    assert user.check_password(DEMO_PASSWORD)
    assert user.reservation_profile.is_admin
