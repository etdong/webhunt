"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const utils = require('../utils');
/**
 * Represents a player in the game.
 */
class Player {
    constructor(socket) {
        this.words = [];
        this.score = 0;
        this.isReady = false;
        this.roomId = "menu";
        this.googleId = "";
        this.id = socket.id;
        this.socket = socket;
        this.name = 'Guest_' + utils.generateRandomString(4);
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
exports.Player = Player;
