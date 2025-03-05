import express from 'express';
import http from 'http';
import { Server } from 'socket.io'
import cors from 'cors';
import * as fs from 'fs';
const wordList = fs.readFileSync('words.txt','utf8').replace(/(\r)/gm, "").split('\n');

const port = process.env.PORT || 2001

const app = express()
app.get('/', (req: any, res: any) => {
    res.sendFile(__dirname + '/index.html');
});
app.use(cors());

const serv = http.createServer(app)

const io = new Server(serv, {
    cors: {
        origin: "https://webhunt-client.onrender.com",
        methods: ["GET", "POST"]
    }
})

serv.listen(port, () => {
    console.log('App listening on port %s', port)
});


let SOCKET_LIST: { [key: string]: any } = {};
let leaderboard: { [key: string]: number } = {};
let board: { [key: number]: string[] } = {};
let all_ready = false;

io.sockets.on('connection', (socket: any) => {
    socket.id = Math.random()
    socket.words = []
    socket.ready = false;
    SOCKET_LIST[socket.id] = socket

    console.log('socket connection %s', socket.id)
    console.log('sockets: %s', SOCKET_LIST)

    socket.on('disconnect', () => {
        console.log('socket disconnection')
        delete SOCKET_LIST[socket.id]
    })

    socket.on('signal_start', (size: any) => {
        leaderboard = {}
        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i]
            socket.emit('enter_lobby')
        }
        for (let i = 0; i < size; i++) {
            board[i] = []
            for (let j = 0; j < size; j++) {
                board[i].push(String.fromCharCode(65 + Math.floor(Math.random() * 26)))
            }
        }
        console.log(board)
    })

    socket.on('submit_score', (data: any) => {
        leaderboard[data.id] = data.score;
    })

    socket.on('end', () => {
        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i]
            socket.emit('final_scores', leaderboard)
        }
    })

    socket.on('signal_ready', (id: number) => {
        socket.ready = true;
        console.log(id + ' is ready')
        all_ready = check_ready()
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

function check_ready() {
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i]
        if (!socket.ready) {
            return false;
        }
    }
    return true;
}

setInterval(() => {
    let pack: number[] = [];
    for (let i in SOCKET_LIST) {
        pack.push(SOCKET_LIST[i].id)
    }
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i]
        socket.emit('socket_info', pack)
    }
}, 1000/30)

setInterval(() => {
    if (all_ready) {
        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i]
            socket.emit('game_start')
            socket.emit('board', board)
            socket.ready = false;
        }
        all_ready = false;
    }
}, 1000)
