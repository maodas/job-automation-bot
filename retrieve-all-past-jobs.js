const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

async function retrieveAllPastJobs() {
  console.log('Retrieving ALL past job alerts...');
  
  const credentials = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'credentials', 'google-credentials.json'))
  );
  
  const token = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'credentials', 'token.json'))
  );
  
  const oauth2Client = new google.auth.OAuth2(
    credentials.installed.client_id,
    credentials.installed.client_secret,
    credentials.installed.redirect_uris[0]
  );
  
  oauth2Client.setCredentials(token);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Get ALL emails with job-alerts label (remove the time filter)
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'label:job-alerts',
    maxResults: 100  // Get up to 100 past jobs
  });
  
  const messages = response.data.messages || [];
  console.log(`Found ${messages.length} total job alert emails`);
  
  let added = 0;
  let duplicates = 0;
  
  for (const message of messages) {
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: message.id,
      format: 'full'
    });
    
    const headers = email.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    
    let body = '';
    if (email.data.payload.body.data) {
      body = Buffer.from(email.data.payload.body.data, 'base64').toString();
    } else if (email.data.payload.parts) {
      const textPart = email.data.payload.parts.find(p => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString();
      }
    }
    
    const urlMatch = body.match(/https:\/\/www\.linkedin\.com\/comm\/jobs\/view\/\d+/);
    if (!urlMatch) continue;
    
    const jobUrl = urlMatch[0];
    
    // Check duplicate
    const existing = await pool.query(
      'SELECT id FROM jobs WHERE source_url = $1',
      [jobUrl]
    );
    
    if (existing.rows.length > 0) {
      duplicates++;
      continue;
    }
    
    const subjectParts = subject.split(' at ');
    const title = subjectParts[0]?.trim() || 'Unknown Title';
    const company = subjectParts[1]?.trim() || 'Unknown Company';
    
    await pool.query(`
      INSERT INTO jobs (
        platform, source_url, title, company, location, 
        description, status, fetch_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      'linkedin',
      jobUrl,
      title,
      company,
      'Guatemala City',
      body,
      'new',
      'success'
    ]);
    
    added++;
    console.log(`  ✅ ${added}. ${title} @ ${company}`);
  }
  
  await pool.end();
  console.log(`\n✅ Complete! Added ${added} new jobs, skipped ${duplicates} duplicates`);
}

retrieveAllPastJobs().catch(console.error);
