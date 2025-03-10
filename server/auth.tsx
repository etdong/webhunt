import { MongoClient, ServerApiVersion } from "mongodb";
import passport from "passport";

import client from "./db";

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:2001/google/callback"
    },
    (accessToken: any, refreshToken: any, profile: any, cb: any) => {
        client.connect().then(() => {
            const db = client.db('webhunt-users');
            const collection = db.collection('users');
            collection.findOne({ googleId: profile.id }).then((user) => {
                if (!user) {
                    collection.insertOne({
                        googleId: profile.id,
                        displayName: profile.displayName,
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
