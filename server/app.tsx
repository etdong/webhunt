import cors from 'cors'
import * as fs from 'fs';
import short from 'short-uuid';
import express from 'express';
import http from 'http'
import { Server } from 'socket.io'
import passport from 'passport';
import session from 'express-session';
import client, { store_player } from './db';
import Room from './models/room';
import Player from './models/player';
import { generateRandomString } from './utils/helpers';

const client_url = process.env.CLIENT_URL;
const uuid = short();

// reading in the wordlist
const wordList = fs.readFileSync('words.txt','utf8').replace(/(\r)/gm, "").split('\n');



// setting up server
const app = express();
require('./auth');
app.use(cors({
    origin: client_url, 
    credentials: true,            //access-control-allow-credentials:true
    optionsSuccessStatus: 200
}));
app.use(session({ secret: 'test' }))
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (_, res) => {
    res.send("Hello World!");
})

app.get(
    "/auth/google", 
    passport.authenticate('google', { 
        scope: ['profile'] 
    })
);

app.get(
    "/google/callback", 
    passport.authenticate('google', { session: true }),
    (_, res) => {
        res.redirect(client_url || 'http://localhost:3000');
    }   
);

function isAuthenticated(req: any, res: any, next: any) {
    if (req.user) next();
    else res.json({ loggedIn: false});
}

app.get(
    "/account",
    isAuthenticated,
    (req, res) => {
        const user = {
            ...req.user,
            loggedIn: true
        }
        res.json(user);
    }
)

const serv = http.createServer(app)

const io = new Server(serv, {
    cors: {
        origin: client_url,
        methods: ["GET", "POST"],
    },
})

serv.listen(2001, () => {
    console.log(`Server running on 2001`)
})

// player list for tracking sockets
// key is the socket id, value is the player object
let player_list: { [key: string]: any } = {};

// 
let room_list: { [key: string]: Room } = {};

