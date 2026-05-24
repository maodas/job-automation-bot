#!/usr/bin/env node
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function checkGmail() {
  console.log('[Gmail Check] Starting...');
  
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
  });
  
  try {
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
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:jobalerts-noreply@linkedin.com newer_than:8h',
      maxResults: 10
    });
    
    const messages = response.data.messages || [];
    console.log(`[Gmail Check] Found ${messages.length} LinkedIn email(s)\n`);
    
    let totalJobsAdded = 0;
    let totalDuplicates = 0;
    
    for (const message of messages) {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });
      
      const headers = email.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      
      console.log(`📧 ${subject}`);
      
      let body = '';
      
      if (email.data.payload.body.data) {
        body = Buffer.from(email.data.payload.body.data, 'base64').toString();
      }
      
      if (email.data.payload.parts) {
        for (const part of email.data.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString();
          }
        }
      }
      
      const urlMatches = body.matchAll(/https:\/\/www\.linkedin\.com\/comm\/jobs\/view\/(\d+)/g);
      const jobUrls = [...new Set([...urlMatches].map(match => match[0]))];
      
      if (jobUrls.length === 0) {
        console.log(`   No job URLs\n`);
        continue;
      }
      
      console.log(`   Found ${jobUrls.length} job URL(s)`);
      
      const lines = body.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      for (const jobUrl of jobUrls) {
        const existing = await pool.query(
          'SELECT id FROM jobs WHERE source_url = $1',
          [jobUrl]
        );
        
        if (existing.rows.length > 0) {
          totalDuplicates++;
          continue;
        }
        
        let title = 'LinkedIn Job';
        let company = 'See LinkedIn';
        
        const urlLineIndex = lines.findIndex(line => line.includes(jobUrl));
        
        if (urlLineIndex > -1) {
          for (let i = Math.max(0, urlLineIndex - 5); i < urlLineIndex; i++) {
            const line = lines[i];
            
            if (line.length < 10 || 
                line.includes('http') || 
                line.includes('View job') ||
                line.includes('Easy Apply') ||
                line.includes('connections')) {
              continue;
            }
            
            if (line.includes(' at ') && line.split(' at ').length === 2) {
              const parts = line.split(' at ');
              title = parts[0].trim();
              company = parts[1].trim();
              break;
            }
            
            if (!line.includes(',') && line.length < 80) {
              title = line;
              if (i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                if (!nextLine.includes('http') && nextLine.length < 50) {
                  company = nextLine;
                }
              }
              break;
            }
          }
        }
        
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
          'Remote / Guatemala',
          body.substring(0, 5000),
          'new',
          'success'
        ]);
        
        console.log(`   ✅ ${title} @ ${company}`);
        totalJobsAdded++;
      }
      
      console.log('');
    }
    
    console.log(`[Gmail Check] Complete! Added ${totalJobsAdded} new, skipped ${totalDuplicates} duplicates`);
    
  } catch (error) {
    console.error('[Gmail Check] Error:', error.message);
    await pool.end();
    process.exit(1);
  } finally {
    // CRITICAL: Always close the pool
    await pool.end();
  }
}

checkGmail();
