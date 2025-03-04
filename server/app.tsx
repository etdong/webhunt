const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')
import cors from 'cors'
import * as fs from 'fs';
const wordList = fs.readFileSync('words.txt','utf8').replace(/(\r)/gm, "").split('\n');


app.use(cors())

const serv = http.createServer(app)

const io = new Server(serv, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
})

serv.listen(2001, () => {
    console.log(`Server running`)
})


let SOCKET_LIST: { [key: string]: any } = {};
let socket_words: { [key: string]: string[] } = {};
let leaderboard: { [key: string]: number } = {};
let done_count = 0;

io.sockets.on('connection', (socket: any) => {
    socket.id = Math.random()
    SOCKET_LIST[socket.id] = socket
    socket_words[socket.id] = []

    console.log('socket connection %s', socket.id)
    console.log('sockets: %s', SOCKET_LIST)

    socket.on('disconnect', () => {
        console.log('socket disconnection')
        delete SOCKET_LIST[socket.id]
    })

    socket.on('start', () => {
        leaderboard = {}
        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i]
            socket.emit('game_start')
        }
    })

    socket.on('final_score', (data: any) => {
        leaderboard[data.id] = data.score;
    })

    socket.on('end', () => {
        for (let i in SOCKET_LIST) {
            let socket = SOCKET_LIST[i]
            socket.emit('final_scores', leaderboard)
        }
    })

    socket.on('word', (data: any) => {
        console.log('word received:', data.word)
        if (wordList.includes(data.word)) {
            if (!socket_words[socket.id].includes(data.word)) {
                socket_words[socket.id].push(data.word)

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
    let pack: number[] = [];
    for (let i in SOCKET_LIST) {
        pack.push(SOCKET_LIST[i].id)
    }
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i]
        socket.emit('socket_info', pack)
    }
}, 1000/30)

