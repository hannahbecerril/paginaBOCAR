from django.db import models
from .base import RFQ_Base, Suppliers



# ── MOLD_COSTBR_P1_S ─────────────────────────────────────────
class MOLD_COSTBR_P1_S(models.Model):
    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='mold_costbr_p1_s_rfq'
    )
    supplier = models.ForeignKey(
        Suppliers, on_delete=models.PROTECT, related_name='mold_costbr_p1_s_supplier', null=True, blank=True
    )

    Company = models.CharField(max_length=255, blank=True)
    Elaborated_by = models.CharField(max_length=255, blank=True)
    Country = models.CharField(max_length=255, blank=True)
    Base_currency = models.CharField(max_length=50, blank=True)
    Last_edited_by = models.CharField(max_length=255, blank=True)
    Last_change = models.DateTimeField(null=True, blank=True)
    Tool_dimensions_Fixed_Side_1_in_mm = models.CharField(max_length=255, blank=True)
    Tool_dimensions_Fixed_Side_2_in_mm = models.CharField(max_length=255, blank=True)
    Tool_dimensions_Fixed_Side_3_in_mm = models.CharField(max_length=255, blank=True)
    Tool_dimensions_Ejector_Side_1_in_mm = models.CharField(max_length=255, blank=True)
    Tool_dimensions_Ejector_Side_2_in_mm = models.CharField(max_length=255, blank=True)
    Tool_dimensions_Ejector_Side_3_in_mm = models.CharField(max_length=255, blank=True)
    Tool_weight_Fixed_Side_in_kg = models.CharField(max_length=255, blank=True)
    Tool_weight_Ejector_Side_in_kg = models.CharField(max_length=255, blank=True)

    # Parker Hydraulic Cylinders
    ParkerHydraulicCylindersSquaresSwitches_Unit = models.FloatField(null=True, blank=True)
    ParkerHydraulicCylindersSquaresSwitches_PriceUnit = models.FloatField(null=True, blank=True)
    ParkerHydraulicCylindersSquaresSwitches_Total = models.FloatField(null=True, blank=True)
    ParkerHydraulicCylindersSquaresSwitches_Weeks = models.FloatField(null=True, blank=True)

    # Jet Cooling
    JetCooling_Unit = models.FloatField(null=True, blank=True)
    JetCooling_PriceUnit = models.FloatField(null=True, blank=True)
    JetCooling_Total = models.FloatField(null=True, blank=True)
    JetCooling_Weeks = models.FloatField(null=True, blank=True)

    # Squeeze Pin
    SqueezePin_Unit = models.FloatField(null=True, blank=True)
    SqueezePin_PriceUnit = models.FloatField(null=True, blank=True)
    SqueezePin_Total = models.FloatField(null=True, blank=True)
    SqueezePin_Weeks = models.FloatField(null=True, blank=True)

    # Interchangeable Inserts
    InterchangeableInserts_Unit = models.FloatField(null=True, blank=True)
    InterchangeableInserts_PriceUnit = models.FloatField(null=True, blank=True)
    InterchangeableInserts_Total = models.FloatField(null=True, blank=True)
    InterchangeableInserts_Weeks = models.FloatField(null=True, blank=True)

    # Chill Blocks
    ChillBlocks_Unit = models.FloatField(null=True, blank=True)
    ChillBlocks_PriceUnit = models.FloatField(null=True, blank=True)
    ChillBlocks_Total = models.FloatField(null=True, blank=True)
    ChillBlocks_Weeks = models.FloatField(null=True, blank=True)

    # Eyebolts
    Eyebolts_Unit = models.FloatField(null=True, blank=True)
    Eyebolts_PriceUnit = models.FloatField(null=True, blank=True)
    Eyebolts_Total = models.FloatField(null=True, blank=True)
    Eyebolts_Weeks = models.FloatField(null=True, blank=True)

    # Oil Water Connectors
    OilWaterConnectors_Unit = models.FloatField(null=True, blank=True)
    OilWaterConnectors_PriceUnit = models.FloatField(null=True, blank=True)
    OilWaterConnectors_Total = models.FloatField(null=True, blank=True)
    OilWaterConnectors_Weeks = models.FloatField(null=True, blank=True)

    # Lethiguel Distributor
    LethiguelDistributor_Unit = models.FloatField(null=True, blank=True)
    LethiguelDistributor_PriceUnit = models.FloatField(null=True, blank=True)
    LethiguelDistributor_Total = models.FloatField(null=True, blank=True)
    LethiguelDistributor_Weeks = models.FloatField(null=True, blank=True)

    # Others Accessories Cost
    OthersAccesoriesCost_Unit = models.FloatField(null=True, blank=True)
    OthersAccesoriesCost_PriceUnit = models.FloatField(null=True, blank=True)
    OthersAccesoriesCost_Total = models.FloatField(null=True, blank=True)
    OthersAccesoriesCost_Weeks = models.FloatField(null=True, blank=True)

    # Total Accessories Cost
    TotalAccesoriesCost_Unit = models.FloatField(null=True, blank=True)
    TotalAccesoriesCost_PriceUnit = models.FloatField(null=True, blank=True)
    TotalAccesoriesCost_Total = models.FloatField(null=True, blank=True)
    TotalAccesoriesCost_Weeks = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'MOLD_COSTBR_P1_S'

    def __str__(self):
        return f'Mold Cost BR P1 S - RFQ {self.id_rfq}'


   


