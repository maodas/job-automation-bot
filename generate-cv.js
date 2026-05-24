#!/usr/bin/env node
const https = require('https');
const { simplifyProfile } = require('./simplify-profile.js');
const puppeteer = require('puppeteer');

async function callClaude(prompt, model = "claude-haiku-4-5-20251001", temperature = 0.6) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      reject(new Error('ANTHROPIC_API_KEY not set'));
      return;
    }
    
    const data = JSON.stringify({
      model: model,
      max_tokens: 4000,
      temperature: temperature,
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
  const shortDescription = (jobData.description || '').slice(0, 1500);
  
  const certs = profileData.certifications || [];
  const alwaysInclude = certs.filter(c => c.always_include);
  const contextual = certs.filter(c => !c.always_include);
  
  const prompt = `Create professional ATS-optimized CV.

MANDATORY CERTS: ${alwaysInclude.map(c => `${c.name} (${c.issuer}, ${c.year})`).join(', ')}
OPTIONAL CERTS: ${contextual.map(c => `${c.name} (${c.issuer})`).join(', ')}

JOB: ${jobData.title} at ${jobData.company}
DESC: ${shortDescription}

PROFILE: Marcos Rodas, 5+ years AI automation, maodas00@gmail.com, +502 40154866
SKILLS: ${matchedSkills.join(', ')}

HTML TEMPLATE - COPY EXACTLY:
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:10.5pt;line-height:1.4;color:#000;padding:0.4in 0.6in}
h1{font-size:20pt;font-weight:bold;text-align:center;margin-bottom:4pt}
.tag{font-size:11.5pt;text-align:center;font-style:italic;margin-bottom:6pt;color:#333}
.contact{font-size:9.5pt;text-align:center;margin-bottom:14pt;color:#444}
h2{font-size:11.5pt;font-weight:bold;text-transform:uppercase;margin-top:14pt;margin-bottom:6pt;border-bottom:2pt solid #000;padding-bottom:2pt}
.job{margin-top:8pt}
.jt{font-weight:bold;float:left}
.jd{float:right;font-size:9.5pt;color:#555}
.jc{clear:both;font-style:italic;font-size:10pt;margin-bottom:4pt}
ul{margin:4pt 0 8pt 18pt}
li{margin:3pt 0}
.cert{margin:3pt 0 3pt 18pt;position:relative}
.cert:before{content:"•";position:absolute;left:-18pt}
.sk{margin:4pt 0}
.skl{font-weight:bold}
</style></head><body>

<h1>MARCOS RODAS</h1>
<div class="tag">[Job-specific title - e.g. "Technical Product Manager — AI & Automation"]</div>
<div class="contact">Guatemala City  |  +502 40154866  |  maodas00@gmail.com  |  maodas.online  |  linkedin.com/in/marcos-rodas</div>

<h2>PROFESSIONAL SUMMARY</h2>
<p>[3-4 sentences, use job keywords, 5+ years, mention certs]</p>

<h2>CORE COMPETENCIES</h2>
<p>[Matched skills first • separated • by bullets]</p>

<h2>PROFESSIONAL EXPERIENCE</h2>

<div class="job">
<div class="jt">Project Coordinator — Digital Platforms</div>
<div class="jd">Jul 2024 – Present</div>
<div class="jc">IOM (International Organization for Migration) — ROOTS Program</div>
<ul><li>[Adapted bullet]</li><li>[Adapted bullet]</li><li>[Adapted bullet]</li></ul>
</div>

<div class="job">
<div class="jt">Automation & AI Solutions Specialist</div>
<div class="jd">2022 – 2024</div>
<div class="jc">IOM — ROOTS Program</div>
<ul><li>[Bullet]</li><li>[Bullet]</li></ul>
</div>

<div class="job">
<div class="jt">Operations Manager</div>
<div class="jd">Feb 2012 – Aug 2023</div>
<div class="jc">IDC Los Tres, S.A.</div>
<ul><li>[Bullet]</li><li>[Bullet]</li></ul>
</div>

<h2>CERTIFICATIONS</h2>
<div class="cert">Google Project Management Certificate — Google/Coursera (2023)</div>
<div class="cert">AI Fluency Framework & Foundations — Anthropic (2026)</div>
[Add relevant optional certs]

<h2>TECHNICAL SKILLS</h2>
<div class="sk"><span class="skl">Languages:</span> JavaScript, TypeScript, Python, SQL</div>
<div class="sk"><span class="skl">AI & Automation:</span> [List]</div>
<div class="sk"><span class="skl">Cloud:</span> [List]</div>

<h2>EDUCATION</h2>
<div class="cert">Associate Degree in Software Development — Universidad Galileo (2023)</div>
<div class="cert">B.S. in Administrative Engineering — Universidad Galileo (In Progress)</div>

</body></html>

Return HTML only, no backticks.`;

  let cv = await callClaude(prompt, "claude-haiku-4-5-20251001", 0.6);
  cv = cv.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
  return cv;
}

async function generateCoverLetter(jobData, profileData, matchedSkills) {
  const certs = profileData.certifications || [];
  const alwaysInclude = certs.filter(c => c.always_include);
  
  const prompt = `Write EXCEPTIONAL cover letter - specific, compelling, authentic.

JOB: ${jobData.title} at ${jobData.company}
DESC: ${(jobData.description || "").slice(0, 900)}

PERSON: 5+ yrs AI automation, n8n expert, ${alwaysInclude.map(c => c.name).join(", ")}
SKILLS: ${matchedSkills.slice(0, 6).join(", ")}

RULES:
- NO "I am writing to express"
- Start with something specific about THEIR company/product
- Tell ONE specific story with metrics
- Show genuine enthusiasm
- 300-350 words, 3-4 paras

EXACT FORMAT:
                                                                Guatemala City

Dear Hiring Manager,

[Hook paragraph - specific to their company/product]

[Story paragraph - concrete example with metrics from your work]

[Fit paragraph - why you are uniquely positioned for THIS role]

[Close - brief and confident]

Best regards,
Marcos Rodas
maodas00@gmail.com | +502 40154866 | maodas.online | linkedin.com/in/marcos-rodas

CRITICAL: Location "Guatemala City" goes TOP RIGHT. Contact info goes BOTTOM after signature.`;

  const letter = await callClaude(prompt, "claude-haiku-4-5-20251001", 0.7);
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
    margin: { top: '0.4in', right: '0.6in', bottom: '0.4in', left: '0.6in' }
  });
  await browser.close();
}

module.exports = { generateCV, generateCoverLetter, htmlToPdf };
