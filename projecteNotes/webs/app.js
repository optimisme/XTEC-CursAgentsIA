/* ============================================================
   Notes App — Note creation & localStorage persistence
   ============================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "notesApp.notes";

  // ---------- DOM references ----------
  const form = document.getElementById("note-form");
  const titleInput = document.getElementById("note-title");
  const contentInput = document.getElementById("note-content");
  const notesContainer = document.getElementById("notes-container");

  // Edit form references
  const editForm = document.getElementById("edit-form");
  const editTitleInput = document.getElementById("edit-title");
  const editContentInput = document.getElementById("edit-content");
  const cancelEditBtn = document.getElementById("cancel-edit");

  // Search input reference
  const searchInput = document.getElementById("search-input");

  let currentEditId = null;

  // ---------- localStorage helpers ----------

  /** Get all notes from localStorage. Returns [] on any failure. */
  function getNotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null || raw === undefined) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (_err) {
      return [];
    }
  }

  /** Persist notes array to localStorage. */
  function saveNotes(notes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (_err) {
      // Storage full or unavailable — silently fail
    }
  }

  // ---------- Render ----------

  /** Build a note card element from a note object. */
  function createNoteElement(note) {
    const card = document.createElement("article");
    card.className = "note-card";
    card.dataset.noteId = note.id;

    // Sanitise user content to prevent XSS
    const safeTitle = escapeHtml(note.title);
    const safeContent = escapeHtml(note.content);

    card.innerHTML =
      '<h3 class="note-card-title">' + safeTitle + "</h3>" +
      '<p class="note-card-content">' + safeContent + "</p>" +
      '<div class="note-card-actions">' +
        '<button class="edit-btn" type="button">Edit</button>' +
        '<button class="delete-btn" type="button">Delete</button>' +
      "</div>";

    return card;
  }

  /** Render all notes into the container, optionally filtered by a search term. */
  function renderNotes(filter) {
    const notes = getNotes();

    // Remove existing note cards and any stale empty-state message (keep the heading)
    const cards = notesContainer.querySelectorAll(".note-card");
    for (let i = 0; i < cards.length; i++) {
      cards[i].remove();
    }
    const existingEmpty = notesContainer.querySelector("p");
    if (existingEmpty) existingEmpty.remove();

    // Apply filter if provided
    let displayNotes = notes;
    if (filter && filter.length > 0) {
      const lowerFilter = filter.toLowerCase();
      displayNotes = notes.filter(function (note) {
        return (
          note.title.toLowerCase().includes(lowerFilter) ||
          note.content.toLowerCase().includes(lowerFilter)
        );
      });
    }

    if (notes.length === 0) {
      const emptyMsg = document.createElement("p");
      emptyMsg.textContent = "No notes yet. Create one above!";
      notesContainer.appendChild(emptyMsg);
      return;
    }

    // Filter active but no matches
    if (displayNotes.length === 0) {
      const emptyMsg = document.createElement("p");
      emptyMsg.textContent = "No notes match your search.";
      notesContainer.appendChild(emptyMsg);
      return;
    }

    // Append cards (newest first)
    for (let i = displayNotes.length - 1; i >= 0; i--) {
      const card = createNoteElement(displayNotes[i]);
      notesContainer.appendChild(card);
    }
  }

  // ---------- Edit form helpers ----------

  /** Open the edit form pre-filled with a note's data. */
  function openEditForm(note) {
    currentEditId = note.id;
    editTitleInput.value = note.title;
    editContentInput.value = note.content;
    editForm.hidden = false;
    editForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /** Hide the edit form and reset its state. */
  function closeEditForm() {
    editForm.hidden = true;
    editForm.reset();
    currentEditId = null;
  }

  /** Handle click events on the notes container (delegation for Edit/Delete). */
  function handleContainerClick(event) {
    var target = event.target;

    if (target.classList.contains("edit-btn")) {
      var card = target.closest(".note-card");
      if (!card) return;
      var noteId = card.dataset.noteId;
      if (!noteId) return;
      var notes = getNotes();
      var note = notes.find(function (n) { return n.id === noteId; });
      if (note) openEditForm(note);
    }

    if (target.classList.contains("delete-btn")) {
      var card = target.closest(".note-card");
      if (!card) return;
      var noteId = card.dataset.noteId;
      if (!noteId) return;
      if (!confirm("Are you sure you want to delete this note?")) return;
      var notes = getNotes();
      notes = notes.filter(function (n) { return n.id !== noteId; });
      saveNotes(notes);
      renderNotes();
    }
  }

  /** Handle edit form submission. */
  function handleEditSubmit(event) {
    event.preventDefault();

    if (currentEditId === null) return;

    var title = editTitleInput.value.trim();
    var content = editContentInput.value.trim();
    if (title === "" || content === "") return;

    var notes = getNotes();
    var note = notes.find(function (n) { return n.id === currentEditId; });
    if (!note) return;

    note.title = title;
    note.content = content;
    saveNotes(notes);
    renderNotes();
    closeEditForm();
  }

  // ---------- XSS helper ----------

  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ---------- Form handler ----------

  function handleFormSubmit(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (title === "" || content === "") {
      return; // Don't save empty notes
    }

    const note = {
      id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9),
      title: title,
      content: content,
      createdAt: new Date().toISOString(),
    };

    const notes = getNotes();
    notes.push(note);
    saveNotes(notes);

    // Clear the form
    form.reset();

    // Re-render the list
    renderNotes();
  }

  // ---------- Init ----------

  form.addEventListener("submit", handleFormSubmit);
  notesContainer.addEventListener("click", handleContainerClick);
  editForm.addEventListener("submit", handleEditSubmit);
  cancelEditBtn.addEventListener("click", closeEditForm);
  searchInput.addEventListener("input", function () {
    renderNotes(searchInput.value.trim());
  });
  renderNotes();
})();
