const STORAGE_KEY = 'notes-app-data';

function loadNotes() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading notes from localStorage', e);
    return [];
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Error saving notes to localStorage', e);
  }
}

function createNote(title, content) {
  const note = {
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: new Date().toISOString(),
  };
  const notes = loadNotes();
  notes.push(note);
  saveNotes(notes);
  return note;
}

function updateNote(id, title, content) {
  const notes = loadNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return null;
  notes[index].title = title;
  notes[index].content = content;
  notes[index].updatedAt = new Date().toISOString();
  saveNotes(notes);
  return notes[index];
}

function deleteNote(id) {
  const notes = loadNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return false;
  notes.splice(index, 1);
  saveNotes(notes);
  return true;
}

function renderNotes(notes) {
  const container = document.getElementById('notes-list');
  if (!notes || notes.length === 0) {
    container.innerHTML = '<p>No notes yet</p>';
    return;
  }

  container.innerHTML = notes
    .map(
      (note) => `
    <div class="note-card" data-id="${note.id}">
      <h3>${escapeHtml(note.title)}</h3>
      <p>${escapeHtml(note.content)}</p>
      <small>${new Date(note.createdAt).toLocaleString()}</small>
      <div class="note-actions">
        <button class="edit-btn" data-id="${note.id}">Edit</button>
        <button class="delete-btn" data-id="${note.id}">Delete</button>
      </div>
    </div>
  `
    )
    .join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function initApp() {
  const formEl = document.getElementById('note-form-el');
  const searchInput = document.getElementById('search-input');
  const notesList = document.getElementById('notes-list');

  function handleFormSubmit(e) {
    e.preventDefault();
    const noteIdInput = document.getElementById('note-id');
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) return;

    const noteId = noteIdInput.value;
    if (noteId) {
      const updated = updateNote(noteId, title, content);
      if (!updated) {
        titleInput.value = '';
        contentInput.value = '';
        noteIdInput.value = '';
        return;
      }
      noteIdInput.value = '';
    } else {
      createNote(title, content);
    }
    titleInput.value = '';
    contentInput.value = '';
    renderNotes(loadNotes());
  }

  function handleSearchInput(e) {
    const query = e.target.value.trim().toLowerCase();
    const notes = loadNotes();
    if (!query) {
      renderNotes(notes);
      return;
    }
    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
    renderNotes(filtered);
  }

  function handleNoteAction(e) {
    const target = e.target;
    const id = target.getAttribute('data-id');
    if (!id) return;

    if (target.classList.contains('delete-btn')) {
      if (deleteNote(id)) {
        renderNotes(loadNotes());
      }
    } else if (target.classList.contains('edit-btn')) {
      const notes = loadNotes();
      const note = notes.find((n) => n.id === id);
      if (note) {
        const titleInput = document.getElementById('note-title');
        const contentInput = document.getElementById('note-content');
        const noteIdInput = document.getElementById('note-id');
        titleInput.value = note.title;
        contentInput.value = note.content;
        noteIdInput.value = note.id;

        titleInput.focus();
      }
    }
  }

  formEl.addEventListener('submit', handleFormSubmit);
  searchInput.addEventListener('input', handleSearchInput);
  notesList.addEventListener('click', handleNoteAction);

  renderNotes(loadNotes());
}

document.addEventListener('DOMContentLoaded', initApp);
