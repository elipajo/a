const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();

app.use(cors());

// Root test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Valorant API is running (scraper version)', status: 'ok' });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Scrape Tracker.gg public profile
app.get('/valorant', async (req, res) => {
  const { username, tagline } = req.query;

  if (!username || !tagline) {
    return res.status(400).json({ error: 'Missing username or tagline' });
  }

  const riotID = encodeURIComponent(`${username}#${tagline}`);
  const url = `https://tracker.gg/valorant/profile/riot/${riotID}/overview`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Simulate real browser
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to extract key stats
    const statBlock = $('.trn-defstat__name:contains("K/D Ratio")').closest('.trn-defstat');
    const kd = statBlock.find('.trn-defstat__value').text().trim() || null;

    const hsBlock = $('.trn-defstat__name:contains("Headshot %")').closest('.trn-defstat');
    const headshots = hsBlock.find('.trn-defstat__value').text().trim() || null;

    const winBlock = $('.trn-defstat__name:contains("Win %")').closest('.trn-defstat');
    const winRate = winBlock.find('.trn-defstat__value').text().trim() || null;

    const rank = $('.rating-entry__rank-info span').first().text().trim() || null;

    res.json({
      kdr: kd,
      headshots: headshots,
      winRate: winRate,
      rank: rank
    });
  } catch (err) {
    console.error('Scrape error:', err.message);
    res.status(500).json({ error: 'Failed to scrape profile', details: err.message });
  }
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000 and accessible at 0.0.0.0');
});

