from __future__ import annotations

from rest_framework import permissions

from .models import UnitStaffMembership, UserProfile


def is_admin(user: UserProfile | None) -> bool:
    return bool(user and getattr(user, "is_admin", False))


def staff_unit_ids(user: UserProfile | None) -> set[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return set()
    return {str(unit_id) for unit_id in UnitStaffMembership.objects.filter(user=user).values_list("unit_id", flat=True)}


def can_manage_unit(user: UserProfile | None, unit_id: str) -> bool:
    if is_admin(user):
        return True
    return str(unit_id) in staff_unit_ids(user)


class IsAuthenticatedProfile(permissions.BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and getattr(request.user, "is_authenticated", False))


class IsStaffOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view) -> bool:
        return is_admin(request.user) or bool(staff_unit_ids(request.user))
