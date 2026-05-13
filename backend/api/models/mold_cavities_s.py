from django.db import models
from .base import RFQ_Base, Suppliers


# ── MOLD_CAVITIES_P1_S ───────────────────────────────────────
class MOLD_CAVITIES_P1_S(models.Model):

    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='mold_cavities_p1_s_rfq'
    )
    supplier = models.ForeignKey(
        Suppliers, on_delete=models.PROTECT, related_name='mold_cavities_p1_s_supplier'
    )

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

    #Interchangeable Inserts
    InterchangeableInserts_Unit = models.FloatField(null=True, blank=True)
    InterchangeableInserts_PriceUnit = models.FloatField(null=True, blank=True)
    InterchangeableInserts_Total = models.FloatField(null=True, blank=True)
    InterchangeableInserts_Weeks = models.FloatField(null=True, blank=True)

    # Inserts Spare Parts
    InsertsSpareParts_Unit = models.FloatField(null=True, blank=True)
    InsertsSpareParts_PriceUnit = models.FloatField(null=True, blank=True)
    InsertsSpareParts_Total = models.FloatField(null=True, blank=True)
    InsertsSpareParts_Weeks = models.FloatField(null=True, blank=True)

    # Chill Blocks
    ChillBlocks_Unit = models.FloatField(null=True, blank=True)
    ChillBlocks_PriceUnit = models.FloatField(null=True, blank=True)
    ChillBlocks_Total = models.FloatField(null=True, blank=True)
    ChillBlocks_Weeks = models.FloatField(null=True, blank=True)

    # Others Accessories
    OthersAccesories_Unit = models.FloatField(null=True, blank=True)
    OthersAccesories_PriceUnit = models.FloatField(null=True, blank=True)
    OthersAccesories_Total = models.FloatField(null=True, blank=True)
    OthersAccesories_Weeks = models.FloatField(null=True, blank=True)

    # Total Accessories
    TotalAccesories_Unit = models.FloatField(null=True, blank=True)
    TotalAccesories_PriceUnit = models.FloatField(null=True, blank=True)
    TotalAccesories_Total = models.FloatField(null=True, blank=True)
    TotalAccesories_Weeks = models.FloatField(null=True, blank=True)

    #Raw Materials
    RawMaterials_Unit = models.FloatField(null=True, blank=True)
    RawMaterials_PriceUnit = models.FloatField(null=True, blank=True)
    RawMaterials_Total = models.FloatField(null=True, blank=True)
    RawMaterials_Weeks = models.FloatField(null=True, blank=True)

    # Others Material Costs
    OthersMaterialCosts_Unit = models.FloatField(null=True, blank=True)
    OthersMaterialCosts_PriceUnit = models.FloatField(null=True, blank=True)
    OthersMaterialCosts_Total = models.FloatField(null=True, blank=True)
    OthersMaterialCosts_Weeks = models.FloatField(null=True, blank=True)

    # Total Material Cost
    TotalMaterialCost_Unit = models.FloatField(null=True, blank=True)
    TotalMaterialCost_PriceUnit = models.FloatField(null=True, blank=True)
    TotalMaterialCost_Total = models.FloatField(null=True, blank=True)
    TotalMaterialCost_Weeks = models.FloatField(null=True, blank=True)

    # Milling
    Milling_H = models.FloatField(null=True, blank=True)
    Milling_PriceH = models.FloatField(null=True, blank=True)
    Milling_Total = models.FloatField(null=True, blank=True)
    Milling_Weeks = models.FloatField(null=True, blank=True)

    # Turning
    Turning_H = models.FloatField(null=True, blank=True)
    Turning_PriceH = models.FloatField(null=True, blank=True)
    Turning_Total = models.FloatField(null=True, blank=True)
    Turning_Weeks = models.FloatField(null=True, blank=True)

    # Wire Cutting
    WireCutting_H = models.FloatField(null=True, blank=True)
    WireCutting_PriceH = models.FloatField(null=True, blank=True)
    WireCutting_Total = models.FloatField(null=True, blank=True)
    WireCutting_Weeks = models.FloatField(null=True, blank=True)

    # EDM
    EDM_H = models.FloatField(null=True, blank=True)
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
        db_table = 'MOLD_CAVITIES_P1_S'

    def __str__(self):
        return f'Mold Cavities P1 S - RFQ {self.id_rfq}'



