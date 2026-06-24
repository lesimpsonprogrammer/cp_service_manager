(() => {
  const form = document.querySelector('#cpsmSettingsForm');
  const saveMessage = document.querySelector('#settingsSaveMessage');
  const sidebarLinks = Array.from(document.querySelectorAll('.settings-sidebar a'));
  const settingsTitle = document.querySelector('#settingsTitle');
  const storageKey = 'cpsmSettingsPreview';
  const portalSessionKey = 'momentumDataClientPortalPreview';
  const projectManagerKey = 'projectManagerName';
  let resetActionLink = null;

  if (settingsTitle) {
    settingsTitle.textContent = 'Settings & Configurations';
  }

  function applySidebarActionStyles() {
    if (document.querySelector('#settingsSidebarActionStyles')) return;

    const style = document.createElement('style');
    style.id = 'settingsSidebarActionStyles';
    style.textContent = `
      .settings-sidebar {
        display: flex !important;
        flex-direction: column !important;
        gap: 0.16rem !important;
      }

      .settings-sidebar-group {
        gap: 0.1rem !important;
      }

      .settings-sidebar-actions {
        position: static !important;
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 0.55rem !important;
        margin-top: auto !important;
        padding: 0.8rem 0 0 !important;
        border-top: 1px solid #eeeeee !important;
        background: transparent !important;
        backdrop-filter: none !important;
      }

      .settings-sidebar-actions .settings-action-link {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex: 1 1 0 !important;
        min-height: 34px !important;
        padding: 0 0.55rem !important;
        border: 1px solid transparent !important;
        border-radius: 0.48rem !important;
        background: transparent !important;
        color: #2f2f2f !important;
        font-size: 0.78rem !important;
        line-height: 1.2 !important;
        text-decoration: none !important;
      }

      .settings-sidebar-actions .settings-action-link:hover,
      .settings-sidebar-actions .settings-action-link:focus {
        border-color: #e5e5e5 !important;
        background: #f5f5f5 !important;
        color: #111111 !important;
      }
    `;

    document.head.appendChild(style);
  }

  function moveActionsToSidebar() {
    const sidebar = document.querySelector('.settings-sidebar');
    const actions = document.querySelector('.settings-actions');
    if (!sidebar || !actions || sidebar.contains(actions)) return;

    actions.classList.add('settings-sidebar-actions');
    actions.innerHTML = `
      <a href="#" class="settings-action-link" id="settingsSavePreviewLink">Save Preview</a>
      <a href="#" class="settings-action-link" id="settingsResetPreviewLink">Reset Preview</a>
    `;

    sidebar.appendChild(actions);
    applySidebarActionStyles();

    actions.querySelector('#settingsSavePreviewLink')?.addEventListener('click', (event) => {
      event.preventDefault();
      form?.requestSubmit();
    });

    resetActionLink = actions.querySelector('#settingsResetPreviewLink');
  }

  if (!form) return;

  const defaults = {
    organizationName: 'Momentum Data client',
    portalName: 'Client Portfolio',
    supportEmail: 'support@momentumdatasolutions.com',
    accountOwner: 'Larry Simpson',
    scheduledNotice: 'Client Portfolio will undergo scheduled update on July 24.',
    sessionTimeout: '30 minutes',
    loginMethod: 'Client ID, username, and password',
    sudoExpiration: '1 hour from approval',
    sudoApprover: 'Superuser only',
    requireClientId: true,
    rememberUserOption: false,
    requireMfa: false,
    auditLogEnabled: true,
    sudoAccessEnabled: true,
    sudoRequiresReason: true,
    defaultRole: 'Client',
    engineeringAdminAuthority: 'Technical setup plus approved sudo',
    accessScope: 'Assigned projects only',
    permissionReviewCycle: 'Before client launch',
    limitClientToAssignedCompany: true,
    requireRoleReview: true,
    trackPermissionChanges: true,
    hideFinancialsFromClients: true,
    requireConfidentiality: true,
    requireEngagement: true,
    trackAgreementStatus: true,
    futureSignatureFlow: false,
    defaultWorkflowStatus: 'Draft',
    workflowApprovalLevel: 'Project Manager review',
    clientId: 'CPSM-CLIENT-001',
    clientStatus: 'Active',
    projectManagerName: localStorage.getItem(projectManagerKey) || 'LSimpson',
    clientVisibility: 'Visible after agreement acceptance',
    defaultProjectName: 'Active project',
    defaultStatus: 'On track',
    defaultDeliveryFormat: 'Google Sheet',
    defaultDueDateText: 'To be confirmed',
    showFinancialManagement: true,
    showSalesManagement: true,
    financialsRequireAdmin: true,
    clientFinancialViewLimited: true,
    accountingMethod: 'To be configured',
    accountingReviewRole: 'Admin',
    defaultInvoiceStatus: 'Draft',
    invoiceCurrency: 'USD',
    showWorkflows: true,
    showProjectManagement: true,
    showFinancialManagementMenu: true,
    showAgreements: true,
    showInvoices: true,
    showSalesManagementMenu: true,
    showConfigureClient: true,
    showClientOnboarding: true,
    showClientDirectory: true
  };

  function readSaved() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch (error) {
      return {};
    }
  }

  function applyToForm(settings) {
    form.querySelectorAll('input, select, textarea').forEach((field) => {
      if (!field.name || !(field.name in settings)) return;
      if (field.type === 'checkbox') {
        field.checked = Boolean(settings[field.name]);
      } else {
        field.value = settings[field.name];
      }
    });
  }

  function collectFromForm() {
    const settings = { ...defaults };
    form.querySelectorAll('input, select, textarea').forEach((field) => {
      if (!field.name) return;
      settings[field.name] = field.type === 'checkbox' ? field.checked : String(field.value || '').trim();
    });
    return settings;
  }

  function syncDashboardPreview(settings) {
    const saved = JSON.parse(sessionStorage.getItem(portalSessionKey) || '{}');
    const status = String(settings.defaultStatus || 'on track').toLowerCase();
    const deliveryFormat = settings.defaultDeliveryFormat || 'Google Sheet';
    const projectName = settings.defaultProjectName || 'Active project';

    sessionStorage.setItem(portalSessionKey, JSON.stringify({
      ...saved,
      clientName: saved.clientName || settings.accountOwner || 'Client',
      companyName: settings.organizationName || settings.clientId || 'Momentum Data client',
      projectName,
      projectDetails: `${projectName} is currently ${status}. Preferred delivery format: ${deliveryFormat}.`,
      dueDate: settings.defaultDueDateText || 'To be confirmed'
    }));

    localStorage.setItem(projectManagerKey, settings.projectManagerName || 'LSimpson');
  }

  function showMessage(text) {
    if (!saveMessage) return;
    saveMessage.textContent = text;
    saveMessage.hidden = false;
    window.clearTimeout(showMessage.timeoutId);
    showMessage.timeoutId = window.setTimeout(() => {
      saveMessage.hidden = true;
    }, 3500);
  }

  function resetPreviewSettings() {
    localStorage.removeItem(storageKey);
    applyToForm(defaults);
    syncDashboardPreview(defaults);
    showMessage('Settings reset to the CPSM preview defaults.');
  }

  function updateActiveSidebarLink(sectionId) {
    if (!sectionId) return;
    sidebarLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${sectionId}`);
    });
  }

  moveActionsToSidebar();
  applyToForm({ ...defaults, ...readSaved() });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const settings = collectFromForm();
    localStorage.setItem(storageKey, JSON.stringify(settings));
    syncDashboardPreview(settings);
    showMessage('Settings saved for this CPSM preview.');
  });

  resetActionLink?.addEventListener('click', (event) => {
    event.preventDefault();
    resetPreviewSettings();
  });

  if ('IntersectionObserver' in window) {
    const sections = Array.from(document.querySelectorAll('[data-settings-section]'));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) updateActiveSidebarLink(visible.target.id);
    }, {
      rootMargin: '-18% 0px -70% 0px',
      threshold: [0.08, 0.16, 0.28]
    });

    sections.forEach((section) => observer.observe(section));
  }
})();
