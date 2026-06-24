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

  const iconMap = {
    'client-portal.html': '<svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5v7a1 1 0 0 1-1 1h-5v-5h-4v5H5a1 1 0 0 1-1-1v-7Z"/></svg>',
    '#systemSettings': '<svg viewBox="0 0 24 24"><path d="M12 3.5v3M12 17.5v3M4.6 7.2l2.6 1.5M16.8 15.3l2.6 1.5M4.6 16.8l2.6-1.5M16.8 8.7l2.6-1.5"/><circle cx="12" cy="12" r="4.25"/></svg>',
    '#securitySettings': '<svg viewBox="0 0 24 24"><path d="M12 3.5 18 6v5.5c0 3.7-2.4 6.9-6 8.1-3.6-1.2-6-4.4-6-8.1V6l6-2.5Z"/><path d="m9.7 12.1 1.5 1.5 3.3-3.4"/></svg>',
    '#roleSettings': '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.8 18.5a5.2 5.2 0 0 1 10.4 0"/><circle cx="17" cy="9" r="2.3"/><path d="M15.2 15.3a4.3 4.3 0 0 1 5 3.2"/></svg>',
    '#permissionSettings': '<svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3"/><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M12 15v2"/></svg>',
    '#onboardingSettings': '<svg viewBox="0 0 24 24"><path d="M5 6.5h8"/><path d="M5 11h8"/><path d="M5 15.5h5"/><path d="m15 16 2 2 4-5"/><rect x="3" y="3.5" width="14" height="17" rx="2"/></svg>',
    '#workflowCenterSettings': '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="5" height="5" rx="1"/><rect x="15" y="14" width="5" height="5" rx="1"/><path d="M9 7.5h3.5a3.5 3.5 0 0 1 3.5 3.5v3"/></svg>',
    '#clientCompanySettings': '<svg viewBox="0 0 24 24"><path d="M4 20V6.5L12 3l8 3.5V20"/><path d="M8 20v-6h8v6"/><path d="M8 9h.01M12 9h.01M16 9h.01"/></svg>',
    '#projectManagementSettings': '<svg viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/><circle cx="7" cy="6" r="1.5"/><circle cx="13" cy="12" r="1.5"/><circle cx="17" cy="18" r="1.5"/></svg>',
    '#financialManagementSettings': '<svg viewBox="0 0 24 24"><path d="M4 18.5h16"/><path d="M7 15V9"/><path d="M12 15V5.5"/><path d="M17 15v-3.5"/><path d="M5 7.5 12 4l7 3.5"/></svg>',
    '#accountingSettings': '<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h4"/></svg>',
    '#invoiceSetupSettings': '<svg viewBox="0 0 24 24"><path d="M7 3.5h10a1 1 0 0 1 1 1v16l-3-1.5-3 1.5-3-1.5-3 1.5v-16a1 1 0 0 1 1-1Z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>',
    '#sidePanelNavigation': '<svg viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>',
    '#auditSettings': '<svg viewBox="0 0 24 24"><path d="M6 3.5h9l3 3V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M14 3.5V7h4"/><path d="M8 12h7"/><path d="M8 16h5"/></svg>'
  };

  function applySettingsSidebarIcons() {
    if (document.querySelector('#settingsSidebarIconStyles')) return;

    const style = document.createElement('style');
    style.id = 'settingsSidebarIconStyles';
    style.textContent = `
      .settings-sidebar a:not(.settings-action-link) {
        display: grid !important;
        grid-template-columns: 18px minmax(0, 1fr) !important;
        align-items: center !important;
        gap: 0.55rem !important;
        padding-top: 0.44rem !important;
        padding-bottom: 0.44rem !important;
      }

      .settings-sidebar-icon {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 18px !important;
        height: 18px !important;
        color: #737373 !important;
      }

      .settings-sidebar-icon svg {
        width: 17px !important;
        height: 17px !important;
        fill: none !important;
        stroke: currentColor !important;
        stroke-width: 1.65 !important;
        stroke-linecap: round !important;
        stroke-linejoin: round !important;
      }

      .settings-sidebar a:hover .settings-sidebar-icon,
      .settings-sidebar a:focus .settings-sidebar-icon,
      .settings-sidebar a.is-active .settings-sidebar-icon {
        color: #111111 !important;
      }
    `;

    document.head.appendChild(style);

    sidebarLinks.forEach((link) => {
      if (link.classList.contains('settings-action-link')) return;
      if (link.querySelector('.settings-sidebar-icon')) return;

      const key = link.getAttribute('href') || '';
      const icon = iconMap[key] || iconMap['#systemSettings'];
      const iconElement = document.createElement('span');
      iconElement.className = 'settings-sidebar-icon';
      iconElement.setAttribute('aria-hidden', 'true');
      iconElement.innerHTML = icon;
      link.prepend(iconElement);
    });
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

  applySettingsSidebarIcons();
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
