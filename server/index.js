// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const db = require('./db'); 

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// DB connectivity test
app.get('/api/test-db', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS totalEvents FROM events');
    res.json({ connected: true, totalEvents: rows[0].totalEvents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ connected: false, error: err.message });
  }
});


//Get all events
app.get('/api/events', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM events ORDER BY event_date');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event by ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM events WHERE event_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create a new event
app.post('/api/events', async (req, res) => {
  const { event_name, event_date, location, description } = req.body;
  if (!event_name || !event_date)
    return res.status(400).json({ error: 'event_name and event_date are required' });

  try {
    const [result] = await db.query(
      'INSERT INTO events (event_name, event_date, location, description) VALUES (?, ?, ?, ?)',
      [event_name, event_date, location || null, description || null]
    );
    res.status(201).json({ event_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update existing event
app.put('/api/events/:id', async (req, res) => {
  const { event_name, event_date, location, description } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE events SET event_name=?, event_date=?, location=?, description=? WHERE event_id=?',
      [event_name, event_date, location || null, description || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete an event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM events WHERE event_id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
