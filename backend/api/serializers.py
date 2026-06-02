from rest_framework import serializers
from django.contrib.auth.models import User, Group
from .models import Archivo, RFQ_Base
from .models.notificacion import Notificacion


class ArchivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Archivo
        fields = '__all__'


class UsuarioReadSerializer(serializers.ModelSerializer):
    grupos     = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email',
                  'is_active', 'grupos', 'department', 'last_login']

    def get_grupos(self, obj):
        return list(obj.groups.values_list('name', flat=True))

    def get_department(self, obj):
        return obj.groups.first().name if obj.groups.exists() else None


class UsuarioCreateSerializer(serializers.ModelSerializer):
    rol = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'rol']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        rol_nombre = validated_data.pop('rol')
        try:
            grupo = Group.objects.get(name=rol_nombre)
        except Group.DoesNotExist:
            raise serializers.ValidationError({"rol": f"El rol/grupo '{rol_nombre}' no existe."})

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        user.groups.add(grupo)
        return user


class RFQBaseSerializer(serializers.ModelSerializer):
    # `title` mirrors `tool` so the frontend can use either field name
    title = serializers.CharField(source='tool', read_only=True)

    class Meta:
        model = RFQ_Base
        fields = [
            'id_rfq', 'title', 'tool', 'type', 'category', 'priority',
            'status', 'submitted_for_review', 'created_by', 'modified_date',
            'response_deadline', 'shipping_terms', 'quality_requirements',
        ]


class ProveedorSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email',
                  'is_active', 'status', 'last_login']

    def get_status(self, obj):
        return 'active' if obj.is_active else 'inactive'


class NotificacionSerializer(serializers.ModelSerializer):
    # English field names matching the FRONTEND_API_CONTRACT
    title      = serializers.CharField(source='titulo', read_only=True)
    message    = serializers.CharField(source='mensaje', read_only=True)
    read       = serializers.BooleanField(source='leida', read_only=True)
    date       = serializers.DateTimeField(source='fecha', read_only=True)
    type       = serializers.CharField(source='tipo', read_only=True)
    categoryId = serializers.CharField(source='category_id', read_only=True)
    rfqId      = serializers.SerializerMethodField()

    class Meta:
        model = Notificacion
        fields = ['id', 'title', 'message', 'type', 'categoryId', 'rfqId', 'read', 'date']

    def get_rfqId(self, obj):
        return obj.rfq.id_rfq if obj.rfq else None
