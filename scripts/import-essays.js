/**
 * Import Essay Questions from CSV to Supabase
 * 
 * Usage: node scripts/import-essays.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CSV_DIR = 'E:\\Costudy\\data\\essays';

// Simple CSV parser (handles quoted fields with commas)
function parseCSV(content) {
    // Normalize line endings
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    let lines = normalized.split('\n');
    
    // Find the header line (skip empty lines at the start)
    let headerIdx = 0;
    while (headerIdx < lines.length && !lines[headerIdx].trim()) {
        headerIdx++;
    }
    
    if (headerIdx >= lines.length) {
        console.log('   ⚠️  No content found');
        return [];
    }
    
    // Get headers, handle BOM
    let headerLine = lines[headerIdx];
    if (headerLine.charCodeAt(0) === 0xFEFF) {
        headerLine = headerLine.slice(1); // Remove BOM
    }
    
    const headers = parseCSVLine(headerLine);
    console.log(`   Raw headers: [${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}]`);
    
    const rows = [];
    
    for (let i = headerIdx + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((header, idx) => {
            const key = header.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
            row[key] = values[idx]?.trim() || '';
        });
        rows.push(row);
    }
    
    return rows;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result.map(v => v.replace(/^"|"$/g, '').trim());
}

// Map CSV columns to database columns (keys are normalized to lowercase)
function mapToDbRow(csvRow, fileIndex) {
    // Debug: log first row's keys
    if (fileIndex.endsWith('-0')) {
        console.log(`   Column keys: ${Object.keys(csvRow).join(', ')}`);
    }
    
    // Normalize part value (check multiple possible column names)
    let part = csvRow.part || csvRow.exam_part || 'Additional';
    if (part && part.includes('1')) part = 'Part1';
    else if (part && part.includes('2')) part = 'Part2';
    else part = 'Additional';
    
    // Generate unique ID
    const id = csvRow.id || `essay-${fileIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get scenario - try multiple column names (normalized to lowercase)
    const scenario = csvRow.scenario || csvRow.scenario_description || '';
    const tasks = csvRow.tasks || '';
    const topic = csvRow.topic || csvRow.topic_area || 'General';
    const answer = csvRow.answer_guidance || csvRow.answer_summary || '';
    
    return {
        id: id,
        part: part,
        topic: topic,
        scenario: scenario,
        tasks: tasks,
        answer_guidance: answer,
        citations: csvRow.citations || '',
        difficulty: 'Medium',
        is_active: true
    };
}

async function importCSVFile(filePath, fileIndex) {
    console.log(`\n📂 Processing: ${path.basename(filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCSV(content);
    
    console.log(`   Found ${rows.length} rows`);
    
    const dbRows = rows
        .map((row, idx) => mapToDbRow(row, `${fileIndex}-${idx}`))
        .filter(row => row.scenario && row.tasks); // Skip empty rows
    
    console.log(`   Valid essays: ${dbRows.length}`);
    
    if (dbRows.length === 0) {
        console.log('   ⚠️  No valid essays found, skipping...');
        return 0;
    }
    
    // Upsert in batches of 50
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < dbRows.length; i += batchSize) {
        const batch = dbRows.slice(i, i + batchSize);
        
        const { data, error } = await supabase
            .from('essay_questions')
            .upsert(batch, { onConflict: 'id' });
        
        if (error) {
            console.error(`   ❌ Batch error: ${error.message}`);
        } else {
            inserted += batch.length;
            process.stdout.write(`   ✅ Inserted: ${inserted}/${dbRows.length}\r`);
        }
    }
    
    console.log(`   ✅ Completed: ${inserted} essays imported`);
    return inserted;
}

async function main() {
    console.log('🚀 CoStudy Essay Import Tool');
    console.log('============================\n');
    console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
    console.log(`📁 CSV Directory: ${CSV_DIR}\n`);
    
    // Check if directory exists
    if (!fs.existsSync(CSV_DIR)) {
        console.error(`❌ Directory not found: ${CSV_DIR}`);
        process.exit(1);
    }
    
    // Get all CSV files
    const csvFiles = fs.readdirSync(CSV_DIR)
        .filter(f => f.endsWith('.csv'))
        .map(f => path.join(CSV_DIR, f));
    
    if (csvFiles.length === 0) {
        console.error('❌ No CSV files found');
        process.exit(1);
    }
    
    console.log(`📋 Found ${csvFiles.length} CSV files:`);
    csvFiles.forEach(f => console.log(`   - ${path.basename(f)}`));
    
    let totalImported = 0;
    
    for (let i = 0; i < csvFiles.length; i++) {
        const count = await importCSVFile(csvFiles[i], i);
        totalImported += count;
    }
    
    console.log('\n============================');
    console.log(`🎉 Import Complete!`);
    console.log(`📊 Total essays imported: ${totalImported}`);
    
    // Verify count
    const { count } = await supabase
        .from('essay_questions')
        .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total essays in database: ${count}`);
}

main().catch(console.error);
