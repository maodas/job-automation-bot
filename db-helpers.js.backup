#!/usr/bin/env node
const { execSync } = require('child_process');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

async function getUnscoredJobs() {
  const { stdout } = await execAsync(`sudo -u postgres psql job_automation -t -A -F'|' -c "SELECT id,title,company,location,description,source_url FROM jobs WHERE status = 'new' ORDER BY created_at DESC"`);
  
  const lines = stdout.trim().split('\n').filter(line => line);
  return lines.map(line => {
    const [id, title, company, location, description, source_url] = line.split('|');
    return { id, title, company, location, description, source_url };
  });
}

async function getProfile() {
  const { stdout } = await execAsync(`sudo -u postgres psql job_automation -t -A -c "SELECT row_to_json(profiles) FROM profiles LIMIT 1"`);
  return JSON.parse(stdout.trim());
}

async function updateJobScore(jobId, scoreResult) {
  const escapeForPsql = (str) => {
    if (!str) return '';
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
  };
  
  const reasoning = escapeForPsql(scoreResult.reasoning);
  const requiredSkills = JSON.stringify(scoreResult.required_skills || []).replace(/'/g, "''");
  const matchedSkills = JSON.stringify(scoreResult.matched_skills || []).replace(/'/g, "''");
  const missingSkills = JSON.stringify(scoreResult.missing_skills || []).replace(/'/g, "''");
  
  const { stdout, stderr } = await execAsync(`sudo -u postgres psql job_automation << 'SQLEOF'
UPDATE jobs 
SET 
  ai_score = ${scoreResult.score},
  ai_reasoning = '${reasoning}',
  required_skills = '${requiredSkills}'::jsonb,
  matched_skills = '${matchedSkills}'::jsonb,
  missing_skills = '${missingSkills}'::jsonb,
  status = 'scored'
WHERE id = '${jobId}';
SQLEOF
`);
  
  if (stderr && !stderr.includes('UPDATE 1')) {
    throw new Error(stderr);
  }
}

async function main() {
  try {
    const command = process.argv[2];
    
    if (command === 'get-unscored') {
      const jobs = await getUnscoredJobs();
      console.log(JSON.stringify(jobs, null, 2));
      
    } else if (command === 'get-profile') {
      const profile = await getProfile();
      console.log(JSON.stringify(profile, null, 2));
      
    } else if (command === 'update-score') {
      const jobId = process.argv[3];
      const score = parseInt(process.argv[4]);
      const reasoning = process.argv[5];
      const matchedSkills = JSON.parse(process.argv[6]);
      const missingSkills = JSON.parse(process.argv[7]);
      
      await updateJobScore(jobId, {
        score,
        reasoning,
        required_skills: [],
        matched_skills: matchedSkills,
        missing_skills: missingSkills
      });
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
