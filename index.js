const dotenv = require('dotenv');
dotenv.config();

const express = require('express')
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');


const {sleep} = require('./utils/sleep')
const {analyzeMatchData} = require('./utils/analyzeMatchData')
const Matchup = require('./models/Matchup')



const app = express();

app.use(express.json());
app.use(cors());

const PORT = 3000

mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("connected to MONGODB")
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        });
}).catch((err)=>{
    console.log("MongoDB Connection Failed:",err)
})

const riotApiKey = process.env.API_KEY;

app.get('/matches/:tier/:division', async (req,res) => {

    try{
        const {tier, division} = req.params;
        const PlayersInTier_apiUrl = `https://sg2.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/${tier.toUpperCase()}/${division.toUpperCase()}?api_key=${riotApiKey}`;

        const response = await axios.get(PlayersInTier_apiUrl);
        const playersInTier_puuids = response.data.map(player=> ({
            puuid: player.puuid,
        }))

        let allMatchIds = []
        for(const player_object of playersInTier_puuids){
        const player_puuid = player_object.puuid;

        const countOfMatchesToRetrieve = 51

        const matchId_apiUrl = `https://sea.api.riotgames.com/lol/match/v5/matches/by-puuid/${player_puuid}/ids?type=ranked&start=0&count=${countOfMatchesToRetrieve}&api_key=${riotApiKey}`
        
            try{
                const matchIds = await axios.get(matchId_apiUrl)
                allMatchIds.push(...matchIds.data)
                console.log("pushing data for: ",player_puuid,"data is:", matchIds.data)
                await sleep(1500)
            }
            catch(err){
                console.log("error fetching data for puuid:",player_puuid,":",err)
                await sleep(1500)
            }
        }

        // end of for loop

    const allUniqueMatchIds = [...new Set(allMatchIds)];
    
    let matchupsSaved = 0;

        for(const matchId of allUniqueMatchIds){

            try{
                const exists = await Matchup.exists({matchId: matchId})
                if(exists){
                    console.log(`skipping match ${matchId} as it already exists in the database`)
                    continue;
                }

                const matchData_apiUrl = `https://sea.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotApiKey}`

                const matchData = await axios.get(matchData_apiUrl)

                const matchupsToSave = analyzeMatchData(matchData.data)

                if(matchupsToSave && matchupsToSave.length > 0){
                    matchupsSaved += matchupsToSave.length
                    await Matchup.insertMany(matchupsToSave)
                    
                    console.log(`+ saved ${matchupsToSave.length} matchups for match ${matchId}`)
                }
            }
            catch(matchError){
                console.log(`! Error processing match ${matchId}: ${matchError.message}. skipping`)
            }

            await sleep(1500)
        }

        //end of matchid iteration for loop

        console.log("Finished fetching all match histories and pushed matchData to Database");
        res.status(200).json({
            message: "Successfully pushed matchdata for matches",
            totalFound: allUniqueMatchIds.length,
            MatchupRecordsSaved: matchupsSaved
        });
    }

    //end of main try block

    catch(err){
        console.log("error fetching data:",err.message)
        await sleep(1500)
        res.status(500).json({ error: "Failed to complete the operation due to a critical error:",err });
    }

})


