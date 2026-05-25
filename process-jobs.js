#!/usr/bin/env node
require('dotenv').config({path: '/home/marcos/job-bot/.env'});
const { Pool } = require('pg');
const { scoreJob } = require('./score-job.js');
const { generateCV, generateCoverLetter, htmlToPdf } = require('./generate-cv.js');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

async function processJobs() {
  try {
    console.log('[' + new Date().toISOString() + '] Checking for unscored jobs...');
    
    const result = await pool.query(`
      SELECT * FROM jobs 
      WHERE status = 'new' 
      ORDER BY created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('  No jobs to process');
      return;
    }
    
    console.log(`  Found ${result.rows.length} job(s) to process`);
    
    const profileResult = await pool.query('SELECT * FROM profiles LIMIT 1');
    const profile = profileResult.rows[0];
    
    for (const job of result.rows) {
      console.log(`  📋 ${job.title} @ ${job.company}`);
      console.log(`     Scoring job...`);
      
      const scoreResult = await scoreJob(job, profile);
      
      await pool.query(`
        UPDATE jobs SET 
          ai_score = $1,
          ai_reasoning = $2,
          matched_skills = $3,
          missing_skills = $4,
          status = 'scored'
        WHERE id = $5
      `, [
        scoreResult.score,
        scoreResult.reasoning,
        JSON.stringify(scoreResult.matched_skills || []),
        JSON.stringify(scoreResult.missing_skills || []),
        job.id
      ]);
      
      console.log(`     Score: ${scoreResult.score}/100`);
      
      if (scoreResult.score >= 70) {
        console.log(`     Generating documents...`);
        
        const storageDir = path.join('/home/marcos/storage/jobs', `job_${job.id}`);
        await fs.mkdir(storageDir, { recursive: true });
        
        try {
          const cvHtml = await generateCV(job, profile, scoreResult.matched_skills || []);
          const sanitizedTitle = job.title.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50);
          const cvPath = path.join(storageDir, `Marcos Rodas CV - ${sanitizedTitle}.pdf`);
          await htmlToPdf(cvHtml, cvPath);
          console.log(`     ✅ CV saved: ${cvPath}`);
        } catch (cvError) {
          console.log(`     ⚠️  CV generation failed: ${cvError.message}`);
        }
        
        try {
          const letterText = await generateCoverLetter(job, profile, scoreResult.matched_skills || []);
          const sanitizedTitle2 = job.title.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50);
          const letterPath = path.join(storageDir, `Marcos Rodas Cover Letter - ${sanitizedTitle2}.pdf`);
          const letterHtml = `<html><body style="font-family: Arial; padding: 40px; white-space: pre-wrap;">${letterText}</body></html>`;
          await htmlToPdf(letterHtml, letterPath);
          console.log(`     ✅ Cover letter saved`);
        } catch (letterError) {
          console.log(`     ⚠️  Cover letter generation failed: ${letterError.message}`);
        }
      }
    }
    
    console.log('  ✅ Processing complete!');
  } catch (error) {
    console.error('Error processing jobs:', error);
    throw error;
  }
}

processJobs()
  .then(() => pool.end())
  .catch(err => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
