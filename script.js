const visualAdjustmentsHref = 'site-visual-adjustments.css';

if (!document.querySelector(`link[href="${visualAdjustmentsHref}"]`)) {
  const visualAdjustmentsLink = document.createElement('link');
  visualAdjustmentsLink.rel = 'stylesheet';
  visualAdjustmentsLink.href = visualAdjustmentsHref;
  document.head.appendChild(visualAdjustmentsLink);
}

const isCpsmWorkspacePage = document.body?.classList.contains('cpsm-dashboard-page') || document.body?.classList.contains('cpsm-settings-page');
const momentumLogoSrc = isCpsmWorkspacePage ? 'assets/momentum-data-md-2.svg' : 'assets/momentum-data-logo-transparent.svg';

function applyMomentumDataLogo() {
  document.querySelectorAll('.brand-logo-transparent').forEach((logoImage) => {
    logoImage.src = momentumLogoSrc;
    logoImage.decoding = 'async';
    logoImage.loading = 'eager';
  });

  const loginCard = document.querySelector('.login-card');
  if (loginCard && !loginCard.querySelector('.login-card-logo')) {
    const loginLogo = document.createElement('img');
    loginLogo.src = momentumLogoSrc;
    loginLogo.alt = 'Momentum Data logo';
    loginLogo.className = 'login-card-logo';
    loginLogo.decoding = 'async';
    loginLogo.loading = 'eager';
    loginLogo.style.display = 'block';
    loginLogo.style.width = 'min(210px, 78%)';
    loginLogo.style.height = 'auto';
    loginLogo.style.margin = '0 auto 24px';
    loginCard.insertBefore(loginLogo, loginCard.firstElementChild);
  }
}

applyMomentumDataLogo();

function dashboardIcon(name) {
  const icons = {
    dashboard: '▦',
    project: '▤',
    financial: '$',
    onboarding: '☷',
    agreements: '▧',
    clientDirectory: '▣',
    staffDirectory: '♙',
    workflow: '⌁',
    etl: '↔',
    api: '</>',
    scope: '◎',
    documents: '▨',
    notifications: '◌'
  };
  return icons[name] || '';
}

function initCpsmDashboardRail() {
  const rail = document.querySelector('.dashboard-rail');
  if (!rail) return;

  const currentPage = window.location.pathname.split('/').pop() || 'client-portal.html';
  const items = [
    { href: 'client-portal.html', label: 'Dashboard', icon: 'dashboard' },
    { href: 'project-management.html', label: 'Project Management', icon: 'project' },
    { href: 'financial-management.html', label: 'Financial Management', icon: 'financial' },
    { href: 'client-onboarding.html', label: 'Client Onboarding', icon: 'onboarding' },
    { href: 'agreements.html', label: 'Agreements', icon: 'agreements' },
    { href: 'client-directory.html', label: 'Client Directory', icon: 'clientDirectory' },
    { href: 'staff-directory.html', label: 'Staff Directory', icon: 'staffDirectory' },
    { href: 'workflow-center.html', label: 'Workflow Center', icon: 'workflow' },
    { href: 'etl-pipeline.html', label: 'ETL Pipeline', icon: 'etl' },
    { href: 'api-center.html', label: 'API', icon: 'api' },
    { href: 'scope.html', label: 'Scope', icon: 'scope' },
    { href: 'documents.html', label: 'Document Library', icon: 'documents' },
    { href: 'notifications.html', label: 'Notifications', icon: 'notifications' }
  ];

  rail.innerHTML = items.map((item) => {
    const isActive = item.href === currentPage || (currentPage === '' && item.href === 'client-portal.html');
    const className = isActive ? ' class="is-active"' : '';
    const ariaCurrent = isActive ? ' aria-current="page"' : '';
    return `<a href="${item.href}"${className}${ariaCurrent}><span class="rail-icon">${dashboardIcon(item.icon)}</span><span>${item.label}</span></a>`;
  }).join('');
}

initCpsmDashboardRail();

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const year = document.querySelector('#year');

if (year) year.textContent = new Date().getFullYear();

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const carouselLines = document.querySelectorAll('.carousel-line');
if (carouselLines.length > 0) {
  let currentLine = 0;
  carouselLines.forEach((line, index) => line.classList.toggle('active', index === 0));
  setInterval(() => {
    carouselLines[currentLine].classList.remove('active');
    currentLine = (currentLine + 1) % carouselLines.length;
    carouselLines[currentLine].classList.add('active');
  }, 3500);
}

const cookieNotice = document.querySelector('#cookieNotice');
const cookieAccept = document.querySelector('#cookieAccept');
const cookieNoticeKey = 'momentumDataCookieNoticeAccepted';

if (cookieNotice && cookieAccept) {
  const cookieAccepted = localStorage.getItem(cookieNoticeKey) === 'true';
  if (!cookieAccepted) cookieNotice.hidden = false;
  cookieAccept.addEventListener('click', () => {
    localStorage.setItem(cookieNoticeKey, 'true');
    cookieNotice.hidden = true;
  });
}

