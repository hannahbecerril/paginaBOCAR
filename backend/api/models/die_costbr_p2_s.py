from django.db import models
from .base import RFQ_Base
from django.contrib.auth.models import User


# ── DIE_COSTBR_P2_S ───────────────────────────────────────────────
class DIE_COSTBR_P2_S(models.Model):
    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name="die_costbr_p2_s_rfq"
    )
    supplier = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="die_costbr_p2_s_supplier",
        null=True,
        blank=True,
    )

    Mill_H = models.FloatField(max_length=255, null=True, blank=True)
    Mill_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Mill_Total = models.FloatField(max_length=255, null=True, blank=True)
    Mill_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    Turn_H = models.FloatField(max_length=255, null=True, blank=True)
    Turn_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Turn_Total = models.FloatField(max_length=255, null=True, blank=True)
    Turn_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    Wirecut_H = models.FloatField(max_length=255, null=True, blank=True)
    Wirecut_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Wirecut_Total = models.FloatField(max_length=255, null=True, blank=True)
    Wirecut_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    EDM_H = models.FloatField(max_length=255, null=True, blank=True)
    EDM_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    EDM_Total = models.FloatField(max_length=255, null=True, blank=True)
    EDM_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    Grind_H = models.FloatField(max_length=255, null=True, blank=True)
    Grind_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Grind_Total = models.FloatField(max_length=255, null=True, blank=True)
    Grind_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    Drill_H = models.FloatField(max_length=255, null=True, blank=True)
    Drill_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Drill_Total = models.FloatField(max_length=255, null=True, blank=True)
    Drill_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    OthMachin_H = models.FloatField(max_length=255, null=True, blank=True)
    OthMachin_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    OthMachin_Total = models.FloatField(max_length=255, null=True, blank=True)
    OthMachin_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    TotalMachinCst_H = models.FloatField(max_length=255, null=True, blank=True)
    TotalMachinCst_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    TotalMachinCst_Total = models.FloatField(max_length=255, null=True, blank=True)
    TotalMachinCst_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    Assem_H = models.FloatField(max_length=255, null=True, blank=True)
    Assem_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Assem_Total = models.FloatField(max_length=255, null=True, blank=True)
    Assem_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    Spot_H = models.FloatField(max_length=255, null=True, blank=True)
    Spot_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Spot_Total = models.FloatField(max_length=255, null=True, blank=True)
    Spot_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    StripPolish_H = models.FloatField(max_length=255, null=True, blank=True)
    StripPolish_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    StripPolish_Total = models.FloatField(max_length=255, null=True, blank=True)
    StripPolish_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    OthManual_H = models.FloatField(max_length=255, null=True, blank=True)
    OthManual_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    OthManual_Total = models.FloatField(max_length=255, null=True, blank=True)
    OthManual_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    TotalManuWk_H = models.FloatField(max_length=255, null=True, blank=True)
    TotalManuWk_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    TotalManuWk_Total = models.FloatField(max_length=255, null=True, blank=True)
    TotalManuWk_Weeks = models.FloatField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "DIE_COSTBR_P2_S"

    def __str__(self):
        return f"Die Costbreakdown Part 2 S - RFQ {self.id_rfq}"
