from django.db import models
from .base import RFQ_Base, Suppliers


# ── MOLD_INFO_P1_S ────────────────────────────────────────────
class MOLD_INFO_P1_S(models.Model):
    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='mold_info_p1_s_rfq'
    )
    supplier = models.ForeignKey(
        Suppliers, on_delete=models.PROTECT, related_name='mold_info_p1_s_supplier', null=True, blank=True
    )

    # Material Cost - M1
    MatCst_M1_PrBd = models.FloatField(null=True, blank=True)
    MatCst_M1_TBd = models.FloatField(null=True, blank=True)
    MatCst_ToolRep_PrBd = models.FloatField(null=True, blank=True)
    MatCst_ToolRep_TBd = models.FloatField(null=True, blank=True)
    MatCst_Cav_PrBd = models.FloatField(null=True, blank=True)
    MatCst_Cav_TBd = models.FloatField(null=True, blank=True)

    # Accessories
    Accs_M1_PrBd = models.FloatField(null=True, blank=True)
    Accs_M1_TBd = models.FloatField(null=True, blank=True)
    Accs_ToolRep_PrBd = models.FloatField(null=True, blank=True)
    Accs_ToolRep_TBd = models.FloatField(null=True, blank=True)
    Accs_Cav_PrBd = models.FloatField(null=True, blank=True)
    Accs_Cav_TBd = models.FloatField(null=True, blank=True)

    # Manufacturing Cost
    ManCst_M1_PrBd = models.FloatField(null=True, blank=True)
    ManCst_M1_TBd = models.FloatField(null=True, blank=True)
    ManCst_ToolRep_PrBd = models.FloatField(null=True, blank=True)
    ManCst_ToolRep_TBd = models.FloatField(null=True, blank=True)
    ManCst_Cav_PrBd = models.FloatField(null=True, blank=True)
    ManCst_Cav_TBd = models.FloatField(null=True, blank=True)

    # Corrections, Optimizations and Measurements
    CorrOptAndMeas_M1_PrBd = models.FloatField(null=True, blank=True)
    CorrOptAndMeas_M1_TBd = models.FloatField(null=True, blank=True)
    CorrOptAndMeas_ToolRep_PrBd = models.FloatField(null=True, blank=True)
    CorrOptAndMeas_ToolRep_TBd = models.FloatField(null=True, blank=True)
    CorrOptAndMeas_Cav_PrBd = models.FloatField(null=True, blank=True)
    CorrOptAndMeas_Cav_TBd = models.FloatField(null=True, blank=True)

    # Logistics Cost
    LogCst_M1_PrBd = models.FloatField(null=True, blank=True)
    LogCst_M1_TBd = models.FloatField(null=True, blank=True)
    LogCst_ToolRep_PrBd = models.FloatField(null=True, blank=True)
    LogCst_ToolRep_TBd = models.FloatField(null=True, blank=True)
    LogCst_Cav_PrBd = models.FloatField(null=True, blank=True)
    LogCst_Cav_TBd = models.FloatField(null=True, blank=True)

    # Grand Total
    GrTot_M1_PrBd = models.FloatField(null=True, blank=True)
    GrTot_M1_TBd = models.FloatField(null=True, blank=True)
    GrTot_ToolRep_PrBd = models.FloatField(null=True, blank=True)
    GrTot_ToolRep_TBd = models.FloatField(null=True, blank=True)
    GrTot_Cav_PrBd = models.FloatField(null=True, blank=True)
    GrTot_Cav_TBd = models.FloatField(null=True, blank=True)

    # Sampling at Supplier Facility
    SampSuppFac_M1_PrBd = models.FloatField(null=True, blank=True)
    SampSuppFac_M1_TBd = models.FloatField(null=True, blank=True)
    SampSuppFac_ToolRep_PrBd = models.FloatField(null=True, blank=True)
    SampSuppFac_ToolRep_TBd = models.FloatField(null=True, blank=True)
    SampSuppFac_Cav_PrBd = models.FloatField(null=True, blank=True)
    SampSuppFac_Cav_TBd = models.FloatField(null=True, blank=True)

    # Spare Parts
    SPPT_M1_PrBd = models.FloatField(null=True, blank=True)
    SPPT_M1_TBd = models.FloatField(null=True, blank=True)
    SPPT_ToolRep_PrBd = models.FloatField(null=True, blank=True)
    SPPT_ToolRep_TBd = models.FloatField(null=True, blank=True)
    SPPT_Cav_PrBd = models.FloatField(null=True, blank=True)
    SPPT_Cav_TBd = models.FloatField(null=True, blank=True)

    # Currency
    Curr = models.CharField(max_length=10, blank=True)

    class Meta:
        db_table = 'MOLD_INFO_P1_S'

    def __str__(self):
        return f'Mold Info P1 S - RFQ {self.id_rfq}'
    



# ── MOLD_INFO_P2_S ───────────────────────────────────────────
class MOLD_INFO_P2_S(models.Model):

    id_rfq = models.ForeignKey(RFQ_Base, on_delete=models.CASCADE, related_name='mold_info_p2_s_rfq')
    supplier = models.ForeignKey(Suppliers, on_delete=models.PROTECT, related_name='mold_info_p2_s_supplier', null=True, blank=True)


    SUPP = models.CharField(max_length=255, blank=True)
    SIGN = models.CharField(max_length=255, blank=True)
    DATE = models.DateTimeField(null=True, blank=True)
    PREP = models.CharField(max_length=255, blank=True)
    QT_No = models.CharField(max_length=255, blank=True)
    INC = models.CharField(max_length=255, blank=True)
    Comment = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'MOLD_INFO_P2_S'

    def __str__(self):
        return f'Mold Info P2 S - RFQ {self.id_rfq}'

