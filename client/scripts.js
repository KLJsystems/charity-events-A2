function statusLabel(ev) {
  const today = new Date().toISOString().slice(0, 10);
  if (ev.suspended) return 'SUSPENDED';
  if (ev.event_date < today) return 'PAST';
  return 'UPCOMING';
}

function eventCardHTML(ev) {
  const date = ev.event_date ? new Date(ev.event_date).toISOString().slice(0, 10) : '';
  const badge = statusLabel(ev).toLowerCase(); // upcoming | past | suspended
  const price = Number(ev.ticket_price || 0).toFixed(2);
  const goal = Number(ev.goal_amount || 0);
  const raised = Number(ev.raised_amount || 0);
  const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return `
    <div class="card-title">
      <a href="/event.html?id=${ev.event_id}">${ev.event_name}</a>
      <span class="badge ${badge}">${badge.toUpperCase()}</span>
    </div>
    <div class="card-sub">
      ${date}${ev.start_time ? ` ${ev.start_time.slice(0, 5)}` : ''} — ${ev.location ?? ''}
      ${ev.category ? ` • ${ev.category}` : ''}
    </div>
    <div>${ev.description ?? ''}</div>
    <div class="tiny muted">Ticket: $${price} • Goal progress: ${progress}%</div>
  `;
}

async function loadEvents() {
  const status = document.getElementById('events-status');
  const list = document.getElementById('events-list');
  status.textContent = 'Loading events…';
  list.innerHTML = '';

  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const events = await res.json();

    status.textContent = events.length ? '' : 'No events found.';
    events.forEach(ev => {
      // Hide suspended events on the Home page
      if (ev.suspended) return;

      const li = document.createElement('li');
      li.className = 'card';
      li.innerHTML = eventCardHTML(ev);
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    status.textContent = 'Failed to load events.';
  }
}

async function addEvent(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const msg = document.getElementById('form-msg');

  const payload = {
    event_name: form.event_name.value.trim(),
    event_date: form.event_date.value, // yyyy-mm-dd
    location: form.location.value.trim() || null,
    description: form.description.value.trim() || null
    // later you can add: category, ticket_price, etc.
  };
  if (!payload.event_name || !payload.event_date) {
    msg.textContent = 'Please provide name and date.';
    return;
  }

  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create event');
    msg.textContent = 'Event added.';
    form.reset();
    await loadEvents();
  } catch (err) {
    console.error(err);
    msg.textContent = 'Error creating event.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-event-form');
  if (form) form.addEventListener('submit', addEvent);
  loadEvents();
});
