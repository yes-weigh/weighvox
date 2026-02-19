
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;

function getAllHtmlFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllHtmlFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith(".html")) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

const htmlFiles = getAllHtmlFiles(rootDir);

console.log(`Found ${htmlFiles.length} HTML files.`);

let fixedCount = 0;

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Regex to find the Meta Pixel Code block
    // It captures "<!-- Meta Pixel Code -->", the script tag, the noscript tag, and "<!-- End Meta Pixel Code -->"
    const pixelRegex = /<!--\s*Meta Pixel Code\s*-->[\s\S]*?<!--\s*End Meta Pixel Code\s*-->/g;

    if (pixelRegex.test(content)) {
        console.log(`Removing Meta Pixel from: ${file}`);

        // Replace with a commented out version or just remove it. 
        // Commenting out is safer in case we need it later, but for this specific cleanup, 
        // removing or commenting is fine. Let's comment it out by wrapping in standard HTML comments, 
        // but since it contains comments, nested comments are bad. 
        // Better to just rename the comment tags so it's not active code? 
        // Or actually, just removing it is cleanest if we are sure.
        // The prompt plan was to "comment out".
        // A safe way to "comment out" a block that already contains comments is to replace the script tags with something invalid
        // or just wrapping the whole thing in a specific way.
        // However, removing it is the most robust way to stop the errors. 
        // Let's replace it with a placeholder comment.

        const newContent = content.replace(pixelRegex, '<!-- Meta Pixel Code REMOVED to fix console errors -->');

        fs.writeFileSync(file, newContent, 'utf8');
        fixedCount++;
    }
});

console.log(`Fixed Meta Pixel in ${fixedCount} files.`);
