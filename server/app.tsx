const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')
import cors from 'cors'

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

io.sockets.on('connection', (socket: any) => {
    socket.id = Math.random()
    SOCKET_LIST[socket.id] = socket
    socket.x = 0
    socket.y = 0
    console.log('socket connection %s', socket.id)
    console.log('sockets: %s', SOCKET_LIST)

    socket.on('disconnect', () => {
        console.log('socket disconnection')
        delete SOCKET_LIST[socket.id]
    })
})

setInterval(() => {
    let pack = []
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i]
        socket.x += 5
        socket.y += 5
        if (socket.x > 500) {
            socket.x = 0
            socket.y = 0
        }
        pack.push({
            id: socket.id,
            x: socket.x,
            y: socket.y
        })
    }
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i]
        socket.emit('socket_info', pack)
    }
}, 1000/30)

