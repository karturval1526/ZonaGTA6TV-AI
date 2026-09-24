# ZonaGTA6TV AI Factory — Android CPU

Esta versión corrige el problema de dispositivos que no tienen CPU/WASM/GPU compatible.

## Funcionamiento

- Si CPU/WASM está disponible: intenta usar CPU/WASM.
- Si CPU/WASM no está disponible: usa WebAssembly/CPU automáticamente.
- Modelo: SmolLM2-135M-Instruct preparado para Transformers.js.
- Sin OpenAI.
- Sin API key.
- Sin pagos por tokens.

Transformers.js permite cargar el modelo ONNX directamente desde el navegador y usar cuantización. La versión SmolLM2-135M-Instruct de ONNX Community está preparada para Transformers.js.

## Primera carga

Necesita Internet para descargar el modelo. En CPU puede ser bastante más lenta que una GPU y consume batería. Mantén Chrome abierto mientras carga.

## Instalación

Publica esta carpeta en GitHub Pages y abre la URL con Chrome Android. Después usa "Instalar app".



### Video
1. Genera el guion.
2. Baja a Estudio de video.
3. Opcionalmente selecciona imágenes.
4. Pulsa GENERAR VIDEO.
5. Espera a que llegue al 100% sin cerrar Chrome.
6. Pulsa DESCARGAR VIDEO.
En Android/Chrome el formato habitual es WebM; MP4 se usa solo si el navegador lo soporta directamente.


### Generador de imágenes IA v5

Después de crear el guion, abre **Generador de imágenes IA** y pulsa **GENERAR IMÁGENES IA**. El sistema crea imágenes verticales a partir de las escenas y las conecta con el Estudio de video. Si el servicio de imágenes está limitado temporalmente, puedes seleccionar imágenes del teléfono como alternativa.

\n### Fábrica automática
Escribe el tema en **FÁBRICA AUTOMÁTICA DE SHORTS** y pulsa **CREAR SHORT COMPLETO**. No cierres Chrome durante la producción. El ZIP se descarga al terminar.

\n### Voz y subtítulos v7
La primera vez pulsa **GENERAR NARRACIÓN** y espera a que descargue/cargue Kokoro. Después el audio queda disponible para previsualizar y descargar. Al renderizar, la pista de voz se incorpora al video y los subtítulos se dibujan sincronizados con el audio.
