import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("subject", models.CharField(max_length=255, unique=True)),
                ("email", models.EmailField(max_length=254)),
                ("name", models.CharField(max_length=255)),
                ("is_admin_claim", models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name="Unit",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.JSONField()),
                ("address", models.JSONField(blank=True, default=dict)),
            ],
        ),
        migrations.CreateModel(
            name="Resource",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.JSONField()),
                ("description", models.JSONField(blank=True, default=dict)),
                ("reservation_instructions", models.JSONField(blank=True, default=dict)),
                ("capacity", models.PositiveIntegerField(default=1)),
                ("slot_minutes", models.PositiveIntegerField(default=60)),
                ("requires_approval", models.BooleanField(default=False)),
                (
                    "unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="resources",
                        to="reservations.unit",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="OpeningHours",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("weekday", models.PositiveSmallIntegerField()),
                ("opens", models.TimeField()),
                ("closes", models.TimeField()),
                (
                    "resource",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="opening_hours",
                        to="reservations.resource",
                    ),
                ),
            ],
            options={"ordering": ["weekday", "opens"]},
        ),
        migrations.CreateModel(
            name="Reservation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("begin", models.DateTimeField()),
                ("end", models.DateTimeField()),
                (
                    "state",
                    models.CharField(
                        choices=[
                            ("requested", "Requested"),
                            ("confirmed", "Confirmed"),
                            ("denied", "Denied"),
                            ("cancelled", "Cancelled"),
                        ],
                        default="requested",
                        max_length=20,
                    ),
                ),
                ("note", models.TextField(blank=True)),
                (
                    "resource",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reservations",
                        to="reservations.resource",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reservations",
                        to="reservations.userprofile",
                    ),
                ),
            ],
            options={"ordering": ["-begin"]},
        ),
        migrations.CreateModel(
            name="UnitStaffMembership",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "unit",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="staff_memberships",
                        to="reservations.unit",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="staff_memberships",
                        to="reservations.userprofile",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="openinghours",
            constraint=models.CheckConstraint(
                condition=models.Q(weekday__gte=0) & models.Q(weekday__lte=6),
                name="opening_hours_weekday_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="openinghours",
            constraint=models.CheckConstraint(
                condition=models.Q(opens__lt=models.F("closes")),
                name="opens_before_closes",
            ),
        ),
        migrations.AddConstraint(
            model_name="reservation",
            constraint=models.CheckConstraint(
                condition=models.Q(begin__lt=models.F("end")),
                name="reservation_begin_before_end",
            ),
        ),
        migrations.AddConstraint(
            model_name="unitstaffmembership",
            constraint=models.UniqueConstraint(fields=("unit", "user"), name="unique_unit_staff_membership"),
        ),
        migrations.AddIndex(
            model_name="resource",
            index=models.Index(fields=["unit"], name="reservatio_resource_unit_id_idx"),
        ),
        migrations.AddIndex(
            model_name="reservation",
            index=models.Index(fields=["resource", "begin", "end"], name="reservatio_resource_begin_idx"),
        ),
    ]
