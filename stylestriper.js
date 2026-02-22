import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirPath = path.join(__dirname, 'components', 'views');

function processFile(filePath) {
    if (!filePath.endsWith('.tsx')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Standardize Modals and Drawers backgrounds
    // Rule: fixed inset-0 z-[number] should have `bg-slate-900/80 backdrop-blur-sm` OR `bg-slate-900/40 backdrop-blur-3xl`. 
    // The user requested: Modals and Drawers: Apply: bg-slate-900/40 border-white/10 rounded-2xl shadow-2xl backdrop-blur-3xl
    content = content.replace(/className="fixed inset-0 z-(30|40|50) ([^"]*)"/g, (match, zIndex, rest) => {
        // Strip out existing background and blur styles
        let newClasses = rest.replace(/bg-\w+(-\d+)?(\/\d+)?/g, '');
        newClasses = newClasses.replace(/backdrop-blur-\w+/g, '');
        newClasses = newClasses.replace(/border-white\/\d+/g, '');
        newClasses = newClasses.replace(/\s+/g, ' ');

        return `className="fixed inset-0 z-${zIndex} bg-slate-900/60 backdrop-blur-2xl border border-white/10 ${newClasses.trim()}"`;
    });

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Modified Modal/Drawers in:', filePath);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            console.log('Processing:', fullPath);
            processFile(fullPath);
        }
    }
}

walkDir(dirPath);
