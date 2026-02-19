
import fs from 'fs';
import path from 'path';

function getAllHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file.startsWith('.')) continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getAllHtmlFiles(filePath, fileList);
        } else {
            if (path.extname(file).toLowerCase() === '.html') {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

function checkImages() {
    const rootDir = process.cwd();
    const htmlFiles = getAllHtmlFiles(rootDir);
    const missingImages = new Set();
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;

    console.log(`Checking ${htmlFiles.length} HTML files...`);

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        let match;
        while ((match = imgRegex.exec(content)) !== null) {
            let src = match[1];

            // Skip external links, data URIs, and anchor links
            if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:') || src.startsWith('#')) continue;

            // Handle query strings/hashes
            src = src.split('?')[0].split('#')[0];

            try {
                src = decodeURIComponent(src);
            } catch (e) {
                // ignore
            }

            const dir = path.dirname(file);
            const absolutePath = path.resolve(dir, src);

            if (!fs.existsSync(absolutePath)) {
                // Only report unique missing images to reduce noise
                if (!missingImages.has(src)) {
                    missingImages.add(src);
                    console.log(`Missing: ${src} (referenced in ${path.relative(rootDir, file)})`);
                }
            }
        }
    }

    if (missingImages.size === 0) {
        console.log('No missing images found!');
    } else {
        console.log(`\nTotal missing unique images: ${missingImages.size}`);
    }
}

checkImages();
