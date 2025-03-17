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
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
// reading in the wordlists
const wordList = fs.readFileSync('words.txt', 'utf8').replace(/(\r)/gm, "").split('\n');
const db = require('./db');
const { Room } = require('./models/Room');
const { Player } = require('./models/Player');
const utils = require('./utils');
const client_url = process.env.CLIENT_URL;
// setting up server
const app = (0, express_1.default)();
require('./auth');
app.use((0, cors_1.default)({
    origin: "https://webhunt.donger.ca",
    credentials: true, //access-control-allow-credentials:true
}));
app.set('trust proxy', 1);
// using noleak memorystore
const MemoryStore = require('memorystore')(express_session_1.default);
app.use((0, express_session_1.default)({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24
    },
    proxy: true,
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    })
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(passport_1.default.authenticate('session'));
// homepage
app.get("/", (_, res) => {
    res.send("Webhunt backend server");
});
// google auth page
app.get("/auth/google", passport_1.default.authenticate('google', {
    scope: ['profile']
}));
// google callback page
app.get("/google/callback", passport_1.default.authenticate('google', {
    session: true,
    successRedirect: client_url || 'https://webhunt.donger.ca',
    failureRedirect: client_url || 'https://webhunt.donger.ca'
}));
// auth middleware
function isAuthenticated(req, res, next) {
    if (req.user)
        next();
    else
        res.json({ loggedIn: false });
}
// get user login information
app.get("/account", isAuthenticated, (req, res) => {
    const user = Object.assign(Object.assign({}, req.user), { loggedIn: true });
    res.json(user);
});
const serv = http_1.default.createServer(app);
// setting up socket.io
const io = new socket_io_1.Server(serv, {
    cors: {
        origin: "https://webhunt.donger.ca",
        credentials: true,
        methods: ["GET", "POST"],
    },
});
// listen on port 2001
serv.listen(2001, () => {
    console.log(`Server running on 2001`);
});
// player list for tracking sockets
// key is the socket id, value is the player object
let player_list = {};
// room list for tracking rooms
// key is the room id, value is the room object
let room_list = {};
// all socket cpmmunication logic
io.sockets.on('connection', (socket) => {
    // create a new player object and add it to the player list on connection
    let new_player = new Player(socket);
    player_list[socket.id] = new_player;
    console.log('\nplayer connection %s', socket.id);
    console.log('players: %s', player_list);
    // remove player from player list on disconnection
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
    // when logged in, set googleid and name
    socket.on('login', (socketId, name, googleId) => {
        let player = player_list[socketId];
        if (player === undefined)
            return;
        player.name = name;
        player.googleId = googleId;
        player.socket.emit('logged_in');
    });
    // check if player is logged in
    socket.on('check_login', (socketId, callback) => {
        let player = player_list[socketId];
        if (player === undefined)
            callback({ status: false, message: 'requesting player not found' });
        else if (player.googleId === "")
            callback({ status: false, message: 'google id not found' });
        else
            callback({ status: true, message: 'logged in' });
    });
    // room creation request
    socket.on('create_room', (socketId, room_info, callback) => {
        // make sure the caller exists
        let owner = player_list[socketId];
        if (owner === undefined) {
            callback({ status: 'error', message: 'current player doesnt exist' });
            return;
        }
        ;
        // owner is always ready
        owner.isReady = true;
        // generate a random unique room id
        let id = utils.generateRandomString(4);
        while (room_list[id] !== undefined) {
            id = utils.generateRandomString(4);
        }
        // if no name is provided, use the room id
        if (room_info.name === "") {
            room_info.name = id;
        }
        let room = new Room(id, owner, room_info.name, room_info.max_players, room_info.round_time, room_info.board_size);
        room_list[room.id] = room;
        owner.socket.join(room.id);
        callback({ status: 'ok', room_id: room.id });
    });
    // join room request
    socket.on('join_room', (socketId, roomId, callback) => {
        let room = room_list[roomId];
        let player = player_list[socketId];
        if (player === undefined) {
            callback({ status: 'error', message: 'requesting player not found' });
            return;
        }
        ;
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
    // leave room request
    socket.on('leave_room', (socketId, roomId) => {
        // make sure the caller exists
        if (player_list[socketId] === undefined) {
            return;
        }
        ;
        let room = room_list[roomId];
        if (room === undefined)
            return;
        room.leave(player_list[socketId]);
        // delete room if empty
        if (Object.keys(room.players).length === 0) {
            console.log('room %s is empty, deleting', room.id);
            delete room_list[room.id];
        }
    });
    // request room list on rooms list page
    socket.on('request_rooms', (socketId, callback) => {
        // make sure the caller exists
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
    // player ready signal
    socket.on('signal_ready', (socketId, roomId) => {
        let room = room_list[roomId];
        let player = player_list[socketId];
        // make sure the caller and room exists
        if (room === undefined || player === undefined)
            return;
        if (room.owner == player)
            player.isReady = true;
        else
            player.isReady = !player.isReady;
    });
    // start game signal
    socket.on('signal_start', (roomId, callback) => {
        console.log('start signalled from room %s', roomId);
        let room = room_list[roomId];
        if (room === undefined) {
            callback({ status: 'error', message: 'room not found' });
            return;
        }
        if (room.startGame()) {
            // on successful start, reset all players and send game start signal
            for (let i in room.players) {
                let player = room.players[i];
                player.reset();
                room.players[i].socket.emit('game_start', room.board, room.round_time);
            }
        }
    });
    // player finished game, submitting score
    socket.on('submit_score', (socketId, score, callback) => {
        let player = player_list[socketId];
        if (player === undefined) {
            callback({ status: 'error', message: 'requesting player not found' });
            return;
        }
        ;
        player.score = score;
        callback({ status: 'ok', message: '' });
    });
    // signal player is on the final screen
    socket.on('signal_finish', (socketId, roomId) => {
        let room = room_list[roomId];
        let cur_player = player_list[socketId];
        if (room === undefined || cur_player === undefined)
            return;
        else
            cur_player.isReady = false;
        // check if all players are on the final screen
        if (room.checkFinish()) {
            console.log('game finished for room %s', roomId);
            let final_scores = [];
            // sort players by score
            for (let i in room.players) {
                let player = room.players[i];
                final_scores.push([player.name, player.score]);
            }
            final_scores.sort((a, b) => b[1] - a[1]);
            // send scores to players
            for (let i in room.players) {
                let player = room.players[i];
                if (Object.keys(room.players).length !== 1) {
                    let win = player.score === final_scores[0][1];
                    db.store_player(player, win);
                }
                player.socket.emit('update_scores', final_scores);
            }
        }
    });
    // word handling
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
    // player stat request
    socket.on('request_stats', (socketId, callback) => {
        let player = player_list[socketId];
        if (player === undefined) {
            callback({ status: 'error', message: 'requesting player not found' });
            return;
        }
        if (player.googleId === "") {
            callback({ status: 'error', message: 'player not found in db' });
            return;
        }
        db.client.connect().then(() => {
            const collection = db.client.db('webhunt-users').collection('users');
            collection.findOne({ googleId: player.googleId }).then((user) => {
                callback({ status: 'ok', user: user });
            });
        });
    });
});
// every 10th of a second, send room info to all players in a room
setInterval(() => {
    for (let i in room_list) {
        let room = room_list[i];
        if (Object.keys(room.players).length === 0) {
            delete room_list[i];
            continue;
        }
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
}, 1000 / 10);
