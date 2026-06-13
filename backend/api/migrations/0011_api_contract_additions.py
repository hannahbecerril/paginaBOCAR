import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_cleanup'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── RFQ_Base: add category + priority ────────────────────────
        migrations.AddField(
            model_name='rfq_base',
            name='category',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='rfq_base',
            name='priority',
            field=models.CharField(
                blank=True,
                max_length=20,
                choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High'), ('Critical', 'Critical')],
            ),
        ),

        # ── Archivo: add nullable RFQ FK ──────────────────────────────
        migrations.AddField(
            model_name='archivo',
            name='id_rfq',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='archivos',
                to='api.rfq_base',
            ),
        ),

        # ── Notificacion model ────────────────────────────────────────
        migrations.CreateModel(
            name='Notificacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=255)),
                ('mensaje', models.TextField(blank=True)),
                ('tipo', models.CharField(
                    choices=[('info', 'Info'), ('warning', 'Warning'), ('success', 'Success'), ('error', 'Error')],
                    default='info',
                    max_length=20,
                )),
                ('category_id', models.CharField(blank=True, max_length=100)),
                ('leida', models.BooleanField(default=False)),
                ('fecha', models.DateTimeField(auto_now_add=True)),
                ('rfq', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='notificaciones',
                    to='api.rfq_base',
                )),
                ('usuario', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notificaciones',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'Notificacion', 'ordering': ['-fecha']},
        ),
    ]
