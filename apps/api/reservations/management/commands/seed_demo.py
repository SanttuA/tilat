from __future__ import annotations

from datetime import time
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from reservations.models import OpeningHours, Resource, Unit, UnitStaffMembership, UserProfile

DEMO_PASSWORD = "Local-demo-12345"


class Command(BaseCommand):
    help = "Seed bilingual demo data for local development."

    def demo_profile(
        self,
        *,
        email: str,
        name: str,
        is_admin: bool = False,
        is_staff: bool = False,
        is_superuser: bool = False,
    ) -> UserProfile:
        User = get_user_model()
        user = User.objects.filter(email=email).first()
        if not user:
            user = User(username=f"demo-{uuid4()}", email=email)
        user.email = email
        user.is_staff = is_staff
        user.is_superuser = is_superuser
        user.is_active = True
        user.set_password(DEMO_PASSWORD)
        user.save()
        profile, _ = UserProfile.objects.update_or_create(
            user=user,
            defaults={"name": name, "is_admin": is_admin},
        )
        return profile

    def handle(self, *args, **options):
        self.demo_profile(
            email="admin@example.com",
            name="Demo Admin",
            is_admin=True,
            is_staff=True,
            is_superuser=True,
        )
        staff = self.demo_profile(
            email="staff@example.com",
            name="Demo Staff",
        )
        self.demo_profile(
            email="user@example.com",
            name="Demo User",
        )

        unit, _ = Unit.objects.update_or_create(
            name={"fi": "Keskustakirjasto", "en": "Central Library"},
            defaults={
                "address": {
                    "fi": "Linnankatu 2, Turku",
                    "en": "Linnankatu 2, Turku",
                },
            },
        )
        UnitStaffMembership.objects.get_or_create(unit=unit, user=staff)

        room, _ = Resource.objects.update_or_create(
            unit=unit,
            name={"fi": "Kokoushuone A", "en": "Meeting room A"},
            defaults={
                "description": {
                    "fi": "Rauhallinen kokoustila kymmenelle hengelle.",
                    "en": "Quiet meeting room for ten people.",
                },
                "reservation_instructions": {
                    "fi": "Saavu kirjaston palvelupisteelle ennen varausta.",
                    "en": "Check in at the library service desk before your reservation.",
                },
                "capacity": 10,
                "slot_minutes": 60,
                "requires_approval": True,
            },
        )
        for weekday in range(5):
            OpeningHours.objects.get_or_create(
                resource=room,
                weekday=weekday,
                opens=time(9, 0),
                closes=time(17, 0),
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded demo users, unit, resource, and opening hours. Demo user password: {DEMO_PASSWORD}",
            ),
        )
