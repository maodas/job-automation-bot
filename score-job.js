#!/usr/bin/env node

const https = require('https');
const { simplifyProfile } = require('./simplify-profile.js');

async function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      reject(new Error('ANTHROPIC_API_KEY not set'));
      return;
    }
    
    const data = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
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

async function scoreJob(jobData, profileData) {
  // NO CONSOLE LOGS - only output JSON
  
  try {
    // Simplify profile based on job relevance
    const simplifiedProfile = simplifyProfile(profileData, jobData);
    
    // Limit job description to 1500 chars
    const shortDescription = (jobData.description || '').slice(0, 1500);
    
    const prompt = `You are a job matching AI. Score how well this candidate matches this job from 0-100.

JOB:
Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location || 'Not specified'}
Description: ${shortDescription}

CANDIDATE PROFILE:
${JSON.stringify(simplifiedProfile, null, 2)}

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "score": 85,
  "reasoning": "Brief explanation of the match quality and key factors",
  "required_skills": ["skill1", "skill2"],
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3"],
  "key_highlights": ["highlight1", "highlight2"]
}`;

    const response = await callClaude(prompt);
    
    // Clean response
    let cleaned = response.trim();
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const result = JSON.parse(cleaned);
    return result;
    
  } catch (error) {
    // Return error as valid JSON
    return {
      score: 50,
      reasoning: `Failed to score: ${error.message}`,
      required_skills: [],
      matched_skills: [],
      missing_skills: [],
      key_highlights: []
    };
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node score-job.js <job-json> <profile-json>');
    process.exit(1);
  }
  
  try {
    const jobData = JSON.parse(args[0]);
    const profileData = JSON.parse(args[1]);
    
    scoreJob(jobData, profileData)
      .then(result => {
        // ONLY output JSON, nothing else
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      })
      .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('Parse error:', error.message);
    process.exit(1);
  }
}

module.exports = { scoreJob };
