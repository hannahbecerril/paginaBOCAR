from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_api_contract_additions'),
    ]

    operations = [
        # Archivo: file metadata so the frontend can display type and 3D flag
        migrations.AddField(
            model_name='archivo',
            name='file_type',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='archivo',
            name='is3d',
            field=models.BooleanField(default=False),
        ),
        # RFQ_Base: Purchases metadata fields
        migrations.AddField(
            model_name='rfq_base',
            name='response_deadline',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='rfq_base',
            name='shipping_terms',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='rfq_base',
            name='quality_requirements',
            field=models.TextField(blank=True),
        ),
    ]
