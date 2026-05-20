#!/bin/bash

echo "🚀 TESTING COMPLETE WORKFLOW"
echo "=============================="
echo ""

# Get unscored jobs
JOBS=$(node db-helpers.js get-unscored)
JOB_COUNT=$(echo $JOBS | jq 'length')

echo "📊 Found $JOB_COUNT unscored job(s)"
echo ""

if [ "$JOB_COUNT" -eq 0 ]; then
  echo "⚠️ No unscored jobs found. Reset some jobs first:"
  echo "sudo -u postgres psql job_automation -c \"UPDATE jobs SET status='new', ai_score=NULL WHERE ai_score IS NOT NULL LIMIT 2;\""
  exit 0
fi

# Get profile once
PROFILE=$(node db-helpers.js get-profile | jq -c '.')

# Process each job
echo $JOBS | jq -c '.[]' | while read -r JOB; do
  JOB_ID=$(echo $JOB | jq -r '.id')
  TITLE=$(echo $JOB | jq -r '.title')
  COMPANY=$(echo $JOB | jq -r '.company')
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 Processing: $TITLE @ $COMPANY"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Step 1: Score job
  echo "🎯 Step 1: Scoring..."
  SCORE_RESULT=$(node score-job.js "$JOB" "$PROFILE")
  SCORE=$(echo $SCORE_RESULT | jq -r '.score')
  
  echo "   Score: $SCORE/100"
  echo ""
  
  # Step 2: Update database with score
  echo "💾 Step 2: Saving score to database..."
  node db-helpers.js update-score "$JOB_ID" "$SCORE_RESULT"
  echo "   ✅ Score saved"
  echo ""
  
  # Step 3: If high score, generate CV
  if [ "$SCORE" -ge 75 ]; then
    echo "🎉 HIGH SCORE! Generating documents..."
    echo ""
    
    MATCHED_SKILLS=$(echo $SCORE_RESULT | jq -c '.matched_skills')
    
    # Generate CV
    echo "📝 Step 3a: Generating CV..."
    CV_OUTPUT=$(node generate-cv.js cv "$JOB" "$PROFILE" "$MATCHED_SKILLS" 2>&1)
    
    if echo "$CV_OUTPUT" | grep -q "CV START"; then
      echo "   ✅ CV generated ($(echo "$CV_OUTPUT" | wc -l) lines)"
      
      # Save CV
      mkdir -p ~/storage/jobs/job_${JOB_ID}
      echo "$CV_OUTPUT" | sed -n '/CV START/,/CV END/p' | sed '1d;$d' > ~/storage/jobs/job_${JOB_ID}/cv.md
      echo "   💾 Saved to: ~/storage/jobs/job_${JOB_ID}/cv.md"
    else
      echo "   ❌ CV generation failed"
      echo "$CV_OUTPUT" | head -20
    fi
    echo ""
    
    # Generate cover letter
    echo "✉️ Step 3b: Generating cover letter..."
    LETTER_OUTPUT=$(node generate-cv.js letter "$JOB" "$PROFILE" "$MATCHED_SKILLS" 2>&1)
    
    if echo "$LETTER_OUTPUT" | grep -q "COVER LETTER START"; then
      echo "   ✅ Cover letter generated"
      
      # Save letter
      echo "$LETTER_OUTPUT" | sed -n '/COVER LETTER START/,/COVER LETTER END/p' | sed '1d;$d' > ~/storage/jobs/job_${JOB_ID}/cover-letter.txt
      echo "   💾 Saved to: ~/storage/jobs/job_${JOB_ID}/cover-letter.txt"
    else
      echo "   ❌ Cover letter failed"
    fi
    echo ""
    
  else
    echo "📊 Score below threshold (75), skipping document generation"
    echo ""
  fi
  
  echo ""
  sleep 2  # Rate limiting
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ WORKFLOW TEST COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
sudo -u postgres psql job_automation -c "
SELECT 
  status,
  COUNT(*) as count,
  ROUND(AVG(ai_score), 1) as avg_score
FROM jobs 
GROUP BY status;"

echo ""
echo "🎯 High-scoring jobs:"
sudo -u postgres psql job_automation -c "
SELECT title, company, ai_score 
FROM jobs 
WHERE ai_score >= 75 
ORDER BY ai_score DESC;"

echo ""
echo "📁 Generated documents:"
ls -lh ~/storage/jobs/ 2>/dev/null || echo "No documents yet"
