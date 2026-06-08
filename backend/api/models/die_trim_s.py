from django.db import models
from .base import RFQ_Base
from django.contrib.auth.models import User


# ── DIE_TRIM_S ───────────────────────────────────────────────
class DIE_TRIM_S(models.Model):
 
    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='die_trim_s_rfq'
    )
    supplier = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='die_trim_s_supplier', null=True, blank=True
    )


    MatCst_TD1_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    MatCst_TD1_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    MatCst_TD2_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    MatCst_TD2_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    Acc_TD1_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    Acc_TD1_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    Acc_TD2_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    Acc_TD2_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    ManuCst_TD1_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    ManuCst_TD1_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    ManuCst_TD2_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    ManuCst_TD2_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    Adjus_TD1_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    Adjus_TD1_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    Adjus_TD2_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    Adjus_TD2_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    Logis_TD1_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    Logis_TD1_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    Logis_TD2_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    Logis_TD2_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    GrTotal_TD1_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    GrTotal_TD1_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    GrTotal_TD2_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    GrTotal_TD2_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    SpParts_TD1_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    SpParts_TD1_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    SpParts_TD2_PrBd = models.FloatField(max_length=255, null=True, blank=True)
    SpParts_TD2_TmBd = models.FloatField(max_length=255, null=True, blank=True)
    Curr_Trim_1=models.CharField(default=False)
    Curr_Trim_2=models.CharField(default=False)
    SUPP=models.CharField(default=False)
    SIGN=models.CharField(default=False)
    DATE = models.DateField(max_length=255, null=True, blank=True)
    PREP=models.CharField(default=False)

    
    class Meta:
        db_table = 'DIE_TRIM_S'

    def __str__(self):
        return f'Die Trim S - RFQ {self.id_rfq}'