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
      const li = document.createElement('li');
      const date = ev.event_date ? new Date(ev.event_date).toISOString().slice(0, 10) : '';
      li.innerHTML = `
        <div class="card-title">${ev.event_name}</div>
        <div class="card-sub">${date} ${ev.location ? '— ' + ev.location : ''}</div>
        <div>${ev.description ?? ''}</div>
      `;
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
