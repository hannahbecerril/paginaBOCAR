from django.db import models
from django.contrib.auth.models import User


class Notificacion(models.Model):
    TIPO_CHOICES = [
        ('info',    'Info'),
        ('warning', 'Warning'),
        ('success', 'Success'),
        ('error',   'Error'),
    ]

    usuario     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificaciones')
    titulo      = models.CharField(max_length=255)
    mensaje     = models.TextField(blank=True)
    tipo        = models.CharField(max_length=20, choices=TIPO_CHOICES, default='info')
    category_id = models.CharField(max_length=100, blank=True)
    rfq         = models.ForeignKey(
        'RFQ_Base', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='notificaciones',
    )
    leida = models.BooleanField(default=False)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Notificacion'
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.usuario.username} — {self.titulo}"
