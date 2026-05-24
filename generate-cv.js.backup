#!/usr/bin/env node
const https = require('https');
const { simplifyProfile } = require('./simplify-profile.js');
const puppeteer = require('puppeteer');

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
      messages: [{role: "user", content: prompt}]
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
          reject(new Error(`Claude API error: ${res.statusCode}`));
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
  const simplifiedProfile = simplifyProfile(profileData, jobData);
  const shortDescription = (jobData.description || '').slice(0, 1200);
  
  const prompt = `Create ATS-friendly CV in HTML. CRITICAL: Simple, clean HTML - NO shadows, NO fancy CSS, black text on white.

JOB: ${jobData.title} at ${jobData.company}
DESCRIPTION: ${shortDescription}
CANDIDATE: ${JSON.stringify(simplifiedProfile, null, 2)}
MATCHED SKILLS: ${matchedSkills.slice(0, 5).join(', ')}

Use this EXACT template - clean and ATS-optimized:

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  font-family: Arial, sans-serif; 
  font-size: 10pt; 
  line-height: 1.4; 
  color: #000;
  background: #fff;
  padding: 0.5in;
  max-width: 100%;
}
h1 { font-size: 16pt; margin-bottom: 4pt; font-weight: bold; }
h2 { 
  font-size: 12pt; 
  margin-top: 12pt; 
  margin-bottom: 6pt; 
  border-bottom: 1px solid #000;
  font-weight: bold;
}
.contact { font-size: 9pt; margin-bottom: 12pt; }
.section { margin-bottom: 10pt; page-break-inside: avoid; }
.job-title { font-weight: bold; margin-top: 6pt; }
.job-company { font-style: italic; }
.job-dates { font-size: 9pt; color: #333; }
ul { margin: 4pt 0 4pt 20pt; }
li { margin: 2pt 0; }
</style>
</head>
<body>
<h1>[FULL NAME]</h1>
<div class="contact">[City, Country] | [Email] | [Phone]</div>

<h2>PROFESSIONAL SUMMARY</h2>
<div class="section">[2-3 sentences highlighting matched skills and experience]</div>

<h2>WORK EXPERIENCE</h2>
[For each job - most relevant first]
<div class="section">
<div class="job-title">[Job Title]</div>
<div class="job-company">[Company Name]</div>
<div class="job-dates">[Dates]</div>
<ul>
<li>[Achievement focusing on matched skills]</li>
<li>[Achievement with metrics]</li>
</ul>
</div>

<h2>SKILLS</h2>
<div class="section">[Matched skills first, then others]</div>

<h2>EDUCATION</h2>
<div class="section">
<div class="job-title">[Degree]</div>
<div class="job-company">[Institution]</div>
<div class="job-dates">[Year]</div>
</div>

</body>
</html>

Return ONLY HTML - no markdown backticks.`;

  let cv = await callClaude(prompt);
  cv = cv.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
  return cv;
}

async function generateCoverLetter(jobData, profileData, matchedSkills) {
  const simplifiedProfile = simplifyProfile(profileData, jobData);
  
  const prompt = `Write professional cover letter. Plain text, 3 paragraphs, 250-300 words.

JOB: ${jobData.title} at ${jobData.company}
CANDIDATE: ${profileData.full_name}
MATCHED SKILLS: ${matchedSkills.slice(0, 5).join(', ')}

Format:
${profileData.full_name}
${profileData.email} | ${profileData.phone || ''}
${profileData.location}

[Date]

Dear Hiring Manager,

[Paragraph 1: Interest in role]
[Paragraph 2: 2-3 relevant achievements]
[Paragraph 3: Call to action]

Best regards,
${profileData.full_name}

Plain text only.`;

  const letter = await callClaude(prompt);
  return letter.trim();
}

async function htmlToPdf(html, outputPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'Letter',
    printBackground: false,
    margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
  });
  await browser.close();
}

module.exports = { generateCV, generateCoverLetter, htmlToPdf };
