# Frameo — Contexto del proyecto
 
> Documento para contextualizar a la IA que me ayudará a construir este proyecto. Léelo completo antes de escribir código o proponer cambios.
 
## 1. Qué es Frameo
 
**Frameo** es una aplicación web que convierte un video en una secuencia de imágenes, frame por frame, y entrega todo en un `.zip` con las imágenes numeradas y ordenadas.
 
**Flujo del usuario:**
 
1. El usuario abre la página y carga un video desde su computador.
2. La página procesa el video y lo separa en frames.
3. Aparece un botón para descargar el resultado.
4. El usuario descarga un `.zip` con todos los frames como imágenes ordenadas.
**Ejemplo del contenido del zip:**
 
```
frameo_video.zip
├── frame_00001.png
├── frame_00002.png
├── frame_00003.png
└── ...
```
 
## 2. Principios no negociables
 
- **100% local.** El video nunca se sube a ningún servidor. Todo ocurre en el navegador de la persona. Esto es el principal argumento de venta (privacidad).
- **Sin backend.** Solo archivos estáticos. Sin base de datos, sin cuentas, sin almacenamiento en la nube.
- **Sin IA.** Es un problema clásico de procesamiento de video. No se necesita ningún modelo.
- **Orden correcto siempre.** Los nombres de archivo llevan ceros a la izquierda (`frame_00001.png`) para que cualquier explorador de archivos los ordene bien.
- **Simple de usar.** Cargar, esperar, descargar. Sin pasos innecesarios.
## 3. Alcance
 
### MVP (primera versión)
 
- Cargar un video con `<input type="file">` y también arrastrando y soltando.
- Extraer los frames.
- Barra de progreso durante la extracción.
- Descargar un `.zip` con los frames numerados.
- Selector de formato: PNG (sin pérdida, pesa más) o JPG (pesa menos).
- Selector de frecuencia: extraer todos los frames o uno cada X.
### Después del MVP (ideas)
 
- Elegir rango de tiempo (desde / hasta).
- Vista previa de los primeros frames antes de descargar.
- Elegir el FPS de salida.
- Procesar por lotes (varios zips) cuando el video es muy pesado.
- Convertirlo en PWA para que funcione sin conexión.
### Fuera de alcance
 
- Subir videos a un servidor.
- Cuentas de usuario, pagos o login.
- Edición de video o de imágenes.
- Cualquier función con IA.
## 4. Enfoque técnico
 
### Extracción de frames (a decidir, en orden de preferencia)
 
1. **WebCodecs (`VideoDecoder`)**: precisión exacta de frames y buen rendimiento. Soporte en navegadores modernos basados en Chromium.
2. **ffmpeg.wasm**: corre FFmpeg dentro del navegador, extrae frames exactos y acepta muchos formatos. Es más pesado de cargar.
3. **`<video>` + `<canvas>`** (mover `currentTime` y dibujar cada cuadro): es lo más simple, pero menos preciso. Puede saltarse o repetir frames, así que solo sirve como plan B.
### Generación del zip
 
- **fflate** (liviano) o **JSZip** para zips pequeños y medianos.
- **client-zip** si se quiere generar el zip en streaming para no llenar la memoria.
### Descarga directa a una carpeta (opcional)
 
- **File System Access API**: permite escribir los frames directamente en una carpeta que el usuario elija, sin pasar por la RAM. Solo funciona en Chrome y Edge.
### Stack sugerido
 
- HTML + JavaScript puro (o Vite si hace falta empaquetar). Para esta herramienta no se necesita un framework pesado.
- Despliegue como sitio estático (por ejemplo en Vercel).
## 5. Puntos delicados a tener en cuenta
 
- **Memoria:** un video de 1 minuto a 30 FPS son 1.800 imágenes. A 60 FPS son 3.600. Los videos largos, en 4K o a 60 FPS pueden colgar la pestaña si todo se arma en RAM. Hay que pensar en procesamiento por lotes o streaming desde el diseño.
- **Cancelar:** el usuario debe poder cancelar el proceso a la mitad sin que se cuelgue la página.
- **Errores claros:** formato de video no soportado, archivo corrupto o memoria insuficiente deben mostrar mensajes comprensibles en español.
- **Rendimiento:** la interfaz no debe congelarse mientras se procesa (usar Web Workers si hace falta).
- **Nombres de archivo:** el zip y las imágenes deben tomar el nombre del video original cuando sea posible.
## 6. Identidad de marca
 
- **Nombre:** Frameo (en minúscula en el wordmark: `frameo`).
- **Idea visual:** una **F** cuyo brazo del medio es un símbolo de **play**, dentro de las esquinas de un **visor de cámara**.
- **Paleta:**
  - Menta neón: `#00F5D4`
  - Lima eléctrico: `#C6FF3D`
  - Degradado: de `#00F5D4` a `#C6FF3D` (en diagonal)
  - Fondo oscuro: `#07070B` (con un leve resplandor verdoso `#0E2A2A`)
  - Texto principal: blanco `#FFFFFF`
- **Tipografía:** Poppins Bold.
- **Estilo de la interfaz:** oscuro, moderno, limpio, con acentos en el degradado neón. Sin recargar.
- **Archivos del logo:** `frameo-logo-v3.svg` (horizontal) y `frameo-icon-v3.svg` (icono cuadrado, para favicon y avatar).
## 7. Sobre mí y cómo quiero que trabajes
 
- Soy desarrollador fullstack y prefiero construir las cosas desde cero antes que depender de soluciones ya hechas. Trabajo en Linux (Pop!_OS).
- **Responde siempre en español.**
- Explica brevemente el porqué de cada decisión técnica importante, sin rodeos.
- Entrega código completo y funcional, no fragmentos sueltos.
- Si hay varias formas de hacer algo, dime las opciones con sus pros y contras antes de elegir por mí.
- Si algo del documento no está claro o hay un conflicto con los principios de la sección 2, pregúntame antes de seguir.
- Avanza por partes: primero el MVP funcionando, después las mejoras.
## 8. Primer paso sugerido
 
1. Confirmar la estrategia de extracción de frames (WebCodecs vs ffmpeg.wasm).
2. Construir un prototipo mínimo: cargar un video, extraer unos pocos frames y descargarlos en un zip.
3. Probarlo con videos de distintos tamaños para medir el consumo de memoria.
4. Recién ahí construir la interfaz completa con la marca de Frameo.
 
