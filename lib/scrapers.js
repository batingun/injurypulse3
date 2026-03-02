// lib/scrapers.js
// Real data scrapers - sportsgambler.com (primary)
// Clean HTML, no heavy bot protection, structured tables

import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

const SPORTSGAMBLER_URLS = {
  laliga: 'https://www.sportsgambler.com/injuries/football/spain-la-liga/',
  seriea: 'https://www.sportsgambler.com/injuries/football/italy-serie-a/',
  bundesliga: 'https://www.sportsgambler.com/injuries/football/germany-bundesliga/',
};

// Normalize names for matching (remove accents)
function normalize(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.error(`[Scraper] Failed: ${url}`, err.message);
    return null;
  }
}

// Determine status from "Info" column text
function parseStatus(infoText) {
  const info = (infoText || '').toLowerCase();
  if (info.includes('yellow card') || info.includes('red card') || info.includes('2nd yellow') || info.includes('direct red') || info.includes('suspended') || info.includes('ban')) {
    const reason = (info.includes('red card') || info.includes('2nd yellow') || info.includes('direct red')) ? 'red_card' : 'yellow_accumulation';
    return { status: 'suspended', reason };
  }
  if (info.includes('doubtful') || info.includes('gtd') || info.includes('game-time')) {
    return { status: 'doubtful', reason: 'fitness' };
  }
  return { status: 'injured', reason: 'injury' };
}

// ─── SPORTSGAMBLER SCRAPER ───
export async function scrapeSportsGambler(leagueKey) {
  const url = SPORTSGAMBLER_URLS[leagueKey];
  if (!url) return [];

  const html = await fetchPage(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const players = [];
  let currentTeam = '';

  // Structure: h3 > a[team name], then rows with: Name | Pos | Matches | Goals | Assists | Info | Return
  $('h3').each((_, h3El) => {
    const teamName = $(h3El).find('a').first().text().trim();
    if (!teamName) return;
    currentTeam = teamName;

    // Collect all sibling elements until next h3
    let el = $(h3El).next();
    while (el.length && !el.is('h3')) {
      // Find table rows
      el.find('tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 4) return;
        
        const name = $(cells[0]).text().trim();
        const pos = $(cells[1]).text().trim();
        
        // Skip header rows
        if (!name || name === 'Name' || name === 'Type' || pos === 'Position') return;

        // Info and return date are in later columns
        let info = '', returnDate = '';
        if (cells.length >= 7) {
          info = $(cells[5]).text().trim();
          returnDate = $(cells[6]).text().trim();
        } else if (cells.length >= 6) {
          info = $(cells[4]).text().trim();
          returnDate = $(cells[5]).text().trim();
        }

        const { status, reason } = parseStatus(info);

        players.push({
          name,
          team: currentTeam,
          position: pos,
          info: info || 'Undisclosed',
          status,
          reason,
          returnDate: returnDate && returnDate !== '-' ? returnDate : null,
          source: 'sportsgambler.com',
          scrapedAt: new Date().toISOString(),
        });
      });
      
      el = el.next();
    }
  });

  return players;
}

// ─── BASKETNEWS EUROLEAGUE ───
export async function scrapeBasketNewsInjuries() {
  const url = 'https://basketnews.com/leagues/25-euroleague/injured.html';
  const html = await fetchPage(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const injuries = [];

  $('[class*="injury"], .team-block, article, .card').each((_, block) => {
    const $b = $(block);
    const teamName = $b.find('.team-name, h3, h4, .team-title').first().text().trim();

    $b.find('tr, .player-row, .player-item').each((_, row) => {
      const $r = $(row);
      const name = $r.find('td:first-child a, .player-name, .name').first().text().trim();
      const injury = $r.find('td:nth-child(2), .injury-type, .injury').text().trim();
      const statusText = $r.find('td:nth-child(3), .status').text().trim();

      if (name && name.length > 1 && name !== 'Name') {
        injuries.push({
          name,
          team: teamName || 'Unknown',
          injury: injury || 'Undisclosed',
          status: statusText.toLowerCase().includes('out') ? 'injured' :
                  statusText.toLowerCase().includes('doubtful') ? 'doubtful' : 'injured',
          source: 'basketnews',
          scrapedAt: new Date().toISOString(),
        });
      }
    });
  });

  return injuries;
}

// ─── MASTER SCRAPE ───
export async function scrapeAll() {
  const results = {
    timestamp: new Date().toISOString(),
    football: {},
    basketball: { euroleague: { injuries: [], lastUpdated: new Date().toISOString() } },
    errors: [],
    sources: [],
  };

  for (const league of ['laliga', 'seriea', 'bundesliga']) {
    try {
      const players = await scrapeSportsGambler(league);
      results.football[league] = {
        all: players,
        injured: players.filter(p => p.status === 'injured'),
        suspended: players.filter(p => p.status === 'suspended'),
        doubtful: players.filter(p => p.status === 'doubtful'),
        totalCount: players.length,
        lastUpdated: new Date().toISOString(),
      };
      results.sources.push(`sportsgambler.com/${league}`);
    } catch (err) {
      results.errors.push({ league, error: err.message });
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  try {
    const bball = await scrapeBasketNewsInjuries();
    results.basketball.euroleague = { injuries: bball, lastUpdated: new Date().toISOString() };
    if (bball.length > 0) results.sources.push('basketnews.com');
  } catch (err) {
    results.errors.push({ league: 'euroleague', error: err.message });
  }

  return results;
}
