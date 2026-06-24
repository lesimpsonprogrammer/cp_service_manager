(() => {
  const board = document.querySelector('.kanban-board');
  const boardPanel = document.querySelector('.kanban-board-panel');
  if (!board || !boardPanel) return;

  const storageKey = 'cpsmClientKanbanBoard';
  const internalModeKey = 'cpsmKanbanInternalEditorEnabled';
  const urlParams = new URLSearchParams(window.location.search);
  const urlRequestsInternalMode = urlParams.get('internal') === '1' || urlParams.get('role') === 'internal';
  const hasInternalAccess = urlRequestsInternalMode || localStorage.getItem(internalModeKey) === 'true';
  let internalMode = hasInternalAccess;
  let activeCardId = null;
  let activeMode = 'edit';

  if (urlRequestsInternalMode) {
    localStorage.setItem(internalModeKey, 'true');
  }

  const columns = [
    { id: 'intake', label: 'Intake' },
    { id: 'inProgress', label: 'In Progress' },
    { id: 'clientReview', label: 'Client Review' },
    { id: 'complete', label: 'Complete' }
  ];

  const defaultBoard = {
    intake: [
      {
        id: 'task-kickoff-packet',
        title: 'Confirm kickoff packet',
        description: 'Review project scope, client contacts, file locations, and delivery expectations.',
        label: 'Client Setup',
        owner: 'Momentum Data',
        due: 'This week',
        priority: 'High'
      },
      {
        id: 'task-source-access',
        title: 'Confirm source data access',
        description: 'Validate source file availability and access instructions before extraction begins.',
        label: 'Access',
        owner: 'Client',
        due: 'Pending',
        priority: 'Medium'
      }
    ],
    inProgress: [
      {
        id: 'task-data-mapping',
        title: 'Data mapping workbook',
        description: 'Map source fields to the target project template and identify transformation rules.',
        label: 'ETL',
        owner: 'Momentum Data',
        due: 'In progress',
        priority: 'High'
      },
      {
        id: 'task-cleaning-rules',
        title: 'Cleaning and validation rules',
        description: 'Apply naming, formatting, duplicate review, and required-field checks.',
        label: 'Validation',
        owner: 'Momentum Data',
        due: 'Next',
        priority: 'Medium'
      }
    ],
    clientReview: [
      {
        id: 'task-sample-review',
        title: 'Client sample review',
        description: 'Review sample output and confirm whether the format is ready for final delivery.',
        label: 'Review',
        owner: 'Client',
        due: 'Awaiting review',
        priority: 'High'
      }
    ],
    complete: [
      {
        id: 'task-workspace-created',
        title: 'Client workspace created',
        description: 'Client portal workspace and initial project record are ready for client review.',
        label: 'Workspace',
        owner: 'Momentum Data',
        due: 'Complete',
        priority: 'Complete'
      }
    ]
  };

  function cloneBoard(boardState) {
    return JSON.parse(JSON.stringify(boardState));
  }

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatClientWelcome() {
    const greeting = document.querySelector('#clientWelcome');
    if (!greeting) return;

    const currentText = greeting.textContent || '';
    const nameMatch = currentText.match(/Hi,\s*(.*?)(?:,\s*welcome|,?$)/i);
    const clientName = nameMatch?.[1]?.trim() || 'Client';
    const welcomeLine = document.createElement('span');

    welcomeLine.textContent = 'Welcome to Client Portfolio Service Manager.';
    greeting.replaceChildren(
      document.createTextNode(`Hi, ${clientName},`),
      document.createElement('br'),
      welcomeLine
    );
  }

  function readBoard() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved === 'object') {
        columns.forEach((column) => {
          if (!Array.isArray(saved[column.id])) saved[column.id] = [];
        });
        return saved;
      }
    } catch (error) {
      // Use defaults when stored board data cannot be read.
    }
    return cloneBoard(defaultBoard);
  }

  function saveBoard(boardState) {
    localStorage.setItem(storageKey, JSON.stringify(boardState));
  }

  function findCard(boardState, cardId) {
    for (const [columnId, cards] of Object.entries(boardState)) {
      const cardIndex = cards.findIndex((card) => card.id === cardId);
      if (cardIndex >= 0) {
        return { columnId, cardIndex, card: cards[cardIndex] };
      }
    }
    return null;
  }

  function createCard(card) {
    const cardElement = document.createElement('article');
    cardElement.className = 'kanban-card';
    cardElement.draggable = internalMode;
    cardElement.dataset.cardId = card.id;
    cardElement.innerHTML = `
      <div class="kanban-card-topline">
        <span>${escapeHtml(card.label)}</span>
        <em>${escapeHtml(card.priority)}</em>
      </div>
      <h4>${escapeHtml(card.title)}</h4>
      <p>${escapeHtml(card.description)}</p>
      <div class="kanban-card-meta">
        <span>${escapeHtml(card.owner)}</span>
        <span>${escapeHtml(card.due)}</span>
      </div>
    `;

    if (internalMode) {
      const editButton = document.createElement('button');
      editButton.className = 'kanban-card-edit';
      editButton.type = 'button';
      editButton.textContent = 'Edit card';
      editButton.addEventListener('click', () => openEditor('edit', card.id));
      cardElement.appendChild(editButton);
    }

    cardElement.addEventListener('dragstart', (event) => {
      if (!internalMode) {
        event.preventDefault();
        return;
      }
      cardElement.classList.add('is-dragging');
      event.dataTransfer.setData('text/plain', card.id);
      event.dataTransfer.effectAllowed = 'move';
    });

    cardElement.addEventListener('dragend', () => {
      cardElement.classList.remove('is-dragging');
    });

    return cardElement;
  }

  function renderBoard(boardState) {
    board.classList.toggle('is-internal-mode', internalMode);
    document.querySelectorAll('[data-kanban-list]').forEach((list) => {
      const columnId = list.dataset.kanbanList;
      const cards = boardState[columnId] || [];
      list.innerHTML = '';
      cards.forEach((card) => list.appendChild(createCard(card)));

      const count = document.querySelector(`[data-kanban-count="${columnId}"]`);
      if (count) count.textContent = String(cards.length);
    });
  }

  function moveCard(boardState, cardId, targetColumnId) {
    if (!internalMode) return boardState;

    const cardInfo = findCard(boardState, cardId);
    if (!cardInfo || cardInfo.columnId === targetColumnId) return boardState;

    boardState[cardInfo.columnId].splice(cardInfo.cardIndex, 1);
    boardState[targetColumnId].push(cardInfo.card);
    saveBoard(boardState);
    return boardState;
  }

  function createInternalToolbar() {
    if (!hasInternalAccess) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'kanban-internal-toolbar';
    toolbar.innerHTML = `
      <div>
        <span>Internal edit mode</span>
        <strong>Team controls are hidden from the standard client view.</strong>
      </div>
      <div class="kanban-internal-actions">
        <button type="button" id="kanbanAddCard">Add card</button>
        <button type="button" id="kanbanResetBoard">Reset board</button>
      </div>
    `;

    const header = boardPanel.querySelector('.kanban-board-header');
    header?.insertAdjacentElement('afterend', toolbar);

    toolbar.querySelector('#kanbanAddCard')?.addEventListener('click', () => openEditor('create'));
    toolbar.querySelector('#kanbanResetBoard')?.addEventListener('click', () => {
      boardState = cloneBoard(defaultBoard);
      saveBoard(boardState);
      renderBoard(boardState);
    });
  }

  function createEditorModal() {
    if (!hasInternalAccess || document.querySelector('#kanbanEditorModal')) return;

    const modal = document.createElement('div');
    modal.className = 'kanban-editor-modal';
    modal.id = 'kanbanEditorModal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'kanbanEditorTitle');
    modal.innerHTML = `
      <div class="kanban-editor-card">
        <div class="kanban-editor-heading">
          <div>
            <p class="dashboard-kicker">Internal Board Editor</p>
            <h2 id="kanbanEditorTitle">Edit board card</h2>
          </div>
          <button type="button" class="kanban-editor-close" aria-label="Close editor">×</button>
        </div>

        <form id="kanbanEditorForm" class="kanban-editor-form">
          <label>
            Card title
            <input name="title" type="text" required maxlength="90" />
          </label>
          <label>
            Description
            <textarea name="description" required maxlength="240"></textarea>
          </label>
          <div class="kanban-editor-grid">
            <label>
              Status column
              <select name="columnId" required>
                ${columns.map((column) => `<option value="${column.id}">${column.label}</option>`).join('')}
              </select>
            </label>
            <label>
              Label
              <input name="label" type="text" maxlength="40" />
            </label>
            <label>
              Owner
              <input name="owner" type="text" maxlength="50" />
            </label>
            <label>
              Due / status note
              <input name="due" type="text" maxlength="50" />
            </label>
            <label>
              Priority
              <select name="priority">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
                <option>Complete</option>
              </select>
            </label>
          </div>
          <div class="kanban-editor-actions">
            <button type="button" class="kanban-delete-card">Delete</button>
            <div>
              <button type="button" class="kanban-cancel-edit">Cancel</button>
              <button type="submit" class="kanban-save-card">Save card</button>
            </div>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.kanban-editor-close')?.addEventListener('click', closeEditor);
    modal.querySelector('.kanban-cancel-edit')?.addEventListener('click', closeEditor);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeEditor();
    });

    modal.querySelector('.kanban-delete-card')?.addEventListener('click', deleteActiveCard);
    modal.querySelector('#kanbanEditorForm')?.addEventListener('submit', saveActiveCard);
  }

  function getEditorElements() {
    const modal = document.querySelector('#kanbanEditorModal');
    const form = modal?.querySelector('#kanbanEditorForm');
    return { modal, form };
  }

  function openEditor(mode, cardId = null) {
    const { modal, form } = getEditorElements();
    if (!modal || !form) return;

    activeMode = mode;
    activeCardId = cardId;
    form.reset();

    const deleteButton = modal.querySelector('.kanban-delete-card');
    const title = modal.querySelector('#kanbanEditorTitle');

    if (mode === 'edit') {
      const cardInfo = findCard(boardState, cardId);
      if (!cardInfo) return;

      title.textContent = 'Edit board card';
      form.elements.title.value = cardInfo.card.title || '';
      form.elements.description.value = cardInfo.card.description || '';
      form.elements.columnId.value = cardInfo.columnId;
      form.elements.label.value = cardInfo.card.label || '';
      form.elements.owner.value = cardInfo.card.owner || '';
      form.elements.due.value = cardInfo.card.due || '';
      form.elements.priority.value = cardInfo.card.priority || 'Medium';
      if (deleteButton) deleteButton.hidden = false;
    } else {
      title.textContent = 'Add board card';
      form.elements.columnId.value = 'intake';
      form.elements.label.value = 'Project Task';
      form.elements.owner.value = 'Momentum Data';
      form.elements.due.value = 'To be confirmed';
      form.elements.priority.value = 'Medium';
      if (deleteButton) deleteButton.hidden = true;
    }

    modal.hidden = false;
    form.elements.title.focus();
  }

  function closeEditor() {
    const { modal } = getEditorElements();
    if (!modal) return;
    modal.hidden = true;
    activeCardId = null;
    activeMode = 'edit';
  }

  function saveActiveCard(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const columnId = String(formData.get('columnId') || 'intake');
    const nextCard = {
      id: activeMode === 'create' ? `task-${Date.now()}` : activeCardId,
      title: String(formData.get('title') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      label: String(formData.get('label') || 'Project Task').trim(),
      owner: String(formData.get('owner') || 'Momentum Data').trim(),
      due: String(formData.get('due') || 'To be confirmed').trim(),
      priority: String(formData.get('priority') || 'Medium').trim()
    };

    if (!nextCard.title || !nextCard.description) return;

    if (activeMode === 'edit') {
      const existing = findCard(boardState, activeCardId);
      if (!existing) return;
      boardState[existing.columnId].splice(existing.cardIndex, 1);
    }

    boardState[columnId].push(nextCard);
    saveBoard(boardState);
    renderBoard(boardState);
    closeEditor();
  }

  function deleteActiveCard() {
    if (!activeCardId) return;
    const existing = findCard(boardState, activeCardId);
    if (!existing) return;
    boardState[existing.columnId].splice(existing.cardIndex, 1);
    saveBoard(boardState);
    renderBoard(boardState);
    closeEditor();
  }

  let boardState = readBoard();
  formatClientWelcome();
  createInternalToolbar();
  createEditorModal();
  renderBoard(boardState);

  document.querySelectorAll('[data-kanban-list]').forEach((list) => {
    list.addEventListener('dragover', (event) => {
      if (!internalMode) return;
      event.preventDefault();
      list.classList.add('is-drop-target');
    });

    list.addEventListener('dragleave', () => {
      list.classList.remove('is-drop-target');
    });

    list.addEventListener('drop', (event) => {
      if (!internalMode) return;
      event.preventDefault();
      list.classList.remove('is-drop-target');
      const cardId = event.dataTransfer.getData('text/plain');
      const targetColumnId = list.dataset.kanbanList;
      boardState = moveCard(boardState, cardId, targetColumnId);
      renderBoard(boardState);
    });
  });
})();
