"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const db_1 = __importDefault(require("./db"));
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport_1.default.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:2001/google/callback"
}, (accessToken, refreshToken, profile, cb) => {
    db_1.default.connect().then(() => {
        const db = db_1.default.db('webhunt-users');
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
