#!/usr/bin/env node
const { execSync } = require('child_process');

function runProcessing() {
  try {
    console.log(new Date().toISOString(), 'Processing jobs...');
    execSync('node process-jobs.js', { stdio: 'inherit' });
    console.log('Syncing Google Sheets...');
    execSync('node google-sheets-sync.js sync', { stdio: 'inherit' });
    console.log('Sending notifications...');
    execSync('node send-notifications.js', { stdio: 'inherit' });
  } catch(e) { console.error(e.message); }
}

console.log('Service started - every 5 min');
runProcessing();
setInterval(runProcessing, 300000);
