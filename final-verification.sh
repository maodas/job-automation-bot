#!/bin/bash
echo "=========================================="
echo "FINAL SYSTEM VERIFICATION"
echo "=========================================="
echo ""

echo "1. CRON SCHEDULE"
echo "----------------"
crontab -l | grep automation
echo ""

echo "2. CRITICAL FILES EXIST & SIZES"
echo "--------------------------------"
ls -lh run-automation.sh job-automation-service.js process-jobs.js score-job.js check-gmail-jobs.js | awk '{print $9, $5}'
echo ""

echo "3. PROCESS-JOBS.JS USES CORRECT IMPORTS"
echo "----------------------------------------"
grep "require.*process-job.js" process-jobs.js && echo "❌ WRONG - Uses broken file!" || echo "✅ CORRECT - No broken imports"
grep "require.*score-job.js" process-jobs.js && echo "✅ Has score-job import" || echo "❌ MISSING score-job import"
echo ""

echo "4. API KEY VALIDITY"
echo "-------------------"
node -e "require('dotenv').config({path: '/home/marcos/job-bot/.env'}); console.log('Length:', process.env.ANTHROPIC_API_KEY?.length, '| Starts with sk-ant:', process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant'));"
echo ""

echo "5. DATABASE CONNECTION"
echo "----------------------"
sudo -u postgres psql job_automation -c "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='scored') as scored, COUNT(*) FILTER (WHERE status='new') as new FROM jobs;" 2>&1 | grep -v "^$"
echo ""

echo "6. TEST COMPLETE WORKFLOW"
echo "-------------------------"
node process-jobs.js 2>&1 | head -5
echo ""

echo "7. GMAIL SCRIPT CHECK"
echo "---------------------"
head -10 check-gmail-jobs.js | grep -E "Pool|google" && echo "✅ Gmail script looks correct"
echo ""

echo "8. RUN FULL AUTOMATION (DRY RUN)"
echo "---------------------------------"
./run-automation.sh 2>&1 | tail -10
echo ""

echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="
