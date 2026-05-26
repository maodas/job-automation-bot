#!/usr/bin/env node
require('dotenv').config({path: '/home/marcos/job-bot/.env'});
const { google } = require('googleapis');
const { execSync } = require('child_process');
const fs = require('fs');

const CREDS_PATH = '/home/marcos/job-bot/credentials/google-credentials.json';
const TOKEN_PATH = '/home/marcos/job-bot/credentials/token.json';

async function getAuth() {
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH));
  const {client_secret, client_id, redirect_uris} = creds.installed;
  const client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    client.setCredentials(token);
    return client;
  } catch(e) { return null; }
}

async function sync() {
  const auth = await getAuth();
  if (!auth) return;
  
  const serverIp = execSync('curl -s ifconfig.me').toString().trim();
  const result = execSync("sudo -u postgres psql job_automation -t -A -F'|' -c \"SELECT id,title,company,location,ai_score,status,source_url,created_at FROM jobs WHERE ai_score IS NOT NULL ORDER BY created_at DESC\"").toString().trim();
  
  const rows = [['ID','Title','Company','Location','Score','Status','Apply URL','CV (PDF)','Cover Letter (PDF)','Date']];
  
  result.split('\n').forEach(line => {
    const [id,title,company,location,score,status,url,date] = line.split('|');
    
    // Only add download links for high-scoring jobs (70+)
    let cvLink = '';
    let letterLink = '';
    
    if (parseInt(score) >= 70) {
      // Sanitize title in JavaScript, then build the URL
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50);
      const cvUrl = `http://${serverIp}:8080/jobs/job_${id}/Marcos%20Rodas%20CV%20-%20${encodeURIComponent(sanitizedTitle)}.pdf`;
      const letterUrl = `http://${serverIp}:8080/jobs/job_${id}/Marcos%20Rodas%20Cover%20Letter%20-%20${encodeURIComponent(sanitizedTitle)}.pdf`;
      
      cvLink = `=HYPERLINK("${cvUrl}","Download CV")`;
      letterLink = `=HYPERLINK("${letterUrl}","Download Letter")`;
    }
    
    rows.push([id,title,company,location,score,status,url,cvLink,letterLink,date]);
  });
  
  const sheets = google.sheets({version: 'v4', auth});
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  
  await sheets.spreadsheets.values.clear({spreadsheetId, range: 'A:J'});
  await sheets.spreadsheets.values.update({
    spreadsheetId, range: 'A1', valueInputOption: 'USER_ENTERED',
    resource: {values: rows}
  });
  console.log('✅ Synced', rows.length-1, 'jobs with download links');
}

const cmd = process.argv[2];
if (cmd === 'sync') sync();
