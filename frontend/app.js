// API Configuration
const API_BASE_URL = 'http://localhost:3000/api/v3/app';

// Tab switching
function showTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  // Add active class to clicked button
  event.target.classList.add('active');
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString();
}

// ==================== EVENTS API ====================

// Fetch all events
async function fetchEvents() {
  const container = document.getElementById('events-list');
  container.innerHTML = '<div class="loading">Loading events...</div>';
  
  try {
    const response = await fetch(`${API_BASE_URL}/events`);
    const events = await response.json();
    
    if (!Array.isArray(events)) {
      // Handle paginated response
      events = events.events || [];
    }
    
    displayEvents(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    container.innerHTML = '<div class="empty-state"><p>Error loading events. Make sure backend is running on port 3000.</p></div>';
  }
}

// Display events
function displayEvents(events) {
  const container = document.getElementById('events-list');
  
  if (!events || events.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No events found. Create your first event!</p></div>';
    return;
  }
  
  container.innerHTML = events.map(event => `
    <div class="card">
      <h4>${event.name || 'Untitled Event'}</h4>
      <p><strong>Tagline:</strong> ${event.tagline || 'N/A'}</p>
      <p><strong>Schedule:</strong> ${formatDate(event.schedule)}</p>
      <p><strong>Category:</strong> ${event.category || 'N/A'}</p>
      <p><strong>Description:</strong> ${event.description ? event.description.substring(0, 100) + '...' : 'N/A'}</p>
      <div class="meta">
        <span>ID: ${event._id}</span>
      </div>
      <div class="actions">
        <button onclick="deleteEvent('${event._id}')" class="btn btn-danger btn-small">Delete</button>
      </div>
    </div>
  `).join('');
}

// Create event
async function createEvent(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Event created successfully!');
      form.reset();
      fetchEvents();
      loadEventsForNudge(); // Refresh event dropdown
    } else {
      showToast(data.error || 'Error creating event', 'error');
    }
  } catch (error) {
    console.error('Error creating event:', error);
    showToast('Error creating event. Make sure backend is running.', 'error');
  }
}

// Delete event
async function deleteEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Event deleted successfully!');
      fetchEvents();
      loadEventsForNudge();
    } else {
      showToast(data.error || 'Error deleting event', 'error');
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    showToast('Error deleting event. Make sure backend is running.', 'error');
  }
}

// ==================== NUDGES API ====================

// Load events for nudge dropdown
async function loadEventsForNudge() {
  const select = document.getElementById('nudge-event-id');
  
  try {
    const response = await fetch(`${API_BASE_URL}/events`);
    const events = await response.json();
    
    if (!Array.isArray(events)) {
      events = events.events || [];
    }
    
    select.innerHTML = '<option value="">Select an event</option>' + 
      events.map(event => 
        `<option value="${event._id}">${event.name || 'Untitled Event'}</option>`
      ).join('');
  } catch (error) {
    console.error('Error loading events:', error);
    select.innerHTML = '<option value="">Error loading events</option>';
  }
}

// Fetch all nudges
async function fetchNudges() {
  const container = document.getElementById('nudges-list');
  container.innerHTML = '<div class="loading">Loading nudges...</div>';
  
  try {
    const response = await fetch(`${API_BASE_URL}/nudges`);
    const data = await response.json();
    
    const nudges = data.nudges || [];
    displayNudges(nudges);
  } catch (error) {
    console.error('Error fetching nudges:', error);
    container.innerHTML = '<div class="empty-state"><p>Error loading nudges. Make sure backend is running on port 3000.</p></div>';
  }
}

// Display nudges
function displayNudges(nudges) {
  const container = document.getElementById('nudges-list');
  
  if (!nudges || nudges.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No nudges found. Create your first nudge!</p></div>';
    return;
  }
  
  container.innerHTML = nudges.map(nudge => `
    <div class="card">
      <h4>${nudge.title || 'Untitled Nudge'}</h4>
      <p><strong>Event ID:</strong> ${nudge.event_id || 'N/A'}</p>
      <p><strong>Send Time:</strong> ${formatDate(nudge.send_time)}</p>
      <p><strong>Invitation:</strong> ${nudge.invitation_line || 'N/A'}</p>
      <p><strong>Description:</strong> ${nudge.description ? nudge.description.substring(0, 100) + '...' : 'N/A'}</p>
      <p><strong>Status:</strong> ${nudge.status || 'N/A'}</p>
      <div class="meta">
        <span>ID: ${nudge._id}</span>
      </div>
      <div class="actions">
        <button onclick="deleteNudge('${nudge._id}')" class="btn btn-danger btn-small">Delete</button>
      </div>
    </div>
  `).join('');
}

// Create nudge
async function createNudge(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  try {
    const response = await fetch(`${API_BASE_URL}/nudges`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Nudge created successfully!');
      form.reset();
      fetchNudges();
    } else {
      showToast(data.error || 'Error creating nudge', 'error');
    }
  } catch (error) {
    console.error('Error creating nudge:', error);
    showToast('Error creating nudge. Make sure backend is running.', 'error');
  }
}

// Delete nudge
async function deleteNudge(nudgeId) {
  if (!confirm('Are you sure you want to delete this nudge?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/nudges/${nudgeId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Nudge deleted successfully!');
      fetchNudges();
    } else {
      showToast(data.error || 'Error deleting nudge', 'error');
    }
  } catch (error) {
    console.error('Error deleting nudge:', error);
    showToast('Error deleting nudge. Make sure backend is running.', 'error');
  }
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
  // Load events on page load
  fetchEvents();
  
  // Load events for nudge dropdown
  loadEventsForNudge();
  
  // Fetch nudges when nudges tab is shown
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.target.textContent.trim() === 'Nudges') {
        fetchNudges();
      }
    });
  });
  
  // Event form submission
  document.getElementById('event-form').addEventListener('submit', createEvent);
  
  // Nudge form submission
  document.getElementById('nudge-form').addEventListener('submit', createNudge);
});
