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
  const jobPosition = jobData.title || 'Position';
  const company = jobData.company || 'Company';
  
  const prompt = `Create tailored CV HTML for: ${jobPosition} at ${company}

CRITICAL: Use ONLY real information. DO NOT invent experience.

TARGET JOB: ${jobPosition} at ${company}
JOB DESCRIPTION: ${(jobData.description || "").slice(0, 1200)}

REAL CANDIDATE INFORMATION:

NAME: Marcos Rodas
CONTACT: maodas00@gmail.com | +502 40154866 | maodas.online | linkedin.com/in/marcos-rodas
LOCATION: Guatemala City, Guatemala

REAL WORK EXPERIENCE:

1. Project Coordinator — Digital Platforms & AI Solutions (2022 – Present)
   IOM (International Organization for Migration) — ROOTS/RRP Program (USAID / U.S. Dept. of State)
   
   CONTEXT: Reported directly TO USAID and U.S. Department of State while implementing FOR Guatemalan government institutions.
   
   Real achievements:
   - Designed and implemented digital platforms for Guatemalan government agencies (MINTRAB, IGM)
   - Built AI-powered automation workflows (Python, Node.js, OpenAI API, Claude API, n8n)
   - Created REST API integrations connecting institutional systems
   - Deployed solutions on GCP with Docker
   - Translated technical requirements into strategic roadmaps
   - Reported project progress to USAID and DoS stakeholders
   
   Create 4-5 XYZ bullets

2. Operations Manager / Technical Lead (2012 – 2022)
   IDC Los Tres
   
   Real achievements:
   - Automated internal processes
   - Built API integrations
   - Created automated reporting
   
   Create 3-4 XYZ bullets

REAL CERTIFICATIONS (First two always):
- Google Project Management Certificate (2023)
- AI Fluency Framework & Foundations — Anthropic (2026)
- Building with the Claude API — Anthropic (2026)
- Claude Code 101 — Anthropic (2026)
- Oracle Next Education - Front End — Alura Latam (2023)
- Foundations: Data, Data, Everywhere — Google (2023)
- Automate tasks and processes with Jira — Coursera (2022)

EDUCATION:
- Associate Degree in Software Development — Universidad Galileo
- Industrial Bachelor / Computer Technician — Instituto Tecnológico Federico Taylor
- B.S. in Administrative Engineering — Universidad Galileo (5th semester, paused)

TECHNICAL SKILLS:
- Languages: JavaScript, Python, TypeScript, Node.js, SQL
- AI & Automation: OpenAI API, Claude API, n8n, prompt engineering
- Cloud: GCP, Firebase, Docker, CI/CD
- APIs: REST APIs, webhooks, Postman, Git
- PM: Jira, Confluence, Agile/Scrum
- Languages: Spanish (native), English (B2+)

MATCHED SKILLS: ${matchedSkills.slice(0, 8).join(", ")}

CSS STYLING REQUIREMENTS:
- NO box-shadow anywhere
- NO border-radius or rounded corners
- NO background boxes or containers
- Clean, flat design with subtle color accents
- Professional blue (#2C5F7C) for name and section headers ONLY
- All text on white background
- Simple horizontal lines for section dividers (1px solid #ddd)
- No shadows, no gradients, no boxes

HTML STRUCTURE:
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { font-family: Arial, Helvetica, sans-serif; max-width: 8.5in; margin: 0 auto; padding: 0.5in; line-height: 1.5; color: #333; }
h1 { color: #2C5F7C; font-size: 28px; margin: 0; padding: 0; border: none; box-shadow: none; }
h2 { color: #2C5F7C; font-size: 14px; text-transform: uppercase; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; box-shadow: none; }
h3 { font-size: 12px; font-weight: bold; margin: 10px 0 5px 0; box-shadow: none; }
p, li { font-size: 10pt; margin: 5px 0; }
ul { margin: 0; padding-left: 20px; }
.contact { font-size: 9pt; color: #666; margin-bottom: 20px; }
.job-title { font-weight: bold; margin-bottom: 2px; }
.company { font-style: italic; margin-bottom: 5px; }
.dates { color: #666; font-size: 9pt; }
</style>
</head>
<body>

[YOUR CONTENT HERE - Name, Contact, Summary, Experience, Certifications, Education, Skills]

</body>
</html>

XYZ FORMAT: "Achieved [result] by [action], which resulted in [impact]"

Return ONLY complete HTML. No markdown, no shadows, no boxes.`;

  let cv = await callClaude(prompt, "claude-haiku-4-5-20251001", 0.5);
  cv = cv.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
  
  if (!cv.includes('<!DOCTYPE html>')) {
    cv = '<!DOCTYPE html>\n<html>\n<head><meta charset="UTF-8"></head>\n<body>\n' + cv + '\n</body></html>';
  }
  
  return cv;
}

async function generateCoverLetter(jobData, profileData, matchedSkills) {
  const jobPosition = jobData.title || 'Position';
  const company = jobData.company || 'this company';
  
  const prompt = `Write professional cover letter for ${jobPosition} at ${company}.

JOB: ${jobPosition}
COMPANY: ${company}
DESCRIPTION: ${(jobData.description || "").slice(0, 900)}

REAL INFO:
- Marcos Rodas
- Project Coordinator at IOM (USAID/DoS programs) - 2+ years
- Reported TO USAID/DoS while implementing FOR Guatemalan government
- Expert: n8n, OpenAI/Claude APIs, Python, Node.js
- Google PM Certificate, AI Fluency Framework
- Contact: maodas00@gmail.com | +502 40154866 | maodas.online | linkedin.com/in/marcos-rodas

MATCHED SKILLS: ${matchedSkills.slice(0, 6).join(", ")}

RULES:
- NO "I am writing to express"
- Hook about THEIR company
- ONE real story with metrics
- 300-350 words, 3-4 paragraphs
- Plain text only (NO markdown)

FORMAT:
                                                                Guatemala City

Dear Hiring Manager,

[Hook]
[Story with metrics]
[Why perfect for role]
[Close]

Best regards,

Marcos Rodas
maodas00@gmail.com | +502 40154866 | maodas.online | linkedin.com/in/marcos-rodas

ONLY real information.`;

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
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: '0.5in', right: '0.6in', bottom: '0.5in', left: '0.6in' }
  });
  await browser.close();
}

module.exports = { generateCV, generateCoverLetter, htmlToPdf };
