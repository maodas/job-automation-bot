#!/bin/bash
echo "=========================================="
echo "FINAL SYSTEM VERIFICATION"
echo "=========================================="
echo ""

FAILED=0

echo "1. Checking cron schedule..."
CRON_COUNT=$(crontab -l | grep "run-automation.sh" | grep -v "^#" | wc -l)
if [ "$CRON_COUNT" -eq 3 ]; then
  echo "   ✅ 3 cron jobs scheduled"
else
  echo "   ❌ FAIL: Expected 3 cron jobs, found $CRON_COUNT"
  FAILED=1
fi

echo "2. Checking .env loading..."
for script in process-jobs.js score-job.js google-sheets-sync.js; do
  if grep -q "dotenv" "$script"; then
    echo "   ✅ $script loads .env"
  else
    echo "   ❌ FAIL: $script missing .env"
    FAILED=1
  fi
done

echo "3. Checking .env file..."
if [ -f .env ]; then
  for var in ANTHROPIC_API_KEY GOOGLE_SHEETS_ID TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID; do
    if grep -q "^$var=" .env; then
      echo "   ✅ $var in .env"
    else
      echo "   ❌ FAIL: $var missing from .env"
      FAILED=1
    fi
  done
else
  echo "   ❌ FAIL: .env file not found"
  FAILED=1
fi

echo "4. Checking file server..."
if sudo systemctl is-active file-server >/dev/null 2>&1; then
  echo "   ✅ File server running"
else
  echo "   ❌ FAIL: File server not running"
  FAILED=1
fi

echo "5. Checking database..."
if sudo -u postgres psql job_automation -c "SELECT 1" >/dev/null 2>&1; then
  echo "   ✅ Database accessible"
else
  echo "   ❌ FAIL: Cannot access database"
  FAILED=1
fi

echo "6. Checking last automation run..."
if tail -1 logs/automation.log | grep -q "Completed successfully"; then
  echo "   ✅ Last run succeeded"
else
  echo "   ❌ FAIL: Last run did not complete"
  FAILED=1
fi

echo "7. Running workflow test..."
./run-automation.sh > /dev/null 2>&1
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "   ✅ Workflow test passed (exit code 0)"
else
  echo "   ❌ FAIL: Workflow exited with code $EXIT_CODE"
  FAILED=1
fi

echo ""
echo "=========================================="
if [ $FAILED -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED"
  echo "System ready for automatic operation"
  echo "Next run: 7 AM Guatemala (13:00 UTC)"
  echo "GO TO SLEEP NOW."
else
  echo "❌ SOME CHECKS FAILED"
  echo "FIX ISSUES ABOVE BEFORE SLEEPING"
fi
echo "=========================================="
