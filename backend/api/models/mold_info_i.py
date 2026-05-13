from django.db import models
from .base import RFQ_Base, Suppliers


# ── MOLD_INFO_P1_I ───────────────────────────────────────────
class MOLD_INFO_P1_I(models.Model):
    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='mold_info_p1_i_rfq'
    )
    supplier = models.ForeignKey(
        Suppliers, on_delete=models.PROTECT, related_name='mold_info_p1_i_supplier'
    )

    DESC = models.CharField(max_length=255, blank=True)
    PPY = models.IntegerField(null=True, blank=True)
    CUST = models.CharField(max_length=255, blank=True)
    PT = models.CharField(max_length=255, blank=True)
    PNUM = models.CharField(max_length=255, blank=True)
    PRLF = models.CharField(max_length=255, blank=True)
    TT = models.CharField(max_length=255, blank=True)
    DTQ = models.DateTimeField(null=True, blank=True)
    ELAB = models.CharField(max_length=255, blank=True)
    Smach = models.CharField(max_length=255, blank=True)
    No_CAV = models.CharField(max_length=255, blank=True)
    No_ofHS = models.CharField(max_length=255, blank=True)
    No_ofMS = models.CharField(max_length=255, blank=True)
    ThirdPSupp = models.CharField(max_length=255, blank=True)
    No_subc = models.CharField(max_length=255, blank=True)
    Jco = models.CharField(max_length=255, blank=True)
    QcSys = models.CharField(max_length=255, blank=True)
    Ihtcs = models.CharField(max_length=255, blank=True)
    Spin = models.CharField(max_length=255, blank=True)
    HICS = models.CharField(max_length=255, blank=True)
    CMGOM = models.CharField(max_length=255, blank=True)
    SPforThermoR = models.CharField(max_length=255, blank=True)
    NReturnV = models.CharField(max_length=255, blank=True)
    VacV = models.CharField(max_length=255, blank=True)
    ChillBl = models.CharField(max_length=255, blank=True)
    No_PlJcosys = models.CharField(max_length=255, blank=True)
    Oth = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'MOLD_INFO_P1_I'

    def __str__(self):
        return f'Mold Info P1 I - RFQ {self.id_rfq}'


# ── MOLD_INFO_P2_I ───────────────────────────────────────────
class MOLD_INFO_P2_I(models.Model):
    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='mold_info_p2_i_rfq'
    )
    supplier = models.ForeignKey(
        Suppliers, on_delete=models.PROTECT, related_name='mold_info_p2_i_supplier'
    )

    ThreeD = models.BooleanField(default=False)
    FlAn = models.BooleanField(default=False)
    Run_des = models.BooleanField(default=False)
    Run_and_over_mod = models.BooleanField(default=False)
    ManProp = models.BooleanField(default=False)
    Ldi = models.BooleanField(default=False)
    Add_of_mach_st = models.BooleanField(default=False)
    Sketch_d_conc_inc_s_dim = models.BooleanField(default=False)
    TwoDDrDes = models.BooleanField(default=False)
    ThreeDDModSolid = models.BooleanField(default=False)
    ThreeD_notes = models.CharField(max_length=500, blank=True)
    FlAn_notes = models.CharField(max_length=500, blank=True)
    Run_des_notes = models.CharField(max_length=500, blank=True)
    Run_and_over_mod_notes = models.CharField(max_length=500, blank=True)
    ManProp_notes = models.CharField(max_length=500, blank=True)
    Ldi_notes = models.CharField(max_length=500, blank=True)
    Add_of_mach_st_notes = models.CharField(max_length=500, blank=True)
    Sketch_d_conc_inc_s_dim_notes = models.CharField(max_length=500, blank=True)
    TwoDDrDes_notes = models.CharField(max_length=500, blank=True)
    ThreeDDModSolid_notes = models.CharField(max_length=500, blank=True)
    Eyeb = models.BooleanField(default=False)
    Eyeb_notes = models.CharField(max_length=500, blank=True)
    OW_Conn = models.BooleanField(default=False)
    OW_Conn_notes = models.CharField(max_length=500, blank=True)
    STM_1_2 = models.BooleanField(default=False)
    STM_1_2_notes = models.CharField(max_length=500, blank=True)
    CMM_dim_rep_cai = models.BooleanField(default=False)
    CMM_dim_rep_cai_notes = models.CharField(max_length=500, blank=True)
    GOM_rep = models.BooleanField(default=False)
    GOM_rep_notes = models.CharField(max_length=500, blank=True)
    H_val_subc_in = models.BooleanField(default=False)
    H_val_subc_in_notes = models.CharField(max_length=500, blank=True)
    Dim_corr_opt = models.BooleanField(default=False)
    Dim_corr_opt_notes = models.CharField(max_length=500, blank=True)
    Sp_Pt = models.BooleanField(default=False)
    Sp_Pt_notes = models.CharField(max_length=500, blank=True)
    Comp_D = models.BooleanField(default=False)
    Comp_D_notes = models.CharField(max_length=500, blank=True)
    Subseq_D = models.BooleanField(default=False)
    Subseq_D_notes = models.CharField(max_length=500, blank=True)
    Set_of_repl_H13 = models.BooleanField(default=False)
    Set_of_repl_H13_notes = models.CharField(max_length=500, blank=True)
    Sp_set_of_EI = models.BooleanField(default=False)
    Sp_set_of_EI_notes = models.CharField(max_length=500, blank=True)
    FICF = models.BooleanField(default=False)
    FICF_notes = models.CharField(max_length=500, blank=True)
    HCLS = models.BooleanField(default=False)
    HCLS_notes = models.CharField(max_length=500, blank=True)
    Fr_Refur = models.BooleanField(default=False)
    Fr_Refur_notes = models.CharField(max_length=500, blank=True)
    sketch_image = models.ImageField(upload_to='mold_sketches/', null=True, blank=True)

    class Meta:
        db_table = 'MOLD_INFO_P2_I'

    def __str__(self):
        return f'Mold Info P2 I - RFQ {self.id_rfq}'