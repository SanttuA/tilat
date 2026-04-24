from django.db import migrations, models

import reservations.models


def migrate_notes_to_form_answers(apps, schema_editor):
    Reservation = apps.get_model("reservations", "Reservation")
    for reservation in Reservation.objects.exclude(note="").iterator():
        reservation.form_answers = {"additionalInfo": reservation.note}
        reservation.save(update_fields=["form_answers"])


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0005_use_email_usernames"),
    ]

    operations = [
        migrations.AddField(
            model_name="resource",
            name="reservation_form",
            field=models.JSONField(default=reservations.models.default_reservation_form),
        ),
        migrations.AddField(
            model_name="reservation",
            name="form_answers",
            field=models.JSONField(blank=True, default=reservations.models.empty_form_answers),
        ),
        migrations.RunPython(migrate_notes_to_form_answers, migrations.RunPython.noop),
    ]