# ── MOLD_COSTBR_P2_S ─────────────────────────────────────────
class MOLD_COSTBR_P2_S(models.Model):
    id_rfq = models.ForeignKey(RFQ_Base, on_delete=models.CASCADE, related_name='mold_costbr_p2_s_rfq')
    supplier = models.ForeignKey(Suppliers, on_delete=models.PROTECT, related_name='mold_costbr_p2_s_supplier', null=True, blank=True)

    # Die Frame
    DieFrame_Unit = models.FloatField(null=True, blank=True)
    DieFrame_PriceUnit = models.FloatField(null=True, blank=True)
    DieFrame_Total = models.FloatField(null=True, blank=True)
    DieFrame_Weeks = models.FloatField(null=True, blank=True)

    # Cavity
    Cavity_Unit = models.FloatField(null=True, blank=True)
    Cavity_PriceUnit = models.FloatField(null=True, blank=True)
    Cavity_Total = models.FloatField(null=True, blank=True)
    Cavity_Weeks = models.FloatField(null=True, blank=True)

    # Steel Pipes and Tubes
    SteelPipesTubes_Unit = models.FloatField(null=True, blank=True)
    SteelPipesTubes_PriceUnit = models.FloatField(null=True, blank=True)
    SteelPipesTubes_Total = models.FloatField(null=True, blank=True)
    SteelPipesTubes_Weeks = models.FloatField(null=True, blank=True)

    # Others Material Costs
    OthersMaterialCosts_Unit = models.FloatField(null=True, blank=True)
    OthersMaterialCosts_PriceUnit = models.FloatField(null=True, blank=True)
    OthersMaterialCosts_Total = models.FloatField(null=True, blank=True)
    OthersMaterialCosts_Weeks = models.FloatField(null=True, blank=True)

    # Total Material Costs
    TotalMaterialCosts_Unit = models.FloatField(null=True, blank=True)
    TotalMaterialCosts_PriceUnit = models.FloatField(null=True, blank=True)
    TotalMaterialCosts_Total = models.FloatField(null=True, blank=True)
    TotalMaterialCosts_Weeks = models.FloatField(null=True, blank=True)

    # Milling
    Milling_h = models.FloatField(null=True, blank=True)
    Milling_PriceH = models.FloatField(null=True, blank=True)
    Milling_Total = models.FloatField(null=True, blank=True)
    Milling_Weeks = models.FloatField(null=True, blank=True)

    # Turning
    Turning_h = models.FloatField(null=True, blank=True)
    Turning_PriceH = models.FloatField(null=True, blank=True)
    Turning_Total = models.FloatField(null=True, blank=True)
    Turning_Weeks = models.FloatField(null=True, blank=True)

    # Wire Cutting
    WireCutting_h = models.FloatField(null=True, blank=True)
    WireCutting_PriceH = models.FloatField(null=True, blank=True)
    WireCutting_Total = models.FloatField(null=True, blank=True)
    WireCutting_Weeks = models.FloatField(null=True, blank=True)

    # EDM
    EDM_h = models.FloatField(null=True, blank=True)
    EDM_PriceH = models.FloatField(null=True, blank=True)
    EDM_Total = models.FloatField(null=True, blank=True)
    EDM_Weeks = models.FloatField(null=True, blank=True)

    # Grinding
    Grinding_h = models.FloatField(null=True, blank=True)
    Grinding_PriceH = models.FloatField(null=True, blank=True)
    Grinding_Total = models.FloatField(null=True, blank=True)
    Grinding_Weeks = models.FloatField(null=True, blank=True)

    # Drilling
    Drillling_h = models.FloatField(null=True, blank=True)
    Drillling_PriceH = models.FloatField(null=True, blank=True)
    Drillling_Total = models.FloatField(null=True, blank=True)
    Drillling_Weeks = models.FloatField(null=True, blank=True)

    # Others Machining
    OthersMachining_h = models.FloatField(null=True, blank=True)
    OthersMachining_PriceH = models.FloatField(null=True, blank=True)
    OthersMachining_Total = models.FloatField(null=True, blank=True)
    OthersMachining_Weeks = models.FloatField(null=True, blank=True)

    # Total Machining
    TotalMachining_h = models.FloatField(null=True, blank=True)
    TotalMachining_PriceH = models.FloatField(null=True, blank=True)
    TotalMachining_Total = models.FloatField(null=True, blank=True)
    TotalMachining_Weeks = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'MOLD_COSTBR_P2_S'

    def __str__(self):
        return f'Mold Cost BR P2 S - RFQ {self.id_rfq}'



