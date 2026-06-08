from django.db import models
from .base import RFQ_Base
from django.contrib.auth.models import User


# ── DIE_COSTBR_P4_S ───────────────────────────────────────────────
class DIE_COSTBR_P4_S(models.Model):

    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='die_costbr_p4_s_rfq'
    )
    supplier = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='die_costbr_p4_s_supplier', null=True, blank=True
    )


    TransportSuppToBTC_Unit = models.FloatField(max_length=255, null=True, blank=True)
    TransportSuppToBTC_PriceUnit = models.FloatField(max_length=255, null=True, blank=True)
    TransportSuppToBTC_Total = models.FloatField(max_length=255, null=True, blank=True)
    TransportSuppToBTC_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    TransportBTCtoSupp_Unit = models.FloatField(max_length=255, null=True, blank=True)
    TransportBTCtoSupp_PriceUnit = models.FloatField(max_length=255, null=True, blank=True)
    TransportBTCtoSupp_Total = models.FloatField(max_length=255, null=True, blank=True)
    TransportBTCtoSupp_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    DutyCosts_Unit = models.FloatField(max_length=255, null=True, blank=True)
    DutyCosts_PriceUnit = models.FloatField(max_length=255, null=True, blank=True)
    DutyCosts_Total = models.FloatField(max_length=255, null=True, blank=True)
    DutyCosts_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    CleaningPack_Unit = models.FloatField(max_length=255, null=True, blank=True)
    CleaningPack_PriceUnit = models.FloatField(max_length=255, null=True, blank=True)
    CleaningPack_Total = models.FloatField(max_length=255, null=True, blank=True)
    CleaningPack_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    OthersLogistics_Unit = models.FloatField(max_length=255, null=True, blank=True)
    OthersLogistics_PriceUnit = models.FloatField(max_length=255, null=True, blank=True)
    OthersLogistics_Total = models.FloatField(max_length=255, null=True, blank=True)
    OthersLogistics_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    TotalLogistics_Unit = models.FloatField(max_length=255, null=True, blank=True)
    TotalLogistics_PriceUnit = models.FloatField(max_length=255, null=True, blank=True)
    TotalLogistics_Total = models.FloatField(max_length=255, null=True, blank=True)
    TotalLogistics_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    DieImprovements_Unit = models.FloatField(max_length=255, null=True, blank=True)
    DieImprovements_PriceUnit = models.FloatField(max_length=255, null=True, blank=True)
    DieImprovements_Total = models.FloatField(max_length=255, null=True, blank=True)
    DieImprovements_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    TotalToolReplace_Unit = models.FloatField(max_length=255, null=True, blank=True)
    TotalToolReplace_PriceUnit = models.FloatField(max_length=255, null=True, blank=True)
    TotalToolReplace_Total = models.FloatField(max_length=255, null=True, blank=True)
    TotalToolReplace_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    SparePt_Unit = models.FloatField(max_length=255, null=True, blank=True)
    SparePt_PriceUnit = models.FloatField(max_length=255, null=True, blank=True)
    SparePt_Total = models.FloatField(max_length=255, null=True, blank=True)
    SparePt_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    OthSparePt_Unit = models.FloatField(max_length=255, null=True, blank=True)
    OthSparePt_PriceUnit = models.FloatField(max_length=255, null=True, blank=True)
    OthSparePt_Total = models.FloatField(max_length=255, null=True, blank=True)
    OthSparePt_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    GrTotalSparePt_Unit = models.FloatField(max_length=255, null=True, blank=True)
    GrTotalSparePt_PriceUnit = models.FloatField(max_length=255, null=True, blank=True)
    GrTotalSparePt_Total = models.FloatField(max_length=255, null=True, blank=True)
    GrTotalSparePt_Weeks = models.FloatField(max_length=255, null=True, blank=True)
    


    class Meta:
        db_table = 'DIE_COSTBR_P4_S'

    def __str__(self):
        return f'Die Costbreakdown Part 4 S - RFQ {self.id_rfq}'