const fs = require('fs');
let content = fs.readFileSync('services/supabaseClient.ts', 'utf8');

const replacement = `
            const urlStr = target.url?.href || '';
            const bodyStr = JSON.stringify(target.body || target.control?.body || {});
            const isMockQuery = urlStr.includes('u-') || bodyStr.includes('u-');
`;

content = content.replace(/const urlStr = target\.url\?\.href \|\| '';\s*const isMockQuery = urlStr\.includes\('u-'\);/, replacement.trim());

fs.writeFileSync('services/supabaseClient.ts', content, 'utf8');
console.log('patched short circuit body');
