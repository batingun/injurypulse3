// app/api/scrape/route.js
// POST: Manual trigger from UI button
// GET: Cron job trigger from Vercel

import { scrapeAll } from '../../../lib/scrapers';
import { setData } from '../../../lib/dataStore';

export const maxDuration = 60; // Allow up to 60s for scraping
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    console.log('[InjuryPulse] Manual scrape triggered');
    const data = await scrapeAll();
    setData(data);

    return Response.json({
      success: true,
      timestamp: data.timestamp,
      data: data,  // Send full scraped data to frontend
      summary: {
        football: Object.fromEntries(
          Object.entries(data.football || {}).map(([k, v]) => [k, {
            injuries: v.injured?.length || 0,
            suspensions: v.suspended?.length || 0,
            total: v.totalCount || v.all?.length || 0,
          }])
        ),
        euroleague: {
          injuries: data.basketball?.euroleague?.injuries?.length || 0,
        },
      },
      sources: data.sources || [],
      errors: data.errors,
    });
  } catch (error) {
    console.error('[InjuryPulse] Scrape failed:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET handler for Vercel Cron Jobs
export async function GET(request) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get('authorization');
  
  try {
    console.log('[InjuryPulse] Cron scrape triggered');
    const data = await scrapeAll();
    setData(data);

    return Response.json({
      success: true,
      trigger: 'cron',
      timestamp: data.timestamp,
      errors: data.errors,
    });
  } catch (error) {
    console.error('[InjuryPulse] Cron scrape failed:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
