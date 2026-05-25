#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { generateCV, generateCoverLetter, htmlToPdf } = require('./generate-cv.js');

function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
}

async function getProfile() {
  try {
    const result = execSync('node db-helpers.js get-profile', { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (e) {
    return null;
  }
}

async function scoreJob(jobData, profile) {
  try {
    // Write to temp file to avoid shell escaping issues
    const tmpFile = '/tmp/score-input-' + Date.now() + '.json';
    fs.writeFileSync(tmpFile, JSON.stringify({ jobData, profileData: profile }));
    
    const result = execSync(`cat ${tmpFile} | node score-job-wrapper.js`, { encoding: 'utf8' });
    fs.unlinkSync(tmpFile);
    
    return JSON.parse(result);
  } catch (e) {
    return { score: 50, reasoning: 'Scoring failed', matched_skills: [], missing_skills: [] };
  }
}

async function updateJobScore(jobId, scoreResult) {
  const reasoningEscaped = (scoreResult.reasoning || '').replace(/'/g, "''");
  const updateCmd = `node db-helpers.js update-score '${jobId}' '${scoreResult.score}' '${reasoningEscaped}' '${JSON.stringify(scoreResult.matched_skills)}' '${JSON.stringify(scoreResult.missing_skills)}'`;
  execSync(updateCmd);
}

async function processJob(jobData) {
  const profile = await getProfile();
  if (!profile) throw new Error('No profile found');
  
  const scoreResult = await scoreJob(jobData, profile);
  await updateJobScore(jobData.id, scoreResult);
  
  let cvPath = null;
  let letterPath = null;
  
  if (scoreResult.score >= 70) {
    const jobDir = path.join(process.env.HOME, 'storage', 'jobs', `job_${jobData.id}`);
    if (!fs.existsSync(jobDir)) {
      fs.mkdirSync(jobDir, { recursive: true });
    }
    
    const name = profile.full_name.replace(/\s+/g, '_');
    const jobTitle = sanitizeFilename(jobData.title.slice(0, 40));
    
    // Generate CV as PDF
    const cvHtml = await generateCV(jobData, profile, scoreResult.matched_skills);
    cvPath = path.join(jobDir, `${name}_${jobTitle}_CV.pdf`);
    await htmlToPdf(cvHtml, cvPath);
    
    // Generate cover letter as PDF
    const letterText = await generateCoverLetter(jobData, profile, scoreResult.matched_skills);
    letterPath = path.join(jobDir, `${name}_${jobTitle}_CoverLetter.pdf`);
    
    const letterHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 0.5in; line-height: 1.6; color: #333; }
    p { margin: 10px 0; white-space: pre-wrap; }
  </style>
</head>
<body>
${letterText.split('\n\n').map(para => `<p>${para}</p>`).join('\n')}
</body>
</html>`;
    
    await htmlToPdf(letterHtml, letterPath);
  }
  
  return {
    score: scoreResult.score,
    cv_path: cvPath,
    letter_path: letterPath
  };
}

module.exports = { processJob };
