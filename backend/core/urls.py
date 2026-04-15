from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import hola, ArchivoViewSet, LoginInternoView, LoginProveedorView, ListarUsuariosView, CambiarEstadoUsuarioView

router = DefaultRouter()
router.register(r'archivos', ArchivoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Aquí agregamos el endpoint de login interno
    path('api/auth/login/interno/', LoginInternoView.as_view(), name='login_interno'),
    path('api/auth/login/proveedor/', LoginProveedorView.as_view(), name='login_proveedor'),
    path('api/usuarios/listar/', ListarUsuariosView.as_view(), name='listar_usuarios'),
    path('api/usuarios/<int:pk>/estado/', CambiarEstadoUsuarioView.as_view(), name='cambiar_estado_usuario'),
    path('api/', include(router.urls)),
]