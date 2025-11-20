# Chat en Tiempo Real con WebSockets

Una aplicación de chat en tiempo real construida con Node.js, Socket.IO, Express y JWT para autenticación.

## Características

- Autenticación de usuarios con JWT
- Chat en tiempo real con WebSockets (Socket.IO)
- Envío de mensajes de texto
- Envío de imágenes (hasta 5MB)
- Visualización de nombres de usuario en cada mensaje
- Timestamps en los mensajes
- Notificaciones cuando usuarios entran/salen del chat
- Contador de usuarios conectados
- Interfaz moderna y responsive
- Mensajes propios destacados con estilo diferente

## Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **Socket.IO** - WebSockets en tiempo real
- **JWT (jsonwebtoken)** - Autenticación con tokens
- **bcryptjs** - Hash de contraseñas
- **Multer** - Subida de archivos
- **cookie-parser** - Manejo de cookies

### Frontend
- **HTML5**
- **CSS3** con animaciones
- **JavaScript vanilla**
- **Socket.IO Client**

## Instalación

1. Clona el repositorio:
```bash
git clone <tu-repositorio>
cd "WebSockets Chat"
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor:
```bash
node index.js
```

4. Abre tu navegador en:
```
http://localhost:3000
```

## Uso

1. **Registro**: Crea una cuenta con un nombre de usuario (mínimo 3 caracteres) y contraseña (mínimo 4 caracteres)

2. **Login**: Inicia sesión con tus credenciales

3. **Chat**:
   - Escribe mensajes en el campo de texto y presiona Enter o clic en el botón de enviar
   - Haz clic en el botón de imagen para adjuntar imágenes
   - Los mensajes propios aparecen a la derecha en morado
   - Los mensajes de otros usuarios aparecen a la izquierda en blanco

4. **Logout**: Haz clic en "Cerrar Sesión" en el header

## Estructura del Proyecto

```
WebSockets Chat/
├── index.js           # Servidor principal
├── chat.html          # Página del chat
├── login.html         # Página de login/registro
├── style.css          # Estilos
├── uploads/           # Carpeta para imágenes (creada automáticamente)
├── package.json       # Dependencias del proyecto
└── README.md          # Este archivo
```



## API Endpoints

### Autenticación
- `POST /api/register` - Registrar nuevo usuario
- `POST /api/login` - Iniciar sesión
- `POST /api/logout` - Cerrar sesión
- `GET /api/me` - Obtener usuario actual (requiere autenticación)

### Chat
- `GET /` - Página principal del chat (requiere autenticación)
- `GET /login` - Página de login/registro

### Archivos
- `POST /upload` - Subir imagen

## Eventos de Socket.IO

### Cliente → Servidor
- `chat message` - Enviar mensaje de texto
- `image message` - Enviar mensaje con imagen

### Servidor → Cliente
- `user count` - Contador de usuarios conectados
- `user joined` - Notificación de usuario que se unió
- `user left` - Notificación de usuario que salió
- `chat message` - Mensaje recibido (texto o imagen)

## Desarrollo

Para desarrollo con auto-reload, instala nodemon:

```bash
npm install -g nodemon
nodemon index.js
```

## Limitaciones Actuales

- Los usuarios se almacenan en memoria (se pierden al reiniciar)
- Las imágenes se guardan localmente (considerar usar cloud storage)
- No hay persistencia de mensajes
- Tamaño máximo de imagen: 5MB

## Mejoras Futuras

- [ ] Persistencia de mensajes en base de datos
- [ ] Historial de chat
- [ ] Salas/canales de chat
- [ ] Mensajes privados
- [ ] Indicador de "escribiendo..."
- [ ] Emojis y reacciones
- [ ] Compartir archivos de otros tipos
- [ ] Videollamadas
- [ ] Temas de colores personalizables
- [ ] Notificaciones push
- [ ] Búsqueda de mensajes

## Licencia

MIT

## Autor

Tu nombre aquí
