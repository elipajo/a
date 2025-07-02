const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());

const API_KEY = process.env.TRN_API_KEY; // Make sure this is set in Render's environment variables

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Valorant API is running', status: 'ok' });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

app.get('/valorant', async (req, res) => {
  const { username, tagline, region } = req.query;

  if (!username || !tagline || !region) {
    return res.status(400).json({ error: 'Missing query parameters' });
  }

  const riotID = encodeURIComponent(`${username}#${tagline}`);
  const url = `https://public-api.tracker.gg/v2/valorant/standard/profile/${region}/${riotID}`;
  
  console.log('Fetching URL:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'TRN-Api-Key': API_KEY // ✅ Case-sensitive and correct
      }
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({ error: data.errors || data.message || 'API request failed' });
    }

    if (!data.data || !data.data.segments || !data.data.segments[0]) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const stats = data.data.segments[0].stats;
    const rank = data.data.segments[0].metadata.rankName;

    res.json({
      kdr: stats.kdratio?.value || null,
      headshots: stats.headshots?.value || null,
      winRate: stats.winPercentage?.value || null,
      rank: rank || null
    });
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000 and accessible at 0.0.0.0');
});

