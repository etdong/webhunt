import cors from 'cors'
import * as fs from 'fs';
import short from 'short-uuid';
import express from 'express';
import http from 'http'
import { Server } from 'socket.io'
import passport from 'passport';
import session from 'express-session';

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

class Player {
    id: string;
    socket: any;
    words: string[] = [];
    score: number = 0;
    isReady: boolean = false;
    roomId: string = "menu";

    constructor(socket: any) {
        this.id = socket.id;
        this.socket = socket;
    }    

    addWord(word: string) {
        this.words.push(word)
    }

    addScore(score: number) {
        this.score += score;
    }
}

class Room {
    id: string;
    name: string;
    owner: Player;
    players: { [key: string]: Player } = {};
    leaderboard: { [key: string]: number } = {};
    board: { [key: number]: string[] } = {};
    all_ready: boolean = false;

    constructor(id: string, name: string, owner: Player) {
        this.id = id;
        this.name = name;
        this.owner = owner;
        this.join(owner);
        console.log('created room %s', this.id)
    }

    public generateBoard(size: number) {
        for (let i = 0; i < size; i++) {
            this.board[i] = []
            for (let j = 0; j < size; j++) {
                this.board[i].push(String.fromCharCode(65 + Math.floor(Math.random() * 26)))
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

        if (Object.keys(this.players).length === 0) {
            console.log('room %s is empty, deleting', this.id)
            delete room_list[this.id];
        }
    }

    private checkReady() {
        for (let i in this.players) {
            let player = this.players[i]
            if (!player.isReady) {
                return false;
            }
        }
        return true;
    }
}

// player list for tracking sockets
// key is the socket id, value is the player object
let player_list: { [key: string]: any } = {};

// 
let room_list: { [key: string]: Room } = {};

io.sockets.on('connection', (socket: any) => {
    socket.id = uuid.generate();
    let new_player = new Player(socket);
    player_list[socket.id] = new_player;

    console.log('\nplayer connection %s', socket.id)
    console.log('players: %s', player_list)

    socket.on('disconnect', () => {
        console.log('socket disconnection %s', socket.id)
        delete player_list[socket.id]
    })

    socket.on('create_room', (data: any) => {
        let owner = player_list[data.socketId];
        let room = new Room(uuid.generate(), data.roomName, owner);
        room_list[room.id] = room;
        socket.to(data.socketId).emit('room_created', room.id)
    })

    socket.on('join_room', (data: any) => {
        let room = room_list[data.roomId];
        room.join(player_list[data.socketId]);
        socket.to(data.socketId).emit('room_joined', room.id)
    })

    socket.on('leave_room', (data: any) => {
        let room = room_list[data.roomId];
        room.leave(player_list[data.socketId]);
        socket.to(data.socketId).emit('room_left', room.id)
    })

    socket.on('request_login', (data: any) => {
        console.log('login request: ' + data.username + ' ' + data.password)
    })

    socket.on('word', (data: any) => {
        console.log('word received:', data.word)
        if (wordList.includes(data.word)) {
            if (!socket.words.includes(data.word)) {
                socket.words.push(data.word)

                let score = 0
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

                console.log('score:', score)
                socket.to(data.id).emit('score', score)
            } else {
                console.log('repeated')
                socket.to(data.id).emit('word_repeated')
            }
            
        } else {
            console.log('word is not in wordlist')
        }
    })
})

setInterval(() => {
    let pack: string[] = [];
    for (let i in player_list) {
        pack.push(player_list[i].id)
    }
    for (let i in player_list) {
        let target = player_list[i].socket
        target.emit('socket_info', pack)
    }
}, 1000/30)
