from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_archivo_rfqbase_extensions'),
    ]

    operations = [
        # Fix Last_change in DIE_COSTBR_P1_S — it's a DateField that was NOT NULL
        # but the frontend never sends it, so any INSERT failed.
        migrations.AlterField(
            model_name='die_costbr_p1_s',
            name='Last_change',
            field=models.DateField(null=True, blank=True),
        ),
    ]
