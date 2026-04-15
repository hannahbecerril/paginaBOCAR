import hmac
import hashlib
import json
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from .models import Archivo
from rest_framework import viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse
from .serializers import ArchivoSerializer
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .serializers import UsuarioReadSerializer
from .permissions import IsSuperAdmin
from django.shortcuts import get_object_or_404


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