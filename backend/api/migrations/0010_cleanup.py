import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

STATUS_CHOICES = [
    ('industrialization_draft', 'Industrialization Draft'),
    ('sent_to_purchases', 'Sent to Purchases'),
    ('purchases_draft', 'Purchases Draft'),
    ('sent_to_suppliers', 'Sent to Suppliers'),
    ('waiting_for_suppliers', 'Waiting for Suppliers'),
    ('supplier_selected', 'Supplier Selected'),
    ('rfq_closed', 'RFQ Closed'),
]


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_data_migration'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── Drop legacy Status_RFQ table ──────────────────────────────
        migrations.DeleteModel(name='Status_RFQ'),

        # ── Fix nivel_alcanzado: increase max_length (was 10, names are up to 24 chars)
        #    and add choices constraint ──────────────────────────────────
        migrations.AlterField(
            model_name='rfq_tracking',
            name='nivel_alcanzado',
            field=models.CharField(choices=STATUS_CHOICES, max_length=50),
        ),

        # ── Change MOLD_COSTBR_I.supplier FK from Suppliers → User ────
        migrations.AlterField(
            model_name='mold_costbr_i',
            name='supplier',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='mold_costbr_i_supplier',
                to=settings.AUTH_USER_MODEL,
            ),
        ),

        # ── Change DIE_COSTBR_I.supplier FK from Suppliers → User ─────
        migrations.AlterField(
            model_name='die_costbr_i',
            name='supplier',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='die_costbr_i_supplier',
                to=settings.AUTH_USER_MODEL,
            ),
        ),

        # ── Add DIE_COSTBR_P1_S.Company as a proper CharField ─────────
        # (was `Company = models` in Python — not a field, no DB column existed)
        migrations.AddField(
            model_name='die_costbr_p1_s',
            name='Company',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
