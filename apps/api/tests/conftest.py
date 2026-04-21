from __future__ import annotations

from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model

from reservations.models import UserProfile


@pytest.fixture
def profile_factory(db):
    def create_profile(
        *,
        email: str = "user@example.com",
        name: str = "User",
        password: str = "Local-test-12345",
        is_admin: bool = False,
    ) -> UserProfile:
        user = get_user_model().objects.create_user(
            username=f"test-{uuid4()}",
            email=email,
            password=password,
        )
        return UserProfile.objects.create(user=user, name=name, is_admin=is_admin)

    return create_profile
