from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Importaciones agrupadas y limpias
from api.views import (
    hola, ArchivoViewSet, LoginInternoView, LoginProveedorView, 
    ListarUsuariosView, CambiarEstadoUsuarioView, CrearUsuarioView,
    RFQAprobadosListView, ProveedorListView, AssignSuppliersRFQView
)

router = DefaultRouter()
router.register(r'archivos', ArchivoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/interno/', LoginInternoView.as_view(), name='login_interno'),
    path('api/auth/login/proveedor/', LoginProveedorView.as_view(), name='login_proveedor'),
    path('api/usuarios/listar/', ListarUsuariosView.as_view(), name='listar_usuarios'),
    path('api/usuarios/<int:pk>/estado/', CambiarEstadoUsuarioView.as_view(), name='cambiar_estado_usuario'),
    path('api/usuarios/crear/', CrearUsuarioView.as_view(), name='crear_usuario'),
    
    # Rutas nuevas corregidas con el prefijo /api/
    path('api/rfqs/pendientes-compras/', RFQAprobadosListView.as_view(), name='rfqs-aprobados'),
    path('api/usuarios/proveedores/', ProveedorListView.as_view(), name='proveedores-buscar'),
    path('api/rfq/<int:pk>/asignar-proveedores/', AssignSuppliersRFQView.as_view(), name='rfq-asignar-proveedores'),
    
    path('api/', include(router.urls)),
]