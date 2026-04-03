
from rest_framework import viewsets
from .models import Archivo
from .serializers import ArchivoSerializer

from django.http import JsonResponse

def hola(request):
    return JsonResponse({"mensaje": "Hola desde Django 🚀"})

class ArchivoViewSet(viewsets.ModelViewSet):
    queryset = Archivo.objects.all()
    serializer_class = ArchivoSerializer