# ── MOLD_COSTBR_P3_S ─────────────────────────────────────────
class MOLD_COSTBR_P3_S(models.Model):
    id_rfq = models.ForeignKey(RFQ_Base, on_delete=models.CASCADE, related_name='mold_costbr_p3_s_rfq')
    supplier = models.ForeignKey(Suppliers, on_delete=models.PROTECT, related_name='mold_costbr_p3_s_supplier', null=True, blank=True)

    # Assembly
    Assembly_h = models.FloatField(null=True, blank=True)
    Assembly_PriceH = models.FloatField(null=True, blank=True)
    Assembly_Total = models.FloatField(null=True, blank=True)
    Assembly_Weeks = models.FloatField(null=True, blank=True)

    # Spotting
    Spotting_h = models.FloatField(null=True, blank=True)
    Spotting_PriceH = models.FloatField(null=True, blank=True)
    Spotting_Total = models.FloatField(null=True, blank=True)
    Spotting_Weeks = models.FloatField(null=True, blank=True)

    # Stripping and Polishing
    StrippingAndPol_h = models.FloatField(null=True, blank=True)
    StrippingAndPol_PriceH = models.FloatField(null=True, blank=True)
    StrippingAndPol_Total = models.FloatField(null=True, blank=True)
    StrippingAndPol_Weeks = models.FloatField(null=True, blank=True)

    # Others Manual Work
    OthersManualWork_h = models.FloatField(null=True, blank=True)
    OthersManualWork_PriceH = models.FloatField(null=True, blank=True)
    OthersManualWork_Total = models.FloatField(null=True, blank=True)
    OthersManualWork_Weeks = models.FloatField(null=True, blank=True)

    # Total Manual Work
    TotalManualWork_h = models.FloatField(null=True, blank=True)
    TotalManualWork_PriceH = models.FloatField(null=True, blank=True)
    TotalManualWork_Total = models.FloatField(null=True, blank=True)
    TotalManualWork_Weeks = models.FloatField(null=True, blank=True)

    # Hardening
    Hardening_h = models.FloatField(null=True, blank=True)
    Hardening_PriceH = models.FloatField(null=True, blank=True)
    Hardening_Total = models.FloatField(null=True, blank=True)
    Hardening_Weeks = models.FloatField(null=True, blank=True)

    # Nitriding
    Nitriding_h = models.FloatField(null=True, blank=True)
    Nitriding_PriceH = models.FloatField(null=True, blank=True)
    Nitriding_Total = models.FloatField(null=True, blank=True)
    Nitriding_Weeks = models.FloatField(null=True, blank=True)

    # Coating
    Coating_h = models.FloatField(null=True, blank=True)
    Coating_PriceH = models.FloatField(null=True, blank=True)
    Coating_Total = models.FloatField(null=True, blank=True)
    Coating_Weeks = models.FloatField(null=True, blank=True)

    # Graining
    Graining_h = models.FloatField(null=True, blank=True)
    Graining_PriceH = models.FloatField(null=True, blank=True)
    Graining_Total = models.FloatField(null=True, blank=True)
    Graining_Weeks = models.FloatField(null=True, blank=True)

    # Others Heat Surface
    OthersHeatSurface_h = models.FloatField(null=True, blank=True)
    OthersHeatSurface_PriceH = models.FloatField(null=True, blank=True)
    OthersHeatSurface_Total = models.FloatField(null=True, blank=True)
    OthersHeatSurface_Weeks = models.FloatField(null=True, blank=True)

    # Total Heat Surface
    TotalHeatSurface_h = models.FloatField(null=True, blank=True)
    TotalHeatSurface_PriceH = models.FloatField(null=True, blank=True)
    TotalHeatSurface_Total = models.FloatField(null=True, blank=True)
    TotalHeatSurface_Weeks = models.FloatField(null=True, blank=True)

    # Design
    Design_h = models.FloatField(null=True, blank=True)
    Design_PriceH = models.FloatField(null=True, blank=True)
    Design_Total = models.FloatField(null=True, blank=True)
    Design_Weeks = models.FloatField(null=True, blank=True)

    # Cam NC Prog
    CamNcProg_h = models.FloatField(null=True, blank=True)
    CamNcProg_PriceH = models.FloatField(null=True, blank=True)
    CamNcProg_Total = models.FloatField(null=True, blank=True)
    CamNcProg_Weeks = models.FloatField(null=True, blank=True)

    # Simulation
    Simulation_h = models.FloatField(null=True, blank=True)
    Simulation_PriceH = models.FloatField(null=True, blank=True)
    Simulation_Total = models.FloatField(null=True, blank=True)
    Simulation_Weeks = models.FloatField(null=True, blank=True)

    # Others Eng and Design
    OthersEngAndDesign_h = models.FloatField(null=True, blank=True)
    OthersEngAndDesign_PriceH = models.FloatField(null=True, blank=True)
    OthersEngAndDesign_Total = models.FloatField(null=True, blank=True)
    OthersEngAndDesign_Weeks = models.FloatField(null=True, blank=True)

    # Total Eng and Design
    TotalEngAndDesign_h = models.FloatField(null=True, blank=True)
    TotalEngAndDesign_PriceH = models.FloatField(null=True, blank=True)
    TotalEngAndDesign_Total = models.FloatField(null=True, blank=True)
    TotalEngAndDesign_Weeks = models.FloatField(null=True, blank=True)

    # Grand Total Manufacturing Cost
    GrandTotalManufacCost_h = models.FloatField(null=True, blank=True)
    GrandTotalManufacCost_PriceH = models.FloatField(null=True, blank=True)
    GrandTotalManufacCost_Total = models.FloatField(null=True, blank=True)
    GrandTotalManufacCost_Weeks = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'MOLD_COSTBR_P3_S'

    def __str__(self):
        return f'Mold Cost BR P3 S - RFQ {self.id_rfq}'


