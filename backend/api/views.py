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
            if 'Proveedor' not in grupos_usuario:
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
        
def hola(request):
    return JsonResponse({"mensaje": "Hola desde Django 🚀"})

class ArchivoViewSet(viewsets.ModelViewSet):
    queryset = Archivo.objects.all()
    serializer_class = ArchivoSerializer