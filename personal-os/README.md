# Personal OS

Tu centro de organización personal: checklist diario, tareas, hábitos, gym,
fútbol, calendario, finanzas, objetivos y diario — todo en una sola app,
corriendo 100% local en tu computador.

Este es un proyecto **por etapas** (ver "Estado del proyecto" abajo). La
Etapa 1 ya está completa y funcionando de punta a punta.

## Stack técnico

- **Frontend:** React + Vite + Tailwind CSS v4
- **Backend:** Node.js + Express
- **Base de datos:** SQLite, vía el módulo nativo `node:sqlite` de Node.js
  (no requiere compilar nada, ni instalar SQLite por separado)

## Requisitos

- **Node.js 22.5 o superior** (necesario por `node:sqlite`). Verifica con:
  ```
  node -v
  ```
  Si tienes una versión menor, instala la última versión LTS desde
  https://nodejs.org

## Autenticación

La app está protegida con una contraseña única (no hay multi-usuario; está
pensada para uso personal).

- **Primera vez en local:** la contraseña por defecto es `cambiame123`.
  Cámbiala de inmediato en **Ajustes → Cambiar contraseña**.
- **En producción (Railway u otro servidor):** define la variable de
  entorno `APP_PASSWORD` con tu contraseña antes de desplegar. El backend
  la toma al iniciar y la guarda hasheada (con bcrypt) en la base de datos;
  el valor en texto plano nunca queda guardado.
- La sesión se guarda en una cookie segura (`httpOnly`), válida por 30 días.
- Para "resetear" la contraseña si la olvidaste: cambia la variable de
  entorno `APP_PASSWORD` y reinicia el servicio.

## Instalación

Desde la carpeta `personal-os/`:

```bash
./install.sh
```

Esto instala las dependencias del backend y del frontend. Si prefieres
hacerlo a mano:

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Cómo iniciar la aplicación (modo desarrollo local)

```bash
./start.sh
```

Esto levanta:
- Backend en `http://localhost:4000`
- Frontend en `http://localhost:5173`

Abre `http://localhost:5173` en tu navegador. Para detener todo, presiona
`Ctrl + C` en la terminal.

Si prefieres iniciar cada parte por separado (dos terminales):

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev
```

## Desplegar en Railway

En producción, el backend sirve también el frontend ya compilado desde el
mismo puerto (un solo servicio, un solo dominio) — así no hay que lidiar con
CORS ni con dos despliegues separados.

### Pasos

1. **Sube el proyecto a un repositorio de GitHub** (Railway despliega desde
   ahí). Asegúrate de que `node_modules`, `dist` y `*.db` no se suban (ya
   están en los `.gitignore` incluidos).

2. **Crea un nuevo proyecto en Railway** → "Deploy from GitHub repo" →
   selecciona el repositorio. Railway detectará el `package.json` de la
   raíz junto con `railway.json` y usará:
   - **Build command:** `npm run build` (compila el frontend)
   - **Start command:** `npm start` (instala dependencias del backend y
     arranca el servidor Express, que sirve también el frontend)

3. **Configura las variables de entorno** del servicio (pestaña
   *Variables*):
   | Variable | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `APP_PASSWORD` | tu contraseña elegida |
   | `JWT_SECRET` | una cadena larga y aleatoria (ej: genera una con `openssl rand -hex 32`) |
   | `DATA_DIR` | `/data` |

   No necesitas definir `PORT`: Railway lo inyecta automáticamente y el
   backend ya lo respeta.

4. **Agrega un volumen persistente** (pestaña *Volumes* del servicio):
   monta un volumen en la ruta `/data`. Ahí vivirá tu archivo
   `personal-os.db`. **Sin este paso, perderías todos tus datos cada vez
   que Railway redespliegue el servicio** (el sistema de archivos normal no
   es persistente).

5. **Genera un dominio público** (pestaña *Settings* → *Networking* →
   *Generate Domain*). Railway entrega HTTPS automáticamente, lo cual es
   necesario porque la cookie de sesión exige una conexión segura en
   producción.

6. Abre la URL que te dio Railway, ingresa con la contraseña que definiste
   en `APP_PASSWORD`, y listo.

### Actualizar la app más adelante

Cada `git push` a la rama conectada hace que Railway reconstruya y
redespliegue automáticamente. Tus datos no se pierden porque viven en el
volumen, no en el contenedor.

### Alternativa sin servidor en internet: red privada con Tailscale

Si prefieres no exponer la app a internet público, puedes dejarla corriendo
en tu propio computador (con `./start.sh` o como servicio) e instalar
[Tailscale](https://tailscale.com) en ese equipo y en tu celular. Así
accedes a `http://<IP-de-tailscale>:5173` desde cualquier lugar, como si
estuvieras en tu misma red local, sin necesidad de Railway, dominio ni
certificados.

