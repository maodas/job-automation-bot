#!/usr/bin/env node

/**
 * Simplifies profile data for Claude API calls
 * Keeps only relevant experience based on job requirements
 */

function simplifyProfile(profile, jobData) {
  // Extract key terms from job title and description
  const jobText = `${jobData.title} ${jobData.description || ''}`.toLowerCase();
  
  // Keywords that indicate relevance
  const keywords = {
    product: ['product', 'pm', 'roadmap', 'strategy', 'stakeholder'],
    technical: ['developer', 'engineer', 'code', 'api', 'software'],
    automation: ['automation', 'workflow', 'n8n', 'integration'],
    management: ['manager', 'lead', 'coordinate', 'team'],
    data: ['data', 'analytics', 'sql', 'database']
  };
  
  // Score each work experience
  const scoredExperience = (profile.work_experience || []).map(exp => {
    const expText = `${exp.title} ${exp.description || ''} ${(exp.achievements || []).join(' ')}`.toLowerCase();
    
    let relevanceScore = 0;
    
    // Calculate relevance
    for (const [category, terms] of Object.entries(keywords)) {
      for (const term of terms) {
        if (jobText.includes(term) && expText.includes(term)) {
          relevanceScore += 2; // Strong match
        } else if (expText.includes(term)) {
          relevanceScore += 1; // Experience has the skill
        }
      }
    }
    
    return { ...exp, relevanceScore };
  });
  
  // Sort by relevance and take top 3
  const topExperiences = scoredExperience
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3)
    .map(exp => {
      // Simplify achievements to top 5
      const achievements = (exp.achievements || []).slice(0, 5);
      
      return {
        title: exp.title,
        company: exp.company,
        dates: exp.dates,
        description: exp.description,
        achievements
      };
    });
  
  // Build simplified profile
  return {
    full_name: profile.full_name,
    headline: profile.headline,
    location: profile.location,
    summary: profile.summary,
    target_roles: profile.target_roles,
    technical_skills: profile.technical_skills,
    work_experience: topExperiences,
    education: (profile.education || []).slice(0, 2), // Max 2 education entries
    min_salary_usd: profile.min_salary_usd
  };
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node simplify-profile.js <job-json> <profile-json>');
    process.exit(1);
  }
  
  try {
    const jobData = JSON.parse(args[0]);
    const profileData = JSON.parse(args[1]);
    
    const simplified = simplifyProfile(profileData, jobData);
    console.log(JSON.stringify(simplified, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { simplifyProfile };
