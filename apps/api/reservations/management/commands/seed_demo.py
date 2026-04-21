from __future__ import annotations

from datetime import time

from django.core.management.base import BaseCommand

from reservations.models import OpeningHours, Resource, Unit, UnitStaffMembership, UserProfile


class Command(BaseCommand):
    help = "Seed bilingual demo data for local development."

    def handle(self, *args, **options):
        admin, _ = UserProfile.objects.update_or_create(
            subject="demo-admin",
            defaults={"email": "admin@example.com", "name": "Demo Admin", "is_admin_claim": True},
        )
        staff, _ = UserProfile.objects.update_or_create(
            subject="demo-staff",
            defaults={"email": "staff@example.com", "name": "Demo Staff", "is_admin_claim": False},
        )
        user, _ = UserProfile.objects.update_or_create(
            subject="demo-user",
            defaults={"email": "user@example.com", "name": "Demo User", "is_admin_claim": False},
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

        self.stdout.write(self.style.SUCCESS("Seeded demo users, unit, resource, and opening hours."))