## Estructura del proyecto

```
personal-os/
├── backend/
│   ├── server.js          # Servidor Express (sirve la API y, en prod, el frontend)
│   ├── middleware/
│   │   └── auth.js        # Verifica la sesión (JWT en cookie)
│   ├── db/
│   │   ├── database.js    # Conexión SQLite + datos por defecto + contraseña inicial
│   │   └── schema.sql     # Esquema completo de la base de datos
│   └── routes/             # Endpoints de la API por módulo (incluye auth.js)
├── frontend/
│   └── src/
│       ├── pages/          # Una página por módulo, incluye Login.jsx
│       ├── components/     # Sidebar, Card, ProgressRing, etc.
│       ├── api/client.js   # Cliente HTTP hacia el backend (con cookies)
│       └── utils/dates.js  # Helpers de fecha/hora en español
├── package.json            # Scripts de build/start para Railway (raíz)
├── railway.json             # Configuración de build/start para Railway
├── .env.example              # Variables de entorno necesarias
├── install.sh
└── start.sh
```

Todos los datos se guardan en `backend/db/personal-os.db`. Es un archivo
único: para respaldar tu información, basta con copiar ese archivo. Nada se
pierde al cerrar la aplicación.

## Estado del proyecto

Este proyecto se está construyendo por etapas para garantizar que cada parte
quede sólida y completamente funcional (un proyecto de esta magnitud no cabe
en una sola entrega).

**✅ Etapa 1 — Completa**
- Arquitectura completa del proyecto (frontend + backend + base de datos)
- Base de datos con el esquema completo de **todos** los módulos (ya
  preparada para las siguientes etapas, con relaciones correctas)
- **Login con contraseña** (sesión vía cookie segura, lista para producción)
- Diseño visual: oscuro, minimalista, estilo Apple/Notion/Linear
- Pantalla principal ("Hoy"): saludo, fecha, hora, frase motivacional,
  anillo de progreso diario, accesos a todos los módulos
- **Checklist diario** completo: crear, editar, eliminar, reordenar
  (drag & drop), marcar completado, historial persistente que no se borra
  al cambiar de día
- **Tareas variables** completas: crear, editar, eliminar, prioridad, fecha,
  mover de día, marcar completadas, filtros
- **Hábitos** completos: crear, eliminar, marcar el día, racha actual,
  racha máxima, porcentaje de cumplimiento (30 días)
- Ajustes básicos (nombre de usuario, cambio de contraseña)

**✅ Etapa 2 — Completa**
- **Gym**: rutina semanal configurable (un nombre de rutina por día, ej.
  Lunes → Pecho), registro de entrenamientos con múltiples ejercicios
  (series, repeticiones, peso, notas), historial completo, autocompletado
  de nombres de ejercicios ya usados, y gráfico de progreso de peso por
  ejercicio en el tiempo
