# ZonaGTA6TV V15 — ONE-CLICK PUBLISH READY

V15 convierte una noticia en un paquete de publicación completo desde el navegador.

## Flujo principal
1. Carga la IA gratuita.
2. En **NEWS RADAR**, pulsa **🔥 CREAR SHORT + VIDEO LARGO**.
3. V15 genera a partir de la misma noticia:
   - 🎬 Short MP4 9:16.
   - 📺 Video MP4 16:9.
   - 🖼️ Escenas/imágenes incorporadas.
   - 🎙️ Narración IA en español latino.
   - 📝 Subtítulos sincronizados.
   - 🔥 Título.
   - 📄 Descripción.
   - #️⃣ Hashtags.
   - 🔎 Keywords.
   - 💬 Comentario fijado.
   - 🔗 Fuentes detectadas por el radar.
4. Descarga automáticamente un ZIP organizado por carpetas.

## MP4
Chrome puede grabar Canvas + audio como WebM. V15 incorpora una conversión local con ffmpeg.wasm cuando hace falta, para entregar MP4. La primera conversión puede descargar aproximadamente 31 MB del núcleo WASM y consumir bastante CPU/RAM en Android.

## Importante
- La app no publica en YouTube de forma silenciosa. La subida sigue requiriendo tu autorización y acción en YouTube Studio/API.
- Las noticias marcadas como filtración/rumor siguen etiquetadas como no confirmadas.
- Revisa fuentes, derechos de imágenes/música/clips y metadata antes de publicar.
- Las imágenes IA usan un servicio externo de generación; el render y conversión de video se hacen en el navegador.
- Para uso local abre el proyecto mediante HTTPS/servidor local; algunos navegadores limitan APIs cuando se abre directamente como `file://`.
