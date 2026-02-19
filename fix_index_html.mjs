
import fs from 'fs';

const filePath = 'd:/weighvox/index.html';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix GTAG (Global Site Tag) 
// The error is: GET .../www.googletagmanager.com/gtag/js/id%3DG-8LZNRLNNV9 404
// This suggests a relative URL "www.googletagmanager.com/..." without https://
// or "../../www..."
// We will look for that pattern and fix it.

// Regex to find the gtag script src
// It usually looks like: <script async src=".../gtag/js?id=..."></script>
const gtagSrcRegex = /src=["'](.*?)www\.googletagmanager\.com\/gtag\/js/g;

content = content.replace(gtagSrcRegex, (match, prefix) => {
    // prefix is what comes before www.googletagmanager.com
    // e.g. "../../" or ""
    return 'src="https://www.googletagmanager.com/gtag/js';
});

// Also explicitly check for the specific ID if general regex fails
if (content.includes('src="www.googletagmanager.com/gtag/js')) {
    content = content.replace('src="www.googletagmanager.com/gtag/js', 'src="https://www.googletagmanager.com/gtag/js');
}
if (content.includes('src="../../www.googletagmanager.com/gtag/js')) {
    content = content.replace('src="../../www.googletagmanager.com/gtag/js', 'src="https://www.googletagmanager.com/gtag/js');
}


// 2. Fix CookieConsent Double Wrapper
// The previous fix injected a window.addEventListener('load') wrapper REPLACING the initialise call.
// If that call was ALREADY inside a 'load' listener, we now have a nested listener which might never fire (if event missed).
// We will flatten it.

// Pattern to match:
// window.addEventListener("load", function () {
//     if (window.cookieconsent) {
//         /* CookieConsent Safe Load */
//         window.addEventListener("load", function(){
//             if (window.cookieconsent) {
//                 window.cookieconsent.initialise({ ... });
//             } else {
//                 console.warn("CookieConsent not loaded");
//             }
//         });
//     }
// });

// We want to replace this whole mess with just the inner logic, but top level.
// Or just clean it up.

// Let's find the specific block using a broader regex or just manual string replacement of the known structure.

const doubleWrapper = `window.addEventListener("load", function () {
            if (window.cookieconsent) {
                
/* CookieConsent Safe Load */
window.addEventListener("load", function(){
    if (window.cookieconsent) {
        window.cookieconsent.initialise({`;

// If we find this pattern (whitespace matches might vary), we fix it.
// Since exact whitespace matching is hard, let's use a simpler approach:
// Replace the start of the double wrapper with a single clean wrapper start.

// We will construct the clean version of the cookie consent script.
const cleanCookieConsent = `
    <script>
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

// Find the existing <script> block containing cookieconsent and replace it entirely.
const scriptBlockRegex = /<script>[\s\S]*?window\.cookieconsent\.initialise[\s\S]*?<\/script>/;

if (scriptBlockRegex.test(content)) {
    content = content.replace(scriptBlockRegex, cleanCookieConsent);
    console.log('Fixed CookieConsent script block.');
} else {
    // Maybe it's the messed up version
    const messedUpRegex = /<script>[\s\S]*?\/\* CookieConsent Safe Load \*\/[\s\S]*?<\/script>/;
    if (messedUpRegex.test(content)) {
        content = content.replace(messedUpRegex, cleanCookieConsent);
        console.log('Fixed broken CookieConsent script block.');
    } else {
        console.log('Could not find CookieConsent block to fix.');
    }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Updated index.html');
