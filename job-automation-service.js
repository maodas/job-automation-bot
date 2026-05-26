#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('[' + new Date().toISOString() + '] Starting scheduled job processing...');

try {
  // 1. Check Gmail for new job alerts
  console.log('Checking Gmail...');
  execSync('node check-gmail-jobs.js', { stdio: 'inherit' });
  
  // 2. Process all jobs
  console.log('Processing jobs...');
  execSync('node process-jobs.js', { stdio: 'inherit' });
  
  // 3. Sync to Google Sheets
  console.log('Syncing Google Sheets...');
  execSync('node google-sheets-sync.js sync', { stdio: 'inherit' });
  
  // 4. Send notifications
  console.log('Sending notifications...');
  execSync('node send-notifications.js', { stdio: 'inherit' });
  
  console.log('[' + new Date().toISOString() + '] ✅ Completed successfully');
} catch(e) {
  console.error('[' + new Date().toISOString() + '] ❌ Error:', e.message);
  process.exit(1);
}
