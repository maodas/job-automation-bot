#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const NOTIFICATION_FILE = '/home/marcos/job-bot/notifications/pending.json';
const EMAIL = process.env.NOTIFICATION_EMAIL || 'marcos@logox.tech';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID || '';

function sendEmail(jobs) {
  const msg = `🎯 ${jobs.length} High-Scoring Jobs!\n\n${jobs.map((j,i) => 
    `${i+1}. ${j.title} @ ${j.company}\n   Score: ${j.score}/100\n`
  ).join('\n')}`;
  
  try {
    execSync(`echo "${msg}" | mail -s "Job Alert" ${EMAIL}`);
    console.log('✅ Email sent');
  } catch(e) { console.log('Email failed:', e.message); }
}

function sendTelegram(jobs) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  
  const msg = `🎯 ${jobs.length} High-Scoring Jobs!\n\n${jobs.map((j,i) => 
    `${i+1}. ${j.title} @ ${j.company}\nScore: ${j.score}/100\n`
  ).join('\n')}`;
  
  const data = JSON.stringify({ chat_id: TELEGRAM_CHAT, text: msg });
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, res => res.on('data', () => console.log('✅ Telegram sent')));
  req.write(data);
  req.end();
}

try {
  const data = JSON.parse(fs.readFileSync(NOTIFICATION_FILE, 'utf8'));
  if (data.length > 0) {
    const allJobs = data.flatMap(n => n.jobs || [n]);
    sendEmail(allJobs);
    sendTelegram(allJobs);
    fs.writeFileSync(NOTIFICATION_FILE, '[]');
  }
} catch(e) { fs.writeFileSync(NOTIFICATION_FILE, '[]'); }
