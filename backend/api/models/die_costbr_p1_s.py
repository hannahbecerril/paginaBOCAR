from django.db import models
from .base import RFQ_Base, Suppliers


# ── DIE_COSTBR_P1_S ───────────────────────────────────────────────
class DIE_COSTBR_P1_S(models.Model):
 
    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='die_costbr_p1_s_rfq'
    )
    supplier = models.ForeignKey(
        Suppliers, on_delete=models.PROTECT, related_name='die_costbr_p1_s_supplier', null=True, blank=True
    )


    Company = models.CharField(max_length=255, blank=True)
    Elaborated_by = models.CharField(max_length=255, blank=True)
    Country = models.CharField(max_length=255, blank=True)
    Base_currency = models.CharField(max_length=255, blank=True)
    Exchange_rate = models.CharField(max_length=255, blank=True)
    Last_edit_by = models.CharField(max_length=255, blank=True)
    Last_change = models.DateField(max_length=255, blank=True)
    Max_Weight_trim = models.CharField(max_length=255, blank=True)
    Comments = models.CharField(max_length=500, blank=True)
    RawMat_Unit = models.CharField(max_length=255, blank=True)
    RawMat_PriceUnit = models.CharField(max_length=255, blank=True)
    RawMat_Total = models.CharField(max_length=255, blank=True)
    RawMat_Weeks = models.CharField(max_length=255, blank=True)
    OthMat_Unit = models.CharField(max_length=255, blank=True)
    OthMat_PriceUnit = models.CharField(max_length=255, blank=True)
    OthMat_Total = models.CharField(max_length=255, blank=True)
    OthMat_Weeks = models.CharField(max_length=255, blank=True)
    TotalMatCost_Unit = models.CharField(max_length=255, blank=True)
    TotalMatCost_PriceUnit = models.CharField(max_length=255, blank=True)
    TotalMatCost_Total = models.CharField(max_length=255, blank=True)
    TotalMatCost_Weeks = models.CharField(max_length=255, blank=True)
    MerkCyl_Unit = models.CharField(max_length=255, blank=True)
    MerkCyl_PriceUnit = models.CharField(max_length=255, blank=True)
    MerkCyl_Total = models.CharField(max_length=255, blank=True)
    MerkCyl_Weeks = models.CharField(max_length=255, blank=True)
    TeleLimit_Unit = models.CharField(max_length=255, blank=True)
    TeleLimit_PriceUnit = models.CharField(max_length=255, blank=True)
    TeleLimit_Total = models.CharField(max_length=255, blank=True)
    TeleLimit_Weeks = models.CharField(max_length=255, blank=True)
    SensIFM_Unit = models.CharField(max_length=255, blank=True)
    SensIFM_PriceUnit = models.CharField(max_length=255, blank=True)
    SensIFM_Total = models.CharField(max_length=255, blank=True)
    SensIFM_Weeks = models.CharField(max_length=255, blank=True)
    AirDevi_Unit = models.CharField(max_length=255, blank=True)
    AirDevi_PriceUnit = models.CharField(max_length=255, blank=True)
    AirDevi_Total = models.CharField(max_length=255, blank=True)
    AirDevi_Weeks = models.CharField(max_length=255, blank=True)
    OthAccCst_Unit = models.CharField(max_length=255, blank=True)
    OthAccCst_PriceUnit = models.CharField(max_length=255, blank=True)
    OthAccCst_Total = models.CharField(max_length=255, blank=True)
    OthAccCst_Weeks = models.CharField(max_length=255, blank=True)
    TotalAccCst_Unit = models.CharField(max_length=255, blank=True)
    TotalAccCst_PriceUnit = models.CharField(max_length=255, blank=True)
    TotalAccCst_Total = models.CharField(max_length=255, blank=True)
    TotalAccCst_Weeks = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'DIE_COSTBR_P1_S'

    def __str__(self):
        return f'Die Costbreakdown Part 1 S - RFQ {self.id_rfq}'