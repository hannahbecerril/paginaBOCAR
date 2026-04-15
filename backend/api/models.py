# Create your models here.
from django.db import models
from django.contrib.auth.models import User

class Archivo(models.Model):
    nombre = models.CharField(max_length=100)
    archivo = models.FileField(upload_to='uploads/')
    fecha_subida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

class Bitacora(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ruta = models.CharField(max_length=255)
    metodo = models.CharField(max_length=10) # GET, POST, PUT, etc.
    direccion_ip = models.GenericIPAddressField(null=True, blank=True)
    fecha_hora = models.DateTimeField(auto_now_add=True)
    
    # Opcional: Para guardar un resumen de qué se intentó enviar (cuidado con passwords)
    payload = models.TextField(null=True, blank=True)

    def __str__(self):
        nombre = self.usuario.username if self.usuario else "Anónimo"
        return f"{self.fecha_hora} - {nombre} - {self.metodo} {self.ruta}"