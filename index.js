const express   = require('express');
const puppeteer = require('puppeteer');
const cors      = require('cors');

const app = express();
app.use(cors());

app.get('/valorant', async (req, res) => {
  const { username, tagline } = req.query;
  if (!username || !tagline) {
    return res.status(400).json({ error: 'Missing username or tagline' });
  }

  // build RiotID: spaces→%20, #→%23
  const safeUser = username.replace(/ /g, '%20');
  const riotID   = `${safeUser}%23${tagline}`;
  const url      = `https://tracker.gg/valorant/profile/riot/${riotID}/overview`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#__NEXT_DATA__', { timeout: 15000 });

    // Extract the Next.js data blob
    const nextData = await page.$eval(
      '#__NEXT_DATA__',
      el => JSON.parse(el.textContent)
    );

    const segments = nextData.props.pageProps.apiResponse.data.segments;
    const overview = segments.find(seg => seg.type === 'overview');
    const s        = overview.stats;
    const m        = overview.metadata;

    // Compute rank (upgrade Immortal >1000RR to Radiant)
    let name = m.rankName  || '';
    let rr   = m.rankValue || 0;
    if (name.toLowerCase().startsWith('immortal') && rr > 1000) {
      name = 'Radiant';
    }

    res.json({
      kdr:          s.kdratio?.value            ?? null,
      headshotPct:  (s.headshotPct?.value       ?? s.headshots?.value) ?? null,
      winPct:       s.winPercentage?.value      ?? null,
      roundWinPct:  s.roundWinPercentage?.value ?? null,
      rank:         `${name} ${rr}`,
      gamesPlayed:  s.matchesPlayed?.value      ?? s.matches?.value ?? null,
      trackerScore: s.score?.value              ?? null
    });
  } catch (err) {
    console.error('Scrape error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Proxy listening on port ${PORT}`);
});
