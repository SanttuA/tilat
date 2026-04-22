from __future__ import annotations

import pytest

from config.settings import positive_int_from_env


def test_positive_int_from_env_defaults(monkeypatch):
    monkeypatch.delenv("PASSWORD_AUTH_TOKEN_TTL_DAYS", raising=False)

    assert positive_int_from_env("PASSWORD_AUTH_TOKEN_TTL_DAYS", "30") == 30


def test_positive_int_from_env_reads_valid_value(monkeypatch):
    monkeypatch.setenv("PASSWORD_AUTH_TOKEN_TTL_DAYS", "7")

    assert positive_int_from_env("PASSWORD_AUTH_TOKEN_TTL_DAYS", "30") == 7


@pytest.mark.parametrize("value", ["0", "-1", "1.5", "abc"])
def test_positive_int_from_env_rejects_invalid_values(monkeypatch, value):
    monkeypatch.setenv("PASSWORD_AUTH_TOKEN_TTL_DAYS", value)

    with pytest.raises(ValueError, match="PASSWORD_AUTH_TOKEN_TTL_DAYS must be a positive integer."):
        positive_int_from_env("PASSWORD_AUTH_TOKEN_TTL_DAYS", "30")