- **Fútbol**: registro de partidos y entrenamientos (posición, minutos,
  goles, asistencias, estado físico, cómo me sentí, observaciones),
  estadísticas acumuladas (partidos, goles, asistencias, minutos) y filtros

**✅ Etapa 3 — Completa**
- **Calendario**: vistas mensual, semanal y diaria; crear, mover y eliminar
  eventos; eventos de todo el día; repeticiones (diaria, semanal, mensual)
  con expansión automática de ocurrencias en cada vista; colores por evento
- **Horario semanal fijo**: bloques de horario por día (Lunes a Domingo)
  con hora de inicio/fin, título y color, totalmente editable

**✅ Etapa 4 — Completa**
- **Finanzas personales**: registrar ingresos, gastos y transferencias, con
  categorías (editables y creables al vuelo); saldo calculado
  automáticamente para hoy, esta semana, este mes y este año; desglose de
  gastos por categoría del mes; filtros por tipo y buscador
- **Objetivos de ahorro**: crear metas con monto objetivo, ícono y fecha
  límite; aportar (o retirar) dinero a una meta; barra de progreso con
  porcentaje; se marca como cumplida automáticamente al alcanzar el monto

**✅ Etapa 5 — Completa (proyecto terminado)**
- **Registro diario**: entrada por día con "¿cómo estuvo mi día?", "¿qué
  hice bien?", "¿qué puedo mejorar?", y sliders de ánimo/energía/
  productividad; historial navegable por fecha
- **Dashboard de estadísticas**: racha activa más larga, tareas
  completadas, entrenamientos y goles de los últimos 30 días, objetivos
  cumplidos, saldo del mes, y un gráfico de cumplimiento diario (checklist
  vs. hábitos) de los últimos 14 días
- **Exportación a Excel (.xlsx)** con las 7 hojas solicitadas: Ingresos,
  Gastos, Resumen financiero (con fórmulas automáticas), Objetivos de
  ahorro (con % de avance), Entrenamientos, Hábitos y Calendario semanal
- **Tema claro/oscuro**, cambiable desde Ajustes
- **Exportar/importar todos los datos** en un archivo `.json` de respaldo
  completo, desde Ajustes
- **Respaldos automáticos**: cada vez que arranca el servidor se genera una
  copia de la base de datos (se conservan las últimas 7)
- **Buscador global** (`Cmd/Ctrl + K` o el botón "Buscar" en el menú)
  que busca en tareas, checklist, hábitos, gym, calendario, finanzas y
  objetivos a la vez
- Gestión de tareas fijas del checklist: ya estaba disponible desde la
  Etapa 1, directamente en la pantalla de Checklist diario

## Todos los módulos del proyecto original están completos:
Agenda/Calendario, Checklist, Registro diario, Hábitos, Rutinas/Horario,
Gym, Fútbol, Finanzas personales, Objetivos, Estadísticas y Exportación a
Excel — todo integrado en una sola aplicación, con login y lista para
producción (Railway).

**✅ Etapa 6 — Compras y Comidas semanales**
- **Compras**: lista de supermercado agrupada por categoría (Frutas y
  verduras, Carnes, Lácteos, Limpieza, etc.), marcar como comprado, limpiar
  los ya comprados de un clic
- **Comidas semanales**: planificador con Desayuno/Almuerzo/Cena/Snack para
  cada día de la semana, con ingredientes; botón para mandar los
  ingredientes de una comida directo a la lista de Compras
- Ambos módulos están incluidos en el buscador global, el respaldo
  (exportar/importar) y la exportación a Excel (2 hojas nuevas: "Compras"
  y "Comidas semanales", con 9 hojas en total)

## Notas de la base de datos

El archivo `backend/db/schema.sql` ya incluye las tablas de **todos** los
módulos del proyecto (gym, fútbol, calendario, horario, finanzas, objetivos,
diario), aunque las rutas de la API para esos módulos se irán agregando en
las próximas etapas. Así evitamos tener que migrar datos más adelante.
