from django.db import migrations


def add_overlap_constraint(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute("CREATE EXTENSION IF NOT EXISTS btree_gist;")
    schema_editor.execute(
        """
        ALTER TABLE reservations_reservation
        ADD CONSTRAINT reservation_no_blocking_overlap
        EXCLUDE USING gist (
          resource_id WITH =,
          tstzrange(begin, "end", '[)') WITH &&
        )
        WHERE (state IN ('requested', 'confirmed'));
        """,
    )


def remove_overlap_constraint(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute(
        "ALTER TABLE reservations_reservation DROP CONSTRAINT IF EXISTS reservation_no_blocking_overlap;",
    )


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(add_overlap_constraint, remove_overlap_constraint),
    ]
