from django.db import models


class Archivo(models.Model):
    nombre = models.CharField(max_length=100)
    archivo = models.FileField(upload_to='uploads/')
    fecha_subida = models.DateTimeField(auto_now_add=True)
    file_type = models.CharField(max_length=20, blank=True)  # 'pdf', 'presentation', '3d'
    is3d = models.BooleanField(default=False)
    # Nullable FK allows existing free-floating files to remain valid
    id_rfq = models.ForeignKey(
        'RFQ_Base', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='archivos',
    )

    class Meta:
        db_table = 'Archivo'

    def __str__(self):
        return self.nombre
