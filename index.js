import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import multer from 'multer';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const server = createServer(app);
const io = new Server(server);

// Secret para JWT (en producción, usar variable de entorno)
const JWT_SECRET = 'tu-clave-secreta-super-segura-cambiar-en-produccion';

// Base de datos simple en memoria (en producción, usar MongoDB, PostgreSQL, etc.)
const users = new Map(); // username -> { username, password (hash), createdAt }

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar JWT en páginas HTML (redirige a login)
const authenticateTokenPage = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.redirect('/login');
  }
};

// Ruta de registro
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'El usuario debe tener al menos 3 caracteres' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
  }

  if (users.has(username)) {
    return res.status(400).json({ error: 'El usuario ya existe' });
  }

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Guardar usuario
  users.set(username, {
    username,
    password: hashedPassword,
    createdAt: new Date()
  });

  // Crear token JWT
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });

  // Enviar token en cookie
  res.cookie('token', token, {
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
  });

  res.json({ success: true, username });
});

// Ruta de login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const user = users.get(username);

  if (!user) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  // Verificar contraseña
  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  // Crear token JWT
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });

  // Enviar token en cookie
  res.cookie('token', token, {
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
  });

  res.json({ success: true, username });
});

// Ruta de logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Verificar si el usuario está autenticado
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({ username: req.user.username });
});

// Página de login
app.get('/login', (req, res) => {
  // Si ya está autenticado, redirigir al chat
  const token = req.cookies.token;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return res.redirect('/');
    } catch (error) {
      // Token inválido, continuar al login
    }
  }
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Página principal (protegida)
app.get('/', authenticateTokenPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

// Endpoint para subir imágenes
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// Autenticación de Socket.IO con JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.error('Socket.IO: No se proporcionó token');
    return next(new Error('No autorizado'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.username = decoded.username;
    console.log(`Socket.IO: Usuario ${decoded.username} autenticado correctamente`);
    next();
  } catch (error) {
    console.error('Socket.IO: Error al verificar token:', error.message);
    return next(new Error('Token inválido'));
  }
});

// Contador de usuarios conectados
const connectedUsers = new Map(); // socketId -> username

io.on('connection', (socket) => {
  const username = socket.username;
  connectedUsers.set(socket.id, username);

  console.log(`${username} connected. Total users:`, connectedUsers.size);

  // Enviar contador de usuarios a todos
  io.emit('user count', connectedUsers.size);

  // Notificar que un usuario se unió
  io.emit('user joined', { username });

  // Recibir mensajes de texto
  socket.on('chat message', (msg) => {
    io.emit('chat message', {
      type: 'text',
      content: msg,
      username: username,
      timestamp: new Date()
    });
  });

  // Recibir mensajes con imágenes
  socket.on('image message', (imageUrl) => {
    io.emit('chat message', {
      type: 'image',
      content: imageUrl,
      username: username,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    console.log(`${username} disconnected. Total users:`, connectedUsers.size);
    io.emit('user count', connectedUsers.size);
    io.emit('user left', { username });
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});