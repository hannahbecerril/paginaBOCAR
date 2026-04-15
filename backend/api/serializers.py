from rest_framework import serializers
from .models import Archivo
from django.contrib.auth.models import User

class ArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Archivo
        fields = '__all__'

        
class UsuarioReadSerializer(serializers.ModelSerializer):
    grupos = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'grupos']

    def get_grupos(self, obj):
        return list(obj.groups.values_list('name', flat=True))