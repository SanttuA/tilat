from __future__ import annotations

from typing import Any

import jwt
from django.conf import settings
from jwt import PyJWKClient
from rest_framework import authentication, exceptions

from .models import UserProfile


class OIDCBearerAuthentication(authentication.BaseAuthentication):
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

        claims = self._decode_token(token)
        profile = self._profile_from_claims(claims)
        request.oidc_claims = claims
        request.oidc_groups = claims.get("groups", [])
        return (profile, token)

    def _decode_token(self, token: str) -> dict[str, Any]:
        if settings.DEBUG and token.startswith("dev."):
            return self._decode_dev_token(token)

        if not settings.OIDC_ISSUER:
            raise exceptions.AuthenticationFailed("OIDC issuer is not configured.")

        jwks_url = f"{settings.OIDC_ISSUER.rstrip('/')}/.well-known/jwks.json"
        jwk_client = PyJWKClient(jwks_url)
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        try:
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256", "ES256"],
                audience=settings.OIDC_AUDIENCE,
                issuer=settings.OIDC_ISSUER.rstrip("/"),
            )
        except jwt.PyJWTError as exc:
            raise exceptions.AuthenticationFailed("Invalid access token.") from exc

    def _decode_dev_token(self, token: str) -> dict[str, Any]:
        # Local-only escape hatch for tests and seed demos when authentik is not running.
        # Format: dev.subject.email.name.group1,group2
        parts = token.split(".", 4)
        if len(parts) != 5:
            raise exceptions.AuthenticationFailed("Invalid dev token.")
        _, subject, email, name, groups = parts
        return {
            "sub": subject,
            "email": email,
            "name": name.replace("_", " "),
            "groups": [group for group in groups.split(",") if group],
        }

    def _profile_from_claims(self, claims: dict[str, Any]) -> UserProfile:
        subject = claims.get("sub")
        if not subject:
            raise exceptions.AuthenticationFailed("Token is missing subject.")

        groups = claims.get("groups", [])
        profile, _ = UserProfile.objects.update_or_create(
            subject=subject,
            defaults={
                "email": claims.get("email") or f"{subject}@example.invalid",
                "name": claims.get("name") or claims.get("preferred_username") or subject,
                "is_admin_claim": settings.OIDC_ADMIN_GROUP in groups,
            },
        )
        return profile
