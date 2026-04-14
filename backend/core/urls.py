from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import hola, ArchivoViewSet, LoginInternoView, LoginProveedorView # No olvides importar la nueva vista

router = DefaultRouter()
router.register(r'archivos', ArchivoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Aquí agregamos el endpoint de login interno
    path('api/auth/login/interno/', LoginInternoView.as_view(), name='login_interno'),
    path('api/auth/login/proveedor/', LoginProveedorView.as_view(), name='login_proveedor'),
    path('api/', include(router.urls)),
]