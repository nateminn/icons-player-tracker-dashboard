#!/usr/bin/env node

/**
 * Independent Data Access Script
 * Access all API results even if dashboard fails
 * Usage: node scripts/data-access.js [command]
 * 
 * Commands:
 *   list     - List all stored results
 *   latest   - Show latest result details
 *   export   - Export specific result to CSV
 *   files    - Show all data file paths
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'api-results');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error('❌ Data directory not found:', DATA_DIR);
    process.exit(1);
  }
}

function listAllResults() {
  console.log('📊 All Stored API Results:\n');
  
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && !f.includes('_raw_api'))
    .map(file => {
      const filepath = path.join(DATA_DIR, file);
      const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      const stats = fs.statSync(filepath);
      
      return {
        file,
        id: content.id,
        testType: content.testType,
        source: content.source,
        timestamp: content.timestamp,
        players: content.metadata.players.length,
        markets: content.metadata.markets.length,
        keywords: content.metadata.keywordCount,
        cost: content.metadata.actualCost,
        size: (stats.size / 1024).toFixed(1) + ' KB',
        created: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (files.length === 0) {
    console.log('No results found. Run an API test first.');
    return;
  }

  console.table(files);
  console.log(`\n📁 Data directory: ${DATA_DIR}`);
  console.log(`💾 Total files: ${fs.readdirSync(DATA_DIR).length}`);
}

function showLatestResult() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && !f.includes('_raw_api'))
    .map(f => ({
      file: f,
      mtime: fs.statSync(path.join(DATA_DIR, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    console.log('No results found.');
    return;
  }

  const latest = files[0];
  const filepath = path.join(DATA_DIR, latest.file);
  const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));

  console.log('🕒 Latest API Result:\n');
  console.log(`ID: ${content.id}`);
  console.log(`Test Type: ${content.testType}`);
  console.log(`Source: ${content.source}`);
  console.log(`Timestamp: ${content.timestamp}`);
  console.log(`Players: ${content.metadata.players.length} (${content.metadata.players.slice(0, 3).join(', ')}...)`);
  console.log(`Markets: ${content.metadata.markets.join(', ')}`);
  console.log(`Keywords: ${content.metadata.keywordCount}`);
  console.log(`Cost: $${content.metadata.actualCost}`);
  
  // Show sample data
  const marketNames = Object.keys(content.processedResults.results || {});
  if (marketNames.length > 0) {
    const firstMarket = marketNames[0];
    const keywords = content.processedResults.results[firstMarket] || [];
    console.log(`\n📊 Sample data from ${firstMarket}:`);
    console.log(`Total keywords: ${keywords.length}`);
    if (keywords.length > 0) {
      console.log(`Sample: ${keywords[0].keyword} - ${keywords[0].search_volume || 'N/A'} searches`);
    }
  }

  console.log(`\n📁 File: ${filepath}`);
}

function showAllFiles() {
  console.log('📂 All Data Files:\n');
  
  const allFiles = fs.readdirSync(DATA_DIR)
    .map(file => {
      const filepath = path.join(DATA_DIR, file);
      const stats = fs.statSync(filepath);
      const ext = path.extname(file);
      const size = (stats.size / 1024).toFixed(1) + ' KB';
      
      let type = 'Unknown';
      if (file.includes('_comprehensive.csv')) type = 'Comprehensive CSV';
      else if (file.includes('_july2025.csv')) type = 'July 2025 CSV';
      else if (file.includes('_executive_summary.csv')) type = 'Executive Summary';
      else if (file.includes('_raw_api.json')) type = 'Raw API Data';
      else if (ext === '.json') type = 'Processed Results';
      
      return {
        file,
        type,
        size,
        modified: stats.mtime.toLocaleDateString()
      };
    })
    .sort((a, b) => a.file.localeCompare(b.file));

  console.table(allFiles);
  console.log(`\n📁 Directory: ${DATA_DIR}`);
  console.log(`💾 Total size: ${allFiles.reduce((sum, f) => sum + parseFloat(f.size), 0).toFixed(1)} KB`);
}

function main() {
  ensureDataDir();
  
  const command = process.argv[2] || 'list';
  
  switch (command.toLowerCase()) {
    case 'list':
    case 'ls':
      listAllResults();
      break;
    case 'latest':
    case 'last':
      showLatestResult();
      break;
    case 'files':
    case 'all':
      showAllFiles();
      break;
    case 'help':
    case '-h':
    case '--help':
      console.log('Data Access Commands:');
      console.log('  list    - List all stored results');
      console.log('  latest  - Show latest result details');
      console.log('  files   - Show all data file paths');
      console.log('  help    - Show this help');
      break;
    default:
      console.log('Unknown command. Use: list, latest, files, or help');
  }
}

main();