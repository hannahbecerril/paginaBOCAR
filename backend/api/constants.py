from django.db import models


class STATUS:
    IND_DRAFT             = 'industrialization_draft'
    SENT_TO_PURCHASES     = 'sent_to_purchases'
    PURCHASES_DRAFT       = 'purchases_draft'
    SENT_TO_SUPPLIERS     = 'sent_to_suppliers'
    WAITING_FOR_SUPPLIERS = 'waiting_for_suppliers'
    SUPPLIER_SELECTED     = 'supplier_selected'
    RFQ_CLOSED            = 'rfq_closed'

    CHOICES = [
        (IND_DRAFT,             'Industrialization Draft'),
        (SENT_TO_PURCHASES,     'Sent to Purchases'),
        (PURCHASES_DRAFT,       'Purchases Draft'),
        (SENT_TO_SUPPLIERS,     'Sent to Suppliers'),
        (WAITING_FOR_SUPPLIERS, 'Waiting for Suppliers'),
        (SUPPLIER_SELECTED,     'Supplier Selected'),
        (RFQ_CLOSED,            'RFQ Closed'),
    ]

    # All statuses beyond Industrialization domain
    PAST_IND = [
        SENT_TO_PURCHASES, PURCHASES_DRAFT, SENT_TO_SUPPLIERS,
        WAITING_FOR_SUPPLIERS, SUPPLIER_SELECTED, RFQ_CLOSED,
    ]

    # Statuses visible to Purchases in their 'all' view
    PURCHASES_ALL = [
        SENT_TO_SUPPLIERS, WAITING_FOR_SUPPLIERS, SUPPLIER_SELECTED, RFQ_CLOSED,
    ]

    # Statuses where suppliers can submit or view quotes
    SUPPLIER_ACTIVE = [SENT_TO_SUPPLIERS, WAITING_FOR_SUPPLIERS]

    # Statuses visible to suppliers in their 'all' view
    SUPPLIER_ALL = [WAITING_FOR_SUPPLIERS, SUPPLIER_SELECTED, RFQ_CLOSED]
