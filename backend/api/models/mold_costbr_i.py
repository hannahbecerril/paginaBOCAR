from django.db import models
from django.contrib.auth.models import User
from .base import RFQ_Base


# ── MOLD_COSTBR_I ────────────────────────────────────────────
class MOLD_COSTBR_I(models.Model):
    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='mold_costbr_i_rfq'
    )
    supplier = models.ForeignKey(
        User, on_delete=models.SET_NULL, related_name='mold_costbr_i_supplier', null=True, blank=True
    )

    Part_name = models.CharField(max_length=255, blank=True)
    Alloy = models.CharField(max_length=255, blank=True)
    Part_no = models.CharField(max_length=255, blank=True)
    Part_dimension_mm = models.CharField(max_length=255, blank=True)
    Min_wall_thickness_in_mm = models.CharField(max_length=255, blank=True)
    Max_wall_thickness_in_mm = models.CharField(max_length=255, blank=True)
    Projected_area_in_cm2 = models.CharField(max_length=255, blank=True)
    Surface_in_cm2 = models.CharField(max_length=255, blank=True)
    Volume_in_cm3 = models.CharField(max_length=255, blank=True)
    Gross_weight_in_g = models.CharField(max_length=255, blank=True)
    Buhler_Machine_Ton = models.CharField(max_length=255, blank=True)
    Number_of_cavities_sets = models.CharField(max_length=255, blank=True)
    Three_plate_mold = models.CharField(max_length=255, blank=True)
    Number_of_gates_per_part = models.CharField(max_length=255, blank=True)
    Number_of_mech_slides = models.CharField(max_length=255, blank=True)
    Number_of_hydr_slides = models.CharField(max_length=255, blank=True)
    Number_of_parts_per_stroke = models.CharField(max_length=255, blank=True)
    Number_of_tools = models.CharField(max_length=255, blank=True)
    Comments = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'MOLD_COSTBR_I'

    def __str__(self):
        return f'Mold Cost BR I - RFQ {self.id_rfq}'
