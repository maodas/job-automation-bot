#!/usr/bin/env node
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { processJob } = require('./process-job.js');

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
    
    // Process each job
    for (const job of jobs) {
      console.log(`\n  📋 ${job.title} @ ${job.company}`);
      
      try {
        const result = await processJob(job);
        console.log(`     Score: ${result.score}/100`);
        
        if (result.cv_path) {
          console.log(`     ✅ CV saved: ${result.cv_path}`);
        }
        if (result.letter_path) {
          console.log(`     ✅ Cover letter saved: ${result.letter_path}`);
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
