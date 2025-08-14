const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const axios = require('axios');

const { sleep } = require('./utils/sleep');
const { analyzeMatchData } = require('./utils/analyzeMatchData');
const Matchup = require('./models/Matchup');

const riotApiKey = process.env.API_KEY;

const TARGET_TIERS = [
    { tier: 'PLATINUM',  division: 'IV' },
    { tier: 'PLATINUM',  division: 'III' },
    { tier: 'PLATINUM',  division: 'II' },
    { tier: 'PLATINUM',  division: 'I' },

    { tier: 'EMERALD',  division: 'IV' },
    { tier: 'EMERALD',  division: 'III' },
    { tier: 'EMERALD',  division: 'II' },
    { tier: 'EMERALD',  division: 'I' },

    { tier: 'DIAMOND',  division: 'IV' },
    { tier: 'DIAMOND',  division: 'III' },
    { tier: 'DIAMOND',  division: 'II' },
    { tier: 'DIAMOND',  division: 'I' },
];


const AXIOS_TIMEOUT = 10000; 

const runFullCollection = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Successfully connected.');

        for (const { tier, division } of TARGET_TIERS) {
            console.log(`\n=================================================`);
            console.log(`--- Starting collection for ${tier} ${division} ---`);
            console.log(`=================================================`);

            const playersApiUrl = `https://sg2.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/${tier.toUpperCase()}/${division.toUpperCase()}?api_key=${riotApiKey}`;
            const playersResponse = await axios.get(playersApiUrl, { timeout: AXIOS_TIMEOUT }); 
            const players = playersResponse.data;
            console.log(`[INFO] Found ${players.length} players in ${tier} ${division}.`);

            let allMatchIds = [];
            let playerCounter = 0; 
            for (const player of players) {
                playerCounter++;
                try {
                    console.log(` -> Processing player ${playerCounter} of ${players.length}...`); 
                    const matchHistoryUrl = `https://sea.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?type=ranked&start=0&count=50&api_key=${riotApiKey}`;
                    const matchHistoryResponse = await axios.get(matchHistoryUrl, { timeout: AXIOS_TIMEOUT });
                    console.log('player matches fetched:', matchHistoryResponse.data)
                    allMatchIds.push(...matchHistoryResponse.data);
                    await sleep(1500);
                } catch (e) {
                    if (e.code === 'ECONNABORTED') {
                        console.warn(`- Player request timed out. Skipping.`);
                    } else {
                        console.warn(`- Skipping one player's history in ${tier} ${division} (Status: ${e.response?.status})`);
                    }
                    await sleep(1500);
                }
            }
            
            const uniqueMatchIds = [...new Set(allMatchIds)];
            console.log(`[INFO] Found ${uniqueMatchIds.length} unique matches to process for ${tier} ${division}.`);

            for (const matchId of uniqueMatchIds) {
                try {
                    const alreadyExists = await Matchup.findOne({ matchId: matchId });
                    if (alreadyExists) continue;

                    const matchDetailsUrl = `https://sea.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotApiKey}`;
                    const matchTimelineUrl = `https://sea.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline?api_key=${riotApiKey}`;

                    console.log(`Processing match ${matchId}...`);
                    
                    const detailsResponse = await axios.get(matchDetailsUrl, { timeout: AXIOS_TIMEOUT });
                    await sleep(1500);
                    const timelineResponse = await axios.get(matchTimelineUrl, { timeout: AXIOS_TIMEOUT });


                    const matchupsToSave = analyzeMatchData(detailsResponse.data, timelineResponse.data);
                    
                    if (matchupsToSave.length > 0) {
                        await Matchup.insertMany(matchupsToSave);
                        console.log(`  -> Saved +${matchupsToSave.length} records for match ${matchId}`);
                    }
                    
                    await sleep(1500);
                } catch (matchError) {
                    if (matchError.code === 'ECONNABORTED') {
                        console.error(`! Match request timed out for ${matchId}. Skipping.`);
                    } else {
                        console.error(`! Failed to process match ${matchId}: ${matchError.message}. Skipping.`);
                    }
                    await sleep(1500); 
                }
            }
        }
        
        console.log("\n--- MASTER COLLECTION PROCESS COMPLETE ---");

    } catch (error) {
        console.error("A critical error occurred in the master collection process:", error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

runFullCollection();