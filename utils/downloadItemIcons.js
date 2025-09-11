
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'item-icons');

async function downloadImage(url, filepath) {
    const writer = fs.createWriteStream(filepath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function fetchAllItemIcons() {
    try {
        console.log('Starting item icon download...');

        console.log('Fetching latest patch version...');
        const versionsResponse = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
        const latestVersion = versionsResponse.data[0];
        console.log(`Latest version found: ${latestVersion}`);

        const ITEM_JSON_URL = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`;
        const IMG_BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/`;

        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
            console.log(`Created directory: ${OUTPUT_DIR}`);
        }

        console.log('Fetching item list from Data Dragon...');
        const response = await axios.get(ITEM_JSON_URL);
        const items = response.data.data;
        const itemIds = Object.keys(items);
        console.log(`Found ${itemIds.length} items to download.`);

        for (const itemId of itemIds) {
            const imageUrl = `${IMG_BASE_URL}${itemId}.png`;
            const localPath = path.join(OUTPUT_DIR, `${itemId}.png`);
            
            if (fs.existsSync(localPath)) continue;

            console.log(`-> Downloading ${itemId}.png...`);
            await downloadImage(imageUrl, localPath);
        }

        console.log('\n==============================');
        console.log('Item icon download complete!');
        console.log('==============================');

    } catch (error) {
        console.error('An error occurred during the download process:', error.message);
    }
}

fetchAllItemIcons();