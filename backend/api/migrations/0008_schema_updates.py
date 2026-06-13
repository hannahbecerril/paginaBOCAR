import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_remove_mold_costbr_p2_s_elaborated_by_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── RFQ_Base: add status + submitted_for_review ───────────────
        migrations.AddField(
            model_name='rfq_base',
            name='status',
            field=models.CharField(
                choices=[
                    ('industrialization_draft', 'Industrialization Draft'),
                    ('sent_to_purchases', 'Sent to Purchases'),
                    ('purchases_draft', 'Purchases Draft'),
                    ('sent_to_suppliers', 'Sent to Suppliers'),
                    ('waiting_for_suppliers', 'Waiting for Suppliers'),
                    ('supplier_selected', 'Supplier Selected'),
                    ('rfq_closed', 'RFQ Closed'),
                ],
                default='industrialization_draft',
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name='rfq_base',
            name='submitted_for_review',
            field=models.BooleanField(default=False),
        ),

        # ── RFQ_Assignment: change supplier FK to User + add has_responded ──
        migrations.AddField(
            model_name='rfq_assignment',
            name='has_responded',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='rfq_assignment',
            name='supplier',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='rfq_assignments',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterUniqueTogether(
            name='rfq_assignment',
            unique_together={('id_rfq', 'supplier')},
        ),

        # ── Restore Elaborated_by on MOLD_COSTBR P2–P5 ───────────────
        migrations.AddField(
            model_name='mold_costbr_p2_s',
            name='Elaborated_by',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='mold_costbr_p3_s',
            name='Elaborated_by',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='mold_costbr_p4_s',
            name='Elaborated_by',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='mold_costbr_p5_s',
            name='Elaborated_by',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
