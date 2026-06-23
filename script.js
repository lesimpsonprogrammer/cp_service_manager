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

  const brandLogoTextNodes = document.querySelectorAll('.brand-text-logo');

  brandLogoTextNodes.forEach((brandText) => {
    const originalText = brandText.textContent.trim() || 'Momentum Data Solutions';
    const brandLink = brandText.closest('.brand') || brandText.parentElement;
    const logoWrap = document.createElement('span');
    const logoImage = document.createElement('img');
    const logoLabel = document.createElement('span');

    logoWrap.className = 'brand-logo-wrap';
    logoWrap.style.display = 'inline-flex';
    logoWrap.style.alignItems = 'center';
    logoWrap.style.gap = '10px';

    logoImage.src = momentumLogoSrc;
    logoImage.alt = 'Momentum Data logo';
    logoImage.className = 'brand-logo brand-logo-transparent';
    logoImage.decoding = 'async';
    logoImage.loading = 'eager';
    logoImage.style.display = 'block';
    logoImage.style.width = 'auto';
    logoImage.style.height = '58px';
    logoImage.style.maxHeight = '58px';
    logoImage.style.objectFit = 'contain';

    logoLabel.className = 'brand-logo-label';
    logoLabel.textContent = originalText;
    logoLabel.style.color = '#ffffff';
    logoLabel.style.fontFamily = 'var(--font-heading)';
    logoLabel.style.fontSize = 'clamp(1.08rem, 1.6vw, 1.38rem)';
    logoLabel.style.fontWeight = '600';
    logoLabel.style.lineHeight = '1.05';
    logoLabel.style.letterSpacing = '-0.02em';
    logoLabel.style.whiteSpace = 'normal';

    logoWrap.append(logoImage, logoLabel);
    brandText.replaceWith(logoWrap);

    if (brandLink) {
      brandLink.style.alignItems = 'center';
      brandLink.style.gap = '0';
      brandLink.setAttribute('aria-label', originalText);
    }
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
    dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
    project: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h16"/><path d="M7 4.5h10l3 3v12H4v-12l3-3Z"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>',
    financial: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18"/><path d="M16.5 7.5c-.9-1.2-2.4-1.8-4.2-1.8-2.4 0-4.1 1.1-4.1 2.9 0 4.1 8.6 1.8 8.6 6.4 0 1.9-1.7 3.3-4.4 3.3-2.1 0-3.8-.8-4.9-2.2"/></svg>',
    onboarding: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.8 19c.7-3.2 2.5-5 5.2-5 2.3 0 3.9 1.2 4.8 3.4"/><path d="M17 9v6"/><path d="M14 12h6"/></svg>',
    agreements: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h9l3 3V20H6V3.5Z"/><path d="M14.5 3.8V7h3.2"/><path d="M8.5 11h7"/><path d="M8.5 15h5"/></svg>',
    clientDirectory: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"/><path d="M8 4v16"/><circle cx="13.5" cy="10" r="2"/><path d="M10.8 16c.6-1.7 1.5-2.5 2.7-2.5s2.1.8 2.7 2.5"/></svg>',
    staffDirectory: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8.5" cy="8" r="2.6"/><circle cx="16" cy="9" r="2.2"/><path d="M3.8 18.5c.7-3.1 2.3-4.7 4.7-4.7s4 1.6 4.7 4.7"/><path d="M13.5 16.5c.6-1.8 1.8-2.8 3.5-2.8 1.8 0 3 1.1 3.6 3.2"/></svg>',
    workflow: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8"/><path d="M7.4 7.7 11 16"/><path d="m16.6 7.7-3.6 8.3"/></svg>',
    etl: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h13"/><path d="m14 4 3 3-3 3"/><path d="M20 17H7"/><path d="m10 14-3 3 3 3"/></svg>',
    api: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m14 5-4 14"/></svg>',
    notifications: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 10.5a6 6 0 1 0-12 0c0 4-2 5.5-2 5.5h16s-2-1.5-2-5.5Z"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0"/></svg>'
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

if (year) {
  year.textContent = new Date().getFullYear();
}

// Keep the Client Log-in button on the homepage and positioned after Contact us.
const desktopNavActions = document.querySelector('.nav-actions');
const desktopContactLink = desktopNavActions?.querySelector('.nav-cta[href="#contact"], .nav-cta[href="index.html#contact"]');
const desktopClientLoginLink = desktopNavActions?.querySelector('.nav-client-login[href="login.html"]');

if (desktopContactLink && desktopClientLoginLink) {
  desktopClientLoginLink.textContent = 'Client Log-in';
  desktopContactLink.insertAdjacentElement('afterend', desktopClientLoginLink);
}

const mobileContactLink = navLinks?.querySelector('.mobile-contact');
const mobileClientLoginLink = navLinks?.querySelector('.mobile-client-login');

if (mobileContactLink && mobileClientLoginLink) {
  mobileClientLoginLink.textContent = 'Client Log-in';
  mobileContactLink.insertAdjacentElement('afterend', mobileClientLoginLink);
}

const heroActions = document.querySelector('.hero-actions');
if (heroActions && !heroActions.querySelector('.client-login-hero')) {
  const heroClientLogin = document.createElement('a');
  heroClientLogin.className = 'btn secondary client-login-hero';
  heroClientLogin.href = 'login.html';
  heroClientLogin.textContent = 'Client Log-in';
  heroActions.appendChild(heroClientLogin);
}

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

  carouselLines.forEach((line, index) => {
    line.classList.toggle('active', index === 0);
  });

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

  if (!cookieAccepted) {
    cookieNotice.hidden = false;
  }

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
  dueDate: 'To be confirmed',
};

function populateClientPortal(data = {}) {
  const portalData = { ...defaultPortalData, ...data };

  if (clientWelcome) {
    clientWelcome.textContent = `Hi, ${portalData.clientName}, welcome to your project.`;
  }
  if (portalClientCompany) {
    portalClientCompany.textContent = portalData.companyName;
  }
  if (portalProjectName) {
    portalProjectName.textContent = portalData.projectName;
  }
  if (portalProjectDetails) {
    portalProjectDetails.textContent = portalData.projectDetails;
  }
  if (portalDueDate) {
    portalDueDate.textContent = portalData.dueDate;
  }
  if (portalTableCompany) {
    portalTableCompany.textContent = portalData.companyName;
  }
  if (portalTableProject) {
    portalTableProject.textContent = portalData.projectName;
  }
  if (portalTableDetails) {
    portalTableDetails.textContent = portalData.projectDetails;
  }
  if (portalTableDueDate) {
    portalTableDueDate.textContent = portalData.dueDate;
  }
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
    const projectDetails = `${projectName} is currently in mapping and validation. Your Momentum Data team is preparing the next review package and tracking open items here.`;
    const dueDate = 'To be confirmed';

    const portalData = { clientName, companyName, projectName, projectDetails, dueDate };
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
      dueDate: defaultPortalData.dueDate,
    }));

    window.location.href = 'client-portal.html';
  });
}

// Project Manager name storage and editor (allows changing without editing HTML)
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

  if (editBtn) {
    editBtn.addEventListener('click', () => toggleEditor(true));
  }

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
