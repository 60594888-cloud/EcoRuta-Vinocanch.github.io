# EcoRuta Vinocanchón 🌿

EcoRuta es un prototipo académico de sostenibilidad comunitaria para ayudar a identificar residuos acumulados, visualizar sectores prioritarios y promover la participación de comerciantes y visitantes del mercado Vinocanchón, en Cusco.

## Mejoras visuales incluidas

- Identidad visual unificada en inicio, mapa de prioridades, reportes, EcoPuntos, administración y acceso.
- Diseño adaptable a celular, tableta y computadora, con menú móvil.
- Portada con fotografía original generada para el proyecto, indicadores, pasos de uso y consejos de separación de residuos.
- Imágenes optimizadas en formato WebP para cargar con mayor rapidez.
- Estados vacíos y mensajes visibles cuando la base de datos todavía no está conectada.
- Formulario de acceso con cambio entre iniciar sesión y crear una cuenta.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta al repositorio, conservando la estructura de archivos y la carpeta `imagenes/`.
2. En GitHub, entra en **Settings → Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**, selecciona tu rama principal y la carpeta `/(root)`. Guarda los cambios.
4. Espera a que GitHub Pages complete el despliegue y abre la URL que muestra esa sección.

Los enlaces son relativos, por lo que funcionan también cuando el sitio se publica dentro de un repositorio de proyecto.

## Datos, inicio de sesión y Supabase

La interfaz puede publicarse como sitio estático, pero las funciones de acceso, registro, reportes, prioridades y puntos necesitan una base de datos configurada. La conexión del cliente se encuentra en `js/configuracion.js`; comprueba que la URL y la clave publicable correspondan a tu proyecto Supabase. Una clave `publishable` puede ir en el navegador, pero **nunca coloques una clave `service_role` en estos archivos**.

Antes de usar el sitio con datos reales, crea las tablas que espera `codigo.js` (`reportes`, `perfiles` y `recompensas`) y configura políticas RLS apropiadas para que cada usuario solo pueda leer o modificar lo que le corresponde. Las funciones de canje seguro también requieren implementación en el backend.

Si Supabase no está disponible o faltan tablas/permisos, la página mostrará un mensaje indicando que los datos no están conectados; las imágenes y el diseño seguirán funcionando.

## Probar el diseño en tu computadora

Con Python instalado, abre una terminal dentro de esta carpeta y ejecuta:

```bash
python -m http.server 8000
```

Luego abre `http://localhost:8000`. Este comando solo sirve los archivos estáticos para revisar la interfaz.

## Importante sobre `server.py`

GitHub Pages publica archivos estáticos y **no ejecuta Python ni otros procesos de servidor**. El archivo `server.py` del repositorio es una alternativa de demostración local y no forma parte del despliegue de GitHub Pages; requiere adaptar/configurar el cliente para utilizar su API antes de usarlo como backend. No expongas un servidor de prueba directamente a Internet.

## Estructura principal

- `index.html`: portada y resumen de EcoRuta.
- `mapa.html`: prioridades estimadas por sector.
- `reportes.html`: formulario y lista de incidencias.
- `recompensas.html`: EcoPuntos y recompensas propuestas.
- `admin.html`: validación de reportes.
- `login.html`: inicio de sesión y registro.
- `estilos.css`: identidad visual y adaptación responsiva.
- `codigo.js`: interacciones y conexión con Supabase.
- `js/configuracion.js`: configuración pública de Supabase.
- `imagenes/`: recursos visuales optimizados del proyecto.

## Alcance del prototipo

El mapa representa prioridades aproximadas por sector, no una ubicación GPS exacta. Las recompensas son propuestas académicas. Revisa las políticas de seguridad, privacidad y acceso a datos antes de utilizar el proyecto fuera de un entorno de demostración.
