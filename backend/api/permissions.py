from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.groups.filter(name='SuperAdmin').exists()
        )
class IsIndAdmin(BasePermission):
    """
    Permite el acceso solo a los administradores de Industrialización 
    y a los SuperAdmins del sistema.
    """
    def has_permission(self, request, view):
        grupos_permitidos = ['SuperAdmin', 'Industrialization_Admin']
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.groups.filter(name__in=grupos_permitidos).exists()
        )
class IsPurchasesAdmin(BasePermission):
    """
    Permite el acceso SOLO a los Jefes (Administradores) de Compras 
    y a los SuperAdmins del sistema.
    """
    def has_permission(self, request, view):
        grupos_permitidos = ['SuperAdmin', 'Purchases_Admin']
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.groups.filter(name__in=grupos_permitidos).exists()
        )
class IsPurchasesUser(BasePermission):
    """
    Permite el acceso a cualquier usuario del departamento de Compras
    (tanto compradores normales como jefes) y a los SuperAdmins.
    """
    def has_permission(self, request, view):
        grupos_permitidos = ['SuperAdmin', 'Purchases_Admin', 'Purchases']
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.groups.filter(name__in=grupos_permitidos).exists()
        )
class IsIndUser(BasePermission):
    """
    Permite el acceso a cualquier usuario del departamento de Industrialización
    (tanto ingenieros normales como jefes) y a los SuperAdmins.
    """
    def has_permission(self, request, view):
        grupos_permitidos = ['SuperAdmin', 'Industrialization_Admin', 'Industrialization']
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.groups.filter(name__in=grupos_permitidos).exists()
        )

class IsSupplier(BasePermission):
    """
    Permite el acceso ÚNICAMENTE a los usuarios externos (Proveedores).
    Los usuarios internos no deberían poder cotizar ni ver el buzón de proveedores.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.groups.filter(name='Supplier').exists()
        )