# ── MOLD_CAVITIES_P2_S ───────────────────────────────────────
class MOLD_CAVITIES_P2_S(models.Model):
 
    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='mold_cavities_p2_s_rfq'
    )
    supplier = models.ForeignKey(
        Suppliers, on_delete=models.PROTECT, related_name='mold_cavities_p2_s_supplier'
    )

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

    #Others Manual Work
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

    # Total Manufacturing Costs
    TotalManufacturingCosts_Total = models.FloatField(null=True, blank=True)
    TotalManufacturingCosts_Weeks = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'MOLD_CAVITIES_P2_S'

    def __str__(self):
        return f'Mold Cavities P2 S - RFQ {self.id_rfq}'





# ── MOLD_CAVITIES_P3_S ───────────────────────────────────────
class MOLD_CAVITIES_P3_S(models.Model):

    id_rfq = models.ForeignKey(
        RFQ_Base, on_delete=models.CASCADE, related_name='mold_cavities_p3_s_rfq'
    )
    supplier = models.ForeignKey(
        Suppliers, on_delete=models.PROTECT, related_name='mold_cavities_p3_s_supplier'
    )

    # Measure Cavities
    MeasureCavities_H = models.FloatField(null=True, blank=True)
    MeasureCavities_PriceH = models.FloatField(null=True, blank=True)
    MeasureCavities_Total = models.FloatField(null=True, blank=True)
    MeasureCavities_Weeks = models.FloatField(null=True, blank=True)

    # Others Correct Opt
    OthersCorrectOpt_H = models.FloatField(null=True, blank=True)
    OthersCorrectOpt_PriceH = models.FloatField(null=True, blank=True)
    OthersCorrectOpt_Total = models.FloatField(null=True, blank=True)
    OthersCorrectOpt_Weeks = models.FloatField(null=True, blank=True)

    # Total Correct Opt
    TotalCorrectOpt_H = models.FloatField(null=True, blank=True)
    TotalCorrectOpt_PriceH = models.FloatField(null=True, blank=True)
    TotalCorrectOpt_Total = models.FloatField(null=True, blank=True)
    TotalCorrectOpt_Weeks = models.FloatField(null=True, blank=True)

    #Cleaning And Packing
    CleaningAndPack_Unit = models.FloatField(null=True, blank=True)
    CleaningAndPack_PriceUnit = models.FloatField(null=True, blank=True)
    CleaningAndPack_Total = models.FloatField(null=True, blank=True)
    CleaningAndPack_Weeks = models.FloatField(null=True, blank=True)
    
    #Others Costs
    OthersCosts_Unit = models.FloatField(null=True, blank=True)
    OthersCosts_PriceUnit = models.FloatField(null=True, blank=True)
    OthersCosts_Total = models.FloatField(null=True, blank=True)
    OthersCosts_Weeks = models.FloatField(null=True, blank=True)

    #Total logistics  
    TotalLogistics_Unit = models.FloatField(null=True, blank=True)
    TotalLogistics_PriceUnit = models.FloatField(null=True, blank=True)
    TotalLogistics_Total = models.FloatField(null=True, blank=True)
    TotalLogistics_Weeks = models.FloatField(null=True, blank=True)

    #Interchange Inserts
    InterchangeInserts_Unit = models.FloatField(null=True, blank=True)
    InterchangeInserts_PriceUnit = models.FloatField(null=True, blank=True)
    InterchangeInserts_Total = models.FloatField(null=True, blank=True)
    InterchangeInserts_Weeks = models.FloatField(null=True, blank=True)

    # Core Pins
    CorePins_Unit = models.FloatField(null=True, blank=True)
    CorePins_PriceUnit = models.FloatField(null=True, blank=True)
    CorePins_Total = models.FloatField(null=True, blank=True)
    CorePins_Weeks = models.FloatField(null=True, blank=True)

    # Others Spare Parts
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
        db_table = 'MOLD_CAVITIES_P3_S'

    def __str__(self):
        return f'Mold Cavities P3 S - RFQ {self.id_rfq}'