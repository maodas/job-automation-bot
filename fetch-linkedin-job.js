const { chromium } = require('playwright');

async function fetchLinkedInJob(url) {
  console.error('Fetching:', url);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Navigate with timeout
    console.error('Navigating to page...');
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    
    // Wait for main content
    console.error('Waiting for content...');
    await page.waitForTimeout(3000);
    
    // Try clicking "Show more" button if it exists
    try {
      const showMoreBtn = page.locator('button.show-more-less-html__button--more, button:has-text("Show more")').first();
      if (await showMoreBtn.isVisible({ timeout: 2000 })) {
        console.error('Clicking "Show more" button...');
        await showMoreBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // Button not found, continue
      console.error('No "Show more" button found');
    }
    
    // Extract job details with multiple selector fallbacks
    console.error('Extracting job details...');
    const jobDetails = await page.evaluate(() => {
      const getText = (selectors) => {
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el && el.innerText) return el.innerText.trim();
        }
        return '';
      };
      
      return {
        title: getText([
          'h1.t-24',
          'h1.job-details-jobs-unified-top-card__job-title',
          'h1.topcard__title',
          'h2.topcard__title',
          'h1'
        ]),
        company: getText([
          '.job-details-jobs-unified-top-card__company-name a',
          '.job-details-jobs-unified-top-card__company-name',
          'a.topcard__org-name-link',
          '.topcard__org-name-link',
          '.topcard__flavor'
        ]),
        location: getText([
          '.job-details-jobs-unified-top-card__bullet',
          '.job-details-jobs-unified-top-card__workplace-type',
          'span.topcard__flavor--bullet',
          '.topcard__flavor--bullet'
        ]),
        description: getText([
          '.jobs-description-content__text',
          '.jobs-description__content',
          '.description__text',
          'div.show-more-less-html__markup',
          '.description'
        ]),
        salary: getText([
          '.job-details-jobs-unified-top-card__job-insight-view-model-secondary',
          'span.compensation__salary',
          '.salary'
        ]),
        jobType: getText([
          '.job-details-jobs-unified-top-card__job-insight span',
          'span.job-criteria__text--criteria',
          '.job-criteria__text'
        ]),
        posted: getText([
          '.job-details-jobs-unified-top-card__posted-date',
          'span.posted-time-ago__text',
          '.posted-time-ago__text'
        ])
      };
    });
    
    await browser.close();
    
    console.error('Extraction complete');
    
    // Validate we got key fields
    if (!jobDetails.title) {
      throw new Error('Failed to extract job title');
    }
    
    if (!jobDetails.description || jobDetails.description.length < 50) {
      throw new Error('Failed to extract job description or description too short');
    }
    
    return {
      success: true,
      data: jobDetails,
      fetched_at: new Date().toISOString()
    };
    
  } catch (error) {
    await browser.close();
    console.error('Error details:', error.message);
    return {
      success: false,
      error: error.message,
      fallback: 'manual_paste_required'
    };
  }
}

// CLI execution
const url = process.argv[2];

if (!url) {
  console.error('Usage: node fetch-linkedin-job.js <linkedin-url>');
  process.exit(1);
}

fetchLinkedInJob(url)
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
