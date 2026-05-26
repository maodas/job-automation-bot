#!/bin/bash
cd /home/marcos/job-bot
source .env
export POSTGRES_HOST POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD ANTHROPIC_API_KEY GOOGLE_SHEETS_ID TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID
node job-automation-service.js >> logs/automation.log 2>&1
