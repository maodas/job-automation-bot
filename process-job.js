require('dotenv').config({path: '/home/marcos/job-bot/.env'});
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
const { scoreJob } = require('./score-job.js');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

async function getProfile() {
  const result = await pool.query('SELECT * FROM profiles LIMIT 1');
  return result.rows[0];
}

async function updateJobScore(jobId, scoreData) {
  await pool.query(`
    UPDATE jobs 
    SET ai_score = $1, 
        ai_reasoning = $2,
        matched_skills = $3,
        missing_skills = $4,
        status = 'scored'
    WHERE id = $5
  `, [
    scoreData.score,
    scoreData.reasoning,
    JSON.stringify(scoreData.matched_skills),
    JSON.stringify(scoreData.missing_skills),
    jobId
  ]);
}

async function processJob(job) {
  try {
    const profile = await getProfile();
    
    console.log(`     Scoring job...`);
    const scoreResult = await scoreJob(job.description, profile);
    
    await updateJobScore(job.id, scoreResult);
    
    console.log(`     Score: ${scoreResult.score}/100`);
    
    return {
      score: scoreResult.score,
      reasoning: scoreResult.reasoning
    };
    
  } catch (error) {
    throw new Error(`Processing failed: ${error.message}`);
  }
}

module.exports = { processJob };
