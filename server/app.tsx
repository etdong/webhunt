import cors from 'cors'
import * as fs from 'fs';
import short from 'short-uuid';
import express from 'express';
import http from 'http'
import { Server } from 'socket.io'
import passport from 'passport';
import session from 'express-session';
import { MongoClient, ServerApiVersion } from 'mongodb';

function generateRandomString(length: number) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
 
    for (let i = 0; i < length; i++) {
       const randomIndex = Math.floor(Math.random() * charset.length);
       result += charset[randomIndex];
    }
 
    return result;
 }

class Player {
    id: string;
    name: string;
    socket: any;
    words: string[] = [];
    score: number = 0;
    isReady: boolean = false;
    roomId: string = "menu";
    googleId: string = "";

    constructor(socket: any) {
        this.id = socket.id;
        this.socket = socket;
        this.name = 'Guest_' + generateRandomString(4);
    }    

    addWord(word: string) {
        this.words.push(word)
    }

    addScore(score: number) {
        this.score += score;
    }

    reset() {
        this.words = [];
        this.score = 0;
        this.isReady = false;
    }
}

class Room {
    id: string;
    name: string;
    owner: Player;
    max_players: number;
    round_time: number;
    board_size: number;
    players: { [key: string]: Player } = {};
    board: { [key: number]: string[] } = {};
    all_ready: boolean = false;

    constructor(id: string, owner: Player, name: string, max_players: number, round_time: number, board_size: number) {
        this.id = id;
        this.owner = owner;
        this.join(owner);
        this.name = name;
        this.max_players = max_players;
        this.round_time = round_time;
        this.board_size = board_size;
        console.log('created room %s', this.id)
    }

    public startGame() {
        if (!this.checkReady()) return false;
        this.generateBoard(this.board_size);
        console.log('game started for room %s', this.id);
        return true;
    }

    public generateBoard(size: number) {

        let letters: string = "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ";

        for (let i = 0; i < size; i++) {
            this.board[i] = []
            for (let j = 0; j < size; j++) {
                this.board[i].push(letters[Math.floor(Math.random() * letters.length)])
            }
        }
        console.log('generated board for room %s', this.id)
    }

    public join(player: Player) {
        if (Object.keys(this.players).includes(player.id)) return;
        this.players[player.id] = player;
        player.roomId = this.id;
        console.log('player %s joined room %s', player.id, this.id)
    }

    public leave(player: Player) {
        if (!Object.keys(this.players).includes(player.id)) return;

        console.log('player %s left room %s', player.id, this.id)
        delete this.players[player.id];

        if (player === this.owner) {
            this.owner = this.players[Object.keys(this.players)[0]];
        }
    }

    public checkReady() {
        for (let i in this.players) {
            let player = this.players[i]
            if (!player.isReady) {
                return false;
            }
        }
        return true;
    }

    public checkFinish() {
        for (let i in this.players) {
            let player = this.players[i]
            if (player.isReady) {
                return false;
            }
        }
        return true;
    }
}

const client_url = process.env.CLIENT_URL;
const uuid = short();

// reading in the wordlist
const wordList = fs.readFileSync('words.txt','utf8').replace(/(\r)/gm, "").split('\n');

// setting up mongodb
const user = process.env.DBUSER;
const pass = process.env.DBPASS;
const uri = "mongodb+srv://" + user + ":" + pass + "@webhunt-users.7qnfa.mongodb.net/?retryWrites=true&w=majority&appName=webhunt-users";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

function store_player(player: any, win: boolean) {
    if (player.googleId !== "") {
        console.log('storing player: ' + player.googleId);
        client.connect().then(() => {
            const db = client.db('webhunt-users');
            const collection = db.collection('users');
            collection.findOne({ googleId: player.googleId } ).then((user) => {
                if (user) {
                    user.total_score += player.score;
                    user.highest_score = Math.max(user.highest_score, player.score);
                    user.games_played += 1;
                    if (win) user.games_won += 1;
                    user.avg_score_per_game = user.total_score / user.games_played;
                    user.words_found += player.words.length;
                    user.avg_score_per_word = user.total_score / user.words_found;
                    collection.updateOne({ googleId: player.googleId }, {
                        $set: {
                            total_score: user.total_score,
                            highest_score: user.highest_score,
                            games_played: user.games_played,
                            games_won: user.games_won,
                            words_found: user.words_found,
                            avg_score_per_game: user.avg_score_per_game,
                            avg_score_per_word: user.avg_score_per_word,
                        }
                    })
                    
                }
            });
        })
    }

}

// setting up server
const app = express();
require('./auth');
app.use(cors({
    origin: "https://webhunt.donger.ca",
    credentials: true,            //access-control-allow-credentials:true
}));

app.set('trust proxy', 1)

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

app.get("/", (_, res) => {
    res.send("Webhunt backend server");
})

app.get(
    "/auth/google", 
    passport.authenticate('google', { 
        scope: ['profile'] 
    })
);

app.get(
    "/google/callback", 
    passport.authenticate('google', { 
        session: true,
        successRedirect: client_url || 'https://webhunt.donger.ca',
        failureRedirect: client_url || 'https://webhunt.donger.ca'
    })
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
        origin: "https://webhunt.donger.ca",
        credentials: true,
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
