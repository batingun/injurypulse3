// lib/scrapers.js
// Transfermarkt + BasketNews scrapers for injury & suspension data

import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ─── TRANSFERMARKT: Injuries ───
// URL format: https://www.transfermarkt.com/laliga/verletzte/wettbewerb/ES1
const TM_INJURY_URLS = {
  laliga: 'https://www.transfermarkt.com/laliga/verletzte/wettbewerb/ES1',
  seriea: 'https://www.transfermarkt.com/serie-a/verletzte/wettbewerb/IT1',
  bundesliga: 'https://www.transfermarkt.com/bundesliga/verletzte/wettbewerb/L1',
};

// ─── TRANSFERMARKT: Suspensions ───
const TM_SUSPENSION_URLS = {
  laliga: 'https://www.transfermarkt.com/laliga/sperrenausfaelle/wettbewerb/ES1',
  seriea: 'https://www.transfermarkt.com/serie-a/sperrenausfaelle/wettbewerb/IT1',
  bundesliga: 'https://www.transfermarkt.com/bundesliga/sperrenausfaelle/wettbewerb/L1',
};

// ─── TRANSFERMARKT: Risk of suspension (yellow card accumulation) ───
const TM_RISK_URLS = {
  laliga: 'https://www.transfermarkt.com/laliga/gelbesperren/wettbewerb/ES1',
  seriea: 'https://www.transfermarkt.com/serie-a/gelbesperren/wettbewerb/IT1',
  bundesliga: 'https://www.transfermarkt.com/bundesliga/gelbesperren/wettbewerb/L1',
};

async function fetchPage(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message);
    return null;
  }
}

