from __future__ import annotations

from types import SimpleNamespace

import pytest

from reservations.views import (
    ReservationListCreateView,
    StaffMembershipListCreateView,
    StaffReservationListView,
)


def is_select_related(queryset, *path: str) -> bool:
    selected = queryset.query.select_related
    for part in path:
        if selected is True:
            return True
        if not isinstance(selected, dict) or part not in selected:
            return False
        selected = selected[part]
    return True


@pytest.mark.django_db
def test_own_reservation_queryset_eager_loads_profile_django_user(profile_factory):
    profile = profile_factory()
    view = ReservationListCreateView()
    view.request = SimpleNamespace(user=profile, query_params={})

    queryset = view.get_queryset()

    assert is_select_related(queryset, "user", "user")


@pytest.mark.django_db
def test_staff_reservation_queryset_eager_loads_profile_django_user(profile_factory):
    admin = profile_factory(is_admin=True)
    view = StaffReservationListView()
    view.request = SimpleNamespace(user=admin, query_params={})

    queryset = view.get_queryset()

    assert is_select_related(queryset, "user", "user")


@pytest.mark.django_db
def test_staff_membership_queryset_eager_loads_profile_django_user(profile_factory):
    admin = profile_factory(is_admin=True)
    view = StaffMembershipListCreateView()
    view.request = SimpleNamespace(user=admin, query_params={})

    queryset = view.get_queryset()

    assert is_select_related(queryset, "user", "user")
