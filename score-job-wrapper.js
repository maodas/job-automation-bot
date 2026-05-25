#!/usr/bin/env node
const { scoreJob } = require('./score-job.js');

// Read from stdin
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', async () => {
  try {
    const parsed = JSON.parse(inputData);
    
    if (!parsed.jobData || !parsed.profileData) {
      throw new Error('Missing jobData or profileData');
    }
    
    const result = await scoreJob(parsed.jobData, parsed.profileData);
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (error) {
    console.error('Wrapper error:', error.message);
    console.log(JSON.stringify({
      score: 50,
      reasoning: 'Scoring failed: ' + error.message,
      matched_skills: [],
      missing_skills: []
    }));
    process.exit(0);
  }
});
