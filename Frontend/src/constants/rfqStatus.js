// Single source of truth for RFQ status values — matches backend constants.py
export const STATUS = {
  IND_DRAFT:             'industrialization_draft',
  SENT_TO_PURCHASES:     'sent_to_purchases',
  PURCHASES_DRAFT:       'purchases_draft',
  SENT_TO_SUPPLIERS:     'sent_to_suppliers',
  WAITING_FOR_SUPPLIERS: 'waiting_for_suppliers',
  SUPPLIER_SELECTED:     'supplier_selected',
  RFQ_CLOSED:            'rfq_closed',
};

export const STATUS_LABEL = {
  [STATUS.IND_DRAFT]:             'Industrialization Draft',
  [STATUS.SENT_TO_PURCHASES]:     'Sent to Purchases',
  [STATUS.PURCHASES_DRAFT]:       'Purchases Draft',
  [STATUS.SENT_TO_SUPPLIERS]:     'Sent to Suppliers',
  [STATUS.WAITING_FOR_SUPPLIERS]: 'Waiting for Suppliers',
  [STATUS.SUPPLIER_SELECTED]:     'Supplier Selected',
  [STATUS.RFQ_CLOSED]:            'RFQ Closed',
};
