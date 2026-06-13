from django.db import models
from .base import RFQ_Base
from django.contrib.auth.models import User


# ── DIE_TRIM_I ───────────────────────────────────────────────
class DIE_TRIM_I(models.Model):
    
    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='die_trim_i_rfq'
    )
    supplier = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name='die_trim_i_supplier', null=True, blank=True
    )


    DESC = models.CharField(max_length=255, null=True, blank=True)
    PPY = models.CharField(max_length=255, null=True, blank=True)
    CUST = models.CharField(max_length=255, null=True, blank=True)
    PT_No = models.CharField(max_length=255, null=True, blank=True)
    PROJ_L = models.CharField(max_length=255, null=True, blank=True)
    DTQB = models.CharField(max_length=255, null=True, blank=True)
    Press = models.CharField(max_length=255, null=True, blank=True)
    No_cavities = models.CharField(max_length=255, null=True, blank=True)
    No_hydra_slides = models.CharField(max_length=255, null=True, blank=True)
    Ful_Auto_proc = models.CharField(max_length=255, null=True, blank=True)
    Presence_Detec = models.CharField(max_length=255, null=True, blank=True)
    Trim_proc = models.CharField(max_length=255, null=True, blank=True)
    Pun_pins_req = models.CharField(max_length=255, null=True, blank=True)
    Admissible_res_burr_mm = models.CharField(max_length=255, null=True, blank=True)
    Castings_supp = models.CharField(max_length=255, null=True, blank=True)
    Adjust_opt_tool_maker = models.CharField(max_length=255, null=True, blank=True)
    Gas_spri = models.CharField(max_length=255, null=True, blank=True)
    Desi_3D = models.BooleanField(default=False)
    Desi_2D = models.BooleanField(default=False)
    Punch_Data = models.BooleanField(default=False)
    Manu_Propo = models.BooleanField(default=False)
    Late_trim_imp = models.BooleanField(default=False)
    Sketch_die = models.BooleanField(default=False)
    Desi_3D_notes = models.CharField(max_length=500, null=True, blank=True)
    Desi_2D_notes = models.CharField(max_length=500, null=True, blank=True)
    Punch_Data_notes = models.CharField(max_length=500, null=True, blank=True)
    Manu_Propo_notes = models.CharField(max_length=500, null=True, blank=True)
    Late_trim_imp_notes = models.CharField(max_length=500, null=True, blank=True)
    Sketch_die_notes = models.CharField(max_length=500, null=True, blank=True)
    Trim_No_1 = models.BooleanField(default=False)
    Trim_No_2 = models.BooleanField(default=False)
    Set_spare = models.BooleanField(default=False)
    Hydra_Cylin_switch = models.BooleanField(default=False)
    Trim_No_1_notes = models.CharField(max_length=500, null=True, blank=True)
    Trim_No_2_notes = models.CharField(max_length=500, null=True, blank=True)
    Set_spare_notes = models.CharField(max_length=500, null=True, blank=True)
    Hydra_Cylin_switch_notes = models.CharField(max_length=500, null=True, blank=True)
    Frame_Refur = models.BooleanField(default=False)
    Set_elec_wires = models.BooleanField(default=False)
    Others = models.BooleanField(default=False)
    Deli_date = models.BooleanField(default=False)
    Ejec_syst_fix = models.BooleanField(default=False)
    Frame_Refur_notes = models.CharField(max_length=500, null=True, blank=True)
    Set_elec_wires_notes = models.CharField(max_length=500, null=True, blank=True)
    Others_notes = models.CharField(max_length=500, null=True, blank=True)
    Deli_date_notes = models.CharField(max_length=500, null=True, blank=True)
    Ejec_syst_fix_notes = models.CharField(max_length=500, null=True, blank=True)
    sketch_image = models.ImageField(upload_to='die_sketches/', null=True, blank=True)
    # Nuevos campos para el modelo de IA
    part_length = models.FloatField(null=True, blank=True)
    part_height = models.FloatField(null=True, blank=True)
    part_depth = models.FloatField(null=True, blank=True)
    part_weight_kg = models.FloatField(null=True, blank=True)
    product_type = models.CharField(max_length=100, null=True, blank=True)
    comodity = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    class Meta:
        db_table = 'DIE_TRIM_I'

    def __str__(self):
        return f'Die Trim I - RFQ {self.id_rfq}'