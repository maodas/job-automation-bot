#!/bin/bash
cd /home/marcos/job-bot
source .env
export POSTGRES_HOST POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD ANTHROPIC_API_KEY
node job-automation-service.js >> logs/automation.log 2>&1
