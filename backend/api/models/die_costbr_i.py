from django.db import models
from .base import RFQ_Base, Suppliers


# ── DIE_COSTBR_I ───────────────────────────────────────────────
class DIE_COSTBR_I(models.Model):
    id_rfq = models.ForeignKey(RFQ_Base, on_delete=models.CASCADE, related_name='die_costbr_i')

    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='die_costbr_i_rfq'
    )
    supplier = models.ForeignKey(
        Suppliers, on_delete=models.PROTECT, related_name='die_costbr_i_supplier'
    )


    Part_name = models.CharField(max_length=255, blank=True)
    Part_no = models.CharField(max_length=255, blank=True)
    Part_dimen_mm = models.CharField(max_length=255, blank=True)
    Min_wall_mm = models.CharField(max_length=255, blank=True)
    Max_wall_mm = models.CharField(max_length=255, blank=True)
    Projec_area_cm = models.CharField(max_length=255, blank=True)
    Surf_cm = models.CharField(max_length=255, blank=True)
    Volu_cm = models.CharField(max_length=255, blank=True)
    Gros_wei_g = models.CharField(max_length=255, blank=True)
    Press_Type = models.CharField(max_length=255, blank=True)
    No_cavities = models.CharField(max_length=255, blank=True)
    Introduc_Extract = models.CharField(max_length=255, blank=True)
    Bisc_Pos = models.CharField(max_length=255, blank=True)
    No_hydr_slid = models.CharField(max_length=255, blank=True)
    Quant_punch_pin = models.CharField(max_length=255, blank=True)
    Admi_resid_burr_mm = models.CharField(max_length=255, blank=True)
    Temp_trim = models.CharField(max_length=255, blank=True)
    Gas_Sprin = models.CharField(max_length=255, blank=True)
    Ejec_syst_fix = models.CharField(max_length=255, blank=True)

 
    class Meta:
        db_table = 'DIE_COSTBR_I'

    def __str__(self):
        return f'Die Costbreakdown I - RFQ {self.id_rfq}'