const clientLoginForm = document.querySelector('#clientLoginForm');
const clientLoginCard = document.querySelector('#clientLoginCard');
const clientDashboard = document.querySelector('#clientDashboard');
const clientWelcome = document.querySelector('#clientWelcome');
const portalClientCompany = document.querySelector('#portalClientCompany');
const portalProjectName = document.querySelector('#portalProjectName');
const portalProjectDetails = document.querySelector('#portalProjectDetails');
const portalDueDate = document.querySelector('#portalDueDate');
const portalTableCompany = document.querySelector('#portalTableCompany');
const portalTableProject = document.querySelector('#portalTableProject');
const portalTableDetails = document.querySelector('#portalTableDetails');
const portalTableDueDate = document.querySelector('#portalTableDueDate');
const portalLogout = document.querySelector('#portalLogout');
const portalMessageForm = document.querySelector('#portalMessageForm');
const messageConfirmation = document.querySelector('#messageConfirmation');
const loginPageForm = document.querySelector('#loginPageForm');
const clientSessionKey = 'momentumDataClientPortalPreview';

const defaultPortalData = {
  clientName: 'Client',
  companyName: 'Momentum Data client',
  projectName: 'Active project',
  projectDetails: 'Data mapping is underway. The next client review is scheduled after validation notes are prepared.',
  dueDate: 'To be confirmed'
};

function populateClientPortal(data = {}) {
  const portalData = { ...defaultPortalData, ...data };
  if (clientWelcome) clientWelcome.textContent = `Hi, ${portalData.clientName}, welcome to your project.`;
  if (portalClientCompany) portalClientCompany.textContent = portalData.companyName;
  if (portalProjectName) portalProjectName.textContent = portalData.projectName;
  if (portalProjectDetails) portalProjectDetails.textContent = portalData.projectDetails;
  if (portalDueDate) portalDueDate.textContent = portalData.dueDate;
  if (portalTableCompany) portalTableCompany.textContent = portalData.companyName;
  if (portalTableProject) portalTableProject.textContent = portalData.projectName;
  if (portalTableDetails) portalTableDetails.textContent = portalData.projectDetails;
  if (portalTableDueDate) portalTableDueDate.textContent = portalData.dueDate;
}

if (clientWelcome || portalTableCompany) {
  const savedPortalData = JSON.parse(sessionStorage.getItem(clientSessionKey) || '{}');
  populateClientPortal(savedPortalData);
}

if (clientLoginForm && clientLoginCard && clientDashboard) {
  clientLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(clientLoginForm);
    const clientName = String(formData.get('clientName') || 'Client').trim() || 'Client';
    const companyName = String(formData.get('companyName') || 'Client company').trim() || 'Client company';
    const projectName = String(formData.get('projectName') || 'Data extraction project').trim() || 'Data extraction project';
    const portalData = {
      clientName,
      companyName,
      projectName,
      projectDetails: `${projectName} is currently in mapping and validation. Your Momentum Data team is preparing the next review package and tracking open items here.`,
      dueDate: 'To be confirmed'
    };
    sessionStorage.setItem(clientSessionKey, JSON.stringify(portalData));
    populateClientPortal(portalData);
    clientLoginCard.hidden = true;
    clientDashboard.hidden = false;
  });
}

if (portalLogout) {
  portalLogout.addEventListener('click', () => {
    sessionStorage.removeItem(clientSessionKey);
    window.location.href = 'login.html';
  });
}

if (portalMessageForm && messageConfirmation) {
  portalMessageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    portalMessageForm.reset();
    messageConfirmation.hidden = false;
  });
}

if (loginPageForm) {
  loginPageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(loginPageForm);
    const userName = String(formData.get('userName') || 'Client').trim() || 'Client';
    const clientId = String(formData.get('clientId') || 'Momentum Data client').trim() || 'Momentum Data client';
    sessionStorage.setItem(clientSessionKey, JSON.stringify({
      clientName: userName,
      companyName: clientId,
      projectName: 'Active project',
      projectDetails: defaultPortalData.projectDetails,
      dueDate: defaultPortalData.dueDate
    }));
    window.location.href = 'client-portal.html';
  });
}

(() => {
  const pmNameKey = 'projectManagerName';
  const pmDisplay = document.getElementById('projectManagerName');
  const editBtn = document.getElementById('editProjectManager');
  const editor = document.getElementById('projectManagerEditor');
  const input = document.getElementById('projectManagerInput');
  const saveBtn = document.getElementById('saveProjectManager');

  function loadPM() {
    const name = localStorage.getItem(pmNameKey) || 'LSimpson';
    if (pmDisplay) pmDisplay.textContent = name;
    if (input) input.value = name;
  }

  function toggleEditor(show) {
    if (!editor) return;
    editor.hidden = !show;
    if (show && input) input.focus();
  }

  if (editBtn) editBtn.addEventListener('click', () => toggleEditor(true));
  if (saveBtn && input) {
    saveBtn.addEventListener('click', () => {
      const newName = String(input.value || '').trim() || 'LSimpson';
      localStorage.setItem(pmNameKey, newName);
      if (pmDisplay) pmDisplay.textContent = newName;
      toggleEditor(false);
    });
  }

  loadPM();
})();
