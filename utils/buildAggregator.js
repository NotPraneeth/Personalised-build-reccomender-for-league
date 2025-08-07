
const dotenv = require('dotenv');
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Matchup = require('../models/Matchup');
const AggregatedBuild = require('../models/AggregatedBuild');

const nameToIdMap = require('./championNameAndId.json');

const idToNameMap = Object.fromEntries(
    Object.entries(nameToIdMap).map(([name, id]) => [id, name])
);

const runAggregation = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Successfully connected.');

        const currentPatch = "15.11";

        console.log(`Deleting old aggregated data for patch ${currentPatch}...`);
        await AggregatedBuild.deleteMany({ patch: currentPatch });

       
        console.log(`Fetching all raw matchups for patch ${currentPatch}...`);
        const allMatchups = await Matchup.find({ patch: currentPatch }).lean();
        console.log(`Found ${allMatchups.length} raw matchup records to process.`);

        if (allMatchups.length === 0) {
            console.log('No raw data found for this patch. Exiting.');
            return;
        }

      
        const groupedMatchups = new Map();
        for (const match of allMatchups) {
            const key = `${match.championId}-${match.opponentChampionId}-${match.lane}`;
            if (!groupedMatchups.has(key)) {
                groupedMatchups.set(key, []); 
            }
            groupedMatchups.get(key).push(match); 
        }
        console.log(`Grouped data into ${groupedMatchups.size} unique matchups.`);

       
        const finalBuildsToSave = [];

        for (const [key, games] of groupedMatchups.entries()) {
            
          
            const itemCounts = new Map();
            for (const game of games) {
                if (game.items) {
                    for (const itemId of game.items) {
                        itemCounts.set(itemId, (itemCounts.get(itemId) || 0) + 1);
                    }
                }
            }
            const mostFrequentItems = [...itemCounts.entries()]
                .sort((a, b) => b[1] - a[1]) 
                .slice(0, 6)                 
                .map(entry => entry[0]);    

           
            const runeCounts = new Map();
            for (const game of games) {
                if (game.runes) {
                    const runeKey = JSON.stringify(game.runes);
                    runeCounts.set(runeKey, (runeCounts.get(runeKey) || 0) + 1);
                }
            }
            let mostCommonRunes = null;
            if (runeCounts.size > 0) {
                const mostCommonRunesKey = [...runeCounts.entries()].reduce((a, b) => b[1] > a[1] ? b : a)[0];
                mostCommonRunes = JSON.parse(mostCommonRunesKey);
            }
            
            
            const skillOrderCounts = new Map();
            for (const game of games) {
                if (game.skillOrder) {
                    skillOrderCounts.set(game.skillOrder, (skillOrderCounts.get(game.skillOrder) || 0) + 1);
                }
            }
            let mostCommonSkillOrder = null;
            if (skillOrderCounts.size > 0) {
                mostCommonSkillOrder = [...skillOrderCounts.entries()].reduce((a, b) => b[1] > a[1] ? b : a)[0];
            }

            
            const summonerSpellCounts = new Map();
            for (const game of games) {
                if (game.summonerSpells) {
                    const spellKey = [...game.summonerSpells].sort().join(','); // Sort to treat [4,12] and [12,4] as the same
                    summonerSpellCounts.set(spellKey, (summonerSpellCounts.get(spellKey) || 0) + 1);
                }
            }
            let mostCommonSummonerSpells = null;
            if (summonerSpellCounts.size > 0) {
                const mostCommonSpellsKey = [...summonerSpellCounts.entries()].reduce((a, b) => b[1] > a[1] ? b : a)[0];
                mostCommonSummonerSpells = mostCommonSpellsKey.split(',').map(Number);
            }

           
            const startingItemCounts = new Map();
            for (const game of games) {
                if (game.startingItems) {
                    const startKey = [...game.startingItems].sort().join(',');
                    startingItemCounts.set(startKey, (startingItemCounts.get(startKey) || 0) + 1);
                }
            }
            let mostCommonStartingItems = null;
            if (startingItemCounts.size > 0) {
                const mostCommonStartKey = [...startingItemCounts.entries()].reduce((a, b) => b[1] > a[1] ? b : a)[0];
                mostCommonStartingItems = mostCommonStartKey.split(',').map(Number);
            }

       
            const [championId, opponentChampionId, lane] = key.split('-');
            const totalGames = games.length;
            const wins = games.filter(g => g.win).length;

            const finalBuild = {
                patch: currentPatch,
                lane: lane,
                championId: Number(championId),
                opponentChampionId: Number(opponentChampionId),
                championName: idToNameMap[championId],
                opponentChampionName: idToNameMap[opponentChampionId],
                sampleSize: totalGames,
                winRate: parseFloat((wins / totalGames * 100).toFixed(2)),
                runes: mostCommonRunes,
                items: mostFrequentItems,
                skillOrder: mostCommonSkillOrder,
                summonerSpells: mostCommonSummonerSpells,
                startingItems: mostCommonStartingItems,
            };

            finalBuildsToSave.push(finalBuild);
        }

        console.log(`Saving ${finalBuildsToSave.length} new aggregated build documents...`);
        if (finalBuildsToSave.length > 0) {
            await AggregatedBuild.insertMany(finalBuildsToSave);
        }
        
        console.log("\n--- AGGREGATION PROCESS COMPLETE ---");

    } catch (error) {
        console.error("A critical error occurred in the aggregation process:", error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

runAggregation();