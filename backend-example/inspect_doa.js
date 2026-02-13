const fetch = require('node-fetch');

async function inspect() {
    try {
        const response = await fetch('https://equran.id/api/doa/1');
        const data = await response.json();
        console.log("Keys in data:", Object.keys(data.data));
        console.log("Full data:", JSON.stringify(data.data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

inspect();
