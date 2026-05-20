#!/usr/bin/env node

const https = require('https');
const { simplifyProfile } = require('./simplify-profile.js');

async function callClaude(prompt, model = "claude-haiku-4-5-20251001") {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      reject(new Error('ANTHROPIC_API_KEY not set'));
      return;
    }
    
    const data = JSON.stringify({
      model: model,
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

async function generateCV(jobData, profileData, matchedSkills) {
  // NO CONSOLE LOGS
  
  try {
    const simplifiedProfile = simplifyProfile(profileData, jobData);
    const shortDescription = (jobData.description || '').slice(0, 1200);
    
    const prompt = `You are a professional CV writer. Create a tailored CV for this job application.

JOB POSTING:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location || 'Not specified'}
Description: ${shortDescription}

CANDIDATE PROFILE:
${JSON.stringify(simplifiedProfile, null, 2)}

MATCHED SKILLS:
${JSON.stringify(matchedSkills, null, 2)}

INSTRUCTIONS:
1. Use ONLY information from the profile provided - DO NOT invent experience
2. Highlight the ${matchedSkills.slice(0, 5).join(', ')} skills prominently
3. Reorder work experience to show most relevant roles first
4. Keep bullet points concise and impact-focused
5. Total length: 1 page equivalent (500-600 words)

Format as clean markdown with sections:
# [Name]
[Headline]

## Professional Summary
[2-3 sentences highlighting relevant experience]

## Work Experience
[Most relevant roles first, 3-5 bullets each]

## Skills
[Grouped by category]

## Education
[Highest degree first]

Return ONLY the markdown CV, no preamble or explanation.`;

    const cv = await callClaude(prompt);
    return cv;
    
  } catch (error) {
    throw error;
  }
}

async function generateCoverLetter(jobData, profileData, matchedSkills) {
  // NO CONSOLE LOGS
  
  try {
    const simplifiedProfile = simplifyProfile(profileData, jobData);
    const shortDescription = (jobData.description || '').slice(0, 1200);
    
    const prompt = `Write a professional cover letter for this job application.

JOB:
Title: ${jobData.title}
Company: ${jobData.company}
Description: ${shortDescription}

CANDIDATE:
${JSON.stringify(simplifiedProfile, null, 2)}

KEY MATCHED SKILLS: ${matchedSkills.slice(0, 5).join(', ')}

INSTRUCTIONS:
1. 3 paragraphs maximum (250-300 words total)
2. Opening: Why you're interested in this specific role/company
3. Body: 2-3 most relevant achievements that match job requirements
4. Closing: Enthusiasm and call to action
5. Professional but conversational tone
6. NO generic fluff - be specific about the match

Format as plain text letter with proper spacing.
Include: [Your Name], [Email], [Phone] at top.

Return ONLY the letter text, no preamble.`;

    const letter = await callClaude(prompt);
    return letter;
    
  } catch (error) {
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.error('Usage: node generate-cv.js <type> <job-json> <profile-json> <matched-skills-json>');
    console.error('  type: "cv" or "letter"');
    process.exit(1);
  }
  
  const [type, jobJson, profileJson, matchedSkillsJson] = args;
  
  try {
    const jobData = JSON.parse(jobJson);
    const profileData = JSON.parse(profileJson);
    const matchedSkills = JSON.parse(matchedSkillsJson);
    
    if (type === 'cv') {
      generateCV(jobData, profileData, matchedSkills)
        .then(cv => {
          console.log('--- CV START ---');
          console.log(cv);
          console.log('--- CV END ---');
          process.exit(0);
        });
    } else if (type === 'letter') {
      generateCoverLetter(jobData, profileData, matchedSkills)
        .then(letter => {
          console.log('--- COVER LETTER START ---');
          console.log(letter);
          console.log('--- COVER LETTER END ---');
          process.exit(0);
        });
    } else {
      console.error('Type must be "cv" or "letter"');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { generateCV, generateCoverLetter };
