#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;

async function processJobs() {
  try {
    console.log(`[${new Date().toISOString()}] Checking for unscored jobs...`);
    
    // Get unscored jobs
    const { stdout: jobsJson } = await execAsync('node db-helpers.js get-unscored');
    const jobs = JSON.parse(jobsJson);
    
    if (jobs.length === 0) {
      console.log('  No jobs to process');
      return;
    }
    
    console.log(`  Found ${jobs.length} job(s) to process`);
    
    // Get profile once
    const { stdout: profileJson } = await execAsync('node db-helpers.js get-profile');
    const profile = JSON.parse(profileJson);
    
    // Process each job
    for (const job of jobs) {
      console.log(`\n  📋 ${job.title} @ ${job.company}`);
      
      try {
        // Score job
        const { stdout: scoreJson } = await execAsync(
          `node score-job.js '${JSON.stringify(job).replace(/'/g, "'\\''")}' '${JSON.stringify(profile).replace(/'/g, "'\\''")}' 2>&1`
        );
        
        const scoreResult = JSON.parse(scoreJson);
        console.log(`     Score: ${scoreResult.score}/100`);
        
        // Update database
        await execAsync(
          `node db-helpers.js update-score '${job.id}' '${JSON.stringify(scoreResult).replace(/'/g, "'\\''")}' 2>&1`
        );
        
        // If high score, generate documents
        if (scoreResult.score >= 75) {
          console.log('     🎉 High score! Generating documents...');
          
          const matchedSkills = JSON.stringify(scoreResult.matched_skills);
          const jobDir = `/home/marcos/storage/jobs/job_${job.id}`;
          
          // Create directory
          await execAsync(`mkdir -p ${jobDir}`);
          
          // Generate CV
          const { stdout: cvOutput } = await execAsync(
            `node generate-cv.js cv '${JSON.stringify(job).replace(/'/g, "'\\''")}' '${JSON.stringify(profile).replace(/'/g, "'\\''")}' '${matchedSkills}' 2>&1`
          );
          
          const cvContent = cvOutput.split('--- CV START ---')[1]?.split('--- CV END ---')[0]?.trim();
          if (cvContent) {
            await fs.writeFile(`${jobDir}/cv.md`, cvContent);
            console.log('     ✅ CV saved');
          }
          
          // Generate cover letter
          const { stdout: letterOutput } = await execAsync(
            `node generate-cv.js letter '${JSON.stringify(job).replace(/'/g, "'\\''")}' '${JSON.stringify(profile).replace(/'/g, "'\\''")}' '${matchedSkills}' 2>&1`
          );
          
          const letterContent = letterOutput.split('--- COVER LETTER START ---')[1]?.split('--- COVER LETTER END ---')[0]?.trim();
          if (letterContent) {
            await fs.writeFile(`${jobDir}/cover-letter.txt`, letterContent);
            console.log('     ✅ Cover letter saved');
          }
        }
        
      } catch (error) {
        console.error(`     ❌ Error: ${error.message}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n  ✅ Processing complete!\n');
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

processJobs();
