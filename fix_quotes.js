const fs = require('fs');
const path = require('path');

const DB_SQL_PATH = path.join(__dirname, 'seatslabs-backend/database/database.sql');
const CONTROLLERS_DIR = path.join(__dirname, 'seatslabs-backend/controllers');

// 1. Extract tokens from database.sql
const sqlContent = fs.readFileSync(DB_SQL_PATH, 'utf8');

const tokens = new Set();
const tableRegex = /CREATE TABLE "(.+)"/g;
const colRegex = /"([a-zA-Z0-9_]+)"/g;

let match;
while ((match = tableRegex.exec(sqlContent)) !== null) {
    tokens.add(match[1]);
}
while ((match = colRegex.exec(sqlContent)) !== null) {
    tokens.add(match[1]);
}

const tokenList = Array.from(tokens);
// Sort by length desc to prevent partial replacements
tokenList.sort((a, b) => b.length - a.length);

console.log(`Found ${tokenList.length} identifiers to quote.`);

// 2. Process controllers
const files = fs.readdirSync(CONTROLLERS_DIR);

files.forEach(file => {
    if (!file.endsWith('.js')) return;
    const filePath = path.join(CONTROLLERS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We want to replace unquoted occurrences of these tokens with quoted ones.
    // But ONLY inside string literals (SQL queries).
    // And we must avoid double quoting.
    
    // Strategy: 
    // 1. Find string literals `...` or '...' or "..." (careful with "..." as it might already be quoted identifier or JSON)
    // Actually, SQL queries in my code are mostly `...` or '...'. 
    
    content = content.replace(/`[\s\S]*?`|'[^']*'/g, (strMatch) => {
        // Skip if it doesn't look like SQL
        if (!strMatch.match(/SELECT|INSERT|UPDATE|DELETE|FROM|JOIN|WHERE/i)) {
            return strMatch;
        }

        let newStr = strMatch;
        tokenList.forEach(token => {
            // We want to match \bToken\b where it's NOT surrounded by quotes.
            // But regex lookaround for " is tricky if we don't know if we are inside " " already.
            // Simplified approach:
            // Replace \bToken\b with "Token".
            // Then clean up ""Token"" -> "Token".
            
            const regex = new RegExp(`\\b${token}\\b`, 'g');
            newStr = newStr.replace(regex, `"${token}"`);
        });

        // Cleanup: ""Token"" -> "Token"
        newStr = newStr.replace(/""/g, '"');
        return newStr;
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed quotes in ${file}`);
});
