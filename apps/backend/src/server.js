const express = require('express');
const app = express();
app.get('/health', (_, res) => res.json({ ok: true }));
app.listen(4000, () => console.log('API listening on :4000'));

app.get('/leaderboard', (_, res) => res.json({ users: [] }));

app.get('/metrics', (_, res) => res.json({ uptime: require('./metrics').uptime() }));
