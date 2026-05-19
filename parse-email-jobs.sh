#!/bin/bash

EMAIL_BODY="$1"

PROMPT="You are a job listing parser. Extract ALL job postings from this email.

EMAIL CONTENT:
$EMAIL_BODY

Return ONLY a valid JSON array with this exact structure (no markdown, no preamble):
[
  {
    \"title\": \"Job Title Here\",
    \"company\": \"Company Name\",
    \"location\": \"Location\",
    \"url\": \"https://linkedin.com/jobs/view/123456\"
  }
]

CRITICAL RULES:
- Return ONLY the JSON array, nothing else
- Include ALL jobs found in the email
- Extract the full LinkedIn URL (linkedin.com/jobs/view/...)
- If no jobs found, return empty array: []"

echo "$PROMPT" | ollama run llama3 --format json
