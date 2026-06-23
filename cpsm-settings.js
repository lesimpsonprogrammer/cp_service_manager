(() => {
  const form = document.querySelector('#cpsmSettingsForm');
  const resetButton = document.querySelector('#resetSettings');
  const saveMessage = document.querySelector('#settingsSaveMessage');
  const storageKey = 'cpsmSettingsPreview';
  const portalSessionKey = 'momentumDataClientPortalPreview';
  const projectManagerKey = 'projectManagerName';

  if (!form) return;

  const defaults = {
    organizationName: 'Momentum Data client',
    portalName: 'Client Portfolio',
    supportEmail: 'support@momentumdatasolutions.com',
    accountOwner: 'Larry Simpson',
    scheduledNotice: 'Client Portfolio will undergo scheduled update on July 24.',
    clientId: 'CPSM-CLIENT-001',
    clientStatus: 'Active',
    projectManagerName: localStorage.getItem(projectManagerKey) || 'LSimpson',
    clientVisibility: 'Visible after agreement acceptance',
    defaultRole: 'Client',
    accessScope: 'Assigned projects only',
    sessionTimeout: '30 minutes',
    loginMethod: 'Client ID, username, and password',
    requireClientId: true,
    rememberUserOption: false,
    requireMfa: false,
    auditLogEnabled: true,
    requireConfidentiality: true,
    requireEngagement: true,
    trackAgreementStatus: true,
    futureSignatureFlow: false,
    defaultProjectName: 'Active project',
    defaultStatus: 'On track',
    defaultDeliveryFormat: 'Google Sheet',
    defaultDueDateText: 'To be confirmed',
    notifyStatusUpdates: true,
    notifyDeliverables: true,
    notifyAgreements: false,
    weeklySummary: true
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

  applyToForm({ ...defaults, ...readSaved() });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const settings = collectFromForm();
    localStorage.setItem(storageKey, JSON.stringify(settings));
    syncDashboardPreview(settings);
    showMessage('Settings saved for this CPSM preview.');
  });

  resetButton?.addEventListener('click', () => {
    localStorage.removeItem(storageKey);
    applyToForm(defaults);
    syncDashboardPreview(defaults);
    showMessage('Settings reset to the CPSM preview defaults.');
  });
})();
