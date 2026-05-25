#!/usr/bin/env python3
"""
Professional ATS-Optimized Cover Letter Generator
"""

import sys
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY

ACCENT_COLOR = HexColor('#2C5F7C')
TEXT_COLOR = HexColor('#1A1A1A')

class CoverLetterGenerator:
    def __init__(self, output_path, profile_data, job_data, letter_content):
        self.output_path = output_path
        self.profile = profile_data
        self.job = job_data
        self.letter_content = letter_content
        self.doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=1*inch,
            leftMargin=1*inch,
            topMargin=1*inch,
            bottomMargin=1*inch
        )
        self.story = []
        self.styles = self._create_styles()
    
    def _create_styles(self):
        styles = getSampleStyleSheet()
        
        styles.add(ParagraphStyle(
            name='SenderName',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=ACCENT_COLOR,
            spaceAfter=2,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='SenderContact',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=TEXT_COLOR,
            spaceAfter=20,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='LetterDate',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=20,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='Recipient',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=20,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='Subject',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=16,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='Salutation',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=12,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='LetterBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=12,
            alignment=TA_JUSTIFY,
            leading=14
        ))
        
        styles.add(ParagraphStyle(
            name='Closing',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=40,
            alignment=TA_LEFT
        ))
        
        styles.add(ParagraphStyle(
            name='Signature',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=0,
            alignment=TA_LEFT
        ))
        
        return styles
    
    def _add_header(self):
        name = Paragraph(self.profile.get('full_name', 'Name Not Provided'), 
                        self.styles['SenderName'])
        self.story.append(name)
        
        contact_parts = []
        if self.profile.get('email'):
            contact_parts.append(self.profile['email'])
        if self.profile.get('phone'):
            contact_parts.append(self.profile['phone'])
        if self.profile.get('location'):
            contact_parts.append(self.profile['location'])
        
        if contact_parts:
            contact_text = ' • '.join(contact_parts)
            self.story.append(Paragraph(contact_text, self.styles['SenderContact']))
    
    def _add_date(self):
        today = datetime.now().strftime("%B %d, %Y")
        self.story.append(Paragraph(today, self.styles['LetterDate']))
    
    def _add_recipient(self):
        company = self.job.get('company', 'Hiring Manager')
        
        recipient_lines = [
            "Hiring Manager",
            company
        ]
        
        if self.job.get('location'):
            recipient_lines.append(self.job['location'])
        
        recipient_text = '<br/>'.join(recipient_lines)
        self.story.append(Paragraph(recipient_text, self.styles['Recipient']))
    
    def _add_subject(self):
        job_title = self.job.get('title', 'Position')
        subject = f"RE: Application for {job_title}"
        self.story.append(Paragraph(subject, self.styles['Subject']))
    
    def _add_salutation(self):
        salutation = "Dear Hiring Manager,"
        self.story.append(Paragraph(salutation, self.styles['Salutation']))
    
    def _add_body(self):
        paragraphs = self.letter_content.split('\n\n')
        
        for para in paragraphs:
            para = para.strip()
            if para and not para.startswith('Dear') and not para.startswith('Sincerely'):
                para = para.replace('**', '')
                para = para.replace('*', '')
                self.story.append(Paragraph(para, self.styles['LetterBody']))
    
    def _add_closing(self):
        closing = Paragraph("Sincerely,", self.styles['Closing'])
        self.story.append(closing)
        
        name = self.profile.get('full_name', 'Name Not Provided')
        signature = Paragraph(name, self.styles['Signature'])
        self.story.append(signature)
    
    def generate(self):
        self._add_header()
        self._add_date()
        self._add_recipient()
        self._add_subject()
        self._add_salutation()
        self._add_body()
        self._add_closing()
        
        self.doc.build(self.story)
        
        return self.output_path


def main():
    if len(sys.argv) != 5:
        print("Usage: generate-cover-letter-pdf.py <output.pdf> <profile.json> <job.json> <letter.txt>")
        sys.exit(1)
    
    output_path = sys.argv[1]
    profile_path = sys.argv[2]
    job_path = sys.argv[3]
    letter_path = sys.argv[4]
    
    with open(profile_path, 'r') as f:
        profile_data = json.load(f)
    
    with open(job_path, 'r') as f:
        job_data = json.load(f)
    
    with open(letter_path, 'r') as f:
        letter_content = f.read()
    
    generator = CoverLetterGenerator(output_path, profile_data, job_data, letter_content)
    generator.generate()
    
    print(f"✅ Cover letter generated: {output_path}")


if __name__ == '__main__':
    main()
