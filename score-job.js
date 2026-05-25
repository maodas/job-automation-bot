require('dotenv').config({path: '/home/marcos/job-bot/.env'});
const https = require('https');

function truncateText(text, maxLength = 3000) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function simplifyProfile(profile) {
  return {
    name: profile.full_name,
    headline: profile.headline,
    summary: truncateText(profile.summary, 500),
    skills: profile.technical_skills,
    target_roles: profile.target_roles,
    // Take only top 3 most recent experiences
    experience: Array.isArray(profile.work_experience) 
      ? profile.work_experience.slice(0, 3)
      : profile.work_experience
  };
}

async function scoreJob(jobDescription, profile) {
  const simplifiedProfile = simplifyProfile(profile);
  const truncatedDescription = truncateText(jobDescription, 2000);
  
  const prompt = `Score this job from 0-100 based on candidate fit.

CANDIDATE:
${JSON.stringify(simplifiedProfile, null, 2)}

JOB:
${truncatedDescription}

Return ONLY valid JSON:
{
  "score": 85,
  "reasoning": "Brief explanation",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3"]
}`;

  const data = JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
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
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Claude API error: ${res.statusCode} - ${body}`));
            return;
          }
          
          const response = JSON.parse(body);
          const text = response.content[0].text;
          
          // Clean markdown if present
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const result = JSON.parse(cleaned);
          
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = { scoreJob };
