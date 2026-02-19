
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

function sanitize() {
    const rootDir = process.cwd();
    const htmlFiles = getAllHtmlFiles(rootDir);

    // 1. Identify files to rename
    const renameMap = []; // { oldPath, newPath, oldName, newName, encodedOldName }

    for (const file of htmlFiles) {
        const filename = path.basename(file);
        // Look for files with query string chars in name
        if (filename.includes('product-detail') && (filename.includes('=') || filename.includes('&') || filename.includes('%'))) {
            // Extract meaningful parts
            // Format: product-detail_product=SCANGLEPR59694&%20title=SGT-664A.php.html
            // We want: product-detail-SCANGLEPR59694-SGT-664A.html

            let newName = filename;

            // Remove .php.html if present, simplify to .html
            newName = newName.replace('.php.html', '.html');

            // Replace common URL encoded chars with -
            newName = newName.replace(/%20/g, '-');
            newName = newName.replace(/%09/g, ''); // tab

            // Remove check for product-detail prefix to avoid duplication if we append it
            // Logic: extract params
            const match = filename.match(/product=([^&]+)&(?:%20)?title=([^.]+)/);
            if (match) {
                const productId = match[1];
                let title = match[2];
                // Clean title
                title = decodeURIComponent(title).replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                newName = `product-detail-${productId}-${title}.html`;
            } else {
                // Fallback cleanup
                newName = newName.replace(/[^a-zA-Z0-9.-]/g, '-');
            }

            renameMap.push({
                oldPath: file,
                newPath: path.join(path.dirname(file), newName),
                oldName: filename,
                newName: newName,
                // We need to match how it appears in href. 
                // Usually href="product-detail_product%3D...%26..."
                // So we need to match the encoded version AND the raw version just in case.
                searchPatterns: [
                    filename, // Raw filename
                    encodeURIComponent(filename).replace(/%2E/g, '.').replace(/%2D/g, '-').replace(/%5F/g, '_'), // Full encode
                    // Partial encode often seen in scraper output:
                    filename.replace(/=/g, '%3D').replace(/&/g, '%26').replace(/ /g, '%20')
                ]
            });
        }
    }

    console.log(`Found ${renameMap.length} files to rename.`);

    // 2. Rename files on disk
    for (const item of renameMap) {
        if (fs.existsSync(item.oldPath)) {
            // Check if target exists (duplicates?)
            if (fs.existsSync(item.newPath) && item.oldPath !== item.newPath) {
                console.log(`Target exists for ${item.newName}, skipping rename of ${item.oldName}`);
                continue;
            }
            fs.renameSync(item.oldPath, item.newPath);
            console.log(`Renamed: ${item.oldName} -> ${item.newName}`);
        }
    }

    // 3. Update references in ALL files
    // Re-scan files because paths changed? No, we just renamed some. 
    // The list 'htmlFiles' has OLD paths. We need to iterate carefully.
    // Actually, we should Iterate over all files in root again or just use the updated paths.
    // But since we just renamed them, the content is still there at new paths.

    const allFilesNow = getAllHtmlFiles(rootDir);

    for (const file of allFilesNow) {
        let content = fs.readFileSync(file, 'utf-8');
        let changed = false;

        for (const item of renameMap) {
            // Create a regex to match the encoded filename in href="..."
            // We iterate over possible search patterns
            for (const pattern of item.searchPatterns) {
                // Determine if pattern is in content
                if (content.includes(pattern)) {
                    // Replace globally
                    // special check to avoid breaking existing replacements if subset? (unlikely with these long names)
                    // Use split/join for safety over regex with special chars
                    content = content.split(pattern).join(item.newName);
                    changed = true;
                }
            }

            // Also try to match typical scraper encoding: 
            // product-detail_product%3DSCANGLEPR59694%26%2520title%3DSGT-664A.php.html
            // This is "filename.replace(= -> %3D, & -> %26)" version roughly.
            // Let's try to construct it specifically if not covered.
            const secondaryPattern = item.oldName.replace(/=/g, '%3D').replace(/&/g, '%26');
            if (content.includes(secondaryPattern)) {
                content = content.split(secondaryPattern).join(item.newName);
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(file, content, 'utf-8');
            console.log(`Updated links in: ${path.relative(rootDir, file)}`);
        }
    }

    console.log('Sanitization complete.');
}

sanitize();
