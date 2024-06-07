require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const usersRouter = require('./routes/users');
const tasksRouter = require('./routes/tasks');
const boardsRouter = require('./routes/boards');
const projectsRouter = require('./routes/projects');
const chatsRouter = require('./routes/chats');
const notificationsRouter = require('./routes/notifications');
const organizationsRouter = require('./routes/organizations');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Root Route
app.get('/', (req, res) => {
  res.send('Welcome to the API');
});

// Routes
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/boards', boardsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/organizations', organizationsRouter);

// WebSocket bağlantısı
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
