const mongoose = require('mongoose')

const matchupSchema = new mongoose.Schema({
    matchId: {
        type: String,
        required: true,
        index: true
    },
    patch: {
        type: String,
        required: true
    },
    gameCreation: Number,
    championId: {
        type: Number,
        required: true
    },
    championName: {
        type: String,
        required: true
    },
    opponentChampionId: {
        type: Number,
        required: true
    },
    opponentChampionName: {
        type: String,
        required: true
    },
    lane:{
        type: String,
        required: true
    },
    win: {
        type: Boolean,
        required: true
    },

    items: [Number],

    runes: {
        primary: {
            styleId: {
                type: Number,
                required: true
            },
            perks: {
                type: [Number],
                required: true
            }
        },
        secondary: {
            styleId: {
                type: Number,
                required: true
            },
            perks: {
                type: [Number],
                required: true
            }
        },
        stats: {
            perks:{
                type: [Number],
                required: true
            }
        }
    } ,
    summonerSpells:[Number],
    skillOrder: String,
    startingItems: [Number],
    
})
matchupSchema.index({ matchId: 1, championId: 1 }, { unique: true });

const Matchup = mongoose.model('Matchup', matchupSchema);

module.exports = Matchup;