# IGS Group USA — sitio web y precalificador de naves

Landing (español e inglés) + ficha de precalificación en línea con clasificación automática (guía interna v1.1 de IGS), PDF para el cliente y registro interno para IGS. Desarrollado por Elevatia.

## Qué hay
- `server.js` — Express: sirve `public/` y expone la API (`/api/precalificar`, `/api/solicitud`, `/api/precalificacion/:ref.pdf`, `/health`).
- `lib/clasificador.js` — motor de clasificación (matriz de puntos, reglas de prioridad, datos "por definir", bandas y estimado). Pruebas: `npm test`.
- `lib/pdf.js` — PDF del cliente (resumen, en el idioma de la ficha) y PDF interno (registro de clasificación).
- `lib/textos.js` — textos ES/EN.
- `public/` — landing ES (`/`), EN (`/en/`), formulario ES (`/precalificar/`) y EN (`/en/prequalify/`).
- `public/assets/js/site-config.js` — número de WhatsApp (vacío hasta que exista), correo, píxel de Meta y Google Analytics.

## Variables de entorno (Coolify)
| Variable | Uso |
|---|---|
| `PORT` | puerto (3000 por defecto) |
| `NODE_ENV=production` | caché de archivos estáticos (1 h) |
| `WEBHOOK_URL` | n8n: `https://n8n.elevatia.do/webhook/igs-web` (por defecto) |
| `CONFIG_URL` | n8n: `https://n8n.elevatia.do/webhook/igs-config` (por defecto) |
| `WEBHOOK_TOKEN` | debe coincidir con el nodo **Validar** del workflow "IGS Web - Formularios" |
| `EMPRESA_WHATSAPP` | número de WhatsApp de IGS en formato internacional (ej. `+1 305 555 0123`) cuando exista |
| `EMPRESA_CORREO` | correo de IGS (por defecto `sfernandez@igsgroupusa.com`) |

## Configuración editable por IGS
Google Sheet **"IGS Group USA - Precalificaciones web"**: hoja `Config` (umbrales de altura y luz, bandas por m², condición, vigencia, correo de aviso), hoja `Registro` (cada precalificación, con enlaces a los PDF en Drive) y hoja `Solicitudes` (suministros y contacto). El servidor relee `Config` cada 10 minutos.

## Desarrollo local
```bash
npm install
WEBHOOK_TOKEN=... node server.js   # http://localhost:3000
npm test
```
Para regenerar PDF de muestra: `node test/pdf-muestra.js /ruta/salida`.

## Despliegue
Coolify → nueva aplicación desde este repositorio (Dockerfile), puerto 3000, variables de entorno de arriba. El dominio (igsgroupusa.com) se apunta al servidor al final del proyecto.
