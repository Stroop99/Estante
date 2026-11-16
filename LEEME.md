# Estante · Instalación y fuentes de datos

App web instalable (PWA): el mismo código funciona en Android y en la PC.
Ya está publicada en https://stroop99.github.io/Estante/

## Actualizar a esta versión

1. En github.com/Stroop99/Estante entra a **Add file → Upload files**.
2. Arrastra `index.html`, `sw.js`, `worker.js` y `LEEME.md` → **Commit changes**. Los archivos con el mismo nombre se reemplazan.
3. Espera 1 o 2 minutos y abre la app con internet. La versión nueva carga sola.

---

## Paso 1 · Clave de Google Books (lo más importante, ~3 min)

Sin clave, Google comparte un límite de consultas con todo el mundo y casi siempre lo rechaza. Esa era la causa de que no encontrara nada.

1. Entra a https://console.cloud.google.com con tu cuenta de Google y acepta los términos.
2. Arriba, en el selector de proyecto, elige **Nuevo proyecto** → nombre `Estante` → **Crear**.
3. Abre https://console.cloud.google.com/apis/library/books.googleapis.com → **Habilitar**.
4. Ve a **APIs y servicios → Credenciales → + Crear credenciales → Clave de API**. Copia la clave (empieza con `AIza…`).
5. En esa misma clave entra a **Editar clave de API**:
   - *Restricciones de aplicaciones* → **Sitios web** → agrega `https://stroop99.github.io/*`
   - *Restricciones de API* → **Restringir clave** → marca solo **Books API** → **Guardar**.
6. En la app, abre **Ajustes → 1 · Google Books** y pega la clave.

La restricción del paso 5 hace que nadie más pueda usar tu clave aunque la vea.

## Paso 2 · Tu servidor gratuito para más bases (opcional, ~10 min)

Hardcover (libros) y UPCitemdb (códigos de barras de tiendas, incluye cómics) no aceptan consultas directas desde una app web.
Un Cloudflare Worker, gratis, las hace por ti.

**a) Token de Hardcover**
1. Crea una cuenta en https://hardcover.app.
2. Abre https://hardcover.app/account/api y copia el token.

**b) Crear el Worker**
1. Crea una cuenta gratis en https://dash.cloudflare.com.
2. Ve a **Workers y Pages → Crear → Worker → "Hello World"**, ponle de nombre `estante-proxy` y presiona **Desplegar**.
3. Presiona **Editar código**, borra todo lo que hay, pega el contenido completo de `worker.js` y presiona **Desplegar**.
4. En el Worker ve a **Configuración → Variables y secretos → Agregar**:
   - Tipo **Secreto**, nombre `HARDCOVER_TOKEN`, valor: tu token de Hardcover → **Desplegar**.
5. Copia la URL del Worker. Se ve así: `https://estante-proxy.TU-USUARIO.workers.dev`
6. En la app, abre **Ajustes → 2 · Tu servidor**, pega la URL y presiona **Probar conexión**. Debe decir ✅ Conectado · Hardcover ✓.

## Paso 3 · Comic Vine (opcional)

Sirve para buscar cómics por título.
1. Crea una cuenta en https://comicvine.gamespot.com/api/ y copia tu clave.
2. Pégala en **Ajustes → 3 · Comic Vine**.

## Diagnóstico

Si un libro no aparece, entra a **Ajustes → Diagnóstico** y escribe su ISBN.
Verás la respuesta de cada base: lo encontró, no lo tiene, o falló y por qué (clave, límite de consultas, conexión).
La misma información aparece en el aviso de "No encontré", en *Qué respondió cada base*.

## Instalar

- **Android:** abre el link en Chrome → Menú ⋮ → **Agregar a pantalla principal → Instalar**.
- **PC:** abre el link en Chrome o Edge → ícono ⊕ en la barra de direcciones → **Instalar**.

## Pasar la colección entre celular y PC

En un dispositivo usa **Ajustes → Exportar respaldo**. En el otro usa **Ajustes → Importar / combinar**.
