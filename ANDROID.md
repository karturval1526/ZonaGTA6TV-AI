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

