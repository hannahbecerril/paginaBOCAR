from django.db import migrations


LEVEL_MAP = {
    'lev1': 'industrialization_draft',
    'lev2': 'industrialization_draft',
    'lev3': 'industrialization_draft',
    'lev4': 'sent_to_purchases',
    'lev5': 'purchases_draft',
    'lev6': 'sent_to_suppliers',
    'lev7': 'waiting_for_suppliers',
    'lev8': 'supplier_selected',
    'lev9': 'rfq_closed',
}


def populate_rfq_status(apps, schema_editor):
    RFQ_Base = apps.get_model('api', 'RFQ_Base')
    Status_RFQ = apps.get_model('api', 'Status_RFQ')

    status_map = {s.id_rfq: s for s in Status_RFQ.objects.all()}

    for rfq in RFQ_Base.objects.all():
        s = status_map.get(rfq.id_rfq)
        if s is None:
            rfq.status = 'industrialization_draft'
            rfq.submitted_for_review = False
        elif s.lev9:
            rfq.status = 'rfq_closed'
        elif s.lev8:
            rfq.status = 'supplier_selected'
        elif s.lev7:
            rfq.status = 'waiting_for_suppliers'
        elif s.lev6:
            rfq.status = 'sent_to_suppliers'
        elif s.lev5:
            rfq.status = 'purchases_draft'
            rfq.submitted_for_review = True
        elif s.lev4:
            rfq.status = 'sent_to_purchases'
        elif s.lev3:
            rfq.status = 'industrialization_draft'
            rfq.submitted_for_review = True
        elif s.lev2:
            rfq.status = 'industrialization_draft'
            rfq.submitted_for_review = False
        else:
            rfq.status = 'industrialization_draft'
            rfq.submitted_for_review = False
        rfq.save(update_fields=['status', 'submitted_for_review'])


def update_tracking_strings(apps, schema_editor):
    RFQ_Tracking = apps.get_model('api', 'RFQ_Tracking')
    for old, new in LEVEL_MAP.items():
        RFQ_Tracking.objects.filter(nivel_alcanzado=old).update(nivel_alcanzado=new)


def clear_invalid_supplier_assignments(apps, schema_editor):
    """
    RFQ_Assignment.supplier previously pointed to the Suppliers table.
    After the FK change to auth.User, those IDs are now meaningless.
    Clear them so views start from a clean state.
    """
    RFQ_Assignment = apps.get_model('api', 'RFQ_Assignment')
    RFQ_Assignment.objects.update(supplier=None)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_schema_updates'),
    ]

    operations = [
        migrations.RunPython(
            clear_invalid_supplier_assignments,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.RunPython(
            populate_rfq_status,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.RunPython(
            update_tracking_strings,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
