import hmac
import hashlib
import json

# 1. Django
from django.conf import settings
from django.db import transaction
from django.db.models import Q  # <--- CORRECCIÓN: Q se importa de aquí, no de .models
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import User
from django.http import JsonResponse, FileResponse, Http404
import os
# 2. Django REST Framework y Terceros
from rest_framework import filters, status, viewsets, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework_simplejwt.tokens import RefreshToken

# 3. Importaciones Locales (Tu App)
from .permissions import IsSuperAdmin, IsIndAdmin, IsIndUser, IsPurchasesAdmin, IsPurchasesUser, IsSupplier
from .serializers import (
    ArchivoSerializer, UsuarioReadSerializer, UsuarioCreateSerializer,
    RFQBaseSerializer, ProveedorSerializer
)
from .models.base import RFQ_Assignment, Suppliers  # Lo mantenemos si no está en tu __init__.py de models
from .models import (
    RFQ_Base, Status_RFQ, 
    MOLD_INFO_P1_I, MOLD_INFO_P2_I, DIE_TRIM_I,
    MOLD_COSTBR_I, DIE_COSTBR_I,
    MOLD_COSTBR_P1_S, MOLD_COSTBR_P2_S, MOLD_COSTBR_P3_S, 
    MOLD_COSTBR_P4_S, MOLD_COSTBR_P5_S, Archivo,
    DIE_COSTBR_P1_S, DIE_COSTBR_P2_S, DIE_COSTBR_P3_S, DIE_COSTBR_P4_S,

)

User = get_user_model()


