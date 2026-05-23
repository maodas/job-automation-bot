#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const STORAGE_DIR = '/home/marcos/storage/jobs';

const server = http.createServer((req, res) => {
  res.setTimeout(30000); // 30 second timeout
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const match = req.url.match(/\/download\/(job_[^\/]+)\/(cv|cover-letter)\.pdf/);
  
  if (!match) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>Job Bot File Server - Running</h1>');
    return;
  }
  
  const [, jobFolder, fileType] = match;
  const jobDir = path.join(STORAGE_DIR, jobFolder);
  
  if (!fs.existsSync(jobDir)) {
    res.writeHead(404);
    res.end('Job folder not found');
    return;
  }
  
  const files = fs.readdirSync(jobDir);
  const pattern = fileType === 'cv' ? /_CV\.pdf$/ : /_CoverLetter\.pdf$/;
  const actualFile = files.find(f => pattern.test(f));
  
  if (!actualFile) {
    res.writeHead(404);
    res.end('File not found in folder');
    return;
  }
  
  const filePath = path.join(jobDir, actualFile);
  
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${actualFile}"`,
    'Cache-Control': 'no-cache'
  });
  
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

server.timeout = 30000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`File server running on port ${PORT}`);
});
