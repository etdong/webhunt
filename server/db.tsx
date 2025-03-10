import { MongoClient, ServerApiVersion } from "mongodb";

// setting up mongodb
const user = process.env.DBUSER;
const pass = process.env.DBPASS;
const uri = "mongodb+srv://" + user + ":" + pass + "@webhunt-users.7qnfa.mongodb.net/?retryWrites=true&w=majority&appName=webhunt-users";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

export default client;

export function store_player(player: any, win: boolean) {
    if (player.googleId !== "") {
        console.log('storing player: ' + player.googleId);
        client.connect().then(() => {
            const db = client.db('webhunt-users');
            const collection = db.collection('users');
            collection.findOne({ googleId: player.googleId } ).then((user) => {
                if (user) {
                    user.total_score += player.score;
                    user.highest_score = Math.max(user.highest_score, player.score);
                    user.games_played += 1;
                    if (win) user.games_won += 1;
                    user.avg_score_per_game = user.total_score / user.games_played;
                    user.words_found += player.words.length;
                    user.avg_score_per_word = user.total_score / user.words_found;
                    collection.updateOne({ googleId: player.googleId }, {
                        $set: {
                            total_score: user.total_score,
                            highest_score: user.highest_score,
                            games_played: user.games_played,
                            games_won: user.games_won,
                            words_found: user.words_found,
                            avg_score_per_game: user.avg_score_per_game,
                            avg_score_per_word: user.avg_score_per_word,
                        }
                    })
                    
                }
            });
        })
    }

}