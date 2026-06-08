import hmac
import hashlib
import json
import os
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import Q, Count
from django.db.models.functions import TruncMonth, TruncDay, TruncWeek
from django.http import JsonResponse, FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import User
from django.utils import timezone

from rest_framework import filters, status, viewsets, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework_simplejwt.tokens import RefreshToken

from .constants import STATUS
from .permissions import IsSuperAdmin, IsIndAdmin, IsIndUser, IsPurchasesAdmin, IsPurchasesUser, IsSupplier, IsInternalUser
from .serializers import (
    ArchivoSerializer, UsuarioReadSerializer, UsuarioCreateSerializer,
    RFQBaseSerializer, ProveedorSerializer, NotificacionSerializer,
)
from .models.base import RFQ_Assignment
from .models import (
    RFQ_Base,
    MOLD_INFO_P1_I, MOLD_INFO_P2_I, DIE_TRIM_I,
    MOLD_COSTBR_I, DIE_COSTBR_I,
    MOLD_COSTBR_P1_S, MOLD_COSTBR_P2_S, MOLD_COSTBR_P3_S,
    MOLD_COSTBR_P4_S, MOLD_COSTBR_P5_S, Archivo,
    MOLD_CAVITIES_P1_S, MOLD_CAVITIES_P2_S, MOLD_CAVITIES_P3_S,
    MOLD_INFO_P1_S, MOLD_INFO_P2_S, DIE_TRIM_S,
    DIE_COSTBR_P1_S, DIE_COSTBR_P2_S, DIE_COSTBR_P3_S, DIE_COSTBR_P4_S,
    RFQ_Tracking,
)
from .models.notificacion import Notificacion

User = get_user_model()


# ── Helper ────────────────────────────────────────────────────────────────────

def registrar_tracking_rfq(rfq_base, nivel, usuario=None):
    RFQ_Tracking.objects.create(
        id_rfq=rfq_base,
        nivel_alcanzado=nivel,
        usuario_responsable=usuario,
    )


def hola(request):
    return JsonResponse({"mensaje": "Hola desde Django"})


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginInternoView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"error": "Se requieren ambos campos: usuario y contrasena."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"error": "Usuario o contrasena incorrectos."}, status=status.HTTP_401_UNAUTHORIZED)

        grupos_usuario = list(user.groups.values_list('name', flat=True))
        roles_internos = ['SuperAdmin', 'Purchases', 'Purchases_Admin', 'Industrialization', 'Industrialization_Admin']

        if not any(rol in roles_internos for rol in grupos_usuario):
            return Response({"error": "Acceso denegado. Portal exclusivo para personal interno."}, status=status.HTTP_403_FORBIDDEN)

        if not user.is_active:
            return Response({"error": "Cuenta deshabilitada. Contacte al administrador."}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        refresh['grupos'] = grupos_usuario

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'usuario': {'id': user.id, 'username': user.username, 'email': user.email, 'grupos': grupos_usuario},
        })


class LoginProveedorView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        firma_recibida = request.headers.get('X-Signature')

        if not username or not password:
            return Response({"error": "Se requieren ambos campos: usuario y contrasena."}, status=status.HTTP_400_BAD_REQUEST)

        if not firma_recibida:
            return Response({"error": "Acceso denegado. Falta la firma de seguridad (Hash)."}, status=status.HTTP_403_FORBIDDEN)

        secret_key = getattr(settings, 'PROVEEDOR_SECRET_KEY', 'clave_secreta').encode('utf-8')
        payload_string = json.dumps({"password": password, "username": username}, sort_keys=True, separators=(',', ':')).encode('utf-8')
        firma_esperada = hmac.new(secret_key, payload_string, hashlib.sha256).hexdigest()

        if not hmac.compare_digest(firma_esperada, firma_recibida):
            return Response({"error": "Firma invalida. Los datos fueron alterados o la solicitud es ilegitima."}, status=status.HTTP_403_FORBIDDEN)

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"error": "Usuario o contrasena incorrectos."}, status=status.HTTP_401_UNAUTHORIZED)

        grupos_usuario = list(user.groups.values_list('name', flat=True))
        if 'Supplier' not in grupos_usuario:
            return Response({"error": "Acceso denegado. Portal exclusivo para proveedores."}, status=status.HTTP_403_FORBIDDEN)

        if not user.is_active:
            return Response({"error": "Cuenta deshabilitada. Contacte al administrador."}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        refresh['grupos'] = grupos_usuario

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'usuario': {'id': user.id, 'username': user.username, 'email': user.email, 'grupos': grupos_usuario},
        })


# ── User Management ───────────────────────────────────────────────────────────

class ListarUsuariosView(ListAPIView):
    """Any internal staff can list internal users (excludes Supplier group)."""
    serializer_class = UsuarioReadSerializer
    permission_classes = [IsAuthenticated, IsInternalUser]

    def get_queryset(self):
        return User.objects.exclude(groups__name='Supplier').order_by('id')


class CrearUsuarioView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UsuarioCreateSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]


