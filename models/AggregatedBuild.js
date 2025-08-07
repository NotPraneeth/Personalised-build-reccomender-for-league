const mongoose = require('mongoose');

const AggregatedBuildSchema = new mongoose.Schema({

    patch: { type: String, required: true },
    lane: { type: String, required: true },
    championId: { type: Number, required: true },
    opponentChampionId: { type: Number, required: true },
    championName: { type: String, required: true },
    opponentChampionName: { type: String, required: true },
    
    sampleSize: { type: Number, required: true },
    winRate: { type: Number, required: true },
    
    runes: { type: Object },
    items: [Number],
    skillOrder: String,
    summonerSpells: [Number],
    startingItems: [Number],
}, { 
    timestamps: true 
});

AggregatedBuildSchema.index({ patch: 1, lane: 1, championId: 1, opponentChampionId: 1 }, { unique: true });

const AggregatedBuild = mongoose.model('AggregatedBuild', AggregatedBuildSchema);


module.exports = AggregatedBuild;