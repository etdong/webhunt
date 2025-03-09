"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../utils/helpers");
class Player {
    constructor(socket) {
        this.words = [];
        this.score = 0;
        this.isReady = false;
        this.roomId = "menu";
        this.googleId = "";
        this.id = socket.id;
        this.socket = socket;
        this.name = 'Guest_' + (0, helpers_1.generateRandomString)(4);
    }
    addWord(word) {
        this.words.push(word);
    }
    addScore(score) {
        this.score += score;
    }
    reset() {
        this.words = [];
        this.score = 0;
        this.isReady = false;
    }
}
exports.default = Player;
