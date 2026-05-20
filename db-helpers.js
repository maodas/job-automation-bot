#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const DB_NAME = 'job_automation';

async function query(sql) {
  const cmd = `sudo -u postgres psql ${DB_NAME} -t -c "${sql}"`;
  const { stdout } = await execPromise(cmd);
  return stdout.trim();
}

async function getProfile() {
  const result = await query(
    "SELECT row_to_json(profiles) FROM profiles LIMIT 1;"
  );
  return result ? JSON.parse(result) : null;
}

async function getUnscoredJobs() {
  const sql = `
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT id, title, company, location, description, source_url
      FROM jobs 
      WHERE status = 'new' 
      AND fetch_status = 'success'
      AND description IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10
    ) t;
  `;
  
  const result = await query(sql);
  
  if (!result || result === 'null') {
    return [];
  }
  
  return JSON.parse(result);
}

async function updateJobScore(jobId, scoreData) {
  // Use parameterized approach to avoid escaping issues
  const { exec } = require('child_process');
  const fs = require('fs');
  const tmpFile = `/tmp/update_job_${jobId}.sql`;
  
  // Write SQL to temp file to avoid shell escaping issues
  const sql = `
UPDATE jobs SET
  ai_score = ${scoreData.score},
  ai_reasoning = $REASON$${scoreData.reasoning}$REASON$,
  required_skills = '${JSON.stringify(scoreData.required_skills || [])}'::jsonb,
  matched_skills = '${JSON.stringify(scoreData.matched_skills || [])}'::jsonb,
  missing_skills = '${JSON.stringify(scoreData.missing_skills || [])}'::jsonb,
  status = 'scored',
  updated_at = NOW()
WHERE id = '${jobId}';
`;
  
  fs.writeFileSync(tmpFile, sql);
  
  try {
    await execPromise(`sudo -u postgres psql ${DB_NAME} -f ${tmpFile}`);
    fs.unlinkSync(tmpFile);
  } catch (error) {
    fs.unlinkSync(tmpFile);
    throw error;
  }
}

if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'get-profile':
      getProfile().then(profile => {
        console.log(JSON.stringify(profile, null, 2));
      });
      break;
      
    case 'get-unscored':
      getUnscoredJobs().then(jobs => {
        console.log(JSON.stringify(jobs, null, 2));
      });
      break;
      
    default:
      console.log('Usage: node db-helpers.js <get-profile|get-unscored>');
  }
}

module.exports = { getProfile, getUnscoredJobs, updateJobScore };
