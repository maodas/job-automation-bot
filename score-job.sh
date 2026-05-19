#!/bin/bash

JOB_JSON="$1"
PROFILE_JSON="$2"

PROMPT="Score this job match from 0-100 based on candidate fit.

JOB:
$JOB_JSON

CANDIDATE PROFILE:
$PROFILE_JSON

Return ONLY this JSON structure (no markdown):
{
  \"score\": 85,
  \"reasoning\": \"Strong match because candidate has 3+ years in product management and technical background. Remote role matches preference.\",
  \"matched_skills\": [\"Product Management\", \"Technical Leadership\", \"Agile\"],
  \"missing_skills\": [\"Machine Learning\", \"Data Science\"]
}

Scoring guide:
90-100: Exceptional match (dream job)
80-89: Strong match (definitely apply)
70-79: Good match (worth considering)
60-69: Moderate match (missing some key skills)
Below 60: Poor match"

echo "$PROMPT" | ollama run llama3 --format json
