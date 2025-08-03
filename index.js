const dotenv = require('dotenv');
dotenv.config();

const express = require('express')
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const {sleep} = require('./utils/sleep')


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

        const countOfMatchesToRetrieve = 50

        const matchId_apiUrl = `https://sea.api.riotgames.com/lol/match/v5/matches/by-puuid/${player_puuid}/ids?type=ranked&start=0&count=${countOfMatchesToRetrieve}&api_key=${riotApiKey}`
        
            try{
                const matchIds = await axios.get(matchId_apiUrl)
                allMatchIds.push(...matchIds.data)
                console.log("pushing data for: ",player_puuid," data is: ", matchIds.data)
                await sleep(1500)
            }
            catch(err){
                console.log("error fetching data for puuid:",player_puuid,":",err)
                await sleep(1500)
            }
        }

        // end of for loop

    const allUniqueMatchIds = [...new Set(allMatchIds)];

        console.log("Finished fetching all match histories! Sending response to client.");
        res.status(200).json({
            message: "Successfully fetched match IDs.",
            totalFound: allUniqueMatchIds.length,
            matchIds: allUniqueMatchIds
        });
    }
    catch(err){
        console.log("error fetching data:",err)
        await sleep(1500)
        res.status(500).json({ error: "Failed to complete the operation due to a critical error:",err });
    }

})


