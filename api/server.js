const express = require('express');
const { exec } = require('child_process');
const { writeFileSync, unlinkSync } = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'job-automation-api' });
});

// FAST REGEX-BASED PARSING (no Ollama)
app.post('/api/parse-email', (req, res) => {
  const { emailBody } = req.body;

  if (!emailBody) {
    return res.status(400).json({ 
      success: false, 
      error: 'emailBody is required' 
    });
  }

  try {
    // Extract LinkedIn job URLs
    const urlRegex = /https?:\/\/(?:www\.)?linkedin\.com\/jobs\/view\/\d+[^\s]*/gi;
    const urls = [...new Set(emailBody.match(urlRegex) || [])];

    const jobs = urls.map(url => {
      // Find text around URL for context
      const urlIndex = emailBody.indexOf(url);
      const before = emailBody.substring(Math.max(0, urlIndex - 300), urlIndex);
      
      // Extract lines before URL
      const lines = before.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 5);
      
      // Try to find title (usually last non-empty line before URL)
      let title = 'Job Opening';
      let company = '';
      let location = '';
      
      if (lines.length > 0) {
        title = lines[lines.length - 1].replace(/[•·\-–—]/g, '').trim();
      }
      
      // Look for company/location patterns
      for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
        const line = lines[i];
        if (line.includes(' at ')) {
          const parts = line.split(' at ');
          title = parts[0].trim();
          company = parts[1].trim();
        }
        if (line.match(/remote|hybrid|on-site/i)) {
          location = line.trim();
        }
      }

      return {
        title: title.substring(0, 200),
        company: company.substring(0, 100),
        location: location.substring(0, 100),
        url: url.split('?')[0] // Clean URL
      };
    });

    res.json({
      success: true,
      jobs: jobs,
      count: jobs.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Fetch job endpoint
app.post('/api/fetch-job', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'url required' });
  }
  const command = `node /home/marcos/job-bot/fetch-linkedin-job.js "${url}"`;
  exec(command, { timeout: 30000 }, (error, stdout) => {
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    try {
      res.json(JSON.parse(stdout));
    } catch (e) {
      res.status(500).json({ success: false, error: 'Parse failed' });
    }
  });
});

// Score job endpoint
app.post('/api/score-job', (req, res) => {
  const { job, profile } = req.body;
  if (!job || !profile) {
    return res.status(400).json({ success: false, error: 'job and profile required' });
  }
  const tempJob = `/tmp/job-${Date.now()}.json`;
  const tempProfile = `/tmp/profile-${Date.now()}.json`;
  try {
    writeFileSync(tempJob, JSON.stringify(job));
    writeFileSync(tempProfile, JSON.stringify(profile));
    const command = `/home/marcos/job-bot/score-job.sh "${tempJob}" "${tempProfile}"`;
    exec(command, { timeout: 120000 }, (error, stdout) => {
      try { unlinkSync(tempJob); unlinkSync(tempProfile); } catch(e) {}
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      try {
        res.json({ success: true, ...JSON.parse(stdout.trim()) });
      } catch (e) {
        res.status(500).json({ success: false, error: 'Parse failed' });
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Job Automation API running on port ${PORT}`);
});
