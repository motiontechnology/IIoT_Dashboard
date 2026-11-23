# IIoT Dashboard

Dashboard web para la visualizacion y el monitoreo de variables industriales de campo.
El proyecto esta pensado como una interfaz de integracion con plataformas como n8n e
Ignition, utilizando inicialmente datos simulados y archivos JSON como estructura temporal
para avanzar el desarrollo.

> Estado del proyecto: prototipo funcional. Los detalles finales de arquitectura,
> seguridad, fuentes de datos, protocolos y despliegue aun deben definirse.

## Objetivo

Proporcionar una interfaz centralizada para:

- Visualizar variables de activos industriales en tiempo real.
- Mostrar tendencias historicas en una ventana corta.
- Consultar tags dentro de una estructura de Unified Namespace.
- Administrar y consultar eventos o fallas.
- Validar flujos de navegacion, autenticacion, roles e interfaces antes de integrar
  servicios industriales reales.

Las conexiones definitivas con n8n e Ignition estan pendientes. La aplicacion actual no
consume APIs externas ni servicios de planta.

## Estado actual

### Implementado

- Inicio de sesion protegido en el frontend.
- Usuarios definidos en `public/users.json`.
- Roles `admin` y `user`.
- Sesion persistida temporalmente con `sessionStorage`.
- Simulacion local de telemetria cada segundo.
- Historial visual de 30 muestras.
- Tarjetas KPI.
- Grafica de variables con Recharts.
- Selector de activos.
- Panel de eventos y fallas.
- Simulacion de sobrecorriente para el rol administrador.
- Pausa y reanudacion del flujo de datos.
- Reconocimiento de alarmas disponible para administradores.
- Vista de tags con temas, registros, valores y calidad.
- Cambio de idioma entre Espanol e Ingles mediante JSON.
- Tema claro y tema oscuro.
- Persistencia de idioma y tema mediante `localStorage`.

### Pendiente de definicion

- Conexion real con Ignition.
- Conexion real con n8n.
- Uso de OPC UA, MQTT, Sparkplug B, Modbus TCP, APIs o WebSockets.
- Modelado definitivo de activos, sitios y variables.
- Persistencia de usuarios y contrasenas en un backend seguro.
- Autenticacion mediante token, sesion de servidor o proveedor externo.
- Base de datos historica y estrategia de retencion.
- Gestion avanzada de permisos.
- Actualizacion de estados de activos y calidad de datos.
- Automatizacion de notificaciones y escalamiento de alarmas.
- Configuracion de entornos de desarrollo, pruebas y produccion.
- Despliegue, certificados, proxy y politicas de red.
- Pruebas unitarias y de integracion.

## Roles

| Rol | Acceso actual |
| --- | --- |
| `admin` | Accede al dashboard, simula fallas, controla la transmision y reconoce alarmas |
| `user` | Accede al dashboard y consulta datos, sin controles administrativos |

Credenciales temporales:

| Rol | Usuario | Contrasena |
| --- | --- | --- |
| Administrador | `admin` | `admin123` |
| Usuario | `user` | `user123` |

> Estas credenciales son exclusivamente para el prototipo. No deben utilizarse en
> produccion y no representan un mecanismo seguro de autenticacion.

## Internacionalizacion

Los textos se encuentran separados por idioma en:

- `public/locales/es.json`
- `public/locales/en.json`

El selector cambia el idioma y guarda la preferencia en `localStorage`.

## Activos y telemetria

Los activos temporales se encuentran en `src/hooks/useTelemetryStream.ts`:

- Main Conveyor Drive.
- Packaging Cell Controller.
- Exhaust Blower VFD.

Las variables simuladas son:

- Corriente de salida.
- Frecuencia de salida.
- Voltaje del bus DC.
- Temperatura IGBT.
- Velocidad del motor.

El generador actual produce un nuevo punto cada segundo y conserva un historial de hasta
30 puntos por activo. Las alarmas se generan cuando la corriente supera el 115 % de la
corriente nominal.

## Estructura del proyecto

```text
public/
  locales/
    es.json
    en.json
  users.json
src/
  assets/
  hooks/
    useTelemetryStream.ts
  types/
    telemetry.ts
  App.tsx
  App.css
  index.css
  main.tsx
```

## Tecnologias actuales

- React 19.
- TypeScript.
- Vite.
- Tailwind CSS.
- Recharts.
- Lucide React.

## Ejecucion local

Instalar dependencias:

```powershell
npm install
```

Iniciar el entorno de desarrollo:

```powershell
npm run dev
```

Comandos disponibles:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

## Integracion prevista

La integracion puede dividirse en etapas:

1. Definir el modelo de activos, sitios, variables, unidades y estados.
2. Definir el origen y el formato de datos que entregara Ignition.
3. Definir los flujos y los contratos de datos que gestionara n8n.
4. Seleccionar el transporte principal: MQTT/Sparkplug, OPC UA, API, WebSocket o una
   combinacion segun el caso.
5. Sustituir `useTelemetryStream` por adaptadores reales de datos.
6. Agregar autenticacion y autorizacion en backend.
7. Incorporar almacenamiento historico y gestion de alarmas.
8. Configurar entornos y despliegue.

## Alcance de seguridad del prototipo

El sistema actual es una maqueta frontend:

- Las contrasenas estan visibles en un archivo publico.
- La validacion ocurre solamente en el navegador.
- Las rutas no tienen proteccion real contra manipulacion del navegador.
- Los permisos del frontend deben replicarse en cualquier API o backend futuro.

No incorporar el sistema actual como solucion de produccion sin implementar autenticacion
servidor, manejo seguro de secretos, HTTPS y autorizacion centralizada.
