#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('[' + new Date().toISOString() + '] Starting scheduled job processing...');

try {
  // Process all jobs
  console.log('Processing jobs...');
  execSync('node process-jobs.js', { stdio: 'inherit' });
  
  // Sync to Google Sheets
  console.log('Syncing Google Sheets...');
  execSync('node google-sheets-sync.js sync', { stdio: 'inherit' });
  
  // Send notifications
  console.log('Sending notifications...');
  execSync('node send-notifications.js', { stdio: 'inherit' });
  
  console.log('[' + new Date().toISOString() + '] ✅ Completed successfully');
} catch(e) {
  console.error('[' + new Date().toISOString() + '] ❌ Error:', e.message);
}
