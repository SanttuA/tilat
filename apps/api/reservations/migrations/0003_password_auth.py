import uuid

import django.db.models.deletion
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations, models


def link_profiles_to_django_users(apps, schema_editor):
    User = apps.get_model("auth", "User")
    UserProfile = apps.get_model("reservations", "UserProfile")

    for profile in UserProfile.objects.all():
        email = (profile.email or f"{profile.subject}@example.invalid").strip().lower()
        user = User.objects.create(
            username=f"profile-{profile.id}",
            email=email,
            password=make_password(None),
            is_staff=False,
            is_active=True,
            is_superuser=False,
        )
        profile.user = user
        profile.is_admin = profile.is_admin_claim
        profile.save(update_fields=["user", "is_admin"])


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("reservations", "0002_postgres_overlap_constraint"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="is_admin",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="user",
            field=models.OneToOneField(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="reservation_profile",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(link_profiles_to_django_users, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="userprofile",
            name="user",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="reservation_profile",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="email",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="is_admin_claim",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="subject",
        ),
        migrations.CreateModel(
            name="UserAccessToken",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("token_hash", models.CharField(max_length=64, unique=True)),
                ("expires_at", models.DateTimeField()),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("last_used_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user_profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="access_tokens",
                        to="reservations.userprofile",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["token_hash"], name="reservation_token_h_f08e64_idx"),
                    models.Index(fields=["expires_at"], name="reservation_expires_bd40da_idx"),
                    models.Index(fields=["revoked_at"], name="reservation_revoked_306757_idx"),
                ],
            },
        ),
    ]
