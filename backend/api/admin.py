from django.contrib import admin

# Register your models here.

from .models import RFQ_Base, Status_RFQ

# Registramos los modelos simples
admin.site.register(RFQ_Base)
admin.site.register(Status_RFQ)