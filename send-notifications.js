#!/usr/bin/env node
require('dotenv').config({path: '/home/marcos/job-bot/.env'});
const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const NOTIFICATION_FILE = '/home/marcos/job-bot/notifications/pending.json';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID || '';

function sendTelegram(jobs) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) {
    console.log('Telegram not configured');
    return;
  }
  
  const highPriority = jobs.filter(j => j.score >= 85);
  const goodMatches = jobs.filter(j => j.score >= 75 && j.score < 85);
  const decent = jobs.filter(j => j.score >= 70 && j.score < 75);
  
  let message = 'Job Alert - ' + jobs.length + ' High-Scoring Jobs Found!\n\n';
  
  if (highPriority.length > 0) {
    message += 'HIGH PRIORITY (85+):\n';
    highPriority.forEach((j, i) => {
      message += (i+1) + '. ' + j.title + ' @ ' + j.company + ' - ' + j.score + '/100\n';
    });
    message += '\n';
  }
  
  if (goodMatches.length > 0) {
    message += 'GOOD MATCHES (75-84):\n';
    goodMatches.forEach((j, i) => {
      message += (i+1) + '. ' + j.title + ' @ ' + j.company + ' - ' + j.score + '/100\n';
    });
    message += '\n';
  }
  
  if (decent.length > 0) {
    message += 'DECENT MATCHES (70-74):\n';
    decent.forEach((j, i) => {
      message += (i+1) + '. ' + j.title + ' @ ' + j.company + ' - ' + j.score + '/100\n';
    });
  }
  
  message += '\nCheck Google Sheets for CVs and cover letters.';
  
  const data = JSON.stringify({
    chat_id: TELEGRAM_CHAT,
    text: message
  });
  
  const options = {
    hostname: 'api.telegram.org',
    path: '/bot' + TELEGRAM_TOKEN + '/sendMessage',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const req = https.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Telegram notification sent');
    } else {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => console.log('Telegram failed:', body));
    }
  });
  
  req.on('error', (e) => console.error('Telegram error:', e.message));
  req.write(data);
  req.end();
}

try {
  const result = execSync(
    "sudo -u postgres psql job_automation -t -A -F'|' -c \"SELECT id, title, company, ai_score FROM jobs WHERE ai_score >= 70 AND status = 'scored' AND created_at > NOW() - INTERVAL '2 hours' ORDER BY ai_score DESC\""
  ).toString().trim();
  
  if (!result) {
    console.log('No notifications to send');
    process.exit(0);
  }
  
  const jobs = result.split('\n').map(line => {
    const [id, title, company, score] = line.split('|');
    return { id, title, company, score: parseInt(score) };
  });
  
  if (jobs.length > 0) {
    sendTelegram(jobs);
  } else {
    console.log('No notifications to send');
  }
} catch (e) {
  console.error('Error:', e.message);
}
