# ZonaGTA6TV V15.1 — ONE-CLICK PUBLISH READY

Parche de estabilidad sobre V15 para solucionar bloqueos durante el paso de render de video en Chrome Android.

## Qué cambia
- Render por defecto en 540×960 a 24 FPS.
- Se redujo el trabajo gráfico por frame: se eliminó el bucle de cientos de scanlines.
- Bitrate adaptativo para reducir memoria y carga.
- El render actualiza el progreso sin saturar el hilo principal.
- Se cierran correctamente AudioContext y pistas del MediaStream.
- Si Chrome no entrega datos, muestra un mensaje de recuperación en lugar de quedar aparentemente congelado.

## Recomendación Android
1. Usa 540p / 24 FPS para el primer render.
2. Mantén Chrome abierto y la pantalla activa durante la producción.
3. Cuando el render funcione correctamente, prueba 720p.
4. Para videos largos de varios minutos, el render puede tardar varios minutos porque se realiza localmente en el navegador.
