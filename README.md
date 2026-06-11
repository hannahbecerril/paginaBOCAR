# BOCAR — Plataforma de Automatización de Compras (RFQ)

Aplicación web integral diseñada para automatizar el ciclo de vida de adquisiciones RFQ (Request for Quote) en BOCAR Group. La plataforma administra de manera eficiente las solicitudes de herramentales (moldes de inyección y troqueles de estampado) desde el diseño técnico en ingeniería interna, pasando por la cotización del proveedor, hasta el análisis final de costos y adjudicación.

---

## 🛠 Arquitectura y Tecnologías

La plataforma está construida sobre una robusta arquitectura cliente-servidor, utilizando un backend de API REST en JSON y un frontend responsivo tipo SPA (Single Page Application) en React.

- **Backend**: Django 5.2 + Django REST Framework (DRF)
- **Frontend**: React + Vite
- **Base de Datos**: SQLite (Desarrollo) / Listo para PostgreSQL (Producción)
- **Autenticación**: JWT mediante `djangorestframework-simplejwt` (Portales seguros y separados para personal interno y proveedores externos)
- **Gestión CORS**: `django-cors-headers`

---

## 📂 Estructura del Proyecto

```text
paginaBOCAR/
├── backend/
│   ├── api/                 # Modelos, Vistas, Serializadores y Permisos personalizados DRF
│   ├── core/                # Configuración del proyecto Django y URLs base
│   └── API_ROUTES.md        # Referencia exhaustiva de los endpoints de la API
├── frontend/                # Código fuente de la aplicación React
├── environment.yml          # Dependencias de entorno Conda
└── CLAUDE.md                # Referencia para desarrolladores y lineamientos arquitectónicos
```

---

## 📋 Requisitos Previos

Asegúrate de tener instaladas las siguientes herramientas antes de inicializar el proyecto:
- Python 3.11 + Conda / Miniconda
- Node.js + npm

---

## 🚀 Instalación y Configuración

### 1. Entorno Conda (Backend)
```bash
conda env create -f environment.yml
conda activate tc3005b-bocar
```

### 2. Inicialización del Backend
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py seed_users   # Genera las cuentas de rol por defecto en la base de datos
python manage.py runserver
# La API del backend estará disponible en http://127.0.0.1:8000
```

### 3. Inicialización del Frontend
```bash
cd frontend
npm install
npm run dev
# La aplicación frontend estará disponible en http://localhost:5173
```

---

## 👥 Control de Acceso Basado en Roles (RBAC)

El sistema impone un estricto control de acceso a través de Grupos de Django, asegurando que cada paso del proceso de adquisición sea manejado por el personal autorizado:

| Grupo de Rol | Nivel de Acceso y Capacidades |
|--------------|-------------------------------|
| `SuperAdmin` | Acceso total al sistema y permisos de sobrescritura administrativa. |
| `Industrialization` | Ingenieros técnicos que crean, detallan y editan los RFQs técnicos. |
| `Industrialization_Admin` | Gerentes que revisan, aprueban o rechazan los RFQs del equipo de ingeniería. |
| `Purchases` | Agentes de compras que asignan candidatos a proveedores y analizan las cotizaciones entrantes. |
| `Purchases_Admin` | Gerentes de compras que aprueban la lista final de proveedores y confirman la adjudicación. |
| `Supplier` | Vendedores externos que acceden a un portal seguro para enviar cotizaciones de RFQs asignados. |

---

## 🔄 Flujo de Vida del RFQ

Cada RFQ avanza a través de una máquina de estados estricta, completamente rastreada para la generación de KPIs:

1. **`industrialization_draft`**: El RFQ está siendo redactado por Ingeniería o está pendiente de revisión por el Admin de Industrialización.
2. **`sent_to_purchases`**: Aprobado por Ingeniería; ahora reside en la bandeja de entrada del departamento de Compras.
3. **`purchases_draft`**: El equipo de Compras está seleccionando y asignando proveedores potenciales.
4. **`sent_to_suppliers`**: Publicado en los portales de los proveedores seleccionados. A la espera de cotizaciones iniciales.
5. **`waiting_for_suppliers`**: Se ha recibido al menos una cotización. Compras puede comenzar el análisis preliminar.
6. **`supplier_selected`**: Compras ha elegido a un proveedor ganador, pendiente de la adjudicación final por gerencia.
7. **`rfq_closed`**: Adjudicación final confirmada. El RFQ se congela y sirve como dato histórico.

---

## 🗂 Categorías de RFQ

La aplicación ajusta dinámicamente formularios, tablas de base de datos y desgloses de costos según el tipo de herramienta requerida:

- **Mold (Moldes de Inyección)**: Requiere especificaciones técnicas detalladas (`MOLD_INFO`) y desgloses de costos en múltiples partes (`MOLD_COSTBR`).
- **Die (Troqueles de Estampado)**: Requiere especificaciones de corte (`DIE_TRIM`) y plantillas especializadas de costos de estampado.

---

## 🌐 Referencia de la API

El backend expone una API RESTful completamente documentada. Para revisar la referencia completa de endpoints, incluyendo esquemas de petición/respuesta, consulta:

👉 **[`backend/API_ROUTES.md`](backend/API_ROUTES.md)**

### Integraciones Clave
- **Inicio de Sesión Seguro y Dual**: Endpoints separados para inicios de sesión internos (estilo Active Directory) vs. inicios de sesión autenticados mediante HMAC-SHA256 para Proveedores.
- **Dashboards de KPIs**: Endpoints analíticos dedicados que generan estadísticas de progresión en tiempo real para Industrialización, Compras y la carga de trabajo de los Proveedores.
- **Comparativa de Cotizaciones**: Endpoints automatizados para el análisis de variación de costos lado a lado entre múltiples ofertas de proveedores.

---

*Esta documentación representa la versión final y lista para producción de la plataforma de automatización de compras desarrollada para BOCAR Group.*
