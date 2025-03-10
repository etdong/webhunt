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
const db_1 = __importStar(require("./db"));
const room_1 = __importDefault(require("./models/room"));
const player_1 = __importDefault(require("./models/player"));
const helpers_1 = require("./utils/helpers");
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
// player list for tracking sockets
// key is the socket id, value is the player object
let player_list = {};
// 
let room_list = {};
io.sockets.on('connection', (socket) => {
    let new_player = new player_1.default(socket);
    player_list[socket.id] = new_player;
    console.log('\nplayer connection %s', socket.id);
    console.log('players: %s', player_list);
    socket.on('disconnect', () => {
        console.log('socket disconnection %s', socket.id);
        for (let i in room_list) {
            let room = room_list[i];
            if (room.players[socket.id] !== undefined) {
                room.leave(player_list[socket.id]);
            }
        }
        delete player_list[socket.id];
    });
    socket.on('login', (socketId, name, googleId) => {
        console.log('login: ', name);
        for (let i in player_list) {
            if (player_list[i].googleId === googleId) {
                player_list[i].socket.emit('logged_out');
                player_list[i].googleId = "";
            }
        }
        let player = player_list[socketId];
        if (player === undefined)
            return;
        player.name = name;
        player.googleId = googleId;
        player.socket.emit('logged_in');
    });
    socket.on('check_login', (socketId, callback) => {
        let player = player_list[socketId];
        if (player === undefined || player.googleId === "")
            callback(false);
        callback(true);
    });
    socket.on('create_room', (socketId, room_info, callback) => {
        let owner = player_list[socketId];
        if (owner === undefined) {
            callback({ status: 'error', message: 'current player doesnt exist' });
            return;
        }
        ;
        owner.isReady = true;
        let id = (0, helpers_1.generateRandomString)(4);
        while (room_list[id] !== undefined) {
            id = (0, helpers_1.generateRandomString)(4);
        }
        let room = new room_1.default(id, owner, room_info.name, room_info.max_players, room_info.round_time, room_info.board_size);
        room_list[room.id] = room;
        owner.socket.join(room.id);
        callback({ status: 'ok', room_id: room.id });
    });
    socket.on('join_room', (socketId, roomId, callback) => {
        let room = room_list[roomId];
        let player = player_list[socketId];
        if (room === undefined) {
            callback({ status: 'room_not_found' });
            return;
        }
        ;
        if (Object.keys(room.players).length + 1 > room.max_players) {
            callback({ status: 'room_full' });
            return;
        }
        room.join(player);
        callback({ status: 'ok' });
    });
    socket.on('leave_room', (socketId, roomId) => {
        let room = room_list[roomId];
        if (room === undefined)
            return;
        room.leave(player_list[socketId]);
        if (Object.keys(room.players).length === 0) {
            console.log('room %s is empty, deleting', room.id);
            delete room_list[room.id];
        }
    });
    socket.on('request_rooms', (socketId, callback) => {
        if (player_list[socketId] === undefined) {
            callback({ status: 'error', message: 'requesting player not found' });
            return;
        }
        ;
        let pack = [];
        for (let i in room_list) {
            let room = room_list[i];
            let data = {
                name: room.name,
                cur_players: Object.keys(room.players).length,
                max_players: room.max_players,
                room_id: room.id,
            };
            pack.push(data);
        }
        callback({ status: 'ok', rooms: pack });
    });
    socket.on('signal_ready', (socketId, roomId) => {
        let room = room_list[roomId];
        let player = player_list[socketId];
        if (room === undefined || player === undefined)
            return;
        if (room.owner == player)
            player.isReady = true;
        else
            player.isReady = !player.isReady;
    });
    socket.on('signal_start', (roomId, callback) => {
        console.log('start signalled from room %s', roomId);
        let room = room_list[roomId];
        if (room.startGame()) {
            for (let i in room.players) {
                let player = room.players[i];
                player.reset();
                room.players[i].socket.emit('game_start', room.board, room.round_time);
            }
        }
    });
    socket.on('submit_score', (socketId, score, callback) => {
        let player = player_list[socketId];
        if (player === undefined) {
            callback({ status: 'error', message: 'player not found' });
            return;
        }
        ;
        player.score = score;
        callback({ status: 'ok', message: '' });
    });
    socket.on('signal_finish', (socketId, roomId) => {
        let room = room_list[roomId];
        let cur_player = player_list[socketId];
        if (room === undefined || cur_player === undefined)
            return;
        else
            cur_player.isReady = false;
        if (room.checkFinish()) {
            console.log('game finished for room %s', roomId);
            let final_scores = [];
            for (let i in room.players) {
                let player = room.players[i];
                final_scores.push([player.name, player.score]);
            }
            final_scores.sort((a, b) => b[1] - a[1]);
            for (let i in room.players) {
                let player = room.players[i];
                if (Object.keys(room.players).length !== 1) {
                    let win = player.score === final_scores[0][1];
                    (0, db_1.store_player)(player, win);
                }
                player.socket.emit('update_scores', final_scores);
            }
        }
    });
    socket.on('word', (socketId, word, callback) => {
        let player = player_list[socketId];
        if (player === undefined)
            return;
        if (wordList.includes(word)) {
            if (!player.words.includes(word)) {
                player.words.push(word);
                let score = 0;
                switch (word.length) {
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
                callback({ status: 'ok', score: score });
            }
            else {
                callback({ status: 'repeated' });
            }
        }
    });
    socket.on('request_stats', (socketId, callback) => {
        let player = player_list[socketId];
        if (player === undefined) {
            callback({ status: 'error', message: 'player not found' });
            return;
        }
        if (player.googleId === "") {
            callback({ status: 'error', message: 'player not found in db' });
            return;
        }
        db_1.default.connect().then(() => {
            const db = db_1.default.db('webhunt-users');
            const collection = db.collection('users');
            collection.findOne({ googleId: player.googleId }).then((user) => {
                callback({ status: 'ok', user: user });
            });
        });
    });
});
setInterval(() => {
    let pack = [];
    for (let i in player_list) {
        pack.push(player_list[i].socket.id);
    }
    for (let i in player_list) {
        let target = player_list[i].socket;
        target.emit('socket_info', pack);
    }
    for (let i in room_list) {
        let room = room_list[i];
        let data = {
            id: room.id,
            name: room.name,
            max_players: room.max_players,
            round_time: room.round_time,
            board_size: room.board_size,
            players: {
                names: Object.values(room.players).map((player) => player.name),
                ready_states: Object.values(room.players).map((player) => player.isReady),
            }
        };
        for (let j in room.players) {
            let player = room.players[j];
            if (player == room.owner)
                player.socket.emit('room_info', data, true);
            else
                player.socket.emit('room_info', data, false);
        }
    }
}, 1000 / 30);
