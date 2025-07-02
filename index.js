const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.json({ message: 'Valorant Puppeteer API running' });
});

app.get('/valorant', async (req, res) => {
  const { username, tagline } = req.query;

  if (!username || !tagline) {
    return res.status(400).json({ error: 'Missing username or tagline' });
  }

  const riotID = encodeURIComponent(`${username}#${tagline}`);
  const url = `https://tracker.gg/valorant/profile/riot/${riotID}/overview`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('.score__description, .trn-defstat__value', { timeout: 15000 });

    const data = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : null;
      };

      return {
        trackerScore: getText('.score__description') || null,
        kdr: getText('.trn-defstat__name:contains("K/D Ratio")')?.parentElement.querySelector('.trn-defstat__value')?.innerText || null,
        headshots: getText('.trn-defstat__name:contains("Headshot %")')?.parentElement.querySelector('.trn-defstat__value')?.innerText || null,
        winRate: getText('.trn-defstat__name:contains("Win %")')?.parentElement.querySelector('.trn-defstat__value')?.innerText || null,
        rank: getText('.rating-entry__rank-info .value') || null,
        matches: getText('.matches .value') || null
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Puppeteer error:', error.message);
    res.status(500).json({ error: 'Failed to scrape Tracker.gg', details: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
