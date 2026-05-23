#!/usr/bin/env node
const { scoreJob } = require('./score-job.js');
const { generateCV, generateCoverLetter, htmlToPdf } = require('./generate-cv.js');
const { getProfile, updateJobScore } = require('./db-helpers.js');
const fs = require('fs');
const path = require('path');

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
}

async function processJob(jobData) {
  const profile = await getProfile();
  if (!profile) throw new Error('No profile found');
  
  const scoreResult = await scoreJob(jobData, profile);
  await updateJobScore(jobData.id, scoreResult);
  
  let cvPath = null;
  let letterPath = null;
  
  if (scoreResult.score >= 75) {
    const jobDir = path.join(process.env.HOME, 'storage', 'jobs', `job_${jobData.id}`);
    if (!fs.existsSync(jobDir)) {
      fs.mkdirSync(jobDir, { recursive: true });
    }
    
    // Create proper filename: Marcos_Rodas_Product_Manager_CV.pdf
    const name = profile.full_name.replace(/\s+/g, '_');
    const jobTitle = sanitizeFilename(jobData.title.slice(0, 40));
    
    // Generate CV as PDF
    const cvHtml = await generateCV(jobData, profile, scoreResult.matched_skills || []);
    cvPath = path.join(jobDir, `${name}_${jobTitle}_CV.pdf`);
    await htmlToPdf(cvHtml, cvPath);
    
    // Generate Cover Letter as PDF
    const letter = await generateCoverLetter(jobData, profile, scoreResult.matched_skills || []);
    const letterHtml = `<!DOCTYPE html>
<html><head><style>
body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; margin: 40px; white-space: pre-wrap; }
</style></head><body>${letter}</body></html>`;
    letterPath = path.join(jobDir, `${name}_${jobTitle}_CoverLetter.pdf`);
    await htmlToPdf(letterHtml, letterPath);
  }
  
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
  const jobData = JSON.parse(jobJson);
  
  processJob(jobData)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

module.exports = { processJob };
