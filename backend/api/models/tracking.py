from django.db import models
from .base import RFQ_Base, Suppliers
from django.contrib.auth.models import User, Group



class RFQ_Tracking(models.Model):
    id_rfq = models.ForeignKey(RFQ_Base, on_delete=models.CASCADE, related_name='tracking')
    nivel_alcanzado = models.CharField(max_length=10) # Ejemplo: 'lev4', 'lev6', 'lev9'
    usuario_responsable = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'RFQ_Tracking'

    def __str__(self):
        return f"RFQ {self.id_rfq_id} -> {self.nivel_alcanzado} en {self.fecha_hora}"