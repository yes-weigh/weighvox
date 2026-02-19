
import fs from 'fs';

const filePath = 'd:/weighvox/index.html';

// 1. Recover functionality - verify we have the full file
let content = fs.readFileSync(filePath, 'utf-8');
if (content.length < 5000) {
    console.error('File still seems truncated! Aborting.');
    process.exit(1);
}

// 2. Fix GTAG (Global Site Tag) 
// The error is: GET .../www.googletagmanager.com/gtag/js/id%3DG-8LZNRLNNV9 404
// This suggests a relative URL "www.googletagmanager.com/..." without https://
// Search for that specific relative URL pattern.

// Fix: explicitly add https:// if missing
const gtagRelative = 'src="www.googletagmanager.com/gtag/js';
const gtagDouble = 'src="../../www.googletagmanager.com/gtag/js';

// Global replace for these specific strings is safer than regex
content = content.split(gtagDouble).join('src="https://www.googletagmanager.com/gtag/js');
content = content.split('src="../www.googletagmanager.com/gtag/js').join('src="https://www.googletagmanager.com/gtag/js');
// The one without ../
// Be careful not to replace one that already has https://
// But split/join on 'src="www...' works because 'src="https://www...' won't match 'src="www...' (no https://).

if (content.includes(gtagRelative)) {
    // Check if it's preceded by https:// - actually regex is safer for "not preceded by https://"
    // But simpler: just replace `src="www.` with `src="https://www.`
    content = content.replace(/src="www\.googletagmanager\.com\/gtag\/js/g, 'src="https://www.googletagmanager.com/gtag/js');
}

// 3. Fix CookieConsent logic - SAFELY
const targetString = 'window.cookieconsent.initialise';
const idx = content.indexOf(targetString);

if (idx !== -1) {
    // Find the opening <script> tag BEFORE the target
    const scriptStart = content.lastIndexOf('<script', idx);
    // Find the closing </script> tag AFTER the target
    const scriptEnd = content.indexOf('</script>', idx);

    if (scriptStart !== -1 && scriptEnd !== -1) {
        const fullBlock = content.substring(scriptStart, scriptEnd + 9); // +9 for </script>

        // Check if this block is the one we want to replace
        // (It should be shortish, like 20-50 lines max, not the whole file)
        if (fullBlock.length < 2000) {
            const cleanCookieConsent = `
    <script>
        /* CookieConsent Safe Load */
        window.addEventListener("load", function(){
            if (window.cookieconsent) {
                window.cookieconsent.initialise({
                    "palette": {
                        "popup": { "background": "#237afc" },
                        "button": { "background": "#fff", "text": "#237afc" }
                    },
                    "type": "opt-in",
                    "content": { "href": "https://weighvox.com/" }
                });
            } else {
                console.warn("CookieConsent not loaded");
            }
        });
    </script>`;

            content = content.replace(fullBlock, cleanCookieConsent);
            console.log('Fixed CookieConsent block safely.');
        } else {
            console.warn('Found target but script block seems too large/ambiguous. Skipping to avoid truncation.');
        }
    }
} else {
    console.log('CookieConsent init not found.');
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Updated index.html safely.');
