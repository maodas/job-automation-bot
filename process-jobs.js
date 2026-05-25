#!/usr/bin/env node
require('dotenv').config({path: '/home/marcos/job-bot/.env'});
const { Pool } = require('pg');
const { scoreJob } = require('./score-job.js');
const { generateCV } = require('./generate-cv.js');
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
    console.log(`[${new Date().toISOString()}] Checking for unscored jobs...`);
    
    const result = await pool.query(
      "SELECT * FROM jobs WHERE status = 'new' ORDER BY created_at DESC"
    );
    const jobs = result.rows;
    
    if (jobs.length === 0) {
      console.log('  No jobs to process');
      await pool.end();
      return;
    }
    
    console.log(`  Found ${jobs.length} job(s) to process`);
    
    const profileResult = await pool.query('SELECT * FROM profiles LIMIT 1');
    const profile = profileResult.rows[0];
    
    for (const job of jobs) {
      console.log(`\n  📋 ${job.title} @ ${job.company}`);
      
      try {
        console.log(`     Scoring job...`);
        const scoreResult = await scoreJob(job.description, profile);
        
        await pool.query(`
          UPDATE jobs 
          SET ai_score = $1, 
              ai_reasoning = $2,
              matched_skills = $3,
              missing_skills = $4,
              status = 'scored'
          WHERE id = $5
        `, [
          scoreResult.score,
          scoreResult.reasoning,
          JSON.stringify(scoreResult.matched_skills),
          JSON.stringify(scoreResult.missing_skills),
          job.id
        ]);
        
        console.log(`     Score: ${scoreResult.score}/100`);
        
        // Generate CV and cover letter if score >= 70
        if (scoreResult.score >= 70) {
          console.log(`     Generating documents...`);
          
          const storageDir = path.join('/home/marcos/storage/jobs', `job_${job.id}`);
          await fs.mkdir(storageDir, { recursive: true });
          
          try {
            const cvContent = await generateCV(job, profile, scoreResult.matched_skills || []);
            const cvPath = path.join(storageDir, 'cv.pdf');
            await fs.writeFile(cvPath, cvContent);
            console.log(`     ✅ CV saved: ${cvPath}`);
          } catch (cvError) {
            console.log(`     ⚠️  CV generation skipped: ${cvError.message}`);
          }
          
          const letterPath = path.join(storageDir, 'cover_letter.pdf');
          const letterContent = `Cover Letter for ${job.title} at ${job.company}\n\nScore: ${scoreResult.score}/100\n\nReasoning: ${scoreResult.reasoning}`;
          await fs.writeFile(letterPath, letterContent);
          console.log(`     ✅ Cover letter saved`);
        }
        
      } catch (error) {
        console.error(`     ❌ Error: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n  ✅ Processing complete!\n');
    await pool.end();
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

processJobs();
