from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    hola, ArchivoViewSet, LoginInternoView, LoginProveedorView, 
    ListarUsuariosView, CambiarEstadoUsuarioView, CrearUsuarioView,
    RFQAprobadosListView, ProveedorListView, AssignSuppliersRFQView, 
    CrearRFQView, EditarRFQView, CotizacionProveedorView, BuzonProveedorListView, 
    AprobarRechazarProveedoresView, RFQPendientesAprobacionComprasListView, ReviewRFQIndView, 
    SelectWinningSupplierView, FalloFinalGerencialView, DescargarArchivoSeguroView, ComparativaCotizacionesView, DashboardComprasView, DashboardIndustrializacionView , DashboardProveedorView

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
    path('api/rfq/<int:pk>/fallo-gerencial/', FalloFinalGerencialView.as_view(), name='rfq-fallo-gerencial'),
    path('api/archivos/<int:pk>/descargar/', DescargarArchivoSeguroView.as_view(), name='archivo-descargar'),
    path('rfqs/pendientes-compras/', RFQAprobadosListView.as_view(), name='rfqs-aprobados'),
    path('api/rfqs/pendientes-aprobacion-gerencia/', RFQPendientesAprobacionComprasListView.as_view(), name='rfqs-pendientes-gerencia'),
    path('rfq/crear/', CrearRFQView.as_view(), name='rfq-crear'),
    path('api/dashboard/proveedor/', DashboardProveedorView.as_view(), name='dash-proveedor'),
    path('api/dashboard/compras/', DashboardComprasView.as_view(), name='dash-compras'),
    path('api/dashboard/industrializacion/', DashboardIndustrializacionView.as_view(), name='dash-ind'),
    path('usuarios/proveedores/', ProveedorListView.as_view(), name='proveedores-buscar'),
    path('api/', include(router.urls)),
    path('api/rfq/<int:pk>/aprobar-proveedores/', AprobarRechazarProveedoresView.as_view(), name='rfq-aprobar-proveedores'),
    path('api/rfq/<int:pk>/cotizar/', CotizacionProveedorView.as_view(), name='rfq-cotizar-proveedor'),
    path('api/rfq/<int:pk>/editar/', EditarRFQView.as_view(), name='rfq-editar'),
    path('rfq/<int:pk>/asignar-proveedores/', AssignSuppliersRFQView.as_view(), name='rfq-asignar-proveedores'),
    path('api/rfq/buzon-proveedor/', BuzonProveedorListView.as_view(), name='rfq-buzon-proveedor'),
    path('api/rfq/<int:pk>/revision-ind/', ReviewRFQIndView.as_view(), name='rfq-revision-ind'),
    path('api/rfq/<int:pk>/seleccionar-proveedor/', SelectWinningSupplierView.as_view(), name='rfq-seleccionar-proveedor'),
    path('rfq/<int:pk>/comparativa/', ComparativaCotizacionesView.as_view(), name='rfq-comparativa'),
]
