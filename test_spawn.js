const { spawn } = require('child_process');
const path = require('path');

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const quotedPath = `"${chromePath}"`;
const doubleQuotedPath = `""${chromePath}""`;

const args = ["--version"];

function testSpawn(executable, label) {
    console.log(`Testing ${label} with path: ${executable}`);
    const child = spawn(executable, args, { shell: false });

    child.on('error', (err) => {
        console.error(`${label} FAILED:`, err.message);
    });

    child.stdout.on('data', (data) => {
        console.log(`${label} SUCCESS:`, data.toString());
    });

    child.on('exit', (code) => {
        console.log(`${label} EXIT code:`, code);
    });
}

testSpawn(chromePath, "UNQUOTED");
testSpawn(quotedPath, "SINGLE QUOTED");
testSpawn(doubleQuotedPath, "DOUBLE QUOTED");