# ── MOLD_COSTBR_P4_S ─────────────────────────────────────────
class MOLD_COSTBR_P4_S(models.Model):
    id_rfq = models.ForeignKey(RFQ_Base, on_delete=models.CASCADE, related_name='mold_costbr_p4_s_rfq')
    supplier = models.ForeignKey(Suppliers, on_delete=models.PROTECT, related_name='mold_costbr_p4_s_supplier', null=True, blank=True)

    # Measure Mold
    MeasureMold_h = models.FloatField(null=True, blank=True)
    MeasureMold_PriceH = models.FloatField(null=True, blank=True)
    MeasureMold_Total = models.FloatField(null=True, blank=True)
    MeasureMold_Weeks = models.FloatField(null=True, blank=True)

    # Dimensional Corrections
    DimensionalCorrect_h = models.FloatField(null=True, blank=True)
    DimensionalCorrect_PriceH = models.FloatField(null=True, blank=True)
    DimensionalCorrect_Total = models.FloatField(null=True, blank=True)
    DimensionalCorrect_Weeks = models.FloatField(null=True, blank=True)

    # Optimizations
    Optimizations_h = models.FloatField(null=True, blank=True)
    Optimizations_PriceH = models.FloatField(null=True, blank=True)
    Optimizations_Total = models.FloatField(null=True, blank=True)
    Optimizations_Weeks = models.FloatField(null=True, blank=True)

    # Others Correct Opt
    OthersCorrectOpt_h = models.FloatField(null=True, blank=True)
    OthersCorrectOpt_PriceH = models.FloatField(null=True, blank=True)
    OthersCorrectOpt_Total = models.FloatField(null=True, blank=True)
    OthersCorrectOpt_Weeks = models.FloatField(null=True, blank=True)

    # Total Correct Opt
    TotalCorrectOpt_h = models.FloatField(null=True, blank=True)
    TotalCorrectOpt_PriceH = models.FloatField(null=True, blank=True)
    TotalCorrectOpt_Total = models.FloatField(null=True, blank=True)
    TotalCorrectOpt_Weeks = models.FloatField(null=True, blank=True)

    # Transport Supp to BTC
    TransportSuppToBTC_Unit = models.FloatField(null=True, blank=True)
    TransportSuppToBTC_PriceUnit = models.FloatField(null=True, blank=True)
    TransportSuppToBTC_Total = models.FloatField(null=True, blank=True)
    TransportSuppToBTC_Weeks = models.FloatField(null=True, blank=True)

    # Transport BTC to Supp
    TransportBTCtoSupp_Unit = models.FloatField(null=True, blank=True)
    TransportBTCtoSupp_PriceUnit = models.FloatField(null=True, blank=True)
    TransportBTCtoSupp_Total = models.FloatField(null=True, blank=True)
    TransportBTCtoSupp_Weeks = models.FloatField(null=True, blank=True)

    # Duty Costs
    DutyCosts_Unit = models.FloatField(null=True, blank=True)
    DutyCosts_PriceUnit = models.FloatField(null=True, blank=True)
    DutyCosts_Total = models.FloatField(null=True, blank=True)
    DutyCosts_Weeks = models.FloatField(null=True, blank=True)

    # Cleaning and Pack
    CleaningPack_Unit = models.FloatField(null=True, blank=True)
    CleaningPack_PriceUnit = models.FloatField(null=True, blank=True)
    CleaningPack_Total = models.FloatField(null=True, blank=True)
    CleaningPack_Weeks = models.FloatField(null=True, blank=True)

    # Others Logistics
    OthersLogistics_Unit = models.FloatField(null=True, blank=True)
    OthersLogistics_PriceUnit = models.FloatField(null=True, blank=True)
    OthersLogistics_Total = models.FloatField(null=True, blank=True)
    OthersLogistics_Weeks = models.FloatField(null=True, blank=True)

    # Total Logistics
    TotalLogistics_Unit = models.FloatField(null=True, blank=True)
    TotalLogistics_PriceUnit = models.FloatField(null=True, blank=True)
    TotalLogistics_Total = models.FloatField(null=True, blank=True)
    TotalLogistics_Weeks = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'MOLD_COSTBR_P4_S'

    def __str__(self):
        return f'Mold Cost BR P4 S - RFQ {self.id_rfq}'




