UPDATE profiles SET
  full_name = 'Marcos Rodas',
  email = 'maodas00@gmail.com',
  phone = '+502 40154866',
  location = 'Guatemala City, Guatemala',
  timezone = 'America/Guatemala',
  
  headline = 'Project Coordinator & Full-Stack Developer — AI Automation & Digital Platforms',
  
  summary = 'Technical Project Coordinator with 7+ years designing and implementing automation solutions, AI integrations, and digital workflows in production environments. Proven track record building end-to-end automation using Python, Node.js, REST APIs, and LLM-based tools. Experienced managing full automation project lifecycles from requirements gathering through deployment. Background blends 15+ years of operations and commercial leadership with expertise in full-stack development, AI automation, and cloud infrastructure. Comfortable operating at the intersection of business operations and technical delivery.',
  
  target_roles = '[
    "Project Manager",
    "Product Manager", 
    "Technical Project Manager",
    "Technical Program Manager",
    "Automation Engineer",
    "Automation Consultant",
    "Business Support Analyst",
    "AI Solutions Specialist",
    "Full-Stack Developer",
    "Integration Engineer"
  ]'::jsonb,
  
  target_locations = '[
    "Remote",
    "Guatemala City",
    "Latin America",
    "United States (Remote)",
    "Canada (Remote)"
  ]'::jsonb,
  
  min_salary_usd = 2600,
  max_salary_usd = 6000,
  
  technical_skills = '{
    "languages": ["Python", "JavaScript", "Node.js", "TypeScript", "SQL", "PHP"],
    "frameworks": ["Next.js", "React", "Astro", "Express", "Tailwind CSS"],
    "automation": ["n8n", "Workflow Automation", "Process Optimization", "CI/CD", "Task Automation", "RPA Concepts"],
    "ai_llm": ["OpenAI API", "Claude API", "Prompt Engineering", "LLM Integration", "AI Agent Design", "Chatbot Development"],
    "apis_integration": ["REST API Design", "API Development", "Postman", "Webhook Integration", "System Integration"],
    "cloud_infrastructure": ["Google Cloud Platform", "Cloud Run", "Cloud Functions", "Firebase", "Docker", "Ubuntu Linux"],
    "databases": ["PostgreSQL", "MongoDB", "Firebase (NoSQL)", "Supabase", "SQL"],
    "data_analytics": ["Python Data Analysis", "Power BI", "Tableau", "Google Looker Studio", "Data Pipeline Design"],
    "devops": ["Git", "GitHub Actions", "CI/CD Pipelines", "Docker", "SSH", "Linux CLI"],
    "project_management": ["Agile", "Scrum", "Jira", "Confluence", "Sprint Planning", "Stakeholder Management", "Requirements Gathering"],
    "other": ["Technical Documentation", "API Testing", "Process Design", "Cybersecurity Fundamentals"]
  }'::jsonb,
  
  soft_skills = '[
    "Stakeholder Management",
    "Requirements Translation", 
    "Cross-functional Team Leadership",
    "Executive Communication",
    "Problem Solving",
    "Strategic Planning",
    "Analytical Thinking",
    "Bilingual Communication (Spanish/English)"
  ]'::jsonb,
  
  work_experience = '[
    {
      "title": "Project Coordinator — Digital Platforms",
      "company": "IOM (International Organization for Migration) — ROOTS Program",
      "location": "Guatemala City (Remote-capable)",
      "dates": "Jul 2024 – Present",
      "description": "Lead digital transformation initiatives for MINTRAB and IGM (Guatemalan government institutions) under USAID and U.S. Department of State funding.",
      "achievements": [
        "Led end-to-end automation projects from requirements gathering through production deployment",
        "Built AI-powered automation workflows using Python, Node.js, and OpenAI API",
        "Designed REST API integrations connecting multiple institutional systems",
        "Developed automated reporting and monitoring solutions with zero manual intervention",
        "Applied prompt engineering for data analysis and report generation using LLMs",
        "Configured CI/CD pipelines on GCP with Docker and Ubuntu Linux",
        "Presented automation ROI and project progress to USAID counterparts",
        "Managed Jira-based project tracking for cross-functional teams"
      ]
    },
    {
      "title": "Automation & AI Solutions Specialist",
      "company": "IOM — ROOTS Program (USAID / U.S. Dept. of State)",
      "location": "Guatemala City",
      "dates": "2022 – 2024",
      "description": "Identified, scoped, and led automation projects for Guatemalan government institutions.",
      "achievements": [
        "Built custom automation tools eliminating critical bottlenecks across Finance, Procurement, and Programmatic departments",
        "Ensured 100% project continuity in volatile regulatory environments",
        "Architected cost-efficient cloud solutions reducing infrastructure overhead",
        "Integrated generative AI into workflows improving output quality",
        "Documented all solutions in structured knowledge repositories"
      ]
    },
    {
      "title": "Project Assistant",
      "company": "IOM — ROOTS Program",
      "location": "Guatemala City",
      "dates": "Aug 2023 – Jul 2024",
      "description": "Promoted to Project Coordinator after one year based on impact digitizing workflows.",
      "achievements": [
        "Designed data-handling protocols reducing application processing times",
        "Created technical reports and dashboards for real-time KPI visualization"
      ]
    },
    {
      "title": "Operations Manager / Technical Lead",
      "company": "IDC Los Tres, S.A.",
      "location": "Guatemala City",
      "dates": "Feb 2012 – Aug 2023",
      "description": "Led automation of internal business processes over 10+ years.",
      "achievements": [
        "Reduced shipping errors by 30% through workflow re-engineering",
        "Integrated third-party platforms via APIs",
        "Built automated reporting pipelines for operational KPIs",
        "Managed multiple concurrent projects under Agile frameworks",
        "Served as liaison between business stakeholders and technical teams",
        "Maintained 100% operational uptime during peak-demand crises"
      ]
    },
    {
      "title": "Regional Sales Supervisor",
      "company": "Calzado Matrix de Guatemala",
      "location": "Guatemala",
      "dates": "Apr 2009 – Dec 2012",
      "description": "Managed regional commercial operations across 22 branches.",
      "achievements": [
        "Consistently exceeded revenue targets of Q2 million/month",
        "Increased individual store profitability up to Q250,000/month",
        "Mentored branch managers and standardized sales processes"
      ]
    }
  ]'::jsonb,
  
  education = '[
    {
      "degree": "Associate Degree in Software Development",
      "institution": "Universidad Galileo",
      "location": "Guatemala",
      "year": 2023,
      "status": "Completed"
    },
    {
      "degree": "Industrial Bachelor / Computer Technician",
      "institution": "Instituto Tecnológico Federico Taylor",
      "location": "Guatemala",
      "year": null,
      "status": "Completed"
    },
    {
      "degree": "B.S. in Administrative Engineering",
      "institution": "Universidad Galileo",
      "location": "Guatemala",
      "year": null,
      "status": "5th semester, currently paused"
    }
  ]'::jsonb,
  
  certifications = '[
    {
      "name": "Google Project Management Professional Certificate",
      "issuer": "Coursera",
      "year": 2023,
      "status": "Completed"
    },
    {
      "name": "Front-End Developer",
      "issuer": "Oracle Next Education / Alura",
      "year": 2023,
      "status": "Completed"
    },
    {
      "name": "Google Data Analytics Professional Certificate",
      "issuer": "Coursera",
      "year": 2024,
      "status": "In Progress"
    }
  ]'::jsonb,
  
  projects = '[
    {
      "name": "WhatsApp AI Chatbot",
      "status": "Active in Production",
      "description": "Full AI-powered conversational agent using n8n, Node.js, and OpenAI API. Handles multi-turn conversations, webhook triggers, automated escalation logic, and database integration.",
      "technologies": ["Python", "OpenAI", "Docker", "Celery", "PostgreSQL", "n8n"]
    },
    {
      "name": "Nutrissé GT D2C Platform",
      "status": "In Progress",
      "description": "End-to-end platform for nutrition clinic including landing page, e-commerce, multi-channel social funnel, WhatsApp automation, and appointment scheduling.",
      "technologies": ["Next.js", "Firebase", "n8n", "WhatsApp Business API"]
    },
    {
      "name": "Beneficiary Mass Messaging Platform",
      "status": "Completed",
      "description": "Segmented communication system with real-time delivery tracking and reporting for social programs.",
      "technologies": ["Node.js", "Twilio API", "Render"]
    },
    {
      "name": "Captive WiFi Portal",
      "status": "Completed",
      "description": "User data capture and authentication with real-time analytics and automated access code generation.",
      "technologies": ["Node.js", "Express", "MongoDB"]
    }
  ]'::jsonb,
  
  preferred_platforms = '["LinkedIn", "Indeed", "Remote OK", "WeWorkRemotely", "AngelList"]'::jsonb,
  
  blacklist_companies = '[]'::jsonb,
  
  auto_apply = false,
  require_approval_above_score = 75,
  
  updated_at = NOW()
  
WHERE id = (SELECT id FROM profiles LIMIT 1);
