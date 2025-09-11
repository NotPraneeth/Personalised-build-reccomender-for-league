const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ITEM_OUTPUT_DIR = path.join(__dirname, '..', 'public', 'item-icons');
const SPELL_OUTPUT_DIR = path.join(__dirname, '..', 'public', 'spell-icons');

async function downloadImage(url, filepath) {
    const dirname = path.dirname(filepath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }

    const writer = fs.createWriteStream(filepath);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function fetchItemIcons(version) {
    console.log('\n--- Starting Item Icon Download ---');
    const ITEM_JSON_URL = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`;
    const IMG_BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/`;

    const response = await axios.get(ITEM_JSON_URL);
    const items = response.data.data;
    const itemIds = Object.keys(items);
    console.log(`Found ${itemIds.length} items to download.`);

    for (const itemId of itemIds) {
        const imageUrl = `${IMG_BASE_URL}${itemId}.png`;
        const localPath = path.join(ITEM_OUTPUT_DIR, `${itemId}.png`);
        if (fs.existsSync(localPath)) continue;

        console.log(`-> Downloading item ${itemId}.png...`);
        await downloadImage(imageUrl, localPath);
    }
    console.log('--- Item Icon Download Complete ---');
}


async function fetchSummonerSpells(version) {
    console.log('\n--- Starting Summoner Spell Icon Download ---');
    const SPELL_JSON_URL = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`;
    const IMG_BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/`;
    
    const response = await axios.get(SPELL_JSON_URL);
    const spells = response.data.data;
    const spellKeys = Object.keys(spells);
    console.log(`Found ${spellKeys.length} summoner spells to download.`);

    for (const spellKey of spellKeys) {
        const spellData = spells[spellKey];

        
        const spellImageFile = spellData.image.full;
        
        const spellId = spellData.key;

        const imageUrl = `${IMG_BASE_URL}${spellImageFile}`;
        
        const localPath = path.join(SPELL_OUTPUT_DIR, `${spellId}.png`);

        if (fs.existsSync(localPath)) continue;

        console.log(`-> Downloading spell ${spellData.name} as ${spellId}.png...`);
        await downloadImage(imageUrl, localPath);
    }
    console.log('--- Summoner Spell Icon Download Complete ---');
}


async function runDownloader() {
    try {
        console.log('Fetching latest patch version...');
        const versionsResponse = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
        const latestVersion = versionsResponse.data[0];
        console.log(`Latest version found: ${latestVersion}`);

        await fetchItemIcons(latestVersion);
        await fetchSummonerSpells(latestVersion);

        console.log('\n==============================');
        console.log('All asset downloads complete!');
        console.log('==============================');

    } catch (error) {
        console.error('An error occurred during the master download process:', error.message);
    }
}

runDownloader();