import * as utils from '../utils';

/**
 * Represents a player in the game.
 */
export class Player {
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
        this.name = 'Guest_' + utils.generateRandomString(4);
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