const axios = require('axios');

const runeIdtoRuneIcon = new Map();

const STAT_SHARD_MAP = {
    5008: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png',
    5005: 'perk-images/StatMods/StatModsAttackSpeedIcon.png',
    5007: 'perk-images/StatMods/StatModsCDRScalingIcon.png',
    5002: 'perk-images/StatMods/StatModsArmorIcon.png',
    5003: 'perk-images/StatMods/StatModsMagicResIcon.png',
    5001: 'perk-images/StatMods/StatModsHealthPlusIcon.png',
};

const runeIconPreprocessor = async () => {
    try {
        const versionsResponse = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
        const latestVersion = versionsResponse.data[0];
        console.log(`Initializing rune data with DDragon version: ${latestVersion}`);

        const runesUrl = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/runesReforged.json`;
        const runesResponse = await axios.get(runesUrl);
        const runesData = runesResponse.data;
        const baseUrl = `https://ddragon.leagueoflegends.com/cdn/img/`;

        runesData.forEach(tree => {
            runeIdtoRuneIcon.set(tree.id, `${baseUrl}${tree.icon}`);
            tree.slots.forEach(slot => {
                slot.runes.forEach(runeItem => {
                    runeIdtoRuneIcon.set(runeItem.id, `${baseUrl}${runeItem.icon}`);
                });
            });
        });

        for (const [id, path] of Object.entries(STAT_SHARD_MAP)) {
            runeIdtoRuneIcon.set(parseInt(id, 10), `${baseUrl}${path}`);
        }

        return true;
    } catch (err) {
        console.error(" Rune data service failed to initialize.", err.message);
        process.exit(1);
    }
};

module.exports = {
    runeIconPreprocessor,
    runeIdtoRuneIcon,
};