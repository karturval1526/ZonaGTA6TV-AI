# ZonaGTA6TV Free AI Content Factory

Versión gratuita y móvil de la fábrica de contenido.

## Qué usa
- WebLLM para ejecutar un modelo abierto directamente en el navegador.
- Modelo inicial: Qwen2.5-1.5B-Instruct-q4f16_1-MLC.
- CPU/WASM para acelerar la IA cuando el teléfono lo permite.
- LocalStorage para guardar proyectos.
- PWA instalable.
- Sin OpenAI API.
- Sin API keys.
- Sin OAuth de YouTube.
- Sin servidor obligatorio.

## Importante
El primer uso descarga el modelo al navegador. El modelo ocupa alrededor de 1.6 GB de memoria/recursos según la variante; el teléfono necesita suficiente memoria y un navegador compatible con CPU/WASM.

La generación de vídeo MP4 completo no se fuerza automáticamente en teléfonos porque FFmpeg WASM puede ser pesado. La app prepara guion, escenas, subtítulos SRT, metadatos y recursos para edición/exportación. Se incluye un generador de storyboard visual y descarga de paquetes.

## Instalación en GitHub Pages desde el teléfono
1. Crea un repositorio nuevo en GitHub.
2. Sube todos los archivos de este ZIP a la raíz.
3. Ve a Settings > Pages.
4. Selecciona Deploy from a branch.
5. Selecciona `main` y `/ (root)`.
6. Guarda.
7. Abre la URL de Pages desde Chrome.
8. Pulsa "Instalar app" cuando el navegador lo permita.

GitHub Pages solo sirve los archivos; la IA se ejecuta en el navegador del teléfono.

## Si aparece "CPU/WASM no disponible"
Prueba Chrome actualizado. Si tu dispositivo/navegador no ofrece CPU/WASM, esta versión no puede ejecutar el modelo localmente. No se incluye una API de pago como respaldo, para mantener el proyecto $0.

## Uso
1. Pulsa "Cargar IA".
2. Espera a que termine la descarga inicial.
3. Elige tema, tipo de vídeo y duración.
4. Pulsa "Crear contenido".
5. Revisa/edita el guion.
6. Genera más piezas desde el mismo proyecto.
7. Exporta el paquete ZIP con guion, SRT, descripción, hashtags y storyboard.



## v4 — Video real desde Android
- Genera un video vertical desde el contenido creado.
- Permite seleccionar hasta 6 imágenes del teléfono.
- Renderiza con Canvas + MediaRecorder en el propio navegador.
- No requiere GPU, OpenAI ni API de video.
- Chrome Android normalmente entrega WebM; si el navegador soporta MP4 nativo, se entrega MP4.


## v5 — AI Image Factory + viral-retention workflow

- Genera imágenes verticales IA a partir del storyboard.
- Modelos seleccionables: Z-Image Turbo o FLUX.
- Las imágenes generadas pasan directamente al renderizador de video.
- El guion pide hooks inmediatos, open loops, micro-recompensas y cambios visuales frecuentes para favorecer la retención.
- Esto optimiza el contenido para descubrimiento y retención, pero ninguna herramienta puede garantizar que un video se vuelva viral.
- La generación de imágenes usa el endpoint público de Pollinations; está sujeto a disponibilidad, límites y cambios del servicio.

\n## v6 — Shorts Factory
Un botón produce un paquete de Short: guion, storyboard, imágenes, subtítulos SRT, video vertical y metadata en ZIP.
La narración exportable depende de las capacidades del navegador; esta versión no falsifica un MP3 cuando Chrome no permite capturar SpeechSynthesis como archivo.

\n## v7 — Voz IA + subtítulos sincronizados
- Narración local con Kokoro-82M vía kokoro-js/Transformers.js.
- Voces españolas: em_alex, em_santa y ef_dora.
- Estilo energético sutil mediante velocidad configurable.
- WAV descargable.
- El render combina pista de video y audio generado.
- Subtítulos grandes se sincronizan con la duración real de la narración.
- La primera carga del modelo de voz puede ser pesada y lenta en CPU/WASM; el modelo se cachea después.


## v8 — Español Latino
La configuración de voz está orientada a español latinoamericano/neutro, evitando el perfil castellano de España. El selector intenta identificar voces LATAM disponibles y conserva un fallback en español cuando el navegador/modelo no expone una voz LATAM específica.


## v10 — LATINO VIRAL MONETIZABLE
La narración usa Kokoro-82M v1.0 con voces oficiales en español (`em_alex`, `ef_dora`, `em_santa`) mediante `kokoro-js`. El modelo y las voces oficiales se publican bajo Apache-2.0, que permite uso comercial conforme a sus términos.

- Generación local en el navegador.
- WebGPU cuando está disponible y WASM como alternativa.
- Voz masculina latina Alex por defecto.
- Ritmo viral 1.06x, configurable.
- WAV descargable y subtítulos sincronizados.
- No requiere una API key de voz.
- La licencia del TTS no garantiza por sí sola la monetización: YouTube/TikTok y otras plataformas aplican sus propias políticas de monetización y contenido.

**Atribución:** Kokoro-82M / kokoro-js. Consulta los avisos de licencia de terceros antes de redistribuir el software o sus dependencias.

## v10.1 — PRODUCCIÓN MASIVA AUTOMÁTICA
Ahora incluye una cola de producción automática. En **Producción Masiva Automática** pega hasta 20 temas, uno por línea, elige Short o video largo, duración e imágenes y pulsa **INICIAR PRODUCCIÓN AUTOMÁTICA**.

La aplicación procesa cada tema secuencialmente y descarga automáticamente un ZIP al terminar cada pieza. No hace publicaciones automáticas en YouTube/TikTok/Facebook y no garantiza viralidad o monetización. La publicación sigue siendo una acción separada.

## v11 — AUTOPILOT
La versión 11 añade un modo Autopilot para que el usuario no tenga que escribir los temas uno por uno.

- Genera automáticamente hasta 20 ideas de GTA 6 desde un banco local de temas.
- Un clic prepara la cola y comienza la producción.
- Puede producir solo Shorts, solo videos largos o alternar ambos.
- Mantiene la voz Kokoro en español latino y la producción secuencial.
- Cada pieza sigue exportándose como paquete ZIP.
- El modo automático no afirma que una idea sea una noticia actual. Para noticias de última hora, el usuario debe proporcionar o conectar una fuente de noticias antes de producir.
- El navegador/teléfono debe permanecer activo durante la producción; Android puede suspender una pestaña en segundo plano y detener el proceso.
