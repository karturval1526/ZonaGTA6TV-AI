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

