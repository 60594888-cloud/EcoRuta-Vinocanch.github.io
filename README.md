# Terranova — Dashboard comunitario con base de datos

## Requisitos
- Python 3.10 o posterior. No necesitas instalar librerías adicionales.
- Navegador moderno.

## Inicio rápido
1. Abre una terminal en esta carpeta.
2. Crea una cuenta de administrador: `python server.py create-admin` (en Windows también puedes usar `py server.py create-admin`). Usa una contraseña de al menos 12 caracteres.
3. Inicia el servidor: `python server.py` (o `py server.py`).
4. Abre **http://127.0.0.1:8000** en tu navegador. No abras los HTML con doble clic; usa el servidor.
5. Inicia sesión con el administrador o registra una cuenta de usuario.
6. Desde una cuenta normal crea un reporte. Desde la cuenta administradora apruébalo y márcalo como resuelto. El usuario recibe 5 puntos. Puedes solicitar un canje cuando alcances el costo de una recompensa.

## Archivos
- `public/login.html`: inicio de sesión y registro.
- `public/index.html`: inicio y estadísticas.
- `public/mapa.html`: mapa de calor automático.
- `public/reportes.html`: envío y seguimiento de reportes.
- `public/recompensas.html`: EcoPuntos y canjes.
- `public/admin.html`: validación y entrega de premios.
- `public/estilos.css`: diseño responsivo.
- `public/codigo.js`: interacción y comunicación con API.
- `server.py`: servidor Python con API, sesiones y SQLite.
- `ecoruta.db`: se crea automáticamente al iniciar; contiene datos compartidos por todas las cuentas conectadas a **ese mismo servidor**.

## Alcance y advertencias
- Prototipo académico para pruebas locales. La base SQLite es compartida entre navegadores conectados al mismo servidor, no entre copias independientes de la carpeta.
- El mapa de calor es **esquemático**, no un mapa geográfico ni una medición física. Suma puntuaciones de reportes pendientes y aprobados: alta=5, media=3, baja=1.
- La validación es **manual**, por una cuenta administradora. Los EcoPuntos se asignan una sola vez cuando un reporte aprobado se marca como resuelto.
- Las recompensas son propuestas: el canje crea una solicitud, y el administrador confirma su entrega.
- **No publiques este servidor directamente en Internet.** Para producción faltan HTTPS, proxy seguro, cookies `Secure`, limitación de intentos de inicio de sesión, recuperación de contraseñas, políticas de privacidad, copias de seguridad, auditoría, protección antiabuso y configuración de despliegue.
- Para probarlo en la red local se puede configurar `ECORUTA_HOST=0.0.0.0`, pero solo en una red confiable; nunca expongas el puerto directamente a Internet.
- Evita utilizar nombres reales, correos personales o datos sensibles en pruebas públicas.
