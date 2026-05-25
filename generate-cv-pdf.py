#!/usr/bin/env python3
"""
Professional ATS-Optimized CV Generator
"""

import sys
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY

ACCENT_COLOR = HexColor('#2C5F7C')
TEXT_COLOR = HexColor('#1A1A1A')
LIGHT_GRAY = HexColor('#E8E8E8')

class CVGenerator:
    def __init__(self, output_path, profile_data, job_data):
        self.output_path = output_path
        self.profile = profile_data
        self.job = job_data
        self.doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        self.story = []
        self.styles = self._create_styles()
    
    def _create_styles(self):
        styles = getSampleStyleSheet()
        
        styles.add(ParagraphStyle(
            name='CVName',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=24,
            textColor=ACCENT_COLOR,
            spaceAfter=6,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='CVHeadline',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=12,
            textColor=TEXT_COLOR,
            spaceAfter=12,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='CVContact',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=TEXT_COLOR,
            spaceAfter=20,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='CVSection',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            textColor=ACCENT_COLOR,
            spaceBefore=16,
            spaceAfter=8,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='CVJobTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            textColor=TEXT_COLOR,
            spaceAfter=2,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='CVJobMeta',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=HexColor('#4A4A4A'),
            spaceAfter=6,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='CVBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            leading=14
        ))
        
        styles.add(ParagraphStyle(
            name='CVBullet',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=4,
            leftIndent=20,
            bulletIndent=10,
            alignment=TA_LEFT,
            leading=13
        ))
        
        return styles
    
    def _add_header(self):
        name = Paragraph(self.profile.get('full_name', 'Name Not Provided'), 
                        self.styles['CVName'])
        self.story.append(name)
        
        headline = self.profile.get('headline', '')
        if headline:
            self.story.append(Paragraph(headline, self.styles['CVHeadline']))
        
        contact_parts = []
        if self.profile.get('email'):
            contact_parts.append(self.profile['email'])
        if self.profile.get('phone'):
            contact_parts.append(self.profile['phone'])
        if self.profile.get('location'):
            contact_parts.append(self.profile['location'])
        
        if contact_parts:
            contact_text = ' • '.join(contact_parts)
            self.story.append(Paragraph(contact_text, self.styles['CVContact']))
        
        self._add_divider()
    
    def _add_divider(self):
        divider = Table([['']], colWidths=[6.5*inch])
        divider.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, -1), 1, LIGHT_GRAY),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        self.story.append(divider)
        self.story.append(Spacer(1, 8))
    
    def _add_section(self, title):
        self.story.append(Paragraph(title.upper(), self.styles['CVSection']))
    
    def _add_summary(self):
        summary = self.profile.get('summary', '')
        if summary:
            self._add_section('Professional Summary')
            self.story.append(Paragraph(summary, self.styles['CVBody']))
            self.story.append(Spacer(1, 6))
    
    def _add_experience(self):
        experience = self.profile.get('work_experience', [])
        if not experience:
            return
        
        self._add_section('Experience')
        
        for job in experience:
            title = job.get('title', 'Position')
            company = job.get('company', 'Company')
            title_text = f"<b>{title}</b> – {company}"
            self.story.append(Paragraph(title_text, self.styles['CVJobTitle']))
            
            date_parts = []
            if job.get('start_date'):
                end = job.get('end_date', 'Present')
                date_parts.append(f"{job['start_date']} – {end}")
            if job.get('location'):
                date_parts.append(job['location'])
            
            if date_parts:
                self.story.append(Paragraph(' • '.join(date_parts), 
                                           self.styles['CVJobMeta']))
            
            description = job.get('description', '')
            if description:
                self.story.append(Paragraph(description, self.styles['CVBody']))
            
            achievements = job.get('achievements', [])
            if achievements:
                for achievement in achievements:
                    bullet_text = f"• {achievement}"
                    self.story.append(Paragraph(bullet_text, self.styles['CVBullet']))
            
            self.story.append(Spacer(1, 10))
    
    def _add_education(self):
        education = self.profile.get('education', [])
        if not education:
            return
        
        self._add_section('Education')
        
        for edu in education:
            degree = edu.get('degree', 'Degree')
            institution = edu.get('institution', 'Institution')
            edu_text = f"<b>{degree}</b> – {institution}"
            self.story.append(Paragraph(edu_text, self.styles['CVJobTitle']))
            
            date_parts = []
            if edu.get('graduation_year'):
                date_parts.append(f"Graduated {edu['graduation_year']}")
            if edu.get('location'):
                date_parts.append(edu['location'])
            
            if date_parts:
                self.story.append(Paragraph(' • '.join(date_parts), 
                                           self.styles['CVJobMeta']))
            
            if edu.get('gpa'):
                self.story.append(Paragraph(f"GPA: {edu['gpa']}", 
                                           self.styles['CVBody']))
            
            self.story.append(Spacer(1, 8))
    
    def _add_skills(self):
        skills = self.profile.get('technical_skills', {})
        if not skills:
            return
        
        self._add_section('Skills')
        
        if isinstance(skills, dict):
            for category, skill_list in skills.items():
                if skill_list:
                    skill_text = f"<b>{category.replace('_', ' ').title()}:</b> {', '.join(skill_list)}"
                    self.story.append(Paragraph(skill_text, self.styles['CVBody']))
        elif isinstance(skills, list):
            skill_text = ', '.join(skills)
            self.story.append(Paragraph(skill_text, self.styles['CVBody']))
        
        self.story.append(Spacer(1, 6))
    
    def _add_certifications(self):
        certifications = self.profile.get('certifications', [])
        if not certifications:
            return
        
        self._add_section('Certifications')
        
        for cert in certifications:
            if isinstance(cert, dict):
                cert_name = cert.get('name', '')
                cert_year = cert.get('year', '')
                cert_text = f"• {cert_name}"
                if cert_year:
                    cert_text += f" ({cert_year})"
            else:
                cert_text = f"• {cert}"
            
            self.story.append(Paragraph(cert_text, self.styles['CVBullet']))
        
        self.story.append(Spacer(1, 6))
    
    def _add_projects(self):
        projects = self.profile.get('projects', [])
        if not projects:
            return
        
        self._add_section('Notable Projects')
        
        for project in projects:
            if isinstance(project, dict):
                proj_name = project.get('name', 'Project')
                proj_desc = project.get('description', '')
                
                self.story.append(Paragraph(f"<b>{proj_name}</b>", 
                                           self.styles['CVJobTitle']))
                if proj_desc:
                    self.story.append(Paragraph(proj_desc, self.styles['CVBody']))
            else:
                self.story.append(Paragraph(f"• {project}", self.styles['CVBullet']))
            
            self.story.append(Spacer(1, 6))
    
    def generate(self):
        self._add_header()
        self._add_summary()
        self._add_experience()
        self._add_education()
        self._add_skills()
        self._add_certifications()
        self._add_projects()
        
        def add_page_number(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(HexColor('#808080'))
            page_num = canvas.getPageNumber()
            text = f"Page {page_num}"
            canvas.drawRightString(7.75*inch, 0.5*inch, text)
            canvas.restoreState()
        
        self.doc.build(self.story, onFirstPage=add_page_number, 
                      onLaterPages=add_page_number)
        
        return self.output_path


def main():
    if len(sys.argv) != 4:
        print("Usage: generate-cv-pdf.py <output.pdf> <profile.json> <job.json>")
        sys.exit(1)
    
    output_path = sys.argv[1]
    profile_path = sys.argv[2]
    job_path = sys.argv[3]
    
    with open(profile_path, 'r') as f:
        profile_data = json.load(f)
    
    with open(job_path, 'r') as f:
        job_data = json.load(f)
    
    generator = CVGenerator(output_path, profile_data, job_data)
    generator.generate()
    
    print(f"✅ CV generated: {output_path}")


if __name__ == '__main__':
    main()
