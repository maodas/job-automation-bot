const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

async function createNotifications() {
  // Get jobs scored >= 75 that need notification
  const result = await pool.query(`
    SELECT id, title, company, ai_score, source_url, created_at
    FROM jobs 
    WHERE ai_score >= 75 
    AND created_at::date = CURRENT_DATE
    ORDER BY ai_score DESC
  `);
  
  if (result.rows.length === 0) {
    console.log('No high-scoring jobs today');
    return;
  }
  
  const notifications = result.rows.map(job => ({
    job_id: job.id,
    title: job.title,
    company: job.company,
    score: job.ai_score,
    source_url: job.source_url
  }));
  
  // Save notifications
  const notifDir = path.join(__dirname, 'notifications');
  fs.mkdirSync(notifDir, { recursive: true });
  
  const notifPath = path.join(notifDir, 'pending.json');
  fs.writeFileSync(notifPath, JSON.stringify(notifications, null, 2));
  
  console.log(`✅ Created ${notifications.length} notification(s)`);
  
  await pool.end();
}

createNotifications().catch(console.error);
