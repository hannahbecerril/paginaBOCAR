import hmac
import hashlib
import json

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import User

from rest_framework import generics, filters, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
# Modelos reales de tu BD
from .models import RFQ_Base, Status_RFQ, MOLD_INFO_P1_I, MOLD_INFO_P2_I, DIE_TRIM_I
from .serializers import (
    ArchivoSerializer, UsuarioReadSerializer, UsuarioCreateSerializer,
    RFQBaseSerializer, ProveedorSerializer
)
from .permissions import IsSuperAdmin
from django.shortcuts import get_object_or_404
from rest_framework.generics import CreateAPIView
from .serializers import UsuarioCreateSerializer
from django.contrib.auth import get_user_model
from django.db import transaction
from .models.base import RFQ_Base, RFQ_Assignment, Status_RFQ

User = get_user_model()

class RFQAprobadosListView(generics.ListAPIView):
    serializer_class = RFQBaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # 1. Buscamos los IDs de los RFQ que tengan el nivel correspondiente en True (ej. lev2)
        rfq_aprobados_ids = Status_RFQ.objects.filter(lev2=True).values_list('id_rfq', flat=True)
        
        # 2. Filtramos la tabla base usando esos IDs
        return RFQ_Base.objects.filter(id_rfq__in=rfq_aprobados_ids)

class ProveedorListView(generics.ListAPIView):
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']

    def get_queryset(self):
        # Retorna solo usuarios que pertenezcan al grupo de proveedores y estén activos
        return User.objects.filter(groups__name='Supplier', is_active=True)