io.sockets.on('connection', (socket: any) => {
    let new_player = new Player(socket);
    player_list[socket.id] = new_player;

    console.log('\nplayer connection %s', socket.id)
    console.log('players: %s', player_list)

    socket.on('disconnect', () => {
        console.log('socket disconnection %s', socket.id)
        for (let i in room_list) {
            let room = room_list[i];
            if (room.players[socket.id] !== undefined) {
                room.leave(player_list[socket.id])
            }
        }
        delete player_list[socket.id]
    })

    socket.on('login', (socketId: string, name: string, googleId: string) => {
        console.log('login: ', name)
        for (let i in player_list) {
            if (player_list[i].googleId === googleId) {
                player_list[i].socket.emit('logged_out');
                player_list[i].googleId = "";
            }
        }
        let player = player_list[socketId];
        if (player === undefined) return;
        player.name = name;
        player.googleId = googleId;
        player.socket.emit('logged_in')
    })

    socket.on('check_login', (socketId: string, callback: any) => {
        let player = player_list[socketId];
        if (player === undefined || player.googleId === "") callback(false);
        callback(true);
    })


    socket.on('create_room', (socketId: string, room_info: any, callback: any) => {
        let owner = player_list[socketId];
        if (owner === undefined) {
            callback({ status: 'error', message: 'current player doesnt exist' });
            return;
        };
        owner.isReady = true;
        let id = generateRandomString(4);
        while (room_list[id] !== undefined) {   
            id = generateRandomString(4);
        }
        let room = new Room(
            id,
            owner,
            room_info.name, 
            room_info.max_players,
            room_info.round_time,
            room_info.board_size
        );
        room_list[room.id] = room;
        owner.socket.join(room.id)
        callback({ status: 'ok', room_id: room.id })
    })

    socket.on('join_room', (socketId: string, roomId: string, callback: any) => {
        let room = room_list[roomId];
        let player = player_list[socketId];

        if (room === undefined) {
            callback({ status: 'room_not_found' })
            return;
        };

        if (Object.keys(room.players).length + 1 > room.max_players) {
            callback({ status: 'room_full' })
            return;
        }

        room.join(player);
        callback({ status: 'ok' })
    })

    socket.on('leave_room', (socketId: string, roomId: string) => {
        let room = room_list[roomId];
        if (room === undefined) return;
        room.leave(player_list[socketId]);
        if (Object.keys(room.players).length === 0) {
            console.log('room %s is empty, deleting', room.id)
            delete room_list[room.id];
        }
    })

    socket.on('request_rooms', (socketId: string, callback: any) => {
        if (player_list[socketId] === undefined) {
            callback({ status: 'error', message: 'requesting player not found' });
            return;
        };
        let pack = [];
        for (let i in room_list) {
            let room = room_list[i];
            let data = {
                name: room.name,
                cur_players: Object.keys(room.players).length,
                max_players: room.max_players,
                room_id: room.id,
            }
            pack.push(data);
        }
        callback({ status: 'ok', rooms: pack })
    })

    socket.on('signal_ready', (socketId: string, roomId: string) => {
        let room = room_list[roomId];
        let player = player_list[socketId];
        if (room === undefined || player === undefined) return;
        if (room.owner == player) player.isReady = true
        else player.isReady = !player.isReady;
    })

    socket.on('signal_start', (roomId: string, callback: any) => {
        console.log('start signalled from room %s', roomId)
        let room = room_list[roomId];
        if (room.startGame()) {
            for (let i in room.players) {
                let player = room.players[i];
                player.reset()
                room.players[i].socket.emit('game_start', room.board, room.round_time)
            }
        }
    })

    socket.on('submit_score', (socketId: string, score: number, callback: any) => {
        let player = player_list[socketId];
        if (player === undefined) {
            callback({ status: 'error', message: 'player not found' });
            return;
        };
        player.score = score;
        callback({ status: 'ok', message: ''})
    })

    socket.on('signal_finish', (socketId: string, roomId: string) => {
        let room = room_list[roomId];
        let cur_player = player_list[socketId];
        if (room === undefined || cur_player === undefined) return;
        else cur_player.isReady = false;

        if (room.checkFinish()) {
            console.log('game finished for room %s', roomId)
            let final_scores: [string, number][] = []
            for (let i in room.players) {
                let player = room.players[i];
                final_scores.push([player.name, player.score])
            }
            final_scores.sort((a, b) => b[1] - a[1])
            for (let i in room.players) {
                let player = room.players[i];
                if (Object.keys(room.players).length !== 1) {
                    let win = player.score === final_scores[0][1];
                    store_player(player, win);
                }
                player.socket.emit('update_scores', final_scores);
            }
        }
        
    })

    socket.on('word', (socketId: string, word: string, callback: any) => {
        let player = player_list[socketId];
        if (player === undefined) return;
        if (wordList.includes(word)) {
            if (!player.words.includes(word)) {
                player.words.push(word)

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

                callback({ status: 'ok', score: score })
            } else {
                callback({ status: 'repeated' })
            }
        }
    })

    socket.on('request_stats', (socketId: string, callback: any) => {
        let player = player_list[socketId];
        if (player === undefined) {
            callback({ status: 'error', message: 'player not found' });
            return
        }
        if (player.googleId === "") {
            callback({ status: 'error', message: 'player not found in db' });
            return
        }
        client.connect().then(() => {
            const db = client.db('webhunt-users');
            const collection = db.collection('users');
            collection.findOne({ googleId: player.googleId }).then((user) => {
                callback({ status: 'ok', user: user });
            });
        })
    })
})

setInterval(() => {
    let pack: string[] = [];
    for (let i in player_list) {
        pack.push(player_list[i].socket.id)
    }
    for (let i in player_list) {
        let target = player_list[i].socket
        target.emit('socket_info', pack)
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
                names: Object.values(room.players).map((player: Player) => player.name),
                ready_states: Object.values(room.players).map((player: Player) => player.isReady),
            }
        }
        for (let j in room.players) {
            let player = room.players[j];
            if (player == room.owner)
                player.socket.emit('room_info', data, true)
            else 
                player.socket.emit('room_info', data, false)
        }
    }
}, 1000/30)
