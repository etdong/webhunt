"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store_player = store_player;
const mongodb_1 = require("mongodb");
// setting up mongodb
const user = process.env.DBUSER;
const pass = process.env.DBPASS;
const uri = "mongodb+srv://" + user + ":" + pass + "@webhunt-users.7qnfa.mongodb.net/?retryWrites=true&w=majority&appName=webhunt-users";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new mongodb_1.MongoClient(uri, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
// client singleton
exports.default = client;
/**
 * Stores player information in the MongoDB database. This is called at the end of each game.
 *
 * @param {any} player - The player object containing player details.
 * @param {boolean} win - A boolean indicating whether the player won the game.
 *
 * This function connects to the MongoDB database and updates the player's statistics.
 * If the player exists in the database, it updates their total score, highest score,
 * games played, games won, average score per game, words found, and average score per word.
 * If the player does not exist, no action is taken.
 *
 * The player object is expected to have the at least following properties:
 * - googleId: A unique identifier for the player (string).
 * - score: The score achieved by the player in the current game (number).
 * - words: An array of words found by the player in the current game (array).
 *
 * @example
 * const player = {
 *   googleId: "player123",
 *   score: 100,
 *   words: ["word1", "word2"]
 * };
 * const win = true;
 * store_player(player, win);
 */
function store_player(player, win) {
    // check if the player has a googleId.
    // if not the player is not logged in and we don't store their stats
    if (player.googleId !== "") {
        console.log('storing player: ' + player.googleId);
        client.connect().then(() => {
            const db = client.db('webhunt-users');
            const collection = db.collection('users');
            collection.findOne({ googleId: player.googleId }).then((user) => {
                // set initial values for the player
                let total_score = player.score;
                let highest_score = player.score;
                let games_played = 1;
                let games_won = win ? 1 : 0;
                let avg_score_per_game = player.score;
                let words_found = player.words.length;
                let avg_score_per_word = player.score / player.words.length;
                // if the player exists in the database, update their stats
                if (user) {
                    total_score += user.total_score;
                    highest_score = Math.max(user.highest_score, player.score);
                    games_played += user.games_played;
                    games_won += win ? 1 : 0;
                    avg_score_per_game = total_score / games_played;
                    words_found += user.words_found;
                    avg_score_per_word = total_score / words_found;
                }
                // update/insert the player's stats in the database
                collection.updateOne({ googleId: player.googleId }, {
                    $set: {
                        total_score: total_score,
                        highest_score: highest_score,
                        games_played: games_played,
                        games_won: games_won,
                        words_found: words_found,
                        avg_score_per_game: avg_score_per_game,
                        avg_score_per_word: avg_score_per_word,
                    },
                }, { upsert: true }).then(() => {
                    console.log('player stats updated');
                });
            });
        });
    }
}
