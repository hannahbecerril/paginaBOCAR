from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from api.views import (
    hola, ArchivoViewSet,
    # Auth
    LoginInternoView, LoginProveedorView,
    # Users
    ListarUsuariosView, CambiarEstadoUsuarioView, CrearUsuarioView,
    UsuarioDetailView, ResetPasswordView,
    # Suppliers
    ProveedorListView, ProveedorListCreateView, ProveedorDetailView,
    # RFQ
    RFQDetailView, RFQProgresoView, RFQClasificadoListView,
    CrearRFQView, EditarRFQView, ReviewRFQIndView,
    GuardarEspecificacionesView, GuardarMetadataComprasView,
    AssignSuppliersRFQView, RFQPendientesAprobacionComprasListView,
    AprobarRechazarProveedoresView, ComparativaCotizacionesView,
    SelectWinningSupplierView, FalloFinalGerencialView,
    BuzonProveedorListView, CotizacionProveedorView,
    # Archivos
    DescargarArchivoSeguroView, RFQDocumentListView, RFQDocumentDownloadView,
    # Dashboards
    DashboardIndustrializacionView, DashboardComprasView, DashboardProveedorView,
    # Notificaciones
    NotificacionListView, NotificacionDetailView, NotificacionBulkView,
    # IA (Nuevo)
    IASugerenciasProveedoresView,
)