class FalloFinalGerencialView(APIView):
    """
    Endpoint PATCH para que el SuperAdmin de Compras apruebe o rechace 
    el fallo final (proveedor ganador) seleccionado por el comprador.
    """
    permission_classes = [IsAuthenticated, IsPurchasesAdmin]

    @transaction.atomic
    def patch(self, request, pk):
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)
        status_rfq = get_object_or_404(Status_RFQ, id_rfq=rfq_base.id_rfq)
        asignacion = get_object_or_404(RFQ_Assignment, id_rfq=rfq_base)

        # Validar que estemos en Nivel 8 (Pendiente de Fallo Gerencial)
        if not status_rfq.lev8:
            return Response(
                {"error": "El RFQ no está en espera de fallo gerencial (Nivel 8)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        accion = request.data.get('accion', '').lower()

        if accion == 'aprobar':
            status_rfq.lev8 = False
            status_rfq.lev9 = True
            mensaje = "Fallo aprobado. La licitación ha sido cerrada y adjudicada (Nivel 9)."
        
        elif accion == 'rechazar':
            status_rfq.lev8 = False
            status_rfq.lev7 = True
            # Borramos al candidato para obligar al comprador a elegir otro
            asignacion.winning_supplier = None
            asignacion.save()
            mensaje = "Fallo rechazado. Se ha revocado al proveedor candidato y el RFQ regresa a análisis de cotizaciones (Nivel 7)."
        
        else:
            return Response(
                {"error": "Acción inválida. Usa 'aprobar' o 'rechazar'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        status_rfq.save()

        return Response({
            "mensaje": mensaje,
            "id_rfq": rfq_base.id_rfq,
            "proveedor_ganador": asignacion.winning_supplier
        }, status=status.HTTP_200_OK)


class DescargarArchivoSeguroView(APIView):
    """
    Endpoint GET para descargar archivos físicos de forma segura.
    Evita la exposición directa de las URLs en el servidor web.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # Obtenemos el registro de la base de datos
        archivo_obj = get_object_or_404(Archivo, pk=pk)
        
        if not archivo_obj.archivo:
            raise Http404("El archivo no tiene una ruta física asociada.")

        # Construimos la ruta absoluta del sistema operativo
        file_path = archivo_obj.archivo.path
        
        if not os.path.exists(file_path):
            raise Http404("El archivo no se encuentra en el servidor.")

        # FileResponse maneja la transferencia en chunks, optimizando la memoria RAM
        response = FileResponse(open(file_path, 'rb'))
        # Forzamos la cabecera para que el navegador inicie la descarga con el nombre original
        response['Content-Disposition'] = f'attachment; filename="{archivo_obj.nombre}"'
        
        return response
class RFQAprobadosListView(generics.ListAPIView):
    serializer_class = RFQBaseSerializer
    permission_classes = [IsAuthenticated, IsPurchasesUser]

    def get_queryset(self):
        # 1. Buscamos los IDs de los RFQ que tengan el nivel correspondiente en True (ej. lev2)
        rfq_aprobados_ids = Status_RFQ.objects.filter(lev4=True).values_list('id_rfq', flat=True)
        
        # 2. Filtramos la tabla base usando esos IDs
        return RFQ_Base.objects.filter(id_rfq__in=rfq_aprobados_ids)

class ProveedorListView(generics.ListAPIView):
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated,IsPurchasesUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']

    def get_queryset(self):
        # Retorna solo usuarios que pertenezcan al grupo de proveedores y estén activos
        return User.objects.filter(groups__name='Supplier', is_active=True)

class AssignSuppliersRFQView(APIView):
    """
    BACK: Selección y Guardado de Proveedores Candidatos
    Guarda temporalmente la selección y la envía a gerencia (Nivel 5).
    """
    permission_classes = [IsAuthenticated, IsPurchasesUser]

    @transaction.atomic
    def put(self, request, pk):
        rfq = get_object_or_404(RFQ_Base, pk=pk)
        status_rfq, created = Status_RFQ.objects.get_or_create(id_rfq=rfq.id_rfq)
        
        if not status_rfq.lev4:
            return Response(
                {"error": "El RFQ no se encuentra en borrador de compras (Nivel 4)."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        proveedores_ids = request.data.get('proveedores_ids', [])
        if not isinstance(proveedores_ids, list) or not proveedores_ids:
            return Response(
                {"error": "Debes proporcionar un arreglo válido 'proveedores_ids'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        proveedores_validos = Suppliers.objects.filter(id__in=proveedores_ids)
        if proveedores_validos.count() != len(proveedores_ids):
            return Response(
                {"error": "Uno o más IDs de proveedores no son válidos."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Actualización relacional masiva en RFQ_Assignment
        RFQ_Assignment.objects.filter(id_rfq=rfq).delete()
        nuevas_asignaciones = [
            RFQ_Assignment(id_rfq=rfq, supplier=proveedor) 
            for proveedor in proveedores_validos
        ]
        RFQ_Assignment.objects.bulk_create(nuevas_asignaciones)

        # Inicializar tablas técnicas (Mold vs Die)
        if rfq.type == 'mold':
            for proveedor in proveedores_validos:
                MOLD_COSTBR_I.objects.get_or_create(id_rfq=rfq, supplier_id=proveedor.id)
        elif rfq.type == 'die':
            for proveedor in proveedores_validos:
                DIE_COSTBR_I.objects.get_or_create(id_rfq=rfq, supplier_id=proveedor.id)

        status_rfq.lev4 = False
        status_rfq.lev5 = True
        status_rfq.save()

        return Response({ 
            "message": f"Proveedores guardados para el RFQ {rfq.id_rfq}. Enviado a gerencia.",
            "cantidad_proveedores": proveedores_validos.count()
        }, status=status.HTTP_200_OK)

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

class CrearUsuarioView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UsuarioCreateSerializer
    # Reutilizamos la misma clase de Custom Permission (IsSuperAdmin) y exigimos autenticación
    permission_classes = [IsAuthenticated, IsSuperAdmin]



class CrearRFQView(APIView):
    permission_classes = [IsAuthenticated, IsIndUser]

    @transaction.atomic
    def post(self, request):
        data = request.data
        is_draft = data.get('is_draft', True)
        rfq_type = data.get('type') 
        
        if not is_draft:
            if not data.get('tool') or not rfq_type:
                return Response(
                    {"error": "Los campos 'tool' y 'type' son obligatorios para el envío definitivo."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            rfq_base = RFQ_Base.objects.create(
                created_by=request.user.username,
                tool=data.get('tool', ''),
                type=rfq_type
            )

            Status_RFQ.objects.create(
                id_rfq=rfq_base.id_rfq,
                lev1=True, 
                lev2=not is_draft
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
                raise ValueError("El tipo de RFQ es inválido. Debe ser 'mold' o 'die'.")

            estado_msg = "DRAFT_IND" if is_draft else "PENDING_IND_APPROVAL"
            
            return Response({
                "mensaje": f"RFQ {rfq_base.id_rfq} guardado exitosamente como {estado_msg}.",
                "id_rfq": rfq_base.id_rfq
            }, status=status.HTTP_201_CREATED)

        except TypeError as e:
            return Response({"error": f"Error de estructura en los datos: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class EditarRFQView(APIView):
    permission_classes = [IsAuthenticated, IsIndUser]

    @transaction.atomic
    def put(self, request, pk):
        # 1. Obtenemos los registros existentes
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)
        status_rfq = get_object_or_404(Status_RFQ, id_rfq=rfq_base.id_rfq)

        # 2. Validación crítica de negocio: 
        # Si ya se envió a proveedores (Nivel 6), bloqueamos cualquier edición.
        if status_rfq.lev6:
            return Response(
                {"error": "Edición bloqueada. El RFQ ya fue enviado a los proveedores."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data
        is_draft = data.get('is_draft', True)

        try:
            # 3. Actualizamos la tabla base si vienen esos datos
            if 'tool' in data:
                rfq_base.tool = data['tool']
            if 'type' in data:
                rfq_base.type = data['type']
            rfq_base.save()

            # 4. Máquina de estados
            if is_draft:
                # Si lo guardan como borrador, se queda en edición (Nivel 2)
                status_rfq.lev2 = True
                status_rfq.lev3 = False
                status_rfq.lev4 = False
            else:
                # Si lo envían definitivo, pasa a revisión del SuperAdmin de Ind. (Nivel 3)
                status_rfq.lev2 = False
                status_rfq.lev3 = True
                status_rfq.lev4 = False # Compras dejará de verlo temporalmente hasta que se apruebe
                
            status_rfq.save()

            # 5. Actualización dinámica de las tablas técnicas
            # Usamos .update() para que modifique los campos masivamente en una sola instrucción
            rfq_type = rfq_base.type
            if rfq_type == 'mold':
                mold_p1_data = data.get('mold_info_p1', {})
                if mold_p1_data:
                    MOLD_INFO_P1_I.objects.filter(id_rfq=rfq_base).update(**mold_p1_data)

                mold_p2_data = data.get('mold_info_p2', {})
                if mold_p2_data:
                    MOLD_INFO_P2_I.objects.filter(id_rfq=rfq_base).update(**mold_p2_data)

            elif rfq_type == 'die':
                die_trim_data = data.get('die_trim', {})
                if die_trim_data:
                    DIE_TRIM_I.objects.filter(id_rfq=rfq_base).update(**die_trim_data)

            estado_msg = "Borrador (Nivel 2)" if is_draft else "Pendiente Aprobación SuperAdmin Ind (Nivel 3)"

            return Response({
                "mensaje": f"RFQ {rfq_base.id_rfq} actualizado correctamente. Estado actual: {estado_msg}.",
                "id_rfq": rfq_base.id_rfq
            }, status=status.HTTP_200_OK)

        except TypeError as e:
            return Response({"error": f"Error de estructura en los datos: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class CotizacionProveedorView(APIView):
    """
    Endpoint para que el proveedor envíe su cotización técnica y económica.
    (Soporta 'mold' y 'die')
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)
        status_rfq, created = Status_RFQ.objects.get_or_create(id_rfq=rfq_base.id_rfq)

        if not status_rfq.lev6:
            return Response(
                {"error": "El RFQ no está habilitado para recibir cotizaciones o ya fue procesado."},
                 status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data
        is_draft = data.get('is_draft', True)
        proveedor_identificador = request.user.username 

        try:
            if rfq_base.type == 'mold':
                bloques = [
                    ('mold_cost_p1', MOLD_COSTBR_P1_S), ('mold_cost_p2', MOLD_COSTBR_P2_S),
                    ('mold_cost_p3', MOLD_COSTBR_P3_S), ('mold_cost_p4', MOLD_COSTBR_P4_S),
                    ('mold_cost_p5', MOLD_COSTBR_P5_S)
                ]
                for key, model in bloques:
                    cost_data = data.get(key, {})
                    if cost_data:
                        cost_data['Elaborated_by'] = proveedor_identificador
                        model.objects.update_or_create(
                            id_rfq=rfq_base, Elaborated_by=proveedor_identificador, defaults=cost_data
                        )

            elif rfq_base.type == 'die':
                bloques_die = [
                    ('die_cost_p1', DIE_COSTBR_P1_S), ('die_cost_p2', DIE_COSTBR_P2_S),
                    ('die_cost_p3', DIE_COSTBR_P3_S), ('die_cost_p4', DIE_COSTBR_P4_S)
                ]
                for key, model in bloques_die:
                    cost_data = data.get(key, {})
                    if cost_data:
                        cost_data['Elaborated_by'] = proveedor_identificador
                        model.objects.update_or_create(
                            id_rfq=rfq_base, Elaborated_by=proveedor_identificador, defaults=cost_data
                        )

            if is_draft:
                estado_msg = "Cotización guardada como borrador (Nivel 6)."
            else:
                status_rfq.lev6 = False
                status_rfq.lev7 = True
                status_rfq.save()
                self._notificar_entrega(rfq_base.id_rfq)
                estado_msg = "Cotización enviada oficialmente para revisión (Nivel 7)."

            return Response({"mensaje": estado_msg, "id_rfq": rfq_base.id_rfq}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _notificar_entrega(self, id_rfq):
        print(f"EVENTO: La cotización para el RFQ {id_rfq} ha sido entregada.")

class ComparativaCotizacionesView(APIView):
    """
    Historia 1: Análisis de Cotizaciones Recibidas.
    Permite al comprador comparar todas las ofertas económicas de un RFQ.
    """
    permission_classes = [IsAuthenticated, IsPurchasesUser]

    def get(self, request, pk):
        rfq = get_object_or_404(RFQ_Base, pk=pk)
        status_rfq = get_object_or_404(Status_RFQ, id_rfq=rfq.id_rfq)

        if not status_rfq.lev7:
            return Response(
                {"error": "El RFQ no está en fase de análisis (Nivel 7)."},
                status=status.HTTP_400_BAD_REQUEST
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
                "datos": {f"parte_{i+1}": m.objects.filter(id_rfq=rfq, Elaborated_by=username).values().first() 
                          for i, m in enumerate(modelos)}
            }
            resultado.append(oferta)

        return Response({"id_rfq": rfq.id_rfq, "tipo": rfq.type, "comparativa": resultado}, status=status.HTTP_200_OK)
        
class BuzonProveedorListView(generics.ListAPIView):
    """
    BACK: Buzón de RFQS Asignadas para el Proveedor
    Retorna exclusivamente los RFQs en estado PUBLISHED_TO_SUPPLIERS (lev6)
    donde el request.user esté asignado.
    """
    # Asegúrate de tener RFQBaseSerializer importado
    serializer_class = RFQBaseSerializer 
    permission_classes = [IsAuthenticated, IsSupplier]

    def get_queryset(self):
        # Usamos el ID del usuario logueado (el proveedor que hace la petición)
        proveedor_id = self.request.user.id

        # 1. Encontrar los IDs de los RFQs donde este proveedor fue invitado
        # Buscamos directamente en la tabla relacional RFQ_Assignment
        asignaciones_ids = RFQ_Assignment.objects.filter(
            supplier_id=proveedor_id
        ).values_list('id_rfq', flat=True)

        # 2. Validar estados: De esas asignaciones, filtrar SOLO las que estén en Nivel 6
        rfqs_publicados_ids = Status_RFQ.objects.filter(
            id_rfq__in=asignaciones_ids,
            lev6=True
        ).values_list('id_rfq', flat=True)

        # 3. Retornar la consulta final con la información del RFQ_Base
        return RFQ_Base.objects.filter(id_rfq__in=rfqs_publicados_ids)

class AprobarRechazarProveedoresView(APIView):
    """
    Endpoint PATCH para que el SuperAdmin de Compras apruebe o rechace 
    la lista de proveedores seleccionados para un RFQ.
    Transiciona el estado de lev5 a lev6 (Aprobado) o regresa a lev4 (Rechazado).
    """
    permission_classes = [IsAuthenticated, IsPurchasesAdmin]

    @transaction.atomic
    def patch(self, request, pk):
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)
        status_rfq = get_object_or_404(Status_RFQ, id_rfq=rfq_base.id_rfq)

        if not status_rfq.lev5:
            return Response(
                {"error": "El RFQ no está en espera de autorización de gerencia de compras (Nivel 5)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        accion = request.data.get('accion', '').lower()

        if accion == 'aprobar':
            status_rfq.lev5 = False
            status_rfq.lev6 = True
            mensaje = "Lista de proveedores aprobada. El RFQ ha sido publicado a los proveedores (Nivel 6)."
        
        elif accion == 'rechazar':
            status_rfq.lev5 = False
            status_rfq.lev4 = True
            mensaje = "Lista rechazada. El RFQ ha sido devuelto a los compradores para una nueva selección (Nivel 4)."
        
        else:
            return Response(
                {"error": "Acción inválida. Usa 'aprobar' o 'rechazar'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        status_rfq.save()

        return Response({
            "mensaje": mensaje,
            "id_rfq": rfq_base.id_rfq
        }, status=status.HTTP_200_OK)
    
class RFQPendientesAprobacionComprasListView(generics.ListAPIView):
    """
    Endpoint GET para que el SuperAdmin de Compras vea la lista 
    de RFQs que están esperando su autorización de proveedores (Nivel 5).
    """
    serializer_class = RFQBaseSerializer
    permission_classes = [IsAuthenticated, IsPurchasesAdmin]

    def get_queryset(self):
        # 1. Buscamos los IDs de los RFQ que están en Nivel 5
        rfqs_pendientes_ids = Status_RFQ.objects.filter(lev5=True).values_list('id_rfq', flat=True)
        
        # 2. Retornamos la info base de esos RFQs
        return RFQ_Base.objects.filter(id_rfq__in=rfqs_pendientes_ids)

class ReviewRFQIndView(APIView):
    """
    Endpoint: Aprobación o Rechazo de RFQs por el SuperAdmin de Industrialización.
    Soporta validación de integridad para tipos 'mold' y 'die'.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, pk):
        # 1. Validación de Permisos
        grupos_usuario = request.user.groups.values_list('name', flat=True)
        if 'Industrialization_Admin' not in grupos_usuario and 'SuperAdmin' not in grupos_usuario:
            return Response(
                {"error": "Acceso denegado. Se requiere rol de Administrador de Industrialización."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Obtener el RFQ y su estado
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)
        status_rfq = get_object_or_404(Status_RFQ, id_rfq=rfq_base.id_rfq)

        # 3. Validar fase actual (Nivel 3: Pendiente de revisión)
        if not status_rfq.lev3:
            return Response(
                {"error": "El RFQ no está en estado pendiente de revisión (Nivel 3)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_approved = request.data.get('is_approved')
        if is_approved is None:
            return Response(
                {"error": "Se requiere el campo 'is_approved' (booleano)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Lógica de Aprobación con validación de tipo
        if str(is_approved).lower() in ['true', '1', 't', 'y', 'yes']:
            
            # Verificación de integridad según el tipo de RFQ
            if rfq_base.type == 'mold':
                # Verifica que existan registros en las tablas de moldes
                if not MOLD_INFO_P1_I.objects.filter(id_rfq=rfq_base).exists():
                    return Response({"error": "No se puede aprobar: Faltan datos técnicos del Molde (P1)."}, status=status.HTTP_400_BAD_REQUEST)
            
            elif rfq_base.type == 'die':
                # Verifica que existan registros en las tablas de troqueles (Die)
                if not DIE_TRIM_I.objects.filter(id_rfq=rfq_base).exists():
                    return Response({"error": "No se puede aprobar: Faltan datos técnicos del Troquel (Die)."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Transición a Nivel 4 (Enviado a Compras)
            status_rfq.lev3 = False
            status_rfq.lev4 = True
            estado_msg = "APPROVED_BY_IND (Aprobado y transferido a Compras)"
        
        else:
            # RECHAZADO -> Regresa a Nivel 2 (Borrador para corrección)
            status_rfq.lev3 = False
            status_rfq.lev2 = True
            estado_msg = "DRAFT_IND (Rechazado, regresó a edición)"

        status_rfq.save()

        return Response({
            "mensaje": f"RFQ {rfq_base.id_rfq} ({rfq_base.type}) evaluado correctamente.",
            "id_rfq": rfq_base.id_rfq,
            "estado_actual": estado_msg
        }, status=status.HTTP_200_OK)
    
class SelectWinningSupplierView(APIView):
    """
    Endpoint: Selección de Proveedor y Envío a Validación
    Método: PATCH
    Cuerpo esperado: {"proveedor_id": "12"}
    """
    permission_classes = [IsAuthenticated, IsPurchasesUser]

    @transaction.atomic
    def patch(self, request, pk):
        # 1. Obtener RFQ, Estado y Asignaciones
        rfq_base = get_object_or_404(RFQ_Base, pk=pk)
        status_rfq = get_object_or_404(Status_RFQ, id_rfq=rfq_base.id_rfq)

        # 2. Validar que estemos en Nivel 7 (Respondido por proveedor)
        if not status_rfq.lev7:
            return Response(
                {"error": "El RFQ no está en la fase de selección (Nivel 7)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Obtener el ID enviado en la petición
        proveedor_id = request.data.get('proveedor_id')
        if not asignacion:
            return Response(
                {"error": "Se requiere el campo 'proveedor_id' en el cuerpo de la petición."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Limpiar posibles ganadores previos (por si el comprador cambia de decisión antes de aprobar)
        RFQ_Assignment.objects.filter(id_rfq=rfq_base, is_winner=True).update(is_winner=False)
        asignacion.is_winner = True
        asignacion.save()

        # 7. Actualizar la máquina de estados a Nivel 8 (Pendiente de Fallo Gerencial)
        status_rfq.lev7 = False
        status_rfq.lev8 = True
        status_rfq.save()

        return Response({
            "mensaje": f"Proveedor marcado como ganador virtual. RFQ enviado a validación gerencial (Nivel 8).",
            "id_rfq": rfq_base.id_rfq
        }, status=status.HTTP_200_OK)
