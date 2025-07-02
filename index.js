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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const stat = (label) =>
      $(`.value__wrapper:has(.label:contains("${label}")) .value`).first().text().trim();

    const kdr = stat("K/D Ratio");
    const headshots = stat("Headshot %");
    const winRate = stat("Win %");
    const rank = $('.rating-entry__rank-info .value').first().text().trim();

    res.json({
      kdr: kdr || null,
      headshots: headshots || null,
      winRate: winRate || null,
      rank: rank || null
    });
  } catch (err) {
    console.error('Scrape error:', err.message);
    res.status(500).json({ error: 'Failed to scrape profile', details: err.message });
  }
});

