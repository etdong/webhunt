"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
let db = require('./db');
// we are using the google oauth strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// setting up passport
passport_1.default.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://webhunt.onrender.com/google/callback"
}, (profile, cb) => {
    // check if the user exists in the database
    db.client.connect().then(() => {
        const collection = db.client.db('webhunt-users').collection('users');
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
                });
            }
        });
    });
    return cb(null, profile);
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
