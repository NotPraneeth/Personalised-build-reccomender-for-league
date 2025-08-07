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