class AssignSuppliersRFQView(APIView):
    """
    Endpoint para guardar temporalmente la selección de proveedores para un RFQ
    y enviarla a autorización de gerencia (Superadmin Compras).
    """
    
    @transaction.atomic
    def put(self, request, pk):
        # 1. Obtener el RFQ usando el nombre de modelo correcto (RFQ_Base)
        rfq = get_object_or_404(RFQ_Base, pk=pk)

        # 2. Validar estado inicial exigido por el negocio
        # NOTA: Debes ajustar esta lógica según qué nivel (lev1-lev8) corresponde a 'DRAFT_PUR'
        status_rfq, created = Status_RFQ.objects.get_or_create(id_rfq=rfq.id_rfq)
        
        # Ejemplo: Si DRAFT_PUR es lev4
        if not status_rfq.lev4:
            return Response(
                {"error": "El RFQ no se encuentra en borrador de compras."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Obtener el arreglo de IDs de proveedores enviados desde el Frontend
        proveedores_ids = request.data.get('proveedores_ids', [])
        
        if not isinstance(proveedores_ids, list) or not proveedores_ids:
            return Response(
                {"error": "Debes proporcionar un arreglo válido 'proveedores_ids' con al menos un proveedor."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Como RFQ_Assignment solo soporta hasta 10 proveedores, agregamos esta validación
        if len(proveedores_ids) > 10:
            return Response(
                {"error": "No puedes asignar más de 10 proveedores a un solo RFQ."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Validar que los usuarios existen
        proveedores_validos = User.objects.filter(id__in=proveedores_ids)
        if proveedores_validos.count() != len(proveedores_ids):
            return Response(
                {"error": "Uno o más IDs de proveedores no son válidos o no existen en el sistema."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Actualizar la relación en el modelo correcto (RFQ_Assignment)
        asignacion, _ = RFQ_Assignment.objects.get_or_create(id_rfq=rfq)
        
        # Primero limpiamos los proveedores anteriores en caso de que sea una actualización
        for i in range(1, 11):
            setattr(asignacion, f'supplier{i}', '')
            
        # Asignamos los nuevos proveedores (guardando el ID como string en el CharField)
        for index, proveedor in enumerate(proveedores_validos, start=1):
            setattr(asignacion, f'supplier{index}', str(proveedor.id))
            
        asignacion.save()

        # 6. Administrar la transición de estados
        status_rfq.lev4 = False
        status_rfq.lev5 = True
        status_rfq.save()

        return Response({
            "message": "Proveedores guardados exitosamente. RFQ enviado a autorización de gerencia.",
            "rfq_id": rfq.id_rfq
        }, status=status.HTTP_200_OK)
    
class LoginInternoView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        # Validación 1: Campos vacíos
        if not username or not password:
            return Response(
                {"error": "Se requieren ambos campos: usuario y contraseña."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Autenticación con el ORM de Django
        user = authenticate(username=username, password=password)

        if user is not None:
            # Extraer los nombres de los grupos asignados al usuario en la BD
            grupos_usuario = list(user.groups.values_list('name', flat=True))
            
            # Definir qué grupos son considerados internos
            roles_internos = [
                'SuperAdmin', 
                'Purchases', 
                'Purchases_Admin', 
                'Industrialization', 
                'Industrialization_Admin'
            ]
            
            # Verificar si tiene al menos un rol interno
            es_interno = any(rol in roles_internos for rol in grupos_usuario)

            if not es_interno:
                return Response(
                    {"error": "Acceso denegado. Portal exclusivo para personal interno."}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Verificar que no esté dado de baja
            if not user.is_active:
                return Response(
                    {"error": "Cuenta deshabilitada. Contacte al administrador."}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Generar los tokens JWT
            refresh = RefreshToken.for_user(user)
            
            # Inyectar los grupos en el token para que el Front sepa qué vistas mostrar
            refresh['grupos'] = grupos_usuario

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'usuario': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'grupos': grupos_usuario
                }
            }, status=status.HTTP_200_OK)
        else:
            # Validación 2: Credenciales incorrectas
            return Response(
                {"error": "Usuario o contraseña incorrectos."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
class LoginProveedorView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        # Obtenemos el hash que el FrontEnd (o el proveedor) debe enviar en los Headers
        firma_recibida = request.headers.get('X-Signature')

        # Validación 1: Campos vacíos
        if not username or not password:
            return Response(
                {"error": "Se requieren ambos campos: usuario y contraseña."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not firma_recibida:
            return Response(
                {"error": "Acceso denegado. Falta la firma de seguridad (Hash)."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Validación 2: Verificación del Hash (HMAC)
        # La llave está en settings.py
        secret_key = getattr(settings, 'PROVEEDOR_SECRET_KEY', 'clave_secreta').encode('utf-8')
        
        # Armamos el payload exactamente igual a como lo debe armar quien hace la petición
        # sort_keys=True es vital para que el orden de los campos no altere el hash
        payload = {"username": username, "password": password}
        payload_string = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
        
        # Generamos el hash esperado del lado del servidor
        firma_esperada = hmac.new(secret_key, payload_string, hashlib.sha256).hexdigest()

        # Comparamos la firma recibida con la que nosotros calculamos
        if not hmac.compare_digest(firma_esperada, firma_recibida):
            return Response(
                {"error": "Firma inválida. Los datos fueron alterados o la solicitud es ilegítima."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Validación 3: Autenticación con el ORM de Django (Si el hash es correcto)
        user = authenticate(username=username, password=password)

        if user is not None:
            grupos_usuario = list(user.groups.values_list('name', flat=True))
            
            # Verificar que pertenezca al grupo de Proveedores (Ajusta el nombre según tu BD)
            if 'Supplier' not in grupos_usuario:
                return Response(
                    {"error": "Acceso denegado. Portal exclusivo para proveedores."}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Verificar que no esté dado de baja
            if not user.is_active:
                return Response(
                    {"error": "Cuenta deshabilitada. Contacte al administrador."}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Generar los tokens JWT
            refresh = RefreshToken.for_user(user)
            refresh['grupos'] = grupos_usuario

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'usuario': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'grupos': grupos_usuario
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Usuario o contraseña incorrectos."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

class CambiarEstadoUsuarioView(APIView):
    # Solo usuarios autenticados y SuperAdmins pueden hacer esto
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def put(self, request, pk):
        # Obtener el usuario por su Primary Key (ID) o devolver un error 404
        user = get_object_or_404(User, pk=pk)

        # Obtener el nuevo estado (true o false) desde el cuerpo de la petición (JSON)
        nuevo_estado = request.data.get('is_active')

        # Asegurarse de que enviaron el campo
        if nuevo_estado is None:
            return Response(
                {"error": "Se requiere el campo 'is_active' en el cuerpo de la petición."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Convertir a booleano de forma segura por si llega como string
        if isinstance(nuevo_estado, str):
            nuevo_estado = nuevo_estado.lower() in ['true', '1', 't', 'y', 'yes']
        else:
            nuevo_estado = bool(nuevo_estado)

        # Aplicar la baja lógica (o reactivación)
        user.is_active = nuevo_estado
        user.save()

        # Respuesta informativa
        accion = "reactivado" if nuevo_estado else "dado de baja (suspendido)"

        return Response({
            "mensaje": f"El usuario '{user.username}' ha sido {accion} exitosamente.",
            "usuario": {
                "id": user.id,
                "username": user.username,
                "is_active": user.is_active
            }
        }, status=status.HTTP_200_OK)
        
def hola(request):
    return JsonResponse({"mensaje": "Hola desde Django 🚀"})

class ArchivoViewSet(viewsets.ModelViewSet):
    queryset = Archivo.objects.all()
    serializer_class = ArchivoSerializer

class ListarUsuariosView(ListAPIView):
    queryset = User.objects.all().order_by('id')
    serializer_class = UsuarioReadSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

class CrearUsuarioView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UsuarioCreateSerializer
    # Reutilizamos la misma clase de Custom Permission (IsSuperAdmin) y exigimos autenticación
    permission_classes = [IsAuthenticated, IsSuperAdmin]


class CrearRFQView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        data = request.data
        is_draft = data.get('is_draft', True)
        rfq_type = data.get('type') 
        
        if not is_draft:
            if not data.get('tool') or not rfq_type:
                return Response(
                    {"error": "Los campos 'tool' y 'type' son obligatorios para el envío definitivo."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            rfq_base = RFQ_Base.objects.create(
                created_by=request.user.username,
                tool=data.get('tool', ''),
                type=rfq_type
            )

            Status_RFQ.objects.create(
                id_rfq=rfq_base.id_rfq,
                lev1=True, 
                lev2=not is_draft
            )

            if rfq_type == 'mold':
                mold_p1_data = data.get('mold_info_p1', {})
                if mold_p1_data:
                    MOLD_INFO_P1_I.objects.create(id_rfq=rfq_base, **mold_p1_data)

                mold_p2_data = data.get('mold_info_p2', {})
                if mold_p2_data:
                    MOLD_INFO_P2_I.objects.create(id_rfq=rfq_base, **mold_p2_data)

            elif rfq_type == 'die':
                die_trim_data = data.get('die_trim', {})
                if die_trim_data:
                    DIE_TRIM_I.objects.create(id_rfq=rfq_base, **die_trim_data)
            else:
                raise ValueError("El tipo de RFQ es inválido. Debe ser 'mold' o 'die'.")

            estado_msg = "DRAFT_IND" if is_draft else "PENDING_IND_APPROVAL"
            
            return Response({
                "mensaje": f"RFQ {rfq_base.id_rfq} guardado exitosamente como {estado_msg}.",
                "id_rfq": rfq_base.id_rfq
            }, status=status.HTTP_201_CREATED)

        except TypeError as e:
            return Response({"error": f"Error de estructura en los datos: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)