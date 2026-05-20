#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function getUnscoredJobs() {
  const { stdout } = await execAsync(`sudo -u postgres psql job_automation -t -A -F'|' -c "
    SELECT row_to_json(t) FROM (
      SELECT * FROM jobs 
      WHERE status = 'new' 
        AND fetch_status = 'success'
      ORDER BY created_at DESC
      LIMIT 20
    ) t;
  "`);
  
  const lines = stdout.trim().split('\n').filter(Boolean);
  return lines.map(line => JSON.parse(line));
}

async function getProfile() {
  const { stdout } = await execAsync(`sudo -u postgres psql job_automation -t -A -c "
    SELECT row_to_json(t) FROM (
      SELECT * FROM profiles 
      ORDER BY created_at DESC 
      LIMIT 1
    ) t;
  "`);
  
  return JSON.parse(stdout.trim());
}

async function updateJobScore(jobId, scoreResult) {
  // Properly escape all strings for PostgreSQL
  const escapeForPsql = (str) => {
    if (!str) return '';
    // Replace single quotes with double single quotes for SQL
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
  };
  
  const reasoning = escapeForPsql(scoreResult.reasoning);
  const requiredSkills = JSON.stringify(scoreResult.required_skills || []).replace(/'/g, "''");
  const matchedSkills = JSON.stringify(scoreResult.matched_skills || []).replace(/'/g, "''");
  const missingSkills = JSON.stringify(scoreResult.missing_skills || []).replace(/'/g, "''");
  
  // Use heredoc to avoid shell parsing issues
  const { stdout, stderr } = await execAsync(`sudo -u postgres psql job_automation << 'SQLEOF'
UPDATE jobs 
SET 
  ai_score = ${scoreResult.score},
  ai_reasoning = '${reasoning}',
  required_skills = '${requiredSkills}'::jsonb,
  matched_skills = '${matchedSkills}'::jsonb,
  missing_skills = '${missingSkills}'::jsonb,
  status = 'scored',
  updated_at = NOW()
WHERE id = '${jobId}';
SQLEOF
`);
  
  if (stderr && !stderr.includes('UPDATE')) {
    throw new Error(stderr);
  }
}

// Main CLI
async function main() {
  const command = process.argv[2];
  
  try {
    if (command === 'get-unscored') {
      const jobs = await getUnscoredJobs();
      console.log(JSON.stringify(jobs, null, 2));
      
    } else if (command === 'get-profile') {
      const profile = await getProfile();
      console.log(JSON.stringify(profile, null, 2));
      
    } else if (command === 'update-score') {
      const jobId = process.argv[3];
      const scoreResult = JSON.parse(process.argv[4]);
      await updateJobScore(jobId, scoreResult);
      console.log('✅ Score updated');
      
    } else {
      console.error('Usage: node db-helpers.js <get-unscored|get-profile|update-score>');
      process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getUnscoredJobs, getProfile, updateJobScore };
