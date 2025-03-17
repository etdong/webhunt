import cors from 'cors'
import * as fs from 'fs';
import express from 'express';
import http from 'http'
import { Server } from 'socket.io'
import passport from 'passport';
import session from 'express-session';

// reading in the wordlists
const wordList = fs.readFileSync('words.txt','utf8').replace(/(\r)/gm, "").split('\n');

const db = require('./db')
const client_url = process.env.CLIENT_URL;

// setting up server
const app = express();
require('./auth');
app.use(cors({
    origin: "https://webhunt.donger.ca",
    credentials: true,            //access-control-allow-credentials:true
}));

app.set('trust proxy', 1)

// using noleak memorystore
const MemoryStore = require('memorystore')(session);
app.use(session({ 
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
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('session'))

// homepage
app.get("/", (_, res) => {
    res.send("Webhunt backend server");
})

// google auth page
app.get(
    "/auth/google", 
    passport.authenticate('google', { 
        scope: ['profile'] 
    })
);

// google callback page
app.get(
    "/google/callback", 
    passport.authenticate('google', { 
        session: true,
        successRedirect: client_url || 'https://webhunt.donger.ca',
        failureRedirect: client_url || 'https://webhunt.donger.ca'
    })
);

// auth middleware
function isAuthenticated(req: any, res: any, next: any) {
    if (req.user) next();
    else res.json({ loggedIn: false});
}

// get user login information
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

// setting up socket.io
const io = new Server(serv, {
    cors: {
        origin: "https://webhunt.donger.ca",
        credentials: true,
        methods: ["GET", "POST"],
    },
})
// listen on port 2001
serv.listen(2001, () => {
    console.log(`Server running on 2001`)
})

// player list for tracking sockets
// key is the socket id, value is the player object
let player_list: { [key: string]: any } = {};

// room list for tracking rooms
// key is the room id, value is the room object
let room_list: { [key: string]: Room } = {};

// all socket cpmmunication logic
io.sockets.on('connection', (socket: any) => {
    // create a new player object and add it to the player list on connection
    let new_player = new Player(socket);
    player_list[socket.id] = new_player;

    console.log('\nplayer connection %s', socket.id)
    console.log('players: %s', player_list)

    // remove player from player list on disconnection
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

    // when logged in, set googleid and name
    socket.on('login', (socketId: string, name: string, googleId: string) => {
        let player = player_list[socketId];
        if (player === undefined) return;
        player.name = name;
        player.googleId = googleId;
        player.socket.emit('logged_in');
    })

    // check if player is logged in
    socket.on('check_login', (socketId: string, callback: any) => {
        let player = player_list[socketId];
        if (player === undefined)
            callback({ status: false, message: 'requesting player not found' });
        else if (player.googleId === "")
            callback({ status: false, message: 'google id not found' });
        else
            callback({ status: true, message: 'logged in' });
    })

    // room creation request
    socket.on('create_room', (socketId: string, room_info: any, callback: any) => {
        // make sure the caller exists
        let owner = player_list[socketId];
        if (owner === undefined) {
            callback({ status: 'error', message: 'current player doesnt exist' });
            return;
        };

        // owner is always ready
        owner.isReady = true;

        // generate a random unique room id
        let id = generateRandomString(4);
        while (room_list[id] !== undefined) {   
            id = generateRandomString(4);
        }

        // if no name is provided, use the room id
        if (room_info.name === "") {
            room_info.name = id;
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

    // join room request
    socket.on('join_room', (socketId: string, roomId: string, callback: any) => {
        let room = room_list[roomId];
        let player = player_list[socketId];

        if (player === undefined) {
            callback({ status: 'error', message: 'requesting player not found' });
            return;
        };

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

    // leave room request
    socket.on('leave_room', (socketId: string, roomId: string) => {
        // make sure the caller exists
        if (player_list[socketId] === undefined) {
            return;
        };

        let room = room_list[roomId];
        if (room === undefined) return;
        room.leave(player_list[socketId]);

        // delete room if empty
        if (Object.keys(room.players).length === 0) {
            console.log('room %s is empty, deleting', room.id)
            delete room_list[room.id];
        }
    })

    // request room list on rooms list page
    socket.on('request_rooms', (socketId: string, callback: any) => {
        // make sure the caller exists
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

    // player ready signal
    socket.on('signal_ready', (socketId: string, roomId: string) => {
        let room = room_list[roomId];
        let player = player_list[socketId];

        // make sure the caller and room exists
        if (room === undefined || player === undefined) return;
        if (room.owner == player) player.isReady = true
        else player.isReady = !player.isReady;
    })

    // start game signal
    socket.on('signal_start', (roomId: string, callback: any) => {
        console.log('start signalled from room %s', roomId)
        let room = room_list[roomId];

        if (room === undefined) {
            callback({ status: 'error', message: 'room not found' });
            return;
        }

        if (room.startGame()) {
            // on successful start, reset all players and send game start signal
            for (let i in room.players) {
                let player = room.players[i];
                player.reset()
                room.players[i].socket.emit('game_start', room.board, room.round_time)
            }
        }
    })

    // player finished game, submitting score
    socket.on('submit_score', (socketId: string, score: number, callback: any) => {
        let player = player_list[socketId];
        if (player === undefined) {
            callback({ status: 'error', message: 'requesting player not found' });
            return;
        };
        player.score = score;
        callback({ status: 'ok', message: ''})
    })

    // signal player is on the final screen
    socket.on('signal_finish', (socketId: string, roomId: string) => {
        let room = room_list[roomId];
        let cur_player = player_list[socketId];
        if (room === undefined || cur_player === undefined) return;
        else cur_player.isReady = false;

        // check if all players are on the final screen
        if (room.checkFinish()) {
            console.log('game finished for room %s', roomId)
            let final_scores: [string, number][] = []

            // sort players by score
            for (let i in room.players) {
                let player = room.players[i];
                final_scores.push([player.name, player.score])
            }
            final_scores.sort((a, b) => b[1] - a[1])

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
        
    })

    // word handling
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

    // player stat request
    socket.on('request_stats', (socketId: string, callback: any) => {
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
            collection.findOne({ googleId: player.googleId }).then((user: any) => {
                callback({ status: 'ok', user: user });
            });
        });
    })
})

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
}, 1000/10)
