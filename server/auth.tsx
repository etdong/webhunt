import { MongoClient, ServerApiVersion } from "mongodb";
import passport from "passport";

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

// we are using the google oauth strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// setting up passport
passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "https://webhunt.onrender.com/google/callback"
    },
    (profile: any, cb: any) => {
        // check if the user exists in the database
        client.connect().then(() => {
            const db = client.db('webhunt-users');
            const collection = db.collection('users');
            collection.findOne({ googleId: profile.id }).then((user) => {
                // if the user does not exist, add them to the database
                if (!user) {
                    collection.insertOne({
                        googleId: profile.id,
                        name: profile.name.givenName,
                        total_score: 0,
                        highest_score: 0,
                        games_played: 0,
                        games_won: 0,
                        avg_score_per_game: 0,
                        words_found: 0,
                        avg_score_per_word: 0,
                    })
                }
            });
        })
        return cb(null, profile);
    }
));

passport.serializeUser((user, done) => {
    done(null, user);
})

passport.deserializeUser((user: Express.User, done) => {
    done(null, user);
})
