// Add this to generate-cv.js - just the cover letter function

async function generateCoverLetter(jobData, profileData, matchedSkills) {
  const certs = profileData.certifications || [];
  const alwaysInclude = certs.filter(c => c.always_include);
  
  const prompt = `Write EXCEPTIONAL cover letter - specific, compelling, authentic.

JOB: ${jobData.title} at ${jobData.company}
DESC: ${(jobData.description || '').slice(0, 900)}

PERSON: 5+ yrs AI automation, n8n expert, ${alwaysInclude.map(c => c.name).join(', ')}
SKILLS: ${matchedSkills.slice(0, 6).join(', ')}

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

[Fit paragraph - why you're uniquely positioned for THIS role]

[Close - brief and confident]

Best regards,
Marcos Rodas
maodas00@gmail.com | +502 40154866 | maodas.online | linkedin.com/in/marcos-rodas

CRITICAL: Location "Guatemala City" goes TOP RIGHT. Contact info goes BOTTOM after signature.`;

  const letter = await callClaude(prompt, "claude-haiku-4-5-20251001", 0.7);
  return letter.trim();
}
