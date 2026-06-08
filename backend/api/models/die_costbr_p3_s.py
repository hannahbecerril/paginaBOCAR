from django.db import models
from .base import RFQ_Base
from django.contrib.auth.models import User


# ── DIE_COSTBR_P3_S ───────────────────────────────────────────────
class DIE_COSTBR_P3_S(models.Model):

    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='die_costbr_p3_s_rfq'
    )
    supplier = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='die_costbr_p3_s_supplier', null=True, blank=True
    )

    Hard_H = models.FloatField(max_length=255, null=True, blank=True)
    Hard_PriceH = models.FloatField(max_length=255, null=True, blank=True) 
    Hard_Total = models.FloatField(max_length=255, null=True, blank=True)
    Hard_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    Nitri_H = models.FloatField(max_length=255, null=True, blank=True)
    Nitri_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Nitri_Total = models.FloatField(max_length=255, null=True, blank=True)
    Nitri_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    Coat_H = models.FloatField(max_length=255, null=True, blank=True)
    Coat_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Coat_Total = models.FloatField(max_length=255, null=True, blank=True)
    Coat_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    Grain_H = models.FloatField(max_length=255, null=True, blank=True)
    Grain_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Grain_Total = models.FloatField(max_length=255, null=True, blank=True)
    Grain_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    OthHeatSurf_H = models.FloatField(max_length=255, null=True, blank=True)
    OthHeatSurf_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    OthHeatSurf_Total = models.FloatField(max_length=255, null=True, blank=True)
    OthHeatSurf_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    TotalHeatSurf_H = models.FloatField(max_length=255, null=True, blank=True)
    TotalHeatSurf_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    TotalHeatSurf_Total = models.FloatField(max_length=255, null=True, blank=True)
    TotalHeatSurf_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    Desig_H = models.FloatField(max_length=255, null=True, blank=True)
    Desig_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Desig_Total = models.FloatField(max_length=255, null=True, blank=True)
    Desig_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    CamNC_H = models.FloatField(max_length=255, null=True, blank=True)
    CamNC_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    CamNC_Total = models.FloatField(max_length=255, null=True, blank=True)
    CamNC_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    OthEngDesign_H = models.FloatField(max_length=255, null=True, blank=True)
    OthEngDesign_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    OthEngDesign_Total = models.FloatField(max_length=255, null=True, blank=True)
    OthEngDesign_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    TotalManufCst_H = models.FloatField(max_length=255, null=True, blank=True)
    TotalManufCst_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    TotalManufCst_Total = models.FloatField(max_length=255, null=True, blank=True)
    TotalManufCst_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    Adjust_H = models.FloatField(max_length=255, null=True, blank=True)
    Adjust_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    Adjust_Total = models.FloatField(max_length=255, null=True, blank=True)
    Adjust_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    OthTrimDie_H = models.FloatField(max_length=255, null=True, blank=True)
    OthTrimDie_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    OthTrimDie_Total = models.FloatField(max_length=255, null=True, blank=True)
    OthTrimDie_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    GrTotalTrimAdjust_H = models.FloatField(max_length=255, null=True, blank=True)
    GrTotalTrimAdjust_PriceH = models.FloatField(max_length=255, null=True, blank=True)
    GrTotalTrimAdjust_Total = models.FloatField(max_length=255, null=True, blank=True)
    GrTotalTrimAdjust_Weeks = models.FloatField(max_length=255, null=True, blank=True)



    class Meta:
        db_table = 'DIE_COSTBR_P3_S'

    def __str__(self):
        return f'Die Costbreakdown Part 3 S - RFQ {self.id_rfq}'