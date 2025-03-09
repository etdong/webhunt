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
const cors_1 = __importDefault(require("cors"));
const fs = __importStar(require("fs"));
const short_uuid_1 = __importDefault(require("short-uuid"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const client_url = process.env.CLIENT_URL;
const uuid = (0, short_uuid_1.default)();
// reading in the wordlist
const wordList = fs.readFileSync('words.txt', 'utf8').replace(/(\r)/gm, "").split('\n');
// setting up server
const app = (0, express_1.default)();
require('./auth');
app.use((0, cors_1.default)({
    origin: client_url,
    credentials: true, //access-control-allow-credentials:true
    optionsSuccessStatus: 200
}));
app.use((0, express_session_1.default)({ secret: 'test' }));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.get("/", (_, res) => {
    res.send("Hello World!");
});
app.get("/auth/google", passport_1.default.authenticate('google', {
    scope: ['profile']
}));
app.get("/google/callback", passport_1.default.authenticate('google', { session: true }), (_, res) => {
    res.redirect(client_url || 'http://localhost:3000');
});
function isAuthenticated(req, res, next) {
    if (req.user)
        next();
    else
        res.json({ loggedIn: false });
}
app.get("/account", isAuthenticated, (req, res) => {
    const user = Object.assign(Object.assign({}, req.user), { loggedIn: true });
    res.json(user);
});
const serv = http_1.default.createServer(app);
const io = new socket_io_1.Server(serv, {
    cors: {
        origin: client_url,
        methods: ["GET", "POST"],
    },
});
serv.listen(2001, () => {
    console.log(`Server running on 2001`);
});
class Player {
    constructor(socket) {
        this.words = [];
        this.score = 0;
        this.isReady = false;
        this.roomId = "menu";
        this.id = socket.id;
        this.socket = socket;
    }
    addWord(word) {
        this.words.push(word);
    }
    addScore(score) {
        this.score += score;
    }
}
class Room {
    constructor(id, name, owner) {
        this.players = {};
        this.leaderboard = {};
        this.board = {};
        this.all_ready = false;
        this.id = id;
        this.name = name;
        this.owner = owner;
        this.join(owner);
        console.log('created room %s', this.id);
    }
    generateBoard(size) {
        for (let i = 0; i < size; i++) {
            this.board[i] = [];
            for (let j = 0; j < size; j++) {
                this.board[i].push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
            }
        }
        console.log('generated board for room %s', this.id);
    }
    join(player) {
        if (Object.keys(this.players).includes(player.id))
            return;
        this.players[player.id] = player;
        player.roomId = this.id;
        console.log('player %s joined room %s', player.id, this.id);
    }
    leave(player) {
        if (!Object.keys(this.players).includes(player.id))
            return;
        console.log('player %s left room %s', player.id, this.id);
        delete this.players[player.id];
        if (Object.keys(this.players).length === 0) {
            console.log('room %s is empty, deleting', this.id);
            delete room_list[this.id];
            return;
        }
        if (player === this.owner) {
            this.owner = this.players[Object.keys(this.players)[0]];
        }
    }
    checkReady() {
        for (let i in this.players) {
            let player = this.players[i];
            if (!player.isReady) {
                return false;
            }
        }
        return true;
    }
}
// player list for tracking sockets
// key is the socket id, value is the player object
let player_list = {};
// 
let room_list = {};
io.sockets.on('connection', (socket) => {
    socket.id = uuid.generate();
    let new_player = new Player(socket);
    player_list[socket.id] = new_player;
    console.log('\nplayer connection %s', socket.id);
    console.log('players: %s', player_list);
    socket.on('disconnect', () => {
        console.log('socket disconnection %s', socket.id);
        delete player_list[socket.id];
    });
    socket.on('create_room', (data) => {
        let owner = player_list[data.socketId];
        let room = new Room(uuid.generate(), data.roomName, owner);
        room_list[room.id] = room;
        socket.to(data.socketId).emit('room_created', room.id);
    });
    socket.on('join_room', (data) => {
        let room = room_list[data.roomId];
        room.join(player_list[data.socketId]);
        socket.to(data.socketId).emit('room_joined', room.id);
    });
    socket.on('leave_room', (data) => {
        let room = room_list[data.roomId];
        room.leave(player_list[data.socketId]);
        socket.to(data.socketId).emit('room_left', room.id);
    });
    socket.on('request_login', (data) => {
        console.log('login request: ' + data.username + ' ' + data.password);
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
setInterval(() => {
    let pack = [];
    for (let i in player_list) {
        pack.push(player_list[i].id);
    }
    for (let i in player_list) {
        let target = player_list[i].socket;
        target.emit('socket_info', pack);
    }
}, 1000 / 30);
