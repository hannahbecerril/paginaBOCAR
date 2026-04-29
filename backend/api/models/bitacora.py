from django.db import models
from django.contrib.auth.models import User

class Bitacora(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ruta = models.CharField(max_length=255)
    metodo = models.CharField(max_length=10)
    direccion_ip = models.GenericIPAddressField(null=True, blank=True)
    fecha_hora = models.DateTimeField(auto_now_add=True)
    payload = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'Bitacora'

    def __str__(self):
        nombre = self.usuario.username if self.usuario else "Anónimo"
        return f"{self.fecha_hora} - {nombre} - {self.metodo} {self.ruta}"