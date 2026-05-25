#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3030;
const STORAGE_DIR = '/home/marcos/storage/jobs';

const server = http.createServer((req, res) => {
  res.setTimeout(30000);
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Match /jobs/job_X/cv.pdf or /jobs/job_X/cover_letter.pdf
  const match = req.url.match(/\/jobs\/(job_[^\/]+)\/(cv|cover_letter)\.pdf/);
  
  if (!match) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>Job Bot File Server - Running on port 3030</h1>');
    return;
  }
  
  const [, jobFolder, fileType] = match;
  const filePath = path.join(STORAGE_DIR, jobFolder, `${fileType}.pdf`);
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('File not found: ' + filePath);
    return;
  }
  
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${fileType}.pdf"`
  });
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`File server running on port ${PORT}`);
});
