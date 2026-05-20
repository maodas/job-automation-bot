#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

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
        'Content-Length': data.length
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
  let prompt = fs.readFileSync(__dirname + '/score-job-prompt.txt', 'utf8');
  
  prompt = prompt
    .replace('{PROFILE_DATA}', JSON.stringify(profileData, null, 2))
    .replace('{JOB_TITLE}', jobData.title)
    .replace('{JOB_COMPANY}', jobData.company || 'Not specified')
    .replace('{JOB_LOCATION}', jobData.location || 'Not specified')
    .replace('{JOB_DESCRIPTION}', jobData.description || 'No description');
  
  console.error('🤖 Scoring with Claude Haiku 4.5...');
  
  try {
    const response = await callClaude(prompt);
    
    // Clean response
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    if (!result.score || !result.reasoning) {
      throw new Error('Invalid response format');
    }
    
    result.score = Math.max(0, Math.min(100, parseInt(result.score)));
    
    console.error('✅ Score:', result.score);
    
    return result;
    
  } catch (error) {
    console.error('❌ Scoring error:', error.message);
    
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

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node score-job.js <job-json> <profile-json>');
    process.exit(1);
  }
  
  const jobData = JSON.parse(args[0]);
  const profileData = JSON.parse(args[1]);
  
  scoreJob(jobData, profileData)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { scoreJob };
