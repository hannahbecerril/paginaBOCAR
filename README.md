# Proyecto Web de Automatización de Procesos

Este repositorio contiene el desarrollo de una aplicación web orientada a la automatización de procesos mediante la carga, procesamiento y visualización de datos.

La arquitectura del sistema sigue un enfoque cliente-servidor, separando claramente el backend y el frontend para facilitar el desarrollo colaborativo, la escalabilidad y el mantenimiento.

---

## Arquitectura

El sistema está dividido en dos componentes principales:

- Backend: API REST desarrollada con Django y Django REST Framework
- Frontend: Aplicación web desarrollada en React (en proceso)

El backend se encarga de:
- Gestión de datos mediante ORM
- Exposición de endpoints REST
- Procesamiento de información

El frontend se encarga de:
- Interfaz de usuario
- Consumo de la API
- Visualización de datos

---

## Estructura del Proyecto

```
proyecto/
 ├── backend/       # Aplicación Django (API REST)
 ├── frontend/      # Aplicación React
 ├── environment.yml
 ├── .gitignore
 └── README.md
```

---

## Requisitos

- Python 3.11
- Conda / Miniconda
- Node.js y npm

---

## Configuración del entorno

Crear el entorno a partir del archivo de configuración:

```bash
conda env create -f environment.yml
```

Activar el entorno:

```bash
conda activate tc3005b-bocar
```

---

## Ejecución del backend

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

El servidor estará disponible en:

```
http://127.0.0.1:8000/
```

---

## Endpoints iniciales

El backend expone endpoints REST que serán consumidos por el frontend:

```
GET  /api/hola/
GET  /api/archivos/
POST /api/archivos/
```

---

## Ejecución del frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Flujo de trabajo

- El backend proporciona una API REST basada en JSON
- El frontend consume los endpoints mediante HTTP
- La comunicación entre servicios se habilita mediante configuración de CORS
- El desarrollo se realiza de manera independiente por componente

---

## Funcionalidades (en desarrollo)

- Carga de archivos (CSV, Excel)
- Procesamiento de datos
- Persistencia mediante ORM
- Visualización de información en dashboards
- Automatización de procesos basados en datos

---

## Colaboración

El repositorio está estructurado para trabajo en equipo:

- Backend: definición de modelos, lógica de negocio y endpoints
- Frontend: desarrollo de interfaz y consumo de servicios

Se recomienda el uso de ramas para nuevas funcionalidades.

---

## Consideraciones

- No incluir archivos generados o dependencias:
  - db.sqlite3
  - node_modules/
  - entornos virtuales

- El entorno debe reproducirse mediante el archivo `environment.yml`

---

## Estado del proyecto

En desarrollo. Se cuenta con la estructura base del backend y endpoints iniciales listos para integración con el frontend.

---

## Objetivo

Desarrollar una plataforma que permita automatizar procesos mediante el análisis y gestión de datos, facilitando la toma de decisiones y optimizando flujos operativos.