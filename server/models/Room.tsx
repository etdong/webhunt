/**
 * Represents a game room where players can join, leave, and play a game.
 */
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

    /**
     * Starts the game for the room if all players are ready.
     * @returns Whether the game has successfully started
     */
    public startGame() {
        if (!this.checkReady()) return false;
        this.generateBoard(this.board_size);
        console.log('game started for room %s', this.id);
        return true;
    }

    /**
     * Generates a size x size board of random letters for the game.
     * @param size 
     */
    public generateBoard(size: number) {
        // using the scrabble letter distribution
        let letters: string = "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ";

        for (let i = 0; i < size; i++) {
            this.board[i] = []
            for (let j = 0; j < size; j++) {
                this.board[i].push(letters[Math.floor(Math.random() * letters.length)])
            }
        }
        console.log('generated board for room %s', this.id)
    }

    /**
     * Adds player to the room.
     * @param player 
     * @returns 
     */
    public join(player: Player) {
        if (Object.keys(this.players).includes(player.id)) return;
        this.players[player.id] = player;
        player.roomId = this.id;
        console.log('player %s joined room %s', player.id, this.id)
    }

    /**
     * Removes player from the room.
     * @param player 
     * @returns 
     */
    public leave(player: Player) {
        if (!Object.keys(this.players).includes(player.id)) return;

        console.log('player %s left room %s', player.id, this.id)
        delete this.players[player.id];
        player.isReady = false;

        if (player === this.owner) {
            let new_owner = this.players[Object.keys(this.players)[0]];
            if (new_owner === undefined) return;
            new_owner.isReady = true;
            this.owner = new_owner;
        }
    }

    /**
     * Checks if all players in the room are ready.
     * @returns Whether all players in the room are ready.
     */
    public checkReady() {
        for (let i in this.players) {
            let player = this.players[i]
            if (!player.isReady) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks if all players in the room are finished and on the score screen.
     * @returns Whether all players in the room are finished.
     */
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