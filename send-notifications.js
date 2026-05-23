#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const NOTIFICATION_FILE = '/home/marcos/job-bot/notifications/pending.json';
const EMAIL = process.env.NOTIFICATION_EMAIL || 'marcos@logox.tech';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID || '';

function sendTelegram(jobs) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) {
    console.log('Telegram not configured');
    return;
  }
  
  const highPriority = jobs.filter(j => j.score >= 85);
  const goodMatches = jobs.filter(j => j.score >= 75 && j.score < 85);
  
  let message = `Job Alert - ${jobs.length} High-Scoring Jobs Found!\n\n`;
  
  if (highPriority.length > 0) {
    message += `HIGH PRIORITY (85+):\n`;
    highPriority.forEach((j, i) => {
      message += `${i+1}. ${j.title} @ ${j.company} - ${j.score}/100\n`;
    });
    message += '\n';
  }
  
  if (goodMatches.length > 0) {
    message += `GOOD MATCHES (75-84):\n`;
    goodMatches.forEach((j, i) => {
      message += `${i+1}. ${j.title} @ ${j.company} - ${j.score}/100\n`;
    });
    message += '\n';
  }
  
  message += `View all & download CVs:\nhttps://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEETS_ID}/edit`;
  
  const data = JSON.stringify({
    chat_id: TELEGRAM_CHAT,
    text: message
  });
  
  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const req = https.request(options, (res) => {
    res.on('data', () => {});
    res.on('end', () => console.log('✅ Telegram sent'));
  });
  
  req.on('error', (e) => console.error('Telegram error:', e.message));
  req.write(data);
  req.end();
}

function sendEmail(jobs) {
  const msg = `${jobs.length} High-Scoring Jobs!\n\n${jobs.map((j,i) => 
    `${i+1}. ${j.title} @ ${j.company} - Score: ${j.score}/100`
  ).join('\n')}`;
  
  try {
    execSync(`echo "${msg}" | mail -s "Job Alert" ${EMAIL}`);
    console.log('✅ Email sent');
  } catch(e) {
    console.log('Email failed:', e.message);
  }
}

// Main execution
try {
  const data = JSON.parse(fs.readFileSync(NOTIFICATION_FILE, 'utf8'));
  
  if (data.length > 0) {
    const allJobs = data.flatMap(n => n.jobs || [n]);
    
    console.log(`Processing ${allJobs.length} notification(s)...`);
    
    sendTelegram(allJobs);
    sendEmail(allJobs);
    
    // Clear queue
    fs.writeFileSync(NOTIFICATION_FILE, '[]');
    console.log('✅ Notifications sent and queue cleared');
  } else {
    console.log('No notifications to send');
  }
} catch(e) {
  console.log('Creating empty notification queue');
  fs.writeFileSync(NOTIFICATION_FILE, '[]');
}
