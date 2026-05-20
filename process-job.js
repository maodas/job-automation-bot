#!/usr/bin/env node

const { scoreJob } = require('./score-job.js');
const { generateCV, generateCoverLetter } = require('./generate-cv.js');
const { getProfile, updateJobScore } = require('./db-helpers.js');
const fs = require('fs');
const path = require('path');

async function processJob(jobData) {
  console.error(`\n🎯 Processing: ${jobData.title} @ ${jobData.company}`);
  console.error('━'.repeat(60));
  
  // Get profile
  const profile = await getProfile();
  if (!profile) {
    throw new Error('No profile found in database');
  }
  
  // Score job
  console.error('\n1️⃣  Scoring job...');
  const scoreResult = await scoreJob(jobData, profile);
  console.error(`   Score: ${scoreResult.score}/100`);
  console.error(`   Reasoning: ${scoreResult.reasoning.substring(0, 100)}...`);
  
  // Update database
  console.error('\n2️⃣  Updating database...');
  await updateJobScore(jobData.id, scoreResult);
  
  let cvPath = null;
  let letterPath = null;
  
  // Generate documents if score is high enough
  if (scoreResult.score >= 75) {
    console.error(`\n3️⃣  High score! Generating documents...`);
    
    // Create storage directory
    const jobDir = path.join(process.env.HOME, 'storage', 'jobs', `job_${jobData.id}`);
    if (!fs.existsSync(jobDir)) {
      fs.mkdirSync(jobDir, { recursive: true });
    }
    
    // Generate CV
    const cv = await generateCV(jobData, profile, scoreResult.matched_skills || []);
    cvPath = path.join(jobDir, 'cv_tailored.md');
    fs.writeFileSync(cvPath, cv);
    console.error(`   ✅ CV saved: ${cvPath}`);
    
    // Generate cover letter
    const letter = await generateCoverLetter(jobData, profile, scoreResult.matched_skills || []);
    letterPath = path.join(jobDir, 'cover_letter.md');
    fs.writeFileSync(letterPath, letter);
    console.error(`   ✅ Cover letter saved: ${letterPath}`);
    
  } else {
    console.error(`\n3️⃣  Score below threshold (75), skipping document generation`);
  }
  
  console.error('\n✅ Job processing complete!\n');
  
  return {
    job_id: jobData.id,
    title: jobData.title,
    company: jobData.company,
    score: scoreResult.score,
    cv_path: cvPath,
    letter_path: letterPath
  };
}

if (require.main === module) {
  const jobJson = process.argv[2];
  
  if (!jobJson) {
    console.error('Usage: node process-job.js <job-json>');
    process.exit(1);
  }
  
  const jobData = JSON.parse(jobJson);
  
  processJob(jobData)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { processJob };
