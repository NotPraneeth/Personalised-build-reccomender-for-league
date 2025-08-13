const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const AggregatedBuild = require('./models/AggregatedBuild');
const itemInfo = require('./utils/itemInfo.json');

const { runeIconPreprocessor, runeIdtoRuneIcon } = require('./services/runeIconPreprocessor');

const app = express();

const publicDirectoryPath = path.join(__dirname, 'public');

app.use(express.static(publicDirectoryPath));
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await runeIconPreprocessor();

        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB.");

        app.listen(PORT, () => {
            console.log(`🚀 Server is running and ready on port ${PORT}`);
            console.log(`📂 Serving static files from: ${publicDirectoryPath}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();


app.get('/api/test/:championName/:opponentChampionName', async (req, res) => {
    try {
        const { championName, opponentChampionName } = req.params;
        console.log(`Fetching items for ${championName} vs ${opponentChampionName}`);

        const buildData = await AggregatedBuild.findOne({ championName, opponentChampionName });

        if (!buildData) {
            return res.status(404).json({ message: "Matchup doesn't exist yet." });
        }

        const itemNames = buildData.items.map(itemId => {
            return itemInfo.data[itemId]?.name || `Unknown Item (${itemId})`;
        });
        
        const runes = buildData.runes;

        const dataToSend = {
            items: itemNames,
            runes: {
                "primary": {
                    "styleId": runes.primary.styleId,
                    "styleIcon": runeIdtoRuneIcon.get(runes.primary.styleId),
                    "perks": runes.primary.perks.map(perkId => ({
                        "perkId": perkId,
                        "icon": runeIdtoRuneIcon.get(perkId),
                    }))
                },
                "secondary": {
                    "styleId": runes.secondary.styleId,
                    "styleIcon": runeIdtoRuneIcon.get(runes.secondary.styleId),
                    "perks": runes.secondary.perks.map(perkId => ({
                        "perkId": perkId,
                        "icon": runeIdtoRuneIcon.get(perkId),
                    }))
                },
                "stats": {
                    "perks": runes.stats.perks.map(perkId => ({
                        "perkId": perkId,
                        "icon": runeIdtoRuneIcon.get(perkId),
                    }))
                }
            },
        };
        res.status(200).json(dataToSend);
        // res.status(200).json(buildData);
    } catch (error) {
        console.error("Error in /api/test route:", error);
        res.status(500).json({ message: "An internal server error occurred." });
    }
});

