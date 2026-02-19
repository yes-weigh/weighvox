
import fs from 'fs';
import path from 'path';
import https from 'https';

const missingImages = [
    "assets/img/product/RT15.jpg",
    "assets/img/product/Yuotube 15.jpg",
    "assets/img/product/POS (2).jpg"
];

const baseUrl = "https://weighvox.com/";

async function downloadImage(relPath) {
    const url = baseUrl + encodeURI(relPath); // simple encode to handle spaces
    const dest = path.join(process.cwd(), relPath);

    // Ensure dir exists
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded: ${relPath}`);
                    resolve();
                });
            } else {
                console.error(`Failed to download ${url}: Status ${response.statusCode}`);
                // Attempt to close and delete
                file.close();
                fs.unlink(dest, () => { });
                resolve(); // resolve anyway to continue
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            console.error(`Error downloading ${relPath}: ${err.message}`);
            resolve();
        });
    });
}

async function run() {
    for (const img of missingImages) {
        await downloadImage(img);
    }
}

run();