# ── MOLD_COSTBR_P5_S ─────────────────────────────────────────
class MOLD_COSTBR_P5_S(models.Model):
    id_rfq = models.ForeignKey(RFQ_Base, on_delete=models.CASCADE, related_name='mold_costbr_p5_s_rfq')
    supplier = models.ForeignKey(Suppliers, on_delete=models.PROTECT, related_name='mold_costbr_p5_s_supplier', null=True, blank=True)

    #Die improvements
    DieImprovements_Unit = models.FloatField(null=True, blank=True)
    DieImprovements_PriceUnit = models.FloatField(null=True, blank=True)
    DieImprovements_Total = models.FloatField(null=True, blank=True)
    DieImprovements_Weeks = models.FloatField(null=True, blank=True)

    # Others Tool Replace
    OthersToolReplace_Unit = models.FloatField(null=True, blank=True)
    OthersToolReplace_PriceUnit = models.FloatField(null=True, blank=True)
    OthersToolReplace_Total = models.FloatField(null=True, blank=True)
    OthersToolReplace_Weeks = models.FloatField(null=True, blank=True)

    # Total Tool Replace
    TotalToolReplace_Unit = models.FloatField(null=True, blank=True)
    TotalToolReplace_PriceUnit = models.FloatField(null=True, blank=True)
    TotalToolReplace_Total = models.FloatField(null=True, blank=True)
    TotalToolReplace_Weeks = models.FloatField(null=True, blank=True)

    # Tryout Cost
    TryoutCost_Q = models.FloatField(null=True, blank=True)
    TryoutCost_PriceQ = models.FloatField(null=True, blank=True)
    TryoutCost_Total = models.FloatField(null=True, blank=True)
    TryoutCost_Weeks = models.FloatField(null=True, blank=True)

    # Measurement
    Measurement_Q = models.FloatField(null=True, blank=True)
    Measurement_PriceQ = models.FloatField(null=True, blank=True)
    Measurement_Total = models.FloatField(null=True, blank=True)
    Measurement_Weeks = models.FloatField(null=True, blank=True)

    # Others Sampling
    OthersSampling_Q = models.FloatField(null=True, blank=True)
    OthersSampling_PriceQ = models.FloatField(null=True, blank=True)
    OthersSampling_Total = models.FloatField(null=True, blank=True)
    OthersSampling_Weeks = models.FloatField(null=True, blank=True)

    # Total Sampling
    TotalSampling_Q = models.FloatField(null=True, blank=True)
    TotalSampling_PriceQ = models.FloatField(null=True, blank=True)
    TotalSampling_Total = models.FloatField(null=True, blank=True)
    TotalSampling_Weeks = models.FloatField(null=True, blank=True)

    # Interchange Inserts
    InterchangeInserts_Unit = models.FloatField(null=True, blank=True)
    InterchangeInserts_PriceUnit = models.FloatField(null=True, blank=True)
    InterchangeInserts_Total = models.FloatField(null=True, blank=True)
    InterchangeInserts_Weeks = models.FloatField(null=True, blank=True)

    # Core pins
    CorePins_Unit = models.FloatField(null=True, blank=True)
    CorePins_PriceUnit = models.FloatField(null=True, blank=True)
    CorePins_Total = models.FloatField(null=True, blank=True)
    CorePins_Weeks = models.FloatField(null=True, blank=True)

    #Inserts Spare Parts
    InsertsSparePart_Unit = models.FloatField(null=True, blank=True)
    InsertsSparePart_PriceUnit = models.FloatField(null=True, blank=True)
    InsertsSparePart_Total = models.FloatField(null=True, blank=True)
    InsertsSparePart_Weeks = models.FloatField(null=True, blank=True)    

    #Others Spare Parts
    OthersSpareParts_Unit = models.FloatField(null=True, blank=True)
    OthersSpareParts_PriceUnit = models.FloatField(null=True, blank=True)
    OthersSpareParts_Total = models.FloatField(null=True, blank=True)
    OthersSpareParts_Weeks = models.FloatField(null=True, blank=True)

    # Total Spare Parts
    TotalSpareParts_Unit = models.FloatField(null=True, blank=True)
    TotalSpareParts_PriceUnit = models.FloatField(null=True, blank=True)
    TotalSpareParts_Total = models.FloatField(null=True, blank=True)
    TotalSpareParts_Weeks = models.FloatField(null=True, blank=True)


    class Meta:
        db_table = 'MOLD_COSTBR_P5_S'

    def __str__(self):
        return f'Mold Cost BR P5 S - RFQ {self.id_rfq}'