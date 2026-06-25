(() => {
  const workflowStorageKey = 'cpsmConnectedWorkflowRecords';
  const boardStorageKey = 'cpsmClientKanbanBoard';

  const projectRecord = {
    client: 'Kompan',
    clientId: 'CLI-KOM-100100',
    projectTitle: 'Paylocity Implementation',
    projectId: 'PRJ-KOM-005-100100',
    deliverables: 5,
    owner: 'Project Manager',
    triggerSource: 'Client Onboarding'
  };

  const defaultWorkflows = [
    {
      id: 'client-onboarding-pull',
      name: 'Client Onboarding Pull',
      client: projectRecord.client,
      clientId: projectRecord.clientId,
      projectId: projectRecord.projectId,
      projectTitle: projectRecord.projectTitle,
      deliverables: projectRecord.deliverables,
      status: 'Completed',
      triggerSource: 'Client Onboarding',
      assignedOwner: 'Client Onboarding Team',
      lastAction: 'Client Profile Saved To Database',
      nextAction: 'Release To Client Directory',
      missedIncident: 'None',
      dateCreated: 'June 24, 2026',
      dateUpdated: 'June 24, 2026'
    },
    {
      id: 'project-initiation',
      name: 'Project Initiation',
      client: projectRecord.client,
      clientId: projectRecord.clientId,
      projectId: projectRecord.projectId,
      projectTitle: projectRecord.projectTitle,
      deliverables: projectRecord.deliverables,
      status: 'Active',
      triggerSource: 'Initiate Project',
      assignedOwner: 'Project Manager',
      lastAction: 'Project Record Prepared',
      nextAction: 'Click Initiate Project',
      missedIncident: 'None',
      dateCreated: 'June 24, 2026',
      dateUpdated: 'June 24, 2026'
    },
    {
      id: 'welcome-email',
      name: 'Welcome Email',
      client: projectRecord.client,
      clientId: projectRecord.clientId,
      projectId: projectRecord.projectId,
      projectTitle: projectRecord.projectTitle,
      deliverables: projectRecord.deliverables,
      status: 'Pending',
      triggerSource: 'Project Initiation',
      assignedOwner: 'Workflow Center',
      lastAction: 'Email Template Loaded',
      nextAction: 'Send Welcome Email',
      missedIncident: 'None',
      dateCreated: 'June 24, 2026',
      dateUpdated: 'June 24, 2026'
    },
    {
      id: 'kanban-card-creation',
      name: 'Kanban Card Creation',
      client: projectRecord.client,
      clientId: projectRecord.clientId,
      projectId: projectRecord.projectId,
      projectTitle: projectRecord.projectTitle,
      deliverables: projectRecord.deliverables,
      status: 'Pending',
      triggerSource: 'Project Initiation',
      assignedOwner: 'Dashboard Board',
      lastAction: 'Card Structure Ready',
      nextAction: 'Create Initial Kanban Card',
      missedIncident: 'None',
      dateCreated: 'June 24, 2026',
      dateUpdated: 'June 24, 2026'
    },
    {
      id: 'billable-hours-release',
      name: 'Billable Hours Release',
      client: projectRecord.client,
      clientId: projectRecord.clientId,
      projectId: projectRecord.projectId,
      projectTitle: projectRecord.projectTitle,
      deliverables: projectRecord.deliverables,
      status: 'Pending Approval',
      triggerSource: 'Approved Timecards',
      assignedOwner: 'Admin',
      lastAction: 'Awaiting Approved Timecards',
      nextAction: 'Release Approved Totals To Hours By Project',
      missedIncident: 'None',
      dateCreated: 'June 24, 2026',
      dateUpdated: 'June 24, 2026'
    },
    {
      id: 'financial-management-handoff',
      name: 'Financial Management Handoff',
      client: projectRecord.client,
      clientId: projectRecord.clientId,
      projectId: projectRecord.projectId,
      projectTitle: projectRecord.projectTitle,
      deliverables: projectRecord.deliverables,
      status: 'Unable To Execute',
      triggerSource: 'Hours By Project',
      assignedOwner: 'Financial Management',
      lastAction: 'Waiting For Released Hours',
      nextAction: 'Review Missed Incident',
      missedIncident: 'Hours By Project Has Not Been Released Yet',
      dateCreated: 'June 24, 2026',
      dateUpdated: 'June 24, 2026'
    }
  ];

  function readWorkflows() {
    try {
      const saved = JSON.parse(localStorage.getItem(workflowStorageKey) || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (error) {
      // Use defaults when stored data cannot be read.
    }
    return defaultWorkflows;
  }

  function saveWorkflows(workflows) {
    localStorage.setItem(workflowStorageKey, JSON.stringify(workflows));
  }

  function statusClass(status = '') {
    const normalized = status.toLowerCase();
    if (normalized.includes('completed')) return 'completed';
    if (normalized.includes('unable') || normalized.includes('failed')) return 'failed';
    if (normalized.includes('pending')) return 'pending';
    return 'active';
  }

  function renderWorkflowRows(container, fullDetail = false) {
    const workflows = readWorkflows();
    const tbody = container.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = workflows.map((workflow) => {
      const missedLink = workflow.missedIncident && workflow.missedIncident !== 'None'
        ? `<a href="workflow-center.html#${workflow.id}" class="workflow-link">View Missed Incident</a>`
        : '';
      const workflowLink = `<a href="workflow-center.html#${workflow.id}" class="workflow-link">View Workflow</a>`;
      const actionLinks = missedLink
        ? `<span class="workflow-actions-inline">${missedLink}${workflowLink}</span>`
        : `<span class="workflow-actions-inline">${workflowLink}</span>`;

      if (fullDetail) {
        return `<tr><td>${workflow.name}</td><td>${workflow.clientId}</td><td>${workflow.projectId}</td><td>${workflow.projectTitle}</td><td>${workflow.deliverables}</td><td><span class="status-pill ${statusClass(workflow.status)}">${workflow.status}</span></td><td>${workflow.triggerSource}</td><td>${workflow.assignedOwner}</td><td>${workflow.nextAction}</td><td>${actionLinks}</td></tr>`;
      }

      return `<tr><td>${workflow.name}</td><td>${workflow.client}</td><td>${workflow.projectId}</td><td><span class="status-pill ${statusClass(workflow.status)}">${workflow.status}</span></td><td>${actionLinks}</td></tr>`;
    }).join('');
  }

  function renderWorkflowDetails(container) {
    const workflows = readWorkflows();
    container.innerHTML = workflows.map((workflow) => `
      <article class="workflow-detail-card" id="${workflow.id}">
        <div class="kanban-board-header">
          <div>
            <p class="dashboard-kicker">${workflow.triggerSource}</p>
            <h2>${workflow.name}</h2>
            <p>${workflow.lastAction}</p>
          </div>
          <span class="status-pill ${statusClass(workflow.status)}">${workflow.status}</span>
        </div>
        <div class="workflow-detail-meta">
          <div><span>Client ID</span><strong>${workflow.clientId}</strong></div>
          <div><span>Project ID</span><strong>${workflow.projectId}</strong></div>
          <div><span>Project Title</span><strong>${workflow.projectTitle}</strong></div>
          <div><span>Deliverables</span><strong>${workflow.deliverables}</strong></div>
          <div><span>Assigned Owner</span><strong>${workflow.assignedOwner}</strong></div>
          <div><span>Next Required Action</span><strong>${workflow.nextAction}</strong></div>
          <div><span>Date Created</span><strong>${workflow.dateCreated}</strong></div>
          <div><span>Date Updated</span><strong>${workflow.dateUpdated}</strong></div>
        </div>
        ${workflow.missedIncident && workflow.missedIncident !== 'None' ? `<div class="workflow-execution-message">Missed Incident: ${workflow.missedIncident}</div>` : ''}
      </article>
    `).join('');
  }

  function addInitialKanbanCard() {
    let boardState;
    try {
      boardState = JSON.parse(localStorage.getItem(boardStorageKey) || 'null');
    } catch (error) {
      boardState = null;
    }

    if (!boardState || typeof boardState !== 'object') {
      boardState = { intake: [], inProgress: [], clientReview: [], complete: [] };
    }

    Object.keys({ intake: true, inProgress: true, clientReview: true, complete: true }).forEach((column) => {
      if (!Array.isArray(boardState[column])) boardState[column] = [];
    });

    const cardId = 'project-initiation-kompan-paylocity';
    const alreadyExists = Object.values(boardState).some((cards) => Array.isArray(cards) && cards.some((card) => card.id === cardId));
    if (!alreadyExists) {
      boardState.intake.unshift({
        id: cardId,
        title: 'Project Initiated',
        description: `Project "${projectRecord.projectTitle}" Has Been Initiated On June 24, 2026.`,
        label: 'Project Initiation',
        owner: 'Project Manager',
        due: projectRecord.projectId,
        priority: 'High'
      });
      localStorage.setItem(boardStorageKey, JSON.stringify(boardState));
    }
  }

  function completeProjectInitiation() {
    const workflows = readWorkflows().map((workflow) => {
      if (['project-initiation', 'welcome-email', 'kanban-card-creation'].includes(workflow.id)) {
        return {
          ...workflow,
          status: 'Completed',
          lastAction: workflow.id === 'welcome-email' ? 'Welcome Email Sent To Client' : workflow.id === 'kanban-card-creation' ? 'Initial Kanban Card Created' : 'Project Initiated By Project Manager',
          nextAction: workflow.id === 'kanban-card-creation' ? 'Track Card On Dashboard Board' : 'Monitor Active Workflow',
          missedIncident: 'None',
          dateUpdated: 'June 24, 2026'
        };
      }
      return workflow;
    });

    saveWorkflows(workflows);
    addInitialKanbanCard();
    document.querySelectorAll('[data-workflow-widget-list]').forEach((container) => renderWorkflowRows(container));
    document.querySelectorAll('[data-workflow-full-list]').forEach((container) => renderWorkflowRows(container, true));
    document.querySelectorAll('[data-workflow-detail-list]').forEach(renderWorkflowDetails);
    document.querySelectorAll('[data-project-initiation-status]').forEach((status) => {
      status.textContent = 'Project Initiated, Welcome Email Sent, And Kanban Card Created.';
    });
  }

  document.querySelectorAll('[data-workflow-widget-list]').forEach((container) => renderWorkflowRows(container));
  document.querySelectorAll('[data-workflow-full-list]').forEach((container) => renderWorkflowRows(container, true));
  document.querySelectorAll('[data-workflow-detail-list]').forEach(renderWorkflowDetails);
  document.querySelectorAll('[data-initiate-project]').forEach((button) => {
    button.addEventListener('click', completeProjectInitiation);
  });
})();
