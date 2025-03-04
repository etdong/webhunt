"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors_1 = __importDefault(require("cors"));
const fs = __importStar(require("fs"));
const wordList = fs.readFileSync('words.txt', 'utf8').replace(/(\r)/gm, "").split('\n');
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
let socket_words = {};
let leaderboard = {};
let done_count = 0;
io.sockets.on('connection', (socket) => {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    socket_words[socket.id] = [];
    console.log('socket connection %s', socket.id);
    console.log('sockets: %s', SOCKET_LIST);
    socket.on('disconnect', () => {
        console.log('socket disconnection');
        delete SOCKET_LIST[socket.id];
    });
    socket.on('start', () => {
        leaderboard = {};
        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i];
            socket.emit('game_start');
        }
    });
    socket.on('final_score', (data) => {
        leaderboard[data.id] = data.score;
    });
    socket.on('end', () => {
        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i];
            socket.emit('final_scores', leaderboard);
        }
    });
    socket.on('word', (data) => {
        console.log('word received:', data.word);
        if (wordList.includes(data.word)) {
            if (!socket_words[socket.id].includes(data.word)) {
                socket_words[socket.id].push(data.word);
                let score = 0;
                switch (data.word.length) {
                    case 3:
                        score = 100;
                        break;
                    case 4:
                        score = 400;
                        break;
                    case 5:
                        score = 800;
                        break;
                    case 6:
                        score = 1400;
                        break;
                    case 7:
                        score = 1800;
                        break;
                    default:
                        score = 2200;
                        break;
                }
                console.log('score:', score);
                socket.to(data.id).emit('score', score);
            }
            else {
                console.log('repeated');
                socket.to(data.id).emit('word_repeated');
            }
        }
        else {
            console.log('word is not in wordlist');
        }
    });
});
setInterval(() => {
    let pack = [];
    for (let i in SOCKET_LIST) {
        pack.push(SOCKET_LIST[i].id);
    }
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.emit('socket_info', pack);
    }
}, 1000 / 30);
