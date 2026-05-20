#!/bin/bash

# Automated job scoring loop
# Runs continuously, checks for new jobs every 5 minutes

INTERVAL=300  # 5 minutes

echo "🤖 Starting automated job scoring loop..."
echo "Checking for new jobs every $INTERVAL seconds"
echo ""

while true; do
  cd /home/marcos/job-bot
  node process-jobs.js
  
  echo "💤 Sleeping for 5 minutes..."
  echo ""
  
  sleep $INTERVAL
done
