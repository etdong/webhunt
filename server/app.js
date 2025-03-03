"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors_1 = __importDefault(require("cors"));
app.use((0, cors_1.default)());
const serv = http.createServer(app);
const io = new Server(serv, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});
serv.listen(2001, () => {
    console.log(`Server running`);
});
let SOCKET_LIST = {};
io.sockets.on('connection', (socket) => {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    socket.x = 0;
    socket.y = 0;
    console.log('socket connection %s', socket.id);
    console.log('sockets: %s', SOCKET_LIST);
    socket.emit('new_con', { id: socket.id });
    socket.on('disconnect', () => {
        console.log('socket disconnection');
        socket.emit('del_con', { id: socket.id });
        delete SOCKET_LIST[socket.id];
    });
});
setInterval(() => {
    let pack = {};
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.x += 5;
        socket.y += 5;
        if (socket.x > 500) {
            socket.x = 0;
            socket.y = 0;
        }
        pack[socket.id] = {
            x: socket.x,
            y: socket.y,
        };
    }
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.emit('socket_info', pack);
    }
}, 1000 / 30);
