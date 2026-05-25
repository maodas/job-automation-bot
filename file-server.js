#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const STORAGE_DIR = '/home/marcos/storage/jobs';

const server = http.createServer((req, res) => {
  res.setTimeout(30000);
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Decode the URL first!
  const decodedUrl = decodeURIComponent(req.url);
  
  // Match /jobs/job_X/any-filename.pdf
  const match = decodedUrl.match(/\/jobs\/(job_[^\/]+)\/(.+\.pdf)/);
  
  if (!match) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>Job Bot File Server - Running on port 8080</h1>');
    return;
  }
  
  const [, jobFolder, filename] = match;
  const filePath = path.join(STORAGE_DIR, jobFolder, filename);
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('File not found: ' + filePath);
    return;
  }
  
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${filename}"`
  });
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`File server running on port ${PORT}`);
});
