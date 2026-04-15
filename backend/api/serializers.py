from rest_framework import serializers
from .models import Archivo
from django.contrib.auth.models import User
from django.contrib.auth.models import Group

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
    
class UsuarioCreateSerializer(serializers.ModelSerializer):
    # Declaramos el campo 'rol' como write_only porque no pertenece directamente al modelo User
    rol = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'rol']
        extra_kwargs = {
            'password': {'write_only': True} # Evita que la contraseña se devuelva en la respuesta
        }

    def create(self, validated_data):
        # Separamos el rol del resto de datos
        rol_nombre = validated_data.pop('rol')
        
        # Verificamos que el grupo exista antes de crear al usuario
        try:
            grupo = Group.objects.get(name=rol_nombre)
        except Group.DoesNotExist:
            raise serializers.ValidationError({"rol": f"El rol/grupo '{rol_nombre}' no existe en el sistema."})

        # 1. Hashing y Creación: Usamos create_user para que aplique PBKDF2 automáticamente
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        
        # 2. Asignación Relacional de Grupo
        user.groups.add(grupo)
        
        return user