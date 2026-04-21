from django.db import migrations


def use_email_usernames(apps, schema_editor):
    User = apps.get_model("auth", "User")
    UserProfile = apps.get_model("reservations", "UserProfile")
    username_max_length = User._meta.get_field("username").max_length

    for profile in UserProfile.objects.select_related("user"):
        user = profile.user
        email = (user.email or "").strip().lower()
        if not email:
            continue
        if username_max_length is not None and len(email) > username_max_length:
            continue
        if user.username == email:
            continue
        if user.__class__.objects.exclude(pk=user.pk).filter(username__iexact=email).exists():
            continue
        user.email = email
        user.username = email
        user.save(update_fields=["email", "username"])


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0004_rename_reservatio_resource_begin_idx_reservation_resourc_cf30eb_idx_and_more"),
    ]

    operations = [
        migrations.RunPython(use_email_usernames, migrations.RunPython.noop),
    ]
