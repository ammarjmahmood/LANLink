const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const ip = require('ip');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static('public'));

const users = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('user-join', (username) => {
        users[socket.id] = {
            id: socket.id,
            username: username
        };
        io.emit('user-connected', { id: socket.id, username: username });
        io.emit('users-list', Object.values(users));
        console.log(`${username} joined`);
    });

    socket.on('send-message', (message) => {
        if (users[socket.id]) {
            io.emit('new-message', {
                sender: users[socket.id].username, 
                text: message, 
                id: socket.id,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            });
        }
    });

    socket.on('typing', () => {
        if (users[socket.id]) {
            socket.broadcast.emit('user-typing', users[socket.id].username);
        }
    });

    socket.on('stop-typing', () => {
        if (users[socket.id]) {
            socket.broadcast.emit('user-stop-typing');
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            console.log(`${users[socket.id].username} disconnected`);
            io.emit('user-disconnected', socket.id);
            delete users[socket.id];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`For local network access, use: http://${ip.address()}:${PORT}`);
});