# Job Automation Bot

Automated job application system for parsing LinkedIn alerts, scoring jobs, and generating tailored CVs.

## 🎯 Features

- **Email Parsing**: Automatically extracts job postings from LinkedIn email alerts
- **Job Fetching**: Uses Playwright to scrape full job details from LinkedIn
- **AI Scoring**: Ollama (llama3) scores job matches 0-100 based on your profile
- **CV Generation**: Claude API generates tailored CVs and cover letters
- **Status Tracking**: PostgreSQL database tracks all applications

## 🛠️ Tech Stack

- **Orchestration**: n8n workflows
- **Database**: PostgreSQL
- **AI Models**: 
  - Ollama (llama3) for scoring and parsing
  - Claude API (Haiku 4.5) for document generation
- **Automation**: Playwright for browser automation
- **Infrastructure**: GCP e2-standard-2 VM

## 👤 Author

**Marcos Rodas**  
Product Manager & Full-Stack Developer

## 📄 License

Private - Logox Internal Project