router = DefaultRouter()
router.register(r'archivos', ArchivoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Auth ──────────────────────────────────────────────────────────────
    path('api/auth/login/interno/',       LoginInternoView.as_view(),   name='login_interno'),
    path('api/auth/login/proveedor/',     LoginProveedorView.as_view(), name='login_proveedor'),
    path('api/auth/token/refresh/',       TokenRefreshView.as_view(),   name='token_refresh'),

    # ── Users ─────────────────────────────────────────────────────────────
    path('api/usuarios/listar/',          ListarUsuariosView.as_view(),    name='listar_usuarios'),
    path('api/usuarios/crear/',           CrearUsuarioView.as_view(),      name='crear_usuario'),
    path('api/usuarios/<int:pk>/',        UsuarioDetailView.as_view(),     name='usuario-detail'),
    path('api/usuarios/<int:pk>/estado/', CambiarEstadoUsuarioView.as_view(), name='cambiar_estado_usuario'),
    path('api/usuarios/<int:pk>/reset-password/', ResetPasswordView.as_view(), name='usuario-reset-password'),

    # ── Suppliers (old search endpoint + new full CRUD aliases) ───────────
    path('api/usuarios/proveedores/',     ProveedorListView.as_view(),     name='proveedores-buscar'),
    path('api/proveedores/',              ProveedorListCreateView.as_view(), name='proveedor-list'),
    path('api/proveedores/<int:pk>/',     ProveedorDetailView.as_view(),   name='proveedor-detail'),

    # ── Files ─────────────────────────────────────────────────────────────
    path('api/', include(router.urls)),
    path('api/archivos/<int:pk>/descargar/', DescargarArchivoSeguroView.as_view(), name='archivo-descargar'),

    # ── RFQ — Core ────────────────────────────────────────────────────────
    path('api/rfqs/lista/',               RFQClasificadoListView.as_view(),   name='rfqs-clasificados'),
    path('api/rfqs/<int:pk>/',            RFQDetailView.as_view(),             name='rfq-detail'),
    path('api/rfqs/<int:pk>/progreso/',   RFQProgresoView.as_view(),           name='rfq-progreso'),

    # ── RFQ — Documents (RFQ-scoped) ──────────────────────────────────────
    path('api/rfqs/<int:pk>/documentos/', RFQDocumentListView.as_view(),        name='rfq-documentos'),
    path('api/rfqs/<int:pk>/documentos/<int:doc_pk>/download/', RFQDocumentDownloadView.as_view(), name='rfq-documento-download'),

    # ── RFQ — Spec + Metadata save (no status side-effects) ──────────────
    path('api/rfqs/<int:pk>/especificaciones/',  GuardarEspecificacionesView.as_view(),  name='rfq-especificaciones'),
    path('api/rfqs/<int:pk>/compras-metadata/',  GuardarMetadataComprasView.as_view(),   name='rfq-compras-metadata'),

    # ── RFQ — Industrialization (singular + plural aliases) ──────────────
    path('api/rfq/crear/',                CrearRFQView.as_view(),              name='rfq-crear'),
    path('api/rfqs/crear/',               CrearRFQView.as_view(),              name='rfqs-crear-alias'),
    path('api/rfq/<int:pk>/editar/',      EditarRFQView.as_view(),             name='rfq-editar'),
    path('api/rfqs/<int:pk>/editar/',     EditarRFQView.as_view(),             name='rfqs-editar-alias'),
    path('api/rfq/<int:pk>/revision-ind/',  ReviewRFQIndView.as_view(),        name='rfq-revision-ind'),
    path('api/rfqs/<int:pk>/revision-ind/', ReviewRFQIndView.as_view(),        name='rfqs-revision-ind-alias'),

    # ── RFQ — Purchases (singular + plural aliases) ───────────────────────
    path('api/rfqs/pendientes-aprobacion-gerencia/', RFQPendientesAprobacionComprasListView.as_view(), name='rfqs-pendientes-gerencia'),
    path('api/rfq/<int:pk>/asignar-proveedores/',    AssignSuppliersRFQView.as_view(),           name='rfq-asignar-proveedores'),
    path('api/rfqs/<int:pk>/asignar-proveedores/',   AssignSuppliersRFQView.as_view(),           name='rfqs-asignar-alias'),
    path('api/rfq/<int:pk>/aprobar-proveedores/',    AprobarRechazarProveedoresView.as_view(),   name='rfq-aprobar-proveedores'),
    path('api/rfqs/<int:pk>/aprobar-proveedores/',   AprobarRechazarProveedoresView.as_view(),   name='rfqs-aprobar-alias'),
    path('api/rfq/<int:pk>/comparativa/',            ComparativaCotizacionesView.as_view(),      name='rfq-comparativa'),
    path('api/rfqs/<int:pk>/comparativa/',           ComparativaCotizacionesView.as_view(),      name='rfqs-comparativa-alias'),
    path('api/rfq/<int:pk>/seleccionar-proveedor/',  SelectWinningSupplierView.as_view(),        name='rfq-seleccionar-proveedor'),
    path('api/rfqs/<int:pk>/seleccionar-proveedor/', SelectWinningSupplierView.as_view(),        name='rfqs-seleccionar-alias'),
    path('api/rfq/<int:pk>/fallo-gerencial/',        FalloFinalGerencialView.as_view(),          name='rfq-fallo-gerencial'),
    path('api/rfqs/<int:pk>/fallo-gerencial/',       FalloFinalGerencialView.as_view(),          name='rfqs-fallo-alias'),

    # ── RFQ — Supplier Portal ─────────────────────────────────────────────
    path('api/rfq/buzon-proveedor/',       BuzonProveedorListView.as_view(),   name='rfq-buzon-proveedor'),
    path('api/rfq/<int:pk>/cotizar/',      CotizacionProveedorView.as_view(),  name='rfq-cotizar-proveedor'),
    path('api/rfqs/<int:pk>/cotizar/',     CotizacionProveedorView.as_view(),  name='rfqs-cotizar-alias'),

    # ── Dashboards ────────────────────────────────────────────────────────
    path('api/dashboard/industrializacion/', DashboardIndustrializacionView.as_view(), name='dash-ind'),
    path('api/dashboard/compras/',           DashboardComprasView.as_view(),           name='dash-compras'),
    path('api/dashboard/proveedor/',         DashboardProveedorView.as_view(),         name='dash-proveedor'),

    # ── Notifications ─────────────────────────────────────────────────────
    path('api/notificaciones/',          NotificacionListView.as_view(),    name='notificaciones-list'),
    path('api/notificaciones/bulk/',     NotificacionBulkView.as_view(),    name='notificaciones-bulk'),
    path('api/notificaciones/<int:pk>/', NotificacionDetailView.as_view(),  name='notificacion-detail'),
]