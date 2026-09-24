# ZonaGTA6TV AI Factory — Android CPU

Esta versión corrige el problema de dispositivos que no tienen WebGPU/GPU compatible.

## Funcionamiento

- Si WebGPU está disponible: intenta usar WebGPU.
- Si WebGPU no está disponible: usa WebAssembly/CPU automáticamente.
- Modelo: Qwen2.5-0.5B-Instruct preparado para Transformers.js.
- Sin OpenAI.
- Sin API key.
- Sin pagos por tokens.

Transformers.js permite cargar el modelo ONNX directamente desde el navegador y usar cuantización. La versión Qwen2.5-0.5B-Instruct de ONNX Community está preparada para Transformers.js.

## Primera carga

Necesita Internet para descargar el modelo. En CPU puede ser bastante más lenta que una GPU y consume batería. Mantén Chrome abierto mientras carga.

## Instalación

Publica esta carpeta en GitHub Pages y abre la URL con Chrome Android. Después usa "Instalar app".