class UsuarioDetailView(APIView):
    """GET (any internal staff) / PATCH / DELETE (SuperAdmin only) a single internal user."""
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsInternalUser()]
        return [IsAuthenticated(), IsSuperAdmin()]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        return Response(UsuarioReadSerializer(user).data)

    def patch(self, request, pk):
        from django.contrib.auth.models import Group
        user = get_object_or_404(User, pk=pk)

        for field in ('email', 'first_name', 'last_name'):
            if field in request.data:
                setattr(user, field, request.data[field])

        if 'rol' in request.data:
            grupo = get_object_or_404(Group, name=request.data['rol'])
            user.groups.clear()
            user.groups.add(grupo)

        if 'is_active' in request.data:
            val = request.data['is_active']
            user.is_active = val if isinstance(val, bool) else str(val).lower() in ('true', '1')

        if 'password' in request.data and request.data['password']:
            user.set_password(request.data['password'])

        user.save()
        return Response(UsuarioReadSerializer(user).data)

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResetPasswordView(APIView):
    """Placeholder — returns 200; wire to a real email backend in production."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        return Response({
            "mensaje": f"Se enviaria un correo de restablecimiento a {user.email}.",
            "usuario_id": user.id,
        })


class CambiarEstadoUsuarioView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def put(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        nuevo_estado = request.data.get('is_active')

        if nuevo_estado is None:
            return Response({"error": "Se requiere el campo 'is_active'."}, status=status.HTTP_400_BAD_REQUEST)

        if isinstance(nuevo_estado, str):
            nuevo_estado = nuevo_estado.lower() in ['true', '1', 't', 'y', 'yes']
        else:
            nuevo_estado = bool(nuevo_estado)

        user.is_active = nuevo_estado
        user.save()
        accion = "reactivado" if nuevo_estado else "dado de baja (suspendido)"

        return Response({
            "mensaje": f"El usuario '{user.username}' ha sido {accion} exitosamente.",
            "usuario": {"id": user.id, "username": user.username, "is_active": user.is_active},
        })


# ── Supplier User Management ──────────────────────────────────────────────────

class ProveedorListView(generics.ListAPIView):
    """Search suppliers — existing endpoint for Purchases team."""
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated, IsPurchasesUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']

    def get_queryset(self):
        return User.objects.filter(groups__name='Supplier', is_active=True)


class ProveedorListCreateView(APIView):
    """
    GET  /api/proveedores/ — list all suppliers (Purchases role)
    POST /api/proveedores/ — create a new supplier account (SuperAdmin)
    """
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsSuperAdmin()]
        return [IsAuthenticated(), IsPurchasesUser()]

    def get(self, request):
        qs = User.objects.filter(groups__name='Supplier').order_by('id')
        search = request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        return Response(ProveedorSerializer(qs, many=True).data)

    def post(self, request):
        serializer = UsuarioCreateSerializer(data={**request.data, 'rol': 'Supplier'})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(ProveedorSerializer(user).data, status=status.HTTP_201_CREATED)


class ProveedorDetailView(APIView):
    """
    GET   /api/proveedores/{pk}/ — supplier detail
    PATCH /api/proveedores/{pk}/ — update supplier
    DELETE /api/proveedores/{pk}/ — delete supplier
    """
    permission_classes = [IsAuthenticated, IsPurchasesUser]

    def _get_supplier(self, pk):
        return get_object_or_404(User, pk=pk, groups__name='Supplier')

    def get(self, request, pk):
        return Response(ProveedorSerializer(self._get_supplier(pk)).data)

    def patch(self, request, pk):
        user = self._get_supplier(pk)
        for field in ('email', 'first_name', 'last_name', 'username'):
            if field in request.data:
                setattr(user, field, request.data[field])
        if 'is_active' in request.data:
            val = request.data['is_active']
            user.is_active = val if isinstance(val, bool) else str(val).lower() in ('true', '1')
        if 'password' in request.data and request.data['password']:
            user.set_password(request.data['password'])
        user.save()
        return Response(ProveedorSerializer(user).data)

    def delete(self, request, pk):
        self._get_supplier(pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Files ─────────────────────────────────────────────────────────────────────

class ArchivoViewSet(viewsets.ModelViewSet):
    queryset = Archivo.objects.all()
    serializer_class = ArchivoSerializer


class DescargarArchivoSeguroView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        archivo_obj = get_object_or_404(Archivo, pk=pk)
        if not archivo_obj.archivo:
            raise Http404("El archivo no tiene una ruta fisica asociada.")
        file_path = archivo_obj.archivo.path
        if not os.path.exists(file_path):
            raise Http404("El archivo no se encuentra en el servidor.")
        response = FileResponse(open(file_path, 'rb'))
        response['Content-Disposition'] = f'attachment; filename="{archivo_obj.nombre}"'
        return response


class RFQDocumentListView(APIView):
    """
    GET  /api/rfqs/{pk}/documentos/ — list documents attached to an RFQ
    POST /api/rfqs/{pk}/documentos/ — upload a new document for an RFQ
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        rfq = get_object_or_404(RFQ_Base, pk=pk)
        archivos = Archivo.objects.filter(id_rfq=rfq)
        return Response([
            {
                'id': a.id,
                'name': a.nombre,
                'date': str(a.fecha_subida)[:10] if a.fecha_subida else None,
                'type': a.file_type,
                'is3D': a.is3d,
            }
            for a in archivos
        ])

    def post(self, request, pk):
        rfq = get_object_or_404(RFQ_Base, pk=pk)
        archivo_file = request.FILES.get('file')
        if not archivo_file:
            return Response({"error": "Se requiere el campo 'file'."}, status=status.HTTP_400_BAD_REQUEST)
        ftype = request.data.get('type', '')
        archivo_obj = Archivo.objects.create(
            nombre=archivo_file.name,
            archivo=archivo_file,
            id_rfq=rfq,
            file_type=ftype,
            is3d=(ftype == '3d'),
        )
        return Response({
            'id': archivo_obj.id,
            'name': archivo_obj.nombre,
            'date': str(archivo_obj.fecha_subida)[:10] if archivo_obj.fecha_subida else None,
            'type': archivo_obj.file_type,
            'is3D': archivo_obj.is3d,
        }, status=status.HTTP_201_CREATED)


