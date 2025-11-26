const fs = require('fs');
const content = fs.readFileSync('C:\\klyra\\game\\js\\scenes\\GameScene.js', 'utf8');
const lines = content.split('\n');

let depth = 0;
let classStarted = false;

for (let i = 0; i < Math.min(lines.length, 350); i++) {
    const line = lines[i];

    if (line.includes('class GameScene')) {
        classStarted = true;
    }

    if (classStarted) {
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;

        // Show depth BEFORE processing this line
        if (i >= 20 && i <= 350 && (line.includes('{') || line.includes('}') || line.trim().endsWith('()'))) {
            console.log(`Line ${i + 1}: depth=${depth} (before) | ${line}`);
        }

        depth += openBraces - closeBraces;
    }
}

console.log('\nFinal depth before line 344:', depth);
