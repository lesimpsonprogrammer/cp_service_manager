(() => {
  const stylesheets = ['cpsm-kanban-embed.css', 'cpsm-kanban-editable.css'];
  stylesheets.forEach((href) => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  });

  const currentPage = window.location.pathname.split('/').pop() || 'client-portal.html';
  const dashboardContent = document.querySelector('.dashboard-content');
  if (!dashboardContent) return;

  document.querySelectorAll('.dashboard-kanban-panel,.project-kanban-panel').forEach((panel) => panel.remove());

  const dashboardCards = {
    critical: [{ id: 'dash-1', client: 'Brightline Services', title: 'Benefits deduction file needed', detail: 'Client validation file is blocking deduction setup and downstream review.', meta: ['Client action', 'Critical'] }],
    high: [{ id: 'dash-2', client: 'Atlas Manufacturing', title: 'Payroll calendar requested', detail: 'Client needs to upload payroll dates before configuration review.', meta: ['Missing document', 'High'] }, { id: 'dash-3', client: 'Northstar Logistics', title: 'Employee census mapping', detail: 'Department, location, and pay group fields are being standardized.', meta: ['Owner: PM', 'High'] }],
    medium: [{ id: 'dash-4', client: 'Atlas Manufacturing', title: 'Earnings code matrix review', detail: 'Checking code labels and import readiness before client signoff.', meta: ['Due this week', 'Medium'] }],
    low: [{ id: 'dash-5', client: 'Cedar HR Partners', title: 'Document visibility rules', detail: 'Confirm internal-only versus client-visible document categories.', meta: ['PM review', 'Low'] }],
    complete: [{ id: 'dash-6', client: 'Atlas Manufacturing', title: 'NDA received', detail: 'Agreement uploaded, categorized, and marked approved.', meta: ['Complete'], complete: true }]
  };

  const projectCards = {
    critical: [{ id: 'pm-1', client: 'Brightline Services', title: 'Benefits deduction file needed', detail: 'Client validation file is blocking deduction setup and downstream review.', meta: ['Owner: Client', 'Trigger: Missing file', 'Priority: Critical'] }, { id: 'pm-2', client: 'Northstar Logistics', title: 'GL account confirmation', detail: 'Finance contact needs to confirm GL account mapping before export testing.', meta: ['Owner: Client', 'Priority: Critical'] }],
    high: [{ id: 'pm-3', client: 'Atlas Manufacturing', title: 'Payroll calendar requested', detail: 'Collect payroll schedule and cut-off dates before payroll setup validation.', meta: ['Owner: Client', 'Due: Open', 'Priority: High'] }, { id: 'pm-4', client: 'Northstar Logistics', title: 'Employee census mapping', detail: 'Standardize department, location, pay group, and employee type fields.', meta: ['Owner: Consultant', 'Due: This week', 'Priority: High'] }],
    medium: [{ id: 'pm-5', client: 'Atlas Manufacturing', title: 'Earnings code matrix review', detail: 'Validate earning code labels, active flags, and import-readiness.', meta: ['Owner: PM', 'Priority: Medium'] }, { id: 'pm-6', client: 'Atlas Manufacturing', title: 'Payroll setup checklist', detail: 'Review current setup against readiness checklist before client review.', meta: ['Owner: PM', 'Due: Friday'] }],
    low: [{ id: 'pm-7', client: 'Cedar HR Partners', title: 'Confirm project contacts', detail: 'Collect main sponsor, backup approver, and data owner assignments.', meta: ['Owner: PM', 'Priority: Low'] }, { id: 'pm-8', client: 'Cedar HR Partners', title: 'Document visibility rules', detail: 'Confirm internal-only versus client-visible document categories.', meta: ['Owner: PM', 'Review'] }],
    complete: [{ id: 'pm-9', client: 'Atlas Manufacturing', title: 'NDA received', detail: 'Agreement uploaded, categorized, and marked approved.', meta: ['Completed'], complete: true }, { id: 'pm-10', client: 'Northstar Logistics', title: 'Initial workspace created', detail: 'Client, project, and project manager records are ready.', meta: ['Completed'], complete: true }]
  };

  function field(text, editable, tag = 'span') {
    const attrs = editable ? ' contenteditable="true" spellcheck="true" data-pm-editable="true"' : '';
    return `<${tag}${attrs}>${text}</${tag}>`;
  }

  function card(cardData, editable) {
    const meta = cardData.meta.map((item) => field(item, editable, 'em')).join('');
    return `<div class="kanban-card ${cardData.complete ? 'complete' : ''} ${editable ? 'project-kanban-card' : ''}" data-card-id="${cardData.id}">${field(cardData.client, editable)}${field(cardData.title, editable, 'strong')}${field(cardData.detail, editable, 'p')}<div class="kanban-card-meta">${meta}</div></div>`;
  }

  function columns(cards, editable) {
    return [['critical','Critical / Immediate'],['high','High Priority'],['medium','Medium Priority'],['low','Low Priority'],['complete','Complete']].map(([key,label]) => `<article class="kanban-column" data-urgency="${key}"><header><span>${label}</span><strong>${cards[key].length}</strong></header>${cards[key].map((item) => card(item, editable)).join('')}</article>`).join('');
  }

  function dashboardPanel() {
    return `<section class="dashboard-panel dashboard-kanban-panel" aria-labelledby="dashboardKanbanTitle"><div class="dashboard-panel-heading"><div><p class="dashboard-kicker">Project Board</p><h2 id="dashboardKanbanTitle">Current work in motion</h2><p>This is the first client-facing workspace after login. It is view-only for clients and organized from left to right by urgency.</p></div><span class="dashboard-status-pill">6 active cards</span></div><div class="kanban-board dashboard-kanban-board">${columns(dashboardCards, false)}</div></section>`;
  }

  function projectPanel() {
    return `<section class="dashboard-panel project-kanban-panel" aria-labelledby="projectKanbanTitle"><div class="dashboard-panel-heading"><div><p class="dashboard-kicker">PM Editable Board</p><h2 id="projectKanbanTitle">Project Management Kanban</h2><p>Only Project Managers should edit cards. Click inside a card to edit text; edits save locally in this browser.</p></div><span class="dashboard-status-pill">PM Edit Mode</span></div><div class="kanban-toolbar"><div class="kanban-filter-row"><span class="kanban-filter-chip">PM editable</span><span class="kanban-filter-chip">Urgency: left to right</span><span class="kanban-filter-chip">Local save</span></div></div><div class="kanban-board project-kanban-board">${columns(projectCards, true)}</div></section>`;
  }

  if (currentPage === 'client-portal.html') {
    const heading = dashboardContent.querySelector('.dashboard-page-heading');
    if (heading) heading.insertAdjacentHTML('afterend', dashboardPanel());
  }

  if (currentPage === 'project-management.html') {
    dashboardContent.insertAdjacentHTML('beforeend', projectPanel());
  }

  document.querySelectorAll('[data-pm-editable="true"]').forEach((field, index) => {
    const cardEl = field.closest('[data-card-id]');
    if (!cardEl) return;
    const key = `cpsmPmKanban:${cardEl.dataset.cardId}:${index}`;
    const saved = localStorage.getItem(key);
    if (saved) field.textContent = saved;
    field.addEventListener('focus', () => cardEl.classList.add('is-editing'));
    field.addEventListener('blur', () => {
      localStorage.setItem(key, field.textContent.trim());
      cardEl.classList.remove('is-editing');
      const indicator = document.createElement('span');
      indicator.className = 'kanban-save-indicator';
      indicator.textContent = 'Saved';
      cardEl.appendChild(indicator);
      setTimeout(() => indicator.remove(), 1100);
    });
  });
})();
