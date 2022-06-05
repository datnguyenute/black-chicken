const app = require('express')();
const express = require('express');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use('/css', express.static('css'));
app.use('/assets', express.static('assets'));
app.use('/scripts', express.static('scripts'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('chat-message', msg => {
    io.emit('chat-message', msg, io.engine.clientsCount);
  });

  // Add sub message
  socket.on('sub-chat-message', msg => {
    io.emit('sub-chat-message', msg);
  });

  // Notify to others
  socket.on('notify-everyone', msg => {
    socket.broadcast.emit('notify-everyone', msg);
  });

  socket.on('disconnect', () => {
    const mess = `A task has done. Remain tasks: ${io.engine.clientsCount}`;
    io.emit('sub-chat-message', mess, io.engine.clientsCount);
  });

  // Get current count
  socket.on('status-count', () => {
    const mess = `Current number of task: ${io.engine.clientsCount}`;
    io.emit('sub-chat-message', mess, io.engine.clientsCount);
  });

  // Typing and no longer typing
  socket.on('typing', (user) => {
    socket.broadcast.emit('typing', user);
  });

  socket.on('typing-no-longer', (user) => {
    socket.broadcast.emit('typing-no-longer', user);
  });
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
