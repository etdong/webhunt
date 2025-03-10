import Player from "./player.js";

export default class Room {
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