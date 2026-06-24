(() => {
  const board = document.querySelector('.kanban-board');
  if (!board) return;

  const storageKey = 'cpsmClientKanbanBoard';
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

  function readBoard() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved === 'object') return saved;
    } catch (error) {
      // Use defaults when stored board data cannot be read.
    }
    return structuredClone(defaultBoard);
  }

  function saveBoard(boardState) {
    localStorage.setItem(storageKey, JSON.stringify(boardState));
  }

  function createCard(card) {
    const cardElement = document.createElement('article');
    cardElement.className = 'kanban-card';
    cardElement.draggable = true;
    cardElement.dataset.cardId = card.id;
    cardElement.innerHTML = `
      <div class="kanban-card-topline">
        <span>${card.label}</span>
        <em>${card.priority}</em>
      </div>
      <h4>${card.title}</h4>
      <p>${card.description}</p>
      <div class="kanban-card-meta">
        <span>${card.owner}</span>
        <span>${card.due}</span>
      </div>
    `;

    cardElement.addEventListener('dragstart', (event) => {
      cardElement.classList.add('is-dragging');
      event.dataTransfer.setData('text/plain', card.id);
      event.dataTransfer.effectAllowed = 'move';
    });

    cardElement.addEventListener('dragend', () => {
      cardElement.classList.remove('is-dragging');
    });

    return cardElement;
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

  function renderBoard(boardState) {
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
    const cardInfo = findCard(boardState, cardId);
    if (!cardInfo || cardInfo.columnId === targetColumnId) return boardState;

    boardState[cardInfo.columnId].splice(cardInfo.cardIndex, 1);
    boardState[targetColumnId].push(cardInfo.card);
    saveBoard(boardState);
    return boardState;
  }

  let boardState = readBoard();
  renderBoard(boardState);

  document.querySelectorAll('[data-kanban-list]').forEach((list) => {
    list.addEventListener('dragover', (event) => {
      event.preventDefault();
      list.classList.add('is-drop-target');
    });

    list.addEventListener('dragleave', () => {
      list.classList.remove('is-drop-target');
    });

    list.addEventListener('drop', (event) => {
      event.preventDefault();
      list.classList.remove('is-drop-target');
      const cardId = event.dataTransfer.getData('text/plain');
      const targetColumnId = list.dataset.kanbanList;
      boardState = moveCard(boardState, cardId, targetColumnId);
      renderBoard(boardState);
    });
  });
})();
