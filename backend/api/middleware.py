import jwt
from django.conf import settings
from django.contrib.auth.models import User
from .models import Bitacora

class RegistroBitacoraMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Dejar pasar la petición y obtener la respuesta
        response = self.get_response(request)

        # 2. Solo registrar peticiones a la API (ignorar /admin/ o archivos estáticos)
        if request.path.startswith('/api/'):
            usuario_actual = None
            
            # --- MAGIA PARA LEER EL TOKEN JWT ---
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    # Decodificar el token para sacar el ID del usuario
                    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                    user_id = payload.get('user_id')
                    usuario_actual = User.objects.filter(id=user_id).first()
                except jwt.ExpiredSignatureError:
                    pass
                except jwt.InvalidTokenError:
                    pass
            # ------------------------------------

            # Obtener la IP real (útil para auditorías de seguridad)
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')

            # 3. Guardar el registro en la base de datos
            Bitacora.objects.create(
                usuario=usuario_actual,
                ruta=request.path,
                metodo=request.method,
                direccion_ip=ip,
            )

        return response