class RFQDocumentDownloadView(APIView):
    """GET /api/rfqs/{pk}/documentos/{doc_pk}/download/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, doc_pk):
        rfq = get_object_or_404(RFQ_Base, pk=pk)
        archivo_obj = get_object_or_404(Archivo, pk=doc_pk, id_rfq=rfq)
        if not archivo_obj.archivo:
            raise Http404("El archivo no tiene una ruta fisica asociada.")
        file_path = archivo_obj.archivo.path
        if not os.path.exists(file_path):
            raise Http404("El archivo no se encuentra en el servidor.")
        response = FileResponse(open(file_path, 'rb'))
        response['Content-Disposition'] = f'attachment; filename="{archivo_obj.nombre}"'
        return response


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificacionListView(APIView):
    """
    GET    /api/notificaciones/ — list notifications for authenticated user
    PATCH  /api/notificaciones/ — mark all as read  { "read_all": true }
    DELETE /api/notificaciones/ — clear all
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notificacion.objects.filter(usuario=request.user)
        return Response({'notifications': NotificacionSerializer(qs, many=True).data})

    def patch(self, request):
        if request.data.get('read_all'):
            Notificacion.objects.filter(usuario=request.user).update(leida=True)
            return Response({"mensaje": "Todas las notificaciones marcadas como leidas."})
        return Response({"error": "Envia { \"read_all\": true }."}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        Notificacion.objects.filter(usuario=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificacionDetailView(APIView):
    """PATCH /api/notificaciones/{pk}/ — mark one notification as read."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notif = get_object_or_404(Notificacion, pk=pk, usuario=request.user)
        notif.leida = request.data.get('read', True)
        notif.save(update_fields=['leida'])
        return Response(NotificacionSerializer(notif).data)


class NotificacionBulkView(APIView):
    """Legacy — kept for backwards compatibility with /api/notificaciones/bulk/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        Notificacion.objects.filter(usuario=request.user).update(leida=True)
        return Response({"mensaje": "Todas las notificaciones marcadas como leidas."})

    def delete(self, request):
        Notificacion.objects.filter(usuario=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── RFQ — Core ────────────────────────────────────────────────────────────────

_MOLD_COMPLETION_FIELDS = ['DESC', 'CUST', 'No_CAV', 'PPY', 'TT', 'ELAB', 'Smach', 'DTQ']
_DIE_COMPLETION_FIELDS  = ['DESC', 'CUST', 'Press', 'No_cavities', 'PPY', 'PT_No', 'DTQB']


def _calc_completion(detalles: dict, rfq_type: str) -> int:
    fields = _MOLD_COMPLETION_FIELDS if rfq_type == 'mold' else _DIE_COMPLETION_FIELDS
    if not fields:
        return 0
    filled = sum(1 for f in fields if detalles.get(f) not in (None, '', 0, False))
    return round(filled / len(fields) * 100)


def _inject_detalles(item):
    """Inject technical detail + completion percentage into a serialized RFQ item dict."""
    rfq_id = item.get('id_rfq')
    rfq_type = item.get('type')
    if rfq_type == 'mold':
        item['detalles_tecnicos'] = MOLD_INFO_P1_I.objects.filter(id_rfq_id=rfq_id).values().first() or {}
    elif rfq_type == 'die':
        item['detalles_tecnicos'] = DIE_TRIM_I.objects.filter(id_rfq_id=rfq_id).values().first() or {}
    else:
        item['detalles_tecnicos'] = {}

    item['completion_percentage'] = _calc_completion(item['detalles_tecnicos'], rfq_type or '')

    # Offers count (number of submitted quotes)
    if rfq_type == 'mold':
        item['offers_count'] = MOLD_COSTBR_P1_S.objects.filter(id_rfq_id=rfq_id).exclude(Elaborated_by='').count()
    elif rfq_type == 'die':
        item['offers_count'] = DIE_COSTBR_P1_S.objects.filter(id_rfq_id=rfq_id).exclude(Elaborated_by='').count()
    else:
        item['offers_count'] = 0


class RFQProgresoView(APIView):
    """GET /api/rfqs/{pk}/progreso/ — completion percentage for draft RFQs."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        rfq = get_object_or_404(RFQ_Base, pk=pk)
        if rfq.type == 'mold':
            detalles = MOLD_INFO_P1_I.objects.filter(id_rfq=rfq).values().first() or {}
        else:
            detalles = DIE_TRIM_I.objects.filter(id_rfq=rfq).values().first() or {}

        fields = _MOLD_COMPLETION_FIELDS if rfq.type == 'mold' else _DIE_COMPLETION_FIELDS
        filled = [f for f in fields if detalles.get(f) not in (None, '', 0, False)]
        total = len(fields)
        percentage = round(len(filled) / total * 100) if total else 0

        return Response({
            'percentage': percentage,
            'filled': len(filled),
            'total': total,
            'filled_fields': filled,
            'missing_fields': [f for f in fields if f not in filled],
        })


class RFQDetailView(APIView):
    """
    GET /api/rfqs/{pk}/ — full RFQ detail with stage1, stage2, stage3.
    stage2 (supplier assignments) is hidden from Supplier-role users.
    stage3 (quotes) is only populated from waiting_for_suppliers onwards.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        rfq = get_object_or_404(RFQ_Base, pk=pk)
        grupos = list(request.user.groups.values_list('name', flat=True))

        # Stage 1 — Technical specifications
        if rfq.type == 'mold':
            stage1 = {
                'p1': MOLD_INFO_P1_I.objects.filter(id_rfq=rfq).values().first() or {},
                'p2': MOLD_INFO_P2_I.objects.filter(id_rfq=rfq).values().first() or {},
            }
        else:
            stage1 = {
                'die_trim': DIE_TRIM_I.objects.filter(id_rfq=rfq).values().first() or {},
            }

        # Stage 2 — Supplier assignments (hidden from Supplier role)
        stage2 = None
        if 'Supplier' not in grupos:
            assignments = RFQ_Assignment.objects.filter(id_rfq=rfq).select_related('supplier')
            stage2 = {
                'suppliers': [
                    {
                        'id': a.supplier.id,
                        'username': a.supplier.username,
                        'email': a.supplier.email,
                        'is_winner': a.is_winner,
                        'has_responded': a.has_responded,
                    }
                    for a in assignments if a.supplier
                ],
            }

        # Stage 3 — Quote responses.
        # Suppliers: visible from sent_to_suppliers onwards (so they can submit their quote).
        # Internal users: visible from waiting_for_suppliers onwards (when responses exist).
        stage3 = None
        is_supplier_role = 'Supplier' in grupos
        internal_stages = [STATUS.WAITING_FOR_SUPPLIERS, STATUS.SUPPLIER_SELECTED, STATUS.RFQ_CLOSED]
        supplier_stages = STATUS.SUPPLIER_ACTIVE + [STATUS.SUPPLIER_SELECTED, STATUS.RFQ_CLOSED]

        if (is_supplier_role and rfq.status in supplier_stages) or \
           (not is_supplier_role and rfq.status in internal_stages):

            if is_supplier_role:
                # Return only this supplier's own draft/submitted response
                username = request.user.username
                if rfq.type == 'mold':
                    own_p1 = MOLD_COSTBR_P1_S.objects.filter(id_rfq=rfq, Elaborated_by=username).values().first()
                    responses = [{
                        'supplier': username,
                        'p1': own_p1 or {},
                        'p2': MOLD_COSTBR_P2_S.objects.filter(id_rfq=rfq, Elaborated_by=username).values().first() or {},
                        'p3': MOLD_COSTBR_P3_S.objects.filter(id_rfq=rfq, Elaborated_by=username).values().first() or {},
                        'p4': MOLD_COSTBR_P4_S.objects.filter(id_rfq=rfq, Elaborated_by=username).values().first() or {},
                        'p5': MOLD_COSTBR_P5_S.objects.filter(id_rfq=rfq, Elaborated_by=username).values().first() or {},
                        'cav1': MOLD_CAVITIES_P1_S.objects.filter(id_rfq=rfq, supplier__username=username).values().first() or {},
                        'cav2': MOLD_CAVITIES_P2_S.objects.filter(id_rfq=rfq, supplier__username=username).values().first() or {},
                        'cav3': MOLD_CAVITIES_P3_S.objects.filter(id_rfq=rfq, supplier__username=username).values().first() or {},
                        'info1': MOLD_INFO_P1_S.objects.filter(id_rfq=rfq, supplier__username=username).values().first() or {},
                        'info2': MOLD_INFO_P2_S.objects.filter(id_rfq=rfq, supplier__username=username).values().first() or {},
                    }] if own_p1 else []
                else:
                    own_p1 = DIE_COSTBR_P1_S.objects.filter(id_rfq=rfq, Elaborated_by=username).values().first()
                    responses = [{
                        'supplier': username,
                        'p1': own_p1 or {},
                        'p2': DIE_COSTBR_P2_S.objects.filter(id_rfq=rfq, supplier__username=username).values().first() or {},
                        'p3': DIE_COSTBR_P3_S.objects.filter(id_rfq=rfq, supplier__username=username).values().first() or {},
                        'p4': DIE_COSTBR_P4_S.objects.filter(id_rfq=rfq, supplier__username=username).values().first() or {},
                        'info1': DIE_TRIM_S.objects.filter(id_rfq=rfq, supplier__username=username).values().first() or {},
                    }] if own_p1 else []
            else:
                # Internal users see all supplier responses
                if rfq.type == 'mold':
                    usernames = list(MOLD_COSTBR_P1_S.objects.filter(id_rfq=rfq).exclude(Elaborated_by='').values_list('Elaborated_by', flat=True))
                    responses = [
                        {
                            'supplier': u,
                            'p1': MOLD_COSTBR_P1_S.objects.filter(id_rfq=rfq, Elaborated_by=u).values().first() or {},
                            'p2': MOLD_COSTBR_P2_S.objects.filter(id_rfq=rfq, Elaborated_by=u).values().first() or {},
                            'p3': MOLD_COSTBR_P3_S.objects.filter(id_rfq=rfq, Elaborated_by=u).values().first() or {},
                            'p4': MOLD_COSTBR_P4_S.objects.filter(id_rfq=rfq, Elaborated_by=u).values().first() or {},
                            'p5': MOLD_COSTBR_P5_S.objects.filter(id_rfq=rfq, Elaborated_by=u).values().first() or {},
                            'cav1': MOLD_CAVITIES_P1_S.objects.filter(id_rfq=rfq, supplier__username=u).values().first() or {},
                            'cav2': MOLD_CAVITIES_P2_S.objects.filter(id_rfq=rfq, supplier__username=u).values().first() or {},
                            'cav3': MOLD_CAVITIES_P3_S.objects.filter(id_rfq=rfq, supplier__username=u).values().first() or {},
                            'info1': MOLD_INFO_P1_S.objects.filter(id_rfq=rfq, supplier__username=u).values().first() or {},
                            'info2': MOLD_INFO_P2_S.objects.filter(id_rfq=rfq, supplier__username=u).values().first() or {},
                        }
                        for u in usernames
                    ]
                else:
                    usernames = list(DIE_COSTBR_P1_S.objects.filter(id_rfq=rfq).exclude(Elaborated_by='').values_list('Elaborated_by', flat=True))
                    responses = [
                        {
                            'supplier': u,
                            'p1': DIE_COSTBR_P1_S.objects.filter(id_rfq=rfq, Elaborated_by=u).values().first() or {},
                            'p2': DIE_COSTBR_P2_S.objects.filter(id_rfq=rfq, supplier__username=u).values().first() or {},
                            'p3': DIE_COSTBR_P3_S.objects.filter(id_rfq=rfq, supplier__username=u).values().first() or {},
                            'p4': DIE_COSTBR_P4_S.objects.filter(id_rfq=rfq, supplier__username=u).values().first() or {},
                            'info1': DIE_TRIM_S.objects.filter(id_rfq=rfq, supplier__username=u).values().first() or {},
                        }
                        for u in usernames
                    ]

            stage3 = {
                'responses': responses,
                'statistics': {
                    'responsesReceived': RFQ_Assignment.objects.filter(id_rfq=rfq, has_responded=True).count(),
                    'totalInvited': RFQ_Assignment.objects.filter(id_rfq=rfq).count(),
                },
            }

        # Inject is_winner for Supplier role
        if 'Supplier' in grupos and rfq.status == STATUS.SUPPLIER_SELECTED:
            assignment = RFQ_Assignment.objects.filter(id_rfq=rfq, supplier=request.user).first()
            is_winner = assignment.is_winner if assignment else False
        else:
            is_winner = None

        documentos = [
            {
                'id': a.id,
                'name': a.nombre,
                'date': str(a.fecha_subida)[:10] if a.fecha_subida else None,
                'type': a.file_type,
                'is3D': a.is3d,
                'uploadedBy': rfq.created_by,
            }
            for a in Archivo.objects.filter(id_rfq=rfq)
        ]

        return Response({
            'id_rfq': rfq.id_rfq,
            'title':  rfq.tool,
            'tool':   rfq.tool,
            'type':   rfq.type,
            'category':   rfq.category,
            'priority':   rfq.priority,
            'status':     rfq.status,
            'submitted_for_review': rfq.submitted_for_review,
            'created_by':   rfq.created_by,
            'modified_date': rfq.modified_date,
            'response_deadline':    rfq.response_deadline,
            'shipping_terms':       rfq.shipping_terms,
            'quality_requirements': rfq.quality_requirements,
            'is_winner':    is_winner,
            'documentos':   documentos,
            'stage1': stage1,
            'stage2': stage2,
            'stage3': stage3,
        })


class RFQClasificadoListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        grupos = list(user.groups.values_list('name', flat=True))
        tipo_vista = request.query_params.get('vista', 'all').lower()

        if tipo_vista not in ['all', 'draft']:
            return Response({"error": "Parametro 'vista' invalido. Use 'all' o 'draft'."}, status=status.HTTP_400_BAD_REQUEST)

        queryset = RFQ_Base.objects.none()

        if 'Industrialization' in grupos or 'Industrialization_Admin' in grupos or 'SuperAdmin' in grupos:
            if tipo_vista == 'all':
                queryset = RFQ_Base.objects.filter(status__in=STATUS.PAST_IND)
            else:
                queryset = RFQ_Base.objects.filter(status=STATUS.IND_DRAFT)

        elif 'Purchases' in grupos or 'Purchases_Admin' in grupos:
            if tipo_vista == 'all':
                queryset = RFQ_Base.objects.filter(status__in=STATUS.PURCHASES_ALL)
            else:
                queryset = RFQ_Base.objects.filter(status__in=[STATUS.SENT_TO_PURCHASES, STATUS.PURCHASES_DRAFT])

        elif 'Supplier' in grupos:
            rfqs_asignados_ids = RFQ_Assignment.objects.filter(
                supplier=user
            ).values_list('id_rfq_id', flat=True)

            if tipo_vista == 'all':
                queryset = RFQ_Base.objects.filter(id_rfq__in=rfqs_asignados_ids, status__in=STATUS.SUPPLIER_ALL)
            else:
                responded_ids = RFQ_Assignment.objects.filter(
                    supplier=user, has_responded=True
                ).values_list('id_rfq_id', flat=True)
                queryset = RFQ_Base.objects.filter(
                    id_rfq__in=rfqs_asignados_ids,
                    status__in=STATUS.SUPPLIER_ACTIVE,
                ).exclude(id_rfq__in=responded_ids)

        serializer = RFQBaseSerializer(queryset, many=True)
        data = list(serializer.data)

        for item in data:
            _inject_detalles(item)
            if 'Supplier' in grupos:
                assignment = RFQ_Assignment.objects.filter(id_rfq_id=item['id_rfq'], supplier=user).first()
                if assignment:
                    item['is_winner'] = assignment.is_winner
                    item['has_responded'] = assignment.has_responded
                    if assignment.is_winner:
                        item['supplier_status'] = "This RFQ has been selected"
                    elif item.get('status') == STATUS.SUPPLIER_SELECTED:
                        item['supplier_status'] = "Not Selected"
                    elif assignment.has_responded:
                        item['supplier_status'] = "Waiting for response"
                    else:
                        item['supplier_status'] = "Pending"
                else:
                    item['supplier_status'] = "Pending"

        return Response(data)


# ── RFQ — Industrialization ───────────────────────────────────────────────────

class CrearRFQView(APIView):
    permission_classes = [IsAuthenticated, IsIndUser]

    @transaction.atomic
    def post(self, request):
        data = request.data
        is_draft = data.get('is_draft', True)
        rfq_type = data.get('type')

        if not is_draft and (not data.get('tool') or not rfq_type):
            return Response(
                {"error": "Los campos 'tool' y 'type' son obligatorios para el envio definitivo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            rfq_base = RFQ_Base.objects.create(
                created_by=request.user.username,
                tool=data.get('tool', ''),
                type=rfq_type,
                category=data.get('category', ''),
                priority=data.get('priority', ''),
                status=STATUS.IND_DRAFT,
                submitted_for_review=not is_draft,
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
                raise ValueError("El tipo de RFQ es invalido. Debe ser 'mold' o 'die'.")

            if not is_draft:
                registrar_tracking_rfq(rfq_base, STATUS.IND_DRAFT, request.user)

            estado_msg = "DRAFT" if is_draft else "PENDING_IND_REVIEW"
            return Response(
                {"mensaje": f"RFQ {rfq_base.id_rfq} guardado como {estado_msg}.", "id_rfq": rfq_base.id_rfq},
                status=status.HTTP_201_CREATED,
            )

        except (TypeError, ValueError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class EditarRFQView(APIView):
    permission_classes = [IsAuthenticated, IsIndUser]

    @transaction.atomic
    def put(self, request, pk):
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)

        locked_statuses = [
            STATUS.SENT_TO_SUPPLIERS, STATUS.WAITING_FOR_SUPPLIERS,
            STATUS.SUPPLIER_SELECTED, STATUS.RFQ_CLOSED,
        ]
        if rfq_base.status in locked_statuses:
            return Response(
                {"error": "Edicion bloqueada. El RFQ ya fue enviado a los proveedores."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data
        is_draft = data.get('is_draft', True)

        try:
            for field in ('tool', 'type', 'category', 'priority'):
                if field in data:
                    setattr(rfq_base, field, data[field])
            rfq_base.status = STATUS.IND_DRAFT
            rfq_base.submitted_for_review = not is_draft
            rfq_base.save()

            if not is_draft:
                registrar_tracking_rfq(rfq_base, STATUS.IND_DRAFT, request.user)

            rfq_type = rfq_base.type
            if rfq_type == 'mold':
                mold_p1_data = data.get('mold_info_p1', {})
                if mold_p1_data:
                    MOLD_INFO_P1_I.objects.update_or_create(id_rfq=rfq_base, defaults=mold_p1_data)
                mold_p2_data = data.get('mold_info_p2', {})
                if mold_p2_data:
                    MOLD_INFO_P2_I.objects.update_or_create(id_rfq=rfq_base, defaults=mold_p2_data)
            elif rfq_type == 'die':
                die_trim_data = data.get('die_trim', {})
                if die_trim_data:
                    DIE_TRIM_I.objects.update_or_create(id_rfq=rfq_base, defaults=die_trim_data)

            estado_msg = "Borrador" if is_draft else "Enviado al admin para revision"
            return Response({"mensaje": f"RFQ {rfq_base.id_rfq} actualizado. Estado: {estado_msg}.", "id_rfq": rfq_base.id_rfq})

        except (TypeError, ValueError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class GuardarEspecificacionesView(APIView):
    """
    PATCH /api/rfqs/{pk}/especificaciones/
    Update technical spec tables without touching RFQ_Base.status.
    Blocked once sent_to_suppliers or beyond.
    """
    permission_classes = [IsAuthenticated, IsIndUser]

    @transaction.atomic
    def patch(self, request, pk):
        rfq = get_object_or_404(RFQ_Base, pk=pk)

        locked = [STATUS.SENT_TO_SUPPLIERS, STATUS.WAITING_FOR_SUPPLIERS,
                  STATUS.SUPPLIER_SELECTED, STATUS.RFQ_CLOSED]
        if rfq.status in locked:
            return Response(
                {"error": "El RFQ ya fue publicado y sus especificaciones no pueden modificarse."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if rfq.type == 'mold':
                p1 = request.data.get('mold_info_p1', {})
                p2 = request.data.get('mold_info_p2', {})
                if p1:
                    MOLD_INFO_P1_I.objects.update_or_create(id_rfq=rfq, defaults=p1)
                if p2:
                    MOLD_INFO_P2_I.objects.update_or_create(id_rfq=rfq, defaults=p2)
            elif rfq.type == 'die':
                die = request.data.get('die_trim', {})
                if die:
                    DIE_TRIM_I.objects.update_or_create(id_rfq=rfq, defaults=die)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"mensaje": "Especificaciones actualizadas.", "id_rfq": rfq.id_rfq})


class GuardarMetadataComprasView(APIView):
    """
    PATCH /api/rfqs/{pk}/compras-metadata/
    Save Purchases-specific metadata (deadline, terms, requirements) onto RFQ_Base.
    Does not change status or submitted_for_review.
    """
    permission_classes = [IsAuthenticated, IsPurchasesUser]

    def patch(self, request, pk):
        rfq = get_object_or_404(RFQ_Base, pk=pk)

        meta = request.data.get('metadata', request.data)
        updated = []

        if 'response_deadline' in meta:
            rfq.response_deadline = meta['response_deadline'] or None
            updated.append('response_deadline')
        if 'shipping_terms' in meta:
            rfq.shipping_terms = meta['shipping_terms']
            updated.append('shipping_terms')
        if 'quality_requirements' in meta:
            rfq.quality_requirements = meta['quality_requirements']
            updated.append('quality_requirements')

        if updated:
            rfq.save(update_fields=updated)

        return Response({"mensaje": "Metadata actualizada.", "id_rfq": rfq.id_rfq})


class ReviewRFQIndView(APIView):
    permission_classes = [IsAuthenticated, IsIndAdmin]

    @transaction.atomic
    def patch(self, request, pk):
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)

        if rfq_base.status != STATUS.IND_DRAFT or not rfq_base.submitted_for_review:
            return Response(
                {"error": "El RFQ no esta pendiente de revision (industrialization_draft + submitted_for_review=True requerido)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_approved = request.data.get('is_approved')
        if is_approved is None:
            return Response({"error": "Se requiere el campo 'is_approved' (booleano)."}, status=status.HTTP_400_BAD_REQUEST)

        if str(is_approved).lower() in ['true', '1', 't', 'y', 'yes']:
            if rfq_base.type == 'mold' and not MOLD_INFO_P1_I.objects.filter(id_rfq=rfq_base).exists():
                return Response({"error": "No se puede aprobar: Faltan datos tecnicos del Molde (P1)."}, status=status.HTTP_400_BAD_REQUEST)
            if rfq_base.type == 'die' and not DIE_TRIM_I.objects.filter(id_rfq=rfq_base).exists():
                return Response({"error": "No se puede aprobar: Faltan datos tecnicos del Troquel."}, status=status.HTTP_400_BAD_REQUEST)

            rfq_base.status = STATUS.SENT_TO_PURCHASES
            rfq_base.submitted_for_review = False
            rfq_base.save()
            registrar_tracking_rfq(rfq_base, STATUS.SENT_TO_PURCHASES, request.user)
            estado_msg = "SENT_TO_PURCHASES"
        else:
            rfq_base.submitted_for_review = False
            rfq_base.save()
            registrar_tracking_rfq(rfq_base, STATUS.IND_DRAFT, request.user)
            estado_msg = "IND_DRAFT (rechazado, regreso a edicion)"

        return Response({
            "mensaje": f"RFQ {rfq_base.id_rfq} ({rfq_base.type}) evaluado correctamente.",
            "id_rfq": rfq_base.id_rfq,
            "estado_actual": estado_msg,
        })


# ── RFQ — Purchases ───────────────────────────────────────────────────────────

class AssignSuppliersRFQView(APIView):
    permission_classes = [IsAuthenticated, IsPurchasesUser]

    @transaction.atomic
    def put(self, request, pk):
        rfq = get_object_or_404(RFQ_Base, pk=pk)

        if rfq.status not in (STATUS.SENT_TO_PURCHASES, STATUS.PURCHASES_DRAFT):
            return Response(
                {"error": "El RFQ no se encuentra en el inbox de Compras."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        proveedores_ids = request.data.get('proveedores_ids', [])
        is_draft = bool(request.data.get('is_draft', False))

        if not isinstance(proveedores_ids, list):
            return Response({"error": "El campo 'proveedores_ids' debe ser una lista."}, status=status.HTTP_400_BAD_REQUEST)
        if not is_draft and not proveedores_ids:
            return Response({"error": "Debes proporcionar al menos un proveedor para enviar a revision."}, status=status.HTTP_400_BAD_REQUEST)

        proveedores_validos = User.objects.none()
        if proveedores_ids:
            proveedores_validos = User.objects.filter(id__in=proveedores_ids, groups__name='Supplier', is_active=True)
            if proveedores_validos.count() != len(proveedores_ids):
                return Response({"error": "Uno o mas IDs no son validos o no pertenecen al grupo Supplier."}, status=status.HTTP_400_BAD_REQUEST)

        RFQ_Assignment.objects.filter(id_rfq=rfq).delete()
        if rfq.type == 'mold':
            MOLD_COSTBR_I.objects.filter(id_rfq=rfq).delete()
        elif rfq.type == 'die':
            DIE_COSTBR_I.objects.filter(id_rfq=rfq).delete()

        RFQ_Assignment.objects.bulk_create([
            RFQ_Assignment(id_rfq=rfq, supplier=proveedor)
            for proveedor in proveedores_validos
        ])

        if rfq.type == 'mold':
            MOLD_COSTBR_I.objects.create(id_rfq=rfq)
        elif rfq.type == 'die':
            DIE_COSTBR_I.objects.create(id_rfq=rfq)

        rfq.status = STATUS.PURCHASES_DRAFT
        rfq.submitted_for_review = not is_draft
        rfq.save()
        registrar_tracking_rfq(rfq, STATUS.PURCHASES_DRAFT, request.user)

        return Response({
            "message": f"RFQ {rfq.id_rfq} guardado como {'borrador' if is_draft else 'enviado a revision'}.",
            "cantidad_proveedores": proveedores_validos.count(),
            "submitted_for_review": rfq.submitted_for_review,
        })


class RFQPendientesAprobacionComprasListView(generics.ListAPIView):
    serializer_class = RFQBaseSerializer
    permission_classes = [IsAuthenticated, IsPurchasesAdmin]

    def get_queryset(self):
        return RFQ_Base.objects.filter(status=STATUS.PURCHASES_DRAFT, submitted_for_review=True)


class AprobarRechazarProveedoresView(APIView):
    permission_classes = [IsAuthenticated, IsPurchasesAdmin]

    @transaction.atomic
    def patch(self, request, pk):
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)

        if rfq_base.status != STATUS.PURCHASES_DRAFT or not rfq_base.submitted_for_review:
            return Response(
                {"error": "El RFQ no esta en espera de autorizacion de gerencia de compras."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        accion = request.data.get('accion', request.data.get('action', '')).lower()

        if accion in ('aprobar', 'approve'):
            rfq_base.status = STATUS.SENT_TO_SUPPLIERS
            rfq_base.submitted_for_review = False
            rfq_base.save()
            registrar_tracking_rfq(rfq_base, STATUS.SENT_TO_SUPPLIERS, request.user)
            mensaje = "Lista de proveedores aprobada. El RFQ ha sido publicado a los proveedores."
        elif accion in ('rechazar', 'reject'):
            rfq_base.submitted_for_review = False
            rfq_base.save()
            registrar_tracking_rfq(rfq_base, STATUS.PURCHASES_DRAFT, request.user)
            mensaje = "Lista rechazada. El RFQ regreso a Compras para nueva seleccion."
        else:
            return Response({"error": "Accion invalida. Usa 'aprobar'/'approve' o 'rechazar'/'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"mensaje": mensaje, "id_rfq": rfq_base.id_rfq})


class ComparativaCotizacionesView(APIView):
    permission_classes = [IsAuthenticated, IsPurchasesUser]

    def get(self, request, pk):
        rfq = get_object_or_404(RFQ_Base, pk=pk)

        if rfq.status != STATUS.WAITING_FOR_SUPPLIERS:
            return Response(
                {"error": "El RFQ no esta en fase de analisis (waiting_for_suppliers)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if rfq.type == 'mold':
            modelos = [MOLD_COSTBR_P1_S, MOLD_COSTBR_P2_S, MOLD_COSTBR_P3_S, MOLD_COSTBR_P4_S, MOLD_COSTBR_P5_S]
            proveedores_ids = MOLD_COSTBR_P1_S.objects.filter(id_rfq=rfq).values_list('Elaborated_by', flat=True)
        else:
            modelos = [DIE_COSTBR_P1_S, DIE_COSTBR_P2_S, DIE_COSTBR_P3_S, DIE_COSTBR_P4_S]
            proveedores_ids = DIE_COSTBR_P1_S.objects.filter(id_rfq=rfq).values_list('Elaborated_by', flat=True)

        resultado = []
        for username in proveedores_ids:
            user_obj = User.objects.filter(username=username).first()
            oferta = {
                "proveedor": f"{user_obj.first_name} {user_obj.last_name}".strip() if user_obj else username,
                "datos": {
                    f"parte_{i+1}": m.objects.filter(id_rfq=rfq, Elaborated_by=username).values().first()
                    for i, m in enumerate(modelos)
                },
            }
            resultado.append(oferta)

        return Response({"id_rfq": rfq.id_rfq, "tipo": rfq.type, "comparativa": resultado})


class SelectWinningSupplierView(APIView):
    permission_classes = [IsAuthenticated, IsPurchasesUser]

    @transaction.atomic
    def patch(self, request, pk):
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)

        if rfq_base.status != STATUS.WAITING_FOR_SUPPLIERS:
            return Response(
                {"error": "El RFQ no esta en la fase de seleccion (waiting_for_suppliers)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        proveedor_id = request.data.get('proveedor_id')
        if not proveedor_id:
            return Response({"error": "Se requiere el campo 'proveedor_id'."}, status=status.HTTP_400_BAD_REQUEST)

        asignacion = get_object_or_404(RFQ_Assignment, id_rfq=rfq_base, supplier_id=proveedor_id)

        RFQ_Assignment.objects.filter(id_rfq=rfq_base, is_winner=True).update(is_winner=False)
        asignacion.is_winner = True
        asignacion.save()

        rfq_base.status = STATUS.SUPPLIER_SELECTED
        rfq_base.save()
        registrar_tracking_rfq(rfq_base, STATUS.SUPPLIER_SELECTED, request.user)

        return Response({
            "mensaje": "Proveedor marcado como ganador. RFQ enviado a validacion gerencial.",
            "id_rfq": rfq_base.id_rfq,
        })


class FalloFinalGerencialView(APIView):
    permission_classes = [IsAuthenticated, IsPurchasesAdmin]

    @transaction.atomic
    def patch(self, request, pk):
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)

        if rfq_base.status != STATUS.SUPPLIER_SELECTED:
            return Response(
                {"error": f"El RFQ {rfq_base.id_rfq} no se encuentra en espera de fallo gerencial."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        asignacion = get_object_or_404(RFQ_Assignment, id_rfq=rfq_base, is_winner=True)
        accion = request.data.get('accion', request.data.get('action', '')).lower()
        rfq_type_label = "Molde" if rfq_base.type == 'mold' else "Troquel"

        if accion in ('aprobar', 'approve'):
            rfq_base.status = STATUS.RFQ_CLOSED
            rfq_base.save()
            registrar_tracking_rfq(rfq_base, STATUS.RFQ_CLOSED, request.user)
            proveedor_ganador = asignacion.supplier.username if asignacion.supplier else None
            mensaje = f"Fallo aprobado. El {rfq_type_label} ha sido adjudicado y la licitacion esta cerrada."

        elif accion in ('rechazar', 'reject'):
            asignacion.is_winner = False
            asignacion.save()
            rfq_base.status = STATUS.WAITING_FOR_SUPPLIERS
            rfq_base.save()
            registrar_tracking_rfq(rfq_base, STATUS.WAITING_FOR_SUPPLIERS, request.user)
            proveedor_ganador = None
            mensaje = f"Fallo rechazado. Se revoco la seleccion y el {rfq_type_label} regresa a analisis."

        else:
            return Response({"error": "Accion invalida. Los valores permitidos son 'aprobar'/'approve' o 'rechazar'/'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "mensaje": mensaje,
            "id_rfq": rfq_base.id_rfq,
            "tipo": rfq_base.type,
            "proveedor_ganador": proveedor_ganador,
        })


# ── RFQ — Supplier Portal ─────────────────────────────────────────────────────

class BuzonProveedorListView(generics.ListAPIView):
    serializer_class = RFQBaseSerializer
    permission_classes = [IsAuthenticated, IsSupplier]

    def get_queryset(self):
        rfqs_asignados_ids = RFQ_Assignment.objects.filter(
            supplier=self.request.user
        ).values_list('id_rfq_id', flat=True)

        return RFQ_Base.objects.filter(
            id_rfq__in=rfqs_asignados_ids,
            status__in=STATUS.SUPPLIER_ACTIVE,
        )


class CotizacionProveedorView(APIView):
    permission_classes = [IsAuthenticated, IsSupplier]

    @transaction.atomic
    def post(self, request, pk):
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)

        if rfq_base.status not in STATUS.SUPPLIER_ACTIVE:
            return Response(
                {"error": "El RFQ no esta habilitado para recibir cotizaciones."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data
        is_draft = data.get('is_draft', True)
        proveedor_identificador = request.user.username

        # Sanitise cost dicts: drop DB-internal / metadata keys.
        # Replace None numeric values with 0 so NOT NULL FloatField columns
        # never receive NULL.  DateField / CharField nulls are stripped instead
        # of converted to 0 to avoid type errors on re-submission.
        _DB_KEYS = frozenset({
            'id', 'id_rfq_id', 'supplier_id', 'supplier',
            'Last_change', 'Last_edit_by', 'Last_edited_by', 'Elaborated_by',
        })

        def _clean_cost(raw):
            cleaned = {}
            for k, v in (raw or {}).items():
                if k in _DB_KEYS:
                    continue
                cleaned[k] = 0 if v is None else v
            return cleaned

        try:
            if rfq_base.type == 'mold':
                bloques = [
                    ('mold_cost_p1', MOLD_COSTBR_P1_S),
                    ('mold_cost_p2', MOLD_COSTBR_P2_S),
                    ('mold_cost_p3', MOLD_COSTBR_P3_S),
                    ('mold_cost_p4', MOLD_COSTBR_P4_S),
                    ('mold_cost_p5', MOLD_COSTBR_P5_S),
                    ('mold_cavities_p1', MOLD_CAVITIES_P1_S),
                    ('mold_cavities_p2', MOLD_CAVITIES_P2_S),
                    ('mold_cavities_p3', MOLD_CAVITIES_P3_S),
                    ('mold_info_p1', MOLD_INFO_P1_S),
                    ('mold_info_p2', MOLD_INFO_P2_S),
                ]
                for key, model in bloques:
                    cost_data = _clean_cost(data.get(key))
                    if cost_data:
                        # info tables and cavities use 'supplier' FK, others use 'Elaborated_by' string
                        if model in (MOLD_INFO_P1_S, MOLD_INFO_P2_S, DIE_TRIM_S, MOLD_CAVITIES_P1_S, MOLD_CAVITIES_P2_S, MOLD_CAVITIES_P3_S):
                            model.objects.update_or_create(id_rfq=rfq_base, supplier=request.user, defaults=cost_data)
                        else:
                            cost_data['Elaborated_by'] = proveedor_identificador
                            model.objects.update_or_create(id_rfq=rfq_base, Elaborated_by=proveedor_identificador, defaults=cost_data)

            elif rfq_base.type == 'die':
                bloques_die = [
                    ('die_cost_p1', DIE_COSTBR_P1_S),
                    ('die_cost_p2', DIE_COSTBR_P2_S),
                    ('die_cost_p3', DIE_COSTBR_P3_S),
                    ('die_cost_p4', DIE_COSTBR_P4_S),
                    ('die_trim_s', DIE_TRIM_S),
                ]
                for key, model in bloques_die:
                    cost_data = _clean_cost(data.get(key))
                    if cost_data:
                        # DIE P2, P3, P4 and TRIM_S use supplier, P1 uses Elaborated_by
                        if model in (MOLD_INFO_P1_S, MOLD_INFO_P2_S, DIE_TRIM_S, DIE_COSTBR_P2_S, DIE_COSTBR_P3_S, DIE_COSTBR_P4_S):
                            model.objects.update_or_create(id_rfq=rfq_base, supplier=request.user, defaults=cost_data)
                        else:
                            cost_data['Elaborated_by'] = proveedor_identificador
                            model.objects.update_or_create(id_rfq=rfq_base, Elaborated_by=proveedor_identificador, defaults=cost_data)

            if is_draft:
                estado_msg = "Cotizacion guardada como borrador."
            else:
                RFQ_Assignment.objects.filter(
                    id_rfq=rfq_base, supplier=request.user
                ).update(has_responded=True)

                if rfq_base.status == STATUS.SENT_TO_SUPPLIERS:
                    rfq_base.status = STATUS.WAITING_FOR_SUPPLIERS
                    rfq_base.save()
                    registrar_tracking_rfq(rfq_base, STATUS.WAITING_FOR_SUPPLIERS, request.user)

                estado_msg = "Cotizacion enviada oficialmente para revision."

            return Response({"mensaje": estado_msg, "id_rfq": rfq_base.id_rfq})

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── Dashboards ────────────────────────────────────────────────────────────────

def _build_time_series(range_param):
    """Return (dates, labels) for the requested time range."""
    today = timezone.now().date()
    if range_param == 'month':
        days = 30
        dates = [today - timedelta(days=i) for i in range(days - 1, -1, -1)]
        labels = [d.strftime('%b %d') for d in dates]
    elif range_param == 'quarter':
        # 12 weekly buckets
        dates = [today - timedelta(weeks=i) for i in range(11, -1, -1)]
        labels = [f"W{i+1}" for i in range(12)]
    else:  # week (default)
        days = 7
        dates = [today - timedelta(days=i) for i in range(days - 1, -1, -1)]
        labels = [d.strftime('%a') for d in dates]
    return dates, labels


class DashboardIndustrializacionView(APIView):
    permission_classes = [IsAuthenticated, IsIndUser]

    def get(self, request):
        range_param = request.query_params.get('range', 'week')
        all_rfqs = RFQ_Base.objects.all()

        borradores = all_rfqs.filter(status=STATUS.IND_DRAFT, submitted_for_review=False).count()
        pendientes_jefatura = all_rfqs.filter(status=STATUS.IND_DRAFT, submitted_for_review=True).count()
        enviados_a_compras = all_rfqs.filter(status__in=STATUS.PAST_IND).count()
        cerrados = all_rfqs.filter(status=STATUS.RFQ_CLOSED).count()

        distribucion = all_rfqs.values('type').annotate(total=Count('id_rfq'))
        data_distribucion = {item['type']: item['total'] for item in distribucion}

        # Lead time KPI
        lead_times_dias = []
        for rfq_id in all_rfqs.exclude(status=STATUS.IND_DRAFT).values_list('id_rfq', flat=True):
            t_ini = RFQ_Tracking.objects.filter(id_rfq_id=rfq_id, nivel_alcanzado=STATUS.IND_DRAFT).order_by('fecha_hora').first()
            t_fin = RFQ_Tracking.objects.filter(id_rfq_id=rfq_id, nivel_alcanzado=STATUS.SENT_TO_PURCHASES).order_by('fecha_hora').first()
            if t_ini and t_fin and t_fin.fecha_hora > t_ini.fecha_hora:
                lead_times_dias.append((t_fin.fecha_hora - t_ini.fecha_hora).total_seconds() / 86400.0)

        lead_time_promedio = sum(lead_times_dias) / len(lead_times_dias) if lead_times_dias else 0

        # Time-series data
        dates, labels = _build_time_series(range_param)

        # Drafts created per period
        drafts_per_period = []
        accepted_per_period = []
        declined_per_period = []
        draft_to_sent_per_period = []

        for d in dates:
            day_start = timezone.make_aware(
                timezone.datetime.combine(d, timezone.datetime.min.time())
            )
            day_end = day_start + timedelta(days=1)
            created = all_rfqs.filter(modified_date__gte=day_start, modified_date__lt=day_end).count()
            closed = all_rfqs.filter(
                status=STATUS.RFQ_CLOSED,
                modified_date__gte=day_start, modified_date__lt=day_end
            ).count()
            drafts_per_period.append(created)
            accepted_per_period.append(closed)
            declined_per_period.append(0)  # no rejection tracking yet

            # Average days for transitions on this day
            transitions = RFQ_Tracking.objects.filter(
                nivel_alcanzado=STATUS.SENT_TO_PURCHASES,
                fecha_hora__gte=day_start,
                fecha_hora__lt=day_end,
            )
            if transitions.exists():
                total_days = 0
                count = 0
                for t in transitions:
                    first_draft = RFQ_Tracking.objects.filter(
                        id_rfq_id=t.id_rfq_id, nivel_alcanzado=STATUS.IND_DRAFT
                    ).order_by('fecha_hora').values_list('fecha_hora', flat=True).first()
                    if first_draft:
                        total_days += (t.fecha_hora - first_draft).total_seconds() / 86400.0
                        count += 1
                avg_days = total_days / count if count > 0 else 0
                draft_to_sent_per_period.append(round(avg_days, 2))
            else:
                draft_to_sent_per_period.append(0)

        total_accepted = sum(accepted_per_period)
        total_drafts = sum(drafts_per_period)
        acceptance_rate = round(total_accepted / total_drafts * 100, 1) if total_drafts else 0

        return Response({
            "estado_requerimientos": {
                "en_borrador_lev2": borradores,
                "esperando_firma_jefe_lev3": pendientes_jefatura,
                "liberados_a_compras_lev4": enviados_a_compras,
                "proyectos_adjudicados_lev9": cerrados,
            },
            "distribucion_herramientas": data_distribucion,
            "kpis": {"lead_time_tecnico_dias": round(lead_time_promedio, 2)},
            # Time-series shape expected by frontend Dashboard.jsx
            "statusChangeData": {
                "labels": labels,
                "draftToSent": draft_to_sent_per_period,
                "createdToDraft": drafts_per_period,
                "stats": {
                    "avgDraftToSent": round(lead_time_promedio, 2),
                    "fastestDraftToSent": round(min(lead_times_dias), 2) if lead_times_dias else 0,
                    "slowestDraftToSent": round(max(lead_times_dias), 2) if lead_times_dias else 0,
                },
            },
            "rfqDistributionData": {
                "labels": labels,
                "drafts": drafts_per_period,
                "accepted": accepted_per_period,
                "declined": declined_per_period,
                "stats": {
                    "totalDrafts": total_drafts,
                    "totalAccepted": total_accepted,
                    "totalDeclined": 0,
                    "acceptanceRate": acceptance_rate,
                },
            },
        })


class DashboardComprasView(APIView):
    permission_classes = [IsAuthenticated, IsPurchasesUser]

    def get(self, request):
        range_param = request.query_params.get('range', 'week')
        all_rfqs = RFQ_Base.objects.all()

        bandeja_entrada = all_rfqs.filter(status=STATUS.SENT_TO_PURCHASES).count()
        en_cotizacion = all_rfqs.filter(status=STATUS.SENT_TO_SUPPLIERS).count()
        en_analisis = all_rfqs.filter(status=STATUS.WAITING_FOR_SUPPLIERS).count()
        listos_para_fallo = all_rfqs.filter(status=STATUS.SUPPLIER_SELECTED).count()

        total_asignaciones = RFQ_Assignment.objects.count()
        cotizaciones_recibidas = RFQ_Assignment.objects.filter(has_responded=True).count()
        tasa_respuesta = (cotizaciones_recibidas / total_asignaciones * 100) if total_asignaciones > 0 else 0

        tiempos_respuesta_horas = []
        rfqs_cotizados_ids = all_rfqs.filter(
            status__in=[STATUS.WAITING_FOR_SUPPLIERS, STATUS.SUPPLIER_SELECTED, STATUS.RFQ_CLOSED]
        ).values_list('id_rfq', flat=True)

        for rfq_id in rfqs_cotizados_ids:
            t6 = RFQ_Tracking.objects.filter(id_rfq_id=rfq_id, nivel_alcanzado=STATUS.SENT_TO_SUPPLIERS).order_by('fecha_hora').first()
            t7 = RFQ_Tracking.objects.filter(id_rfq_id=rfq_id, nivel_alcanzado=STATUS.WAITING_FOR_SUPPLIERS).order_by('fecha_hora').first()
            if t6 and t7 and t7.fecha_hora > t6.fecha_hora:
                tiempos_respuesta_horas.append((t7.fecha_hora - t6.fecha_hora).total_seconds() / 3600.0)

        tiempo_promedio = sum(tiempos_respuesta_horas) / len(tiempos_respuesta_horas) if tiempos_respuesta_horas else 0

        # Time-series data (mirrors structure from DashboardIndustrializacionView)
        dates, labels = _build_time_series(range_param)
        new_per_period = []
        published_per_period = []
        closed_per_period = []

        for d in dates:
            day_start = timezone.make_aware(
                timezone.datetime.combine(d, timezone.datetime.min.time())
            )
            day_end = day_start + timedelta(days=1)
            new_per_period.append(
                all_rfqs.filter(status=STATUS.SENT_TO_PURCHASES,
                                modified_date__gte=day_start, modified_date__lt=day_end).count()
            )
            published_per_period.append(
                all_rfqs.filter(status=STATUS.SENT_TO_SUPPLIERS,
                                modified_date__gte=day_start, modified_date__lt=day_end).count()
            )
            closed_per_period.append(
                all_rfqs.filter(status=STATUS.RFQ_CLOSED,
                                modified_date__gte=day_start, modified_date__lt=day_end).count()
            )

        return Response({
            "funnel_cotizaciones": {
                "nuevos_requerimientos_lev4": bandeja_entrada,
                "esperando_proveedores_lev6": en_cotizacion,
                "analisis_costos_lev7": en_analisis,
                "pendientes_autorizacion_lev8": listos_para_fallo,
            },
            "kpis": {
                "tasa_respuesta_proveedores": round(tasa_respuesta, 2),
                "tiempo_promedio_respuesta_horas": round(tiempo_promedio, 2),
            },
            "statusChangeData": {
                "labels": labels,
                "newToPublished": published_per_period,
                "publishedToClosed": closed_per_period,
                "stats": {
                    "avgResponseTime": round(tiempo_promedio, 2),
                    "responseRate": round(tasa_respuesta, 2),
                },
            },
            "rfqDistributionData": {
                "labels": labels,
                "drafts": new_per_period,
                "accepted": closed_per_period,
                "declined": [0] * len(labels),
                "stats": {
                    "totalDrafts": bandeja_entrada,
                    "totalAccepted": all_rfqs.filter(status=STATUS.RFQ_CLOSED).count(),
                    "totalDeclined": 0,
                    "acceptanceRate": round(tasa_respuesta, 2),
                },
            },
        })


class DashboardProveedorView(APIView):
    permission_classes = [IsAuthenticated, IsSupplier]

    def get(self, request):
        asignaciones = RFQ_Assignment.objects.filter(supplier=request.user)
        ids_rfqs = asignaciones.values_list('id_rfq_id', flat=True)

        rfqs = RFQ_Base.objects.filter(id_rfq__in=ids_rfqs)

        histograma = rfqs.annotate(
            mes=TruncMonth('modified_date')
        ).values('mes').annotate(total=Count('id_rfq')).order_by('mes')

        borradores = rfqs.filter(status__in=STATUS.SUPPLIER_ACTIVE).count()
        aceptados = asignaciones.filter(is_winner=True).count()
        declinados = asignaciones.filter(
            id_rfq__in=RFQ_Assignment.objects.filter(is_winner=True).exclude(
                supplier=request.user
            ).values_list('id_rfq_id', flat=True)
        ).count()

        success_rate = (aceptados / asignaciones.count() * 100) if asignaciones.count() > 0 else 0

        data_histograma = [
            {"mes": item['mes'].strftime('%Y-%m'), "total": item['total']}
            for item in histograma if item['mes']
        ]

        return Response({
            "histograma_mensual": data_histograma,
            "metricas": {
                "rfqs_en_borrador": borradores,
                "rfqs_ganados": aceptados,
                "rfqs_perdidos": declinados,
                "win_rate_porcentaje": round(success_rate, 2),
            },
        })
