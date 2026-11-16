# Estante · Instalación

App web instalable (PWA): el mismo código funciona como app en Android y como app de escritorio en Windows, Mac o Linux.
Para que la cámara funcione, la app tiene que abrirse desde una dirección **https**. GitHub Pages te da una gratis.

## 1. Publicarla en GitHub Pages (una sola vez, ~5 min)

1. Crea una cuenta en https://github.com si no tienes.
2. Arriba a la derecha: **+ → New repository** → nombre `estante` → **Public** → *Create repository*.
3. En la página del repo: **uploading an existing file** → arrastra **todo el contenido** de esta carpeta
   (`index.html`, `sw.js`, `manifest.webmanifest`, las carpetas `icons/` y `vendor/`) → *Commit changes*.
4. **Settings → Pages** → *Source: Deploy from a branch* → Branch `main`, carpeta `/ (root)` → *Save*.
5. En 1–2 minutos queda en: `https://TU-USUARIO.github.io/estante/`

Tus libros **no** se suben a GitHub: solo el código. Los datos se guardan en cada dispositivo.

## 2. Instalar en Android

1. Abre la dirección en **Chrome**.
2. Menú ⋮ → **Agregar a pantalla principal → Instalar**.
3. La primera vez que escanees, acepta el permiso de cámara.
   Si mantienes presionado el ícono aparece el atajo **Escanear**.

## 3. Instalar en la PC

1. Abre la misma dirección en **Chrome** o **Edge**.
2. Usa el ícono de instalar ⊕ en la barra de direcciones (o Menú → *Instalar Estante*).
3. Se abre en su propia ventana y queda en el menú Inicio o en el Dock.
   Sin webcam usa **Agregar → Foto del código**: sube una foto del código de barras que tomaste con el celular.

## 4. Pasar la colección entre el celular y la PC

**Ajustes → Exportar respaldo** genera un `.json` que puedes mandarte por Drive, WhatsApp o correo.
En el otro dispositivo usa **Ajustes → Importar / combinar**.
Al combinar se conserva la versión más reciente de cada título, y las bibliotecas que tengan el mismo nombre se juntan en una sola.

## 5. Claves opcionales (gratis)

- **Comic Vine** sirve para buscar cómics por título. Crea una cuenta en comicvine.gamespot.com, entra a `/api`, copia tu key y pégala en Ajustes.
- **Google Books** solo sirve para evitar el límite de consultas sin clave. En Google Cloud Console habilita *Books API*, crea una *API key* y pégala en Ajustes.

## Actualizar la app

Sube los archivos nuevos al repo, encima de los anteriores. La app se actualiza sola la siguiente vez que la abras con internet.
