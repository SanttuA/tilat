from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import authentication, exceptions

from .models import UserAccessToken, UserProfile


def hash_access_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(profile: UserProfile) -> tuple[str, UserAccessToken]:
    token = secrets.token_urlsafe(32)
    expires_at = timezone.now() + timedelta(days=settings.PASSWORD_AUTH_TOKEN_TTL_DAYS)
    access_token = UserAccessToken.objects.create(
        user_profile=profile,
        token_hash=hash_access_token(token),
        expires_at=expires_at,
    )
    return token, access_token


class ProfileTokenAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header:
            return None

        try:
            keyword, token = header.split(" ", 1)
        except ValueError as exc:
            raise exceptions.AuthenticationFailed("Invalid authorization header.") from exc

        if keyword != self.keyword:
            return None

        token_hash = hash_access_token(token)
        access_token = (
            UserAccessToken.objects.select_related("user_profile__user")
            .filter(token_hash=token_hash, revoked_at__isnull=True, expires_at__gt=timezone.now())
            .first()
        )
        if not access_token:
            raise exceptions.AuthenticationFailed("Invalid access token.")

        UserAccessToken.objects.filter(pk=access_token.pk).update(last_used_at=timezone.now())
        return (access_token.user_profile, access_token)

    def authenticate_header(self, request) -> str:
        return self.keyword
