from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from reservations.auth import hash_access_token
from reservations.models import UserAccessToken, UserProfile


@pytest.mark.django_db
def test_signup_creates_normal_user_profile_and_token():
    client = APIClient()

    response = client.post(
        "/api/v1/auth/signup",
        {"email": "USER@Example.COM", "name": "Test User", "password": "Local-test-12345"},
        format="json",
    )

    assert response.status_code == 201
    token = response.data["token"]
    assert token
    assert response.data["user"] == {
        "id": str(UserProfile.objects.get(user__email="user@example.com").id),
        "email": "user@example.com",
        "name": "Test User",
        "isAdmin": False,
    }

    user = get_user_model().objects.get(email="user@example.com")
    assert user.username == "user@example.com"
    assert user.check_password("Local-test-12345")
    profile = user.reservation_profile
    assert not profile.is_admin
    assert not profile.staff_memberships.exists()
    assert UserAccessToken.objects.filter(user_profile=profile, token_hash=hash_access_token(token)).exists()


@pytest.mark.django_db
def test_signup_rejects_duplicate_email(profile_factory):
    profile_factory(email="duplicate@example.com")
    client = APIClient()

    response = client.post(
        "/api/v1/auth/signup",
        {"email": "DUPLICATE@example.com", "name": "Duplicate", "password": "Local-test-12345"},
        format="json",
    )

    assert response.status_code == 400
    assert "email" in response.data


@pytest.mark.django_db
def test_signup_rejects_email_that_matches_existing_username():
    get_user_model().objects.create_user(
        username="duplicate@example.com",
        email="other@example.com",
        password="Local-test-12345",
    )
    client = APIClient()

    response = client.post(
        "/api/v1/auth/signup",
        {"email": "DUPLICATE@example.com", "name": "Duplicate", "password": "Local-test-12345"},
        format="json",
    )

    assert response.status_code == 400
    assert "email" in response.data


@pytest.mark.django_db
def test_signin_succeeds_and_rejects_invalid_credentials(profile_factory):
    profile_factory(email="user@example.com", password="Correct-test-12345")
    client = APIClient()

    success = client.post(
        "/api/v1/auth/signin",
        {"email": "USER@example.com", "password": "Correct-test-12345"},
        format="json",
    )
    failure = client.post(
        "/api/v1/auth/signin",
        {"email": "user@example.com", "password": "wrong-password"},
        format="json",
    )

    assert success.status_code == 200
    assert success.data["token"]
    assert success.data["user"]["email"] == "user@example.com"
    assert failure.status_code == 400


@pytest.mark.django_db
def test_signin_checks_all_active_users_with_duplicate_email():
    User = get_user_model()
    first = User.objects.create_user(
        username="legacy-first",
        email="shared@example.com",
        password="First-test-12345",
    )
    first_profile = UserProfile.objects.create(user=first, name="First User")
    second = User.objects.create_user(
        username="legacy-second",
        email="shared@example.com",
        password="Second-test-12345",
    )
    second_profile = UserProfile.objects.create(user=second, name="Second User")
    client = APIClient()

    response = client.post(
        "/api/v1/auth/signin",
        {"email": "shared@example.com", "password": "Second-test-12345"},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["user"]["id"] == str(second_profile.id)
    assert response.data["user"]["id"] != str(first_profile.id)


@pytest.mark.django_db
def test_signin_rejects_duplicate_email_when_password_matches_multiple_users():
    User = get_user_model()
    first = User.objects.create_user(
        username="legacy-first",
        email="shared@example.com",
        password="Shared-test-12345",
    )
    UserProfile.objects.create(user=first, name="First User")
    second = User.objects.create_user(
        username="legacy-second",
        email="shared@example.com",
        password="Shared-test-12345",
    )
    UserProfile.objects.create(user=second, name="Second User")
    client = APIClient()

    response = client.post(
        "/api/v1/auth/signin",
        {"email": "shared@example.com", "password": "Shared-test-12345"},
        format="json",
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_bearer_token_returns_me(profile_factory):
    profile = profile_factory(email="user@example.com", name="Token User")
    token = (
        APIClient()
        .post(
            "/api/v1/auth/signin",
            {"email": "user@example.com", "password": "Local-test-12345"},
            format="json",
        )
        .data["token"]
    )
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    response = client.get("/api/v1/me")

    assert response.status_code == 200
    assert response.data["id"] == str(profile.id)
    assert response.data["staffUnitIds"] == []


@pytest.mark.django_db
def test_revoked_and_expired_tokens_fail(profile_factory):
    profile_factory(email="user@example.com")
    token = (
        APIClient()
        .post(
            "/api/v1/auth/signin",
            {"email": "user@example.com", "password": "Local-test-12345"},
            format="json",
        )
        .data["token"]
    )
    UserAccessToken.objects.filter(token_hash=hash_access_token(token)).update(
        expires_at=timezone.now() - timedelta(minutes=1),
    )
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    response = client.get("/api/v1/me")

    assert response.status_code == 401


@pytest.mark.django_db
def test_signout_revokes_only_current_token(profile_factory):
    profile_factory(email="user@example.com")
    first = (
        APIClient()
        .post(
            "/api/v1/auth/signin",
            {"email": "user@example.com", "password": "Local-test-12345"},
            format="json",
        )
        .data["token"]
    )
    second = (
        APIClient()
        .post(
            "/api/v1/auth/signin",
            {"email": "user@example.com", "password": "Local-test-12345"},
            format="json",
        )
        .data["token"]
    )

    first_client = APIClient()
    first_client.credentials(HTTP_AUTHORIZATION=f"Bearer {first}")
    signout = first_client.post("/api/v1/auth/signout")

    second_client = APIClient()
    second_client.credentials(HTTP_AUTHORIZATION=f"Bearer {second}")

    assert signout.status_code == 204
    assert first_client.get("/api/v1/me").status_code == 401
    assert second_client.get("/api/v1/me").status_code == 200
