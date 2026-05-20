#!/bin/bash

EMAIL_FILE="$1"

if [ ! -f "$EMAIL_FILE" ]; then
  echo '[]'
  exit 0
fi

EMAIL_BODY=$(cat "$EMAIL_FILE")

PROMPT="Extract job listings from this email as JSON array.

Email: $EMAIL_BODY

Format: [{\"title\":\"Job Title\",\"company\":\"Company\",\"location\":\"Location\",\"url\":\"https://linkedin.com/jobs/view/123\"}]

Return only the array. If no jobs, return []"

export TERM=dumb
OUTPUT=$(timeout 90s bash -c "echo '$PROMPT' | ollama run llama3 --format json 2>/dev/null")

# If output is wrapped in {"jobs": [...]} extract the array
if echo "$OUTPUT" | grep -q '"jobs"'; then
  echo "$OUTPUT" | jq -r '.jobs // []' 2>/dev/null || echo '[]'
else
  echo "$OUTPUT"
fi