export async function scrapeTransfermarktInjuries(leagueKey) {
  const url = TM_INJURY_URLS[leagueKey];
  if (!url) return [];

  const html = await fetchPage(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const injuries = [];

  $('table.items tbody tr').each((_, row) => {
    const $row = $(row);
    const playerName = $row.find('td.hauptlink a').first().text().trim();
    const team = $row.find('td:nth-child(2) img').attr('title') || 
                 $row.find('td:nth-child(2) a').text().trim();
    const position = $row.find('td:nth-child(1)').next().text().trim();
    const injury = $row.find('td.hauptlink').next().text().trim() ||
                   $row.find('.verletzungsbox').text().trim();
    const returnDate = $row.find('td:last-child').text().trim();

    if (playerName) {
      injuries.push({
        name: playerName,
        team: team,
        position: position,
        injury: injury,
        returnDate: returnDate,
        status: 'injured',
        source: 'transfermarkt',
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  return injuries;
}

export async function scrapeTransfermarktSuspensions(leagueKey) {
  const url = TM_SUSPENSION_URLS[leagueKey];
  if (!url) return [];

  const html = await fetchPage(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const suspensions = [];

  $('table.items tbody tr').each((_, row) => {
    const $row = $(row);
    const playerName = $row.find('td.hauptlink a').first().text().trim();
    const team = $row.find('td:nth-child(2) img').attr('title') ||
                 $row.find('td:nth-child(2) a').text().trim();
    const reason = $row.find('td:nth-child(4)').text().trim();
    const remainingMatches = $row.find('td:nth-child(5)').text().trim();

    if (playerName) {
      suspensions.push({
        name: playerName,
        team: team,
        reason: reason,
        remainingMatches: remainingMatches,
        status: 'suspended',
        source: 'transfermarkt',
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  return suspensions;
}

export async function scrapeTransfermarktCardRisk(leagueKey) {
  const url = TM_RISK_URLS[leagueKey];
  if (!url) return [];

  const html = await fetchPage(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const atRisk = [];

  $('table.items tbody tr').each((_, row) => {
    const $row = $(row);
    const playerName = $row.find('td.hauptlink a').first().text().trim();
    const team = $row.find('td:nth-child(2) img').attr('title') ||
                 $row.find('td:nth-child(2) a').text().trim();
    const yellowCards = $row.find('td:nth-child(4)').text().trim();
    const cardLimit = $row.find('td:nth-child(5)').text().trim();

    if (playerName) {
      atRisk.push({
        name: playerName,
        team: team,
        yellowCards: parseInt(yellowCards) || 0,
        cardLimit: parseInt(cardLimit) || 5,
        status: 'at_risk',
        source: 'transfermarkt',
        scrapedAt: new Date().toISOString(),
      });
    }
  });

  return atRisk;
}

// ─── BASKETNEWS: EuroLeague Injuries ───
export async function scrapeBasketNewsInjuries() {
  const url = 'https://basketnews.com/leagues/25-euroleague/injured.html';
  const html = await fetchPage(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const injuries = [];

  // BasketNews injury report page structure
  $('.injury-report-team, .team-injury-block, [class*="injury"]').each((_, block) => {
    const $block = $(block);
    const teamName = $block.find('.team-name, h3, h4').first().text().trim();

    $block.find('.player-row, .injury-player, tr').each((_, playerEl) => {
      const $p = $(playerEl);
      const name = $p.find('.player-name, td:first-child a').first().text().trim();
      const injury = $p.find('.injury-type, .injury-info, td:nth-child(2)').text().trim();
      const status = $p.find('.status, .injury-status, td:nth-child(3)').text().trim();
      const returnInfo = $p.find('.return-date, td:nth-child(4)').text().trim();

      if (name) {
        injuries.push({
          name,
          team: teamName,
          injury: injury || 'Undisclosed',
          status: status.toLowerCase().includes('out') ? 'injured' :
                  status.toLowerCase().includes('doubtful') || status.toLowerCase().includes('gtd') ? 'doubtful' : 'injured',
          returnInfo,
          source: 'basketnews',
          scrapedAt: new Date().toISOString(),
        });
      }
    });
  });

  return injuries;
}

// ─── EUROLEAGUE OFFICIAL: Weekly Injury Report ───
export async function scrapeEuroleagueOfficial() {
  // EuroLeague.net publishes weekly injury reports
  const url = 'https://www.euroleaguebasketball.net/en/euroleague/news/?query=injury+report';
  const html = await fetchPage(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const reports = [];

  // Get the latest injury report article link
  const latestLink = $('a[href*="injury-report"]').first().attr('href');
  if (latestLink) {
    const fullUrl = latestLink.startsWith('http') ? latestLink : `https://www.euroleaguebasketball.net${latestLink}`;
    const reportHtml = await fetchPage(fullUrl);
    if (reportHtml) {
      const $report = cheerio.load(reportHtml);
      // Extract text content for parsing
      const bodyText = $report('.article-body, .news-body, main').text();
      reports.push({
        content: bodyText.substring(0, 5000), // Limit
        url: fullUrl,
        scrapedAt: new Date().toISOString(),
      });
    }
  }

  return reports;
}

// ─── MASTER SCRAPE FUNCTION ───
export async function scrapeAll() {
  const results = {
    timestamp: new Date().toISOString(),
    football: {},
    basketball: { euroleague: [] },
    errors: [],
  };

  // Football leagues
  for (const league of ['laliga', 'seriea', 'bundesliga']) {
    try {
      const [injuries, suspensions, cardRisk] = await Promise.all([
        scrapeTransfermarktInjuries(league),
        scrapeTransfermarktSuspensions(league),
        scrapeTransfermarktCardRisk(league),
      ]);

      results.football[league] = {
        injuries,
        suspensions,
        cardRisk,
        lastUpdated: new Date().toISOString(),
      };
    } catch (err) {
      results.errors.push({ league, error: err.message });
    }

    // Rate limiting - wait between leagues
    await new Promise(r => setTimeout(r, 2000));
  }

  // EuroLeague
  try {
    const [basketNewsData, euroleagueOfficial] = await Promise.all([
      scrapeBasketNewsInjuries(),
      scrapeEuroleagueOfficial(),
    ]);

    results.basketball.euroleague = {
      injuries: basketNewsData,
      officialReport: euroleagueOfficial,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    results.errors.push({ league: 'euroleague', error: err.message });
  }

  return results;
}
