#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

function escapeJson(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

async function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      reject(new Error('ANTHROPIC_API_KEY not set'));
      return;
    }
    
    const data = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Claude API error: ${res.statusCode} - ${body}`));
          return;
        }
        
        try {
          const response = JSON.parse(body);
          resolve(response.content[0].text);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function generateCV(jobData, profileData, matchedSkills = []) {
  console.error('📝 Generating CV with Claude Haiku 4.5...');
  
  let prompt = fs.readFileSync(__dirname + '/generate-cv-prompt.txt', 'utf8');
  
  // Simplify profile data to avoid huge payloads
  const simplifiedProfile = {
    name: profileData.full_name,
    email: profileData.email,
    phone: profileData.phone,
    location: profileData.location,
    headline: profileData.headline,
    summary: profileData.summary,
    work_experience: profileData.work_experience,
    education: profileData.education,
    certifications: profileData.certifications,
    projects: profileData.projects,
    technical_skills: profileData.technical_skills,
    soft_skills: profileData.soft_skills
  };
  
  prompt = prompt
    .replace('{PROFILE_DATA}', JSON.stringify(simplifiedProfile, null, 2))
    .replace('{JOB_TITLE}', jobData.title || '')
    .replace('{JOB_COMPANY}', jobData.company || 'the company')
    .replace('{JOB_DESCRIPTION}', (jobData.description || '').substring(0, 3000)) // Limit description length
    .replace('{MATCHED_SKILLS}', matchedSkills.join(', ') || 'general skills');
  
  try {
    const cv = await callClaude(prompt);
    console.error('✅ CV generated');
    return cv;
    
  } catch (error) {
    console.error('❌ CV generation failed:', error.message);
    throw error;
  }
}

async function generateCoverLetter(jobData, profileData, matchedSkills = []) {
  console.error('✉️  Generating cover letter with Claude Haiku 4.5...');
  
  let prompt = fs.readFileSync(__dirname + '/generate-cover-letter-prompt.txt', 'utf8');
  
  // Simplify profile data
  const simplifiedProfile = {
    name: profileData.full_name,
    email: profileData.email,
    phone: profileData.phone,
    location: profileData.location,
    headline: profileData.headline,
    summary: profileData.summary,
    work_experience: profileData.work_experience,
    technical_skills: profileData.technical_skills
  };
  
  prompt = prompt
    .replace('{PROFILE_DATA}', JSON.stringify(simplifiedProfile, null, 2))
    .replace('{JOB_TITLE}', jobData.title || '')
    .replace('{JOB_COMPANY}', jobData.company || 'the company')
    .replace('{JOB_DESCRIPTION}', (jobData.description || '').substring(0, 2000))
    .replace('{MATCHED_SKILLS}', matchedSkills.join(', ') || 'general skills');
  
  try {
    const letter = await callClaude(prompt);
    console.error('✅ Cover letter generated');
    return letter;
    
  } catch (error) {
    console.error('❌ Cover letter generation failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set');
    process.exit(1);
  }
  
  if (command === 'cv') {
    const jobData = JSON.parse(args[1]);
    const profileData = JSON.parse(args[2]);
    const matchedSkills = args[3] ? JSON.parse(args[3]) : [];
    
    generateCV(jobData, profileData, matchedSkills)
      .then(cv => {
        console.log(cv);
        process.exit(0);
      })
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
      
  } else if (command === 'letter') {
    const jobData = JSON.parse(args[1]);
    const profileData = JSON.parse(args[2]);
    const matchedSkills = args[3] ? JSON.parse(args[3]) : [];
    
    generateCoverLetter(jobData, profileData, matchedSkills)
      .then(letter => {
        console.log(letter);
        process.exit(0);
      })
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
      
  } else {
    console.error('Usage: node generate-cv.js <cv|letter> <job-json> <profile-json> [matched-skills-json]');
    process.exit(1);
  }
}

module.exports = { generateCV, generateCoverLetter };
