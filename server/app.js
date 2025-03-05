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
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const fs = __importStar(require("fs"));
const wordList = fs.readFileSync('words.txt', 'utf8').replace(/(\r)/gm, "").split('\n');
const port = process.env.PORT || 2001;
const app = (0, express_1.default)();
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.use((0, cors_1.default)());
const serv = http_1.default.createServer(app);
const io = new socket_io_1.Server(serv, {
    cors: {
        origin: "https://etdong.github.io/webhunt/",
        methods: ["GET", "POST"]
    }
});
serv.listen(port, () => {
    console.log('App listening on port %s', port);
});
let SOCKET_LIST = {};
let leaderboard = {};
let board = {};
let all_ready = false;
io.sockets.on('connection', (socket) => {
    socket.id = Math.random();
    socket.words = [];
    socket.ready = false;
    SOCKET_LIST[socket.id] = socket;
    console.log('socket connection %s', socket.id);
    console.log('sockets: %s', SOCKET_LIST);
    socket.on('disconnect', () => {
        console.log('socket disconnection');
        delete SOCKET_LIST[socket.id];
    });
    socket.on('signal_start', (size) => {
        leaderboard = {};
        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i];
            socket.emit('enter_lobby');
        }
        for (let i = 0; i < size; i++) {
            board[i] = [];
            for (let j = 0; j < size; j++) {
                board[i].push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
            }
        }
        console.log(board);
    });
    socket.on('submit_score', (data) => {
        leaderboard[data.id] = data.score;
    });
    socket.on('end', () => {
        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i];
            socket.emit('final_scores', leaderboard);
        }
    });
    socket.on('signal_ready', (id) => {
        socket.ready = true;
        console.log(id + ' is ready');
        all_ready = check_ready();
    });
    socket.on('word', (data) => {
        console.log('word received:', data.word);
        if (wordList.includes(data.word)) {
            if (!socket.words.includes(data.word)) {
                socket.words.push(data.word);
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
function check_ready() {
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        if (!socket.ready) {
            return false;
        }
    }
    return true;
}
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
setInterval(() => {
    if (all_ready) {
        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i];
            socket.emit('game_start');
            socket.emit('board', board);
            socket.ready = false;
        }
        all_ready = false;
    }
}, 1000);
