"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Room {
    constructor(id, owner, name, max_players, round_time, board_size) {
        this.players = {};
        this.board = {};
        this.all_ready = false;
        this.id = id;
        this.owner = owner;
        this.join(owner);
        this.name = name;
        this.max_players = max_players;
        this.round_time = round_time;
        this.board_size = board_size;
        console.log('created room %s', this.id);
    }
    startGame() {
        if (!this.checkReady())
            return false;
        this.generateBoard(this.board_size);
        console.log('game started for room %s', this.id);
        return true;
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
    checkFinish() {
        for (let i in this.players) {
            let player = this.players[i];
            if (player.isReady) {
                return false;
            }
        }
        return true;
    }
}
exports.default = Room;
