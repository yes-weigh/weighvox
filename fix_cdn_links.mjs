
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

function fixLinks() {
    const rootDir = process.cwd();
    const htmlFiles = getAllHtmlFiles(rootDir);

    // replacements map: specific bad relative prefix -> absolute URL base
    const replacements = [
        { find: '../cdn.jsdelivr.net/', replace: 'https://cdn.jsdelivr.net/' },
        { find: '../use.fontawesome.com/', replace: 'https://use.fontawesome.com/' },
        { find: '../maxcdn.bootstrapcdn.com/', replace: 'https://maxcdn.bootstrapcdn.com/' },
        { find: '../code.jquery.com/', replace: 'https://code.jquery.com/' },
        { find: '../www.google.com/', replace: 'https://www.google.com/' },
        { find: '../connect.facebook.net/', replace: 'https://connect.facebook.net/' },
        { find: '../ajax.googleapis.com/', replace: 'https://ajax.googleapis.com/' },
        { find: '../fonts.googleapis.com/', replace: 'https://fonts.googleapis.com/' }
    ];

    let updatedCount = 0;

    for (const file of htmlFiles) {
        let content = fs.readFileSync(file, 'utf-8');
        let changed = false;

        for (const { find, replace } of replacements) {
            // Check if the file contains the broken link
            // We use split/join to replace all occurrences efficiently
            if (content.includes(find)) {
                content = content.split(find).join(replace);
                changed = true;
            }
        }

        // Also fix the cookieconsent initialization if it's the broken one
        if (content.includes('window.cookieconsent.initialise') && !content.includes('window.addEventListener("load"')) {
            // We can assume it needs the fix if it's still using the old unsafe pattern
            const oldInit = `window.cookieconsent.initialise({`;
            const newInit = `window.addEventListener("load", function(){
            if (window.cookieconsent) {
                window.cookieconsent.initialise({`;

            // This is a bit risky with string replacement if indentation varies. 
            // Let's stick to the links for now in this script to be safe, 
            // or use a regex for the block if needed.
            // Given the user complaints are about 404s, links are priority.
        }

        if (changed) {
            fs.writeFileSync(file, content, 'utf-8');
            console.log(`Fixed links in: ${path.relative(rootDir, file)}`);
            updatedCount++;
        }
    }

    console.log(`\nFixed links in ${updatedCount} files.`);
}

fixLinks();
