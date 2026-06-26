const visualAdjustmentsHref = 'site-visual-adjustments.css';

if (!document.querySelector(`link[href="${visualAdjustmentsHref}"]`)) {
  const visualAdjustmentsLink = document.createElement('link');
  visualAdjustmentsLink.rel = 'stylesheet';
  visualAdjustmentsLink.href = visualAdjustmentsHref;
  document.head.appendChild(visualAdjustmentsLink);
}

const momentumLogoSrc = 'assets/momentum-data-logo-transparent.svg';

function applyMomentumDataLogo() {
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

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const year = document.querySelector('#year');
const isClientPortalPage = Boolean(document.querySelector('.client-portal-main'));

if (year) {
  year.textContent = new Date().getFullYear();
}

// Keep public site Client Log-in links, but show Log out on the CPSM portal dashboard.
const desktopNavActions = document.querySelector('.nav-actions');
const desktopContactLink = desktopNavActions?.querySelector('.nav-cta[href="#contact"], .nav-cta[href="index.html#contact"]');
const desktopClientLoginLink = desktopNavActions?.querySelector('.nav-client-login[href="login.html"]');

if (desktopContactLink && desktopClientLoginLink) {
  desktopClientLoginLink.textContent = isClientPortalPage ? 'Log out' : 'Client Log-in';
  desktopClientLoginLink.toggleAttribute('data-portal-logout', isClientPortalPage);
  desktopContactLink.insertAdjacentElement('afterend', desktopClientLoginLink);
}

const mobileContactLink = navLinks?.querySelector('.mobile-contact');
const mobileClientLoginLink = navLinks?.querySelector('.mobile-client-login');

if (mobileContactLink && mobileClientLoginLink) {
  mobileClientLoginLink.textContent = isClientPortalPage ? 'Log out' : 'Client Log-in';
  mobileClientLoginLink.toggleAttribute('data-portal-logout', isClientPortalPage);
  mobileContactLink.insertAdjacentElement('afterend', mobileClientLoginLink);
}

const heroActions = document.querySelector('.hero-actions');
if (!isClientPortalPage && heroActions && !heroActions.querySelector('.client-login-hero')) {
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

function renderClientWelcome(clientName = 'Client') {
  if (!clientWelcome) return;

  const firstLine = `Hi, ${clientName},`;
  const secondLine = 'Welcome to Client Portfolio Service Manager.';
  const welcomeLines = clientWelcome.querySelectorAll('span');

  if (welcomeLines.length >= 2) {
    welcomeLines[0].textContent = firstLine;
    welcomeLines[1].textContent = secondLine;
    return;
  }

  clientWelcome.innerHTML = `<span>${firstLine}</span><span>${secondLine}</span>`;
}

function restorePortalWelcomeLogo() {
  const welcomeStack = document.querySelector('.portal-welcome-stack');
  if (!welcomeStack || welcomeStack.querySelector('.portal-welcome-logo')) return;

  const logoLink = document.createElement('a');
  const logoImage = document.createElement('img');

  logoLink.className = 'portal-welcome-logo';
  logoLink.href = 'index.html#top';
  logoLink.setAttribute('aria-label', 'Momentum Data home');

  logoImage.src = momentumLogoSrc;
  logoImage.alt = 'Momentum Data logo';
  logoImage.decoding = 'async';
  logoImage.loading = 'eager';

  logoLink.appendChild(logoImage);
  welcomeStack.insertBefore(logoLink, welcomeStack.firstElementChild);
}

function populateClientPortal(data = {}) {
  const portalData = { ...defaultPortalData, ...data };

  renderClientWelcome(portalData.clientName);

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

if (isClientPortalPage) {
  restorePortalWelcomeLogo();
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

function clearClientSessionAndLogout() {
  sessionStorage.removeItem(clientSessionKey);
  window.location.href = 'login.html';
}

if (portalLogout) {
  portalLogout.addEventListener('click', clearClientSessionAndLogout);
}

document.querySelectorAll('[data-portal-logout="true"]').forEach((logoutLink) => {
  logoutLink.addEventListener('click', (event) => {
    event.preventDefault();
    clearClientSessionAndLogout();
  });
});

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

// Persistent Sandbox Notes area for documenting page-level testing notes.
(() => {
  const sandboxNotesStyleId = 'sandbox-notes-style';
  const existingNotes = document.querySelector('[data-sandbox-notes="true"]');
  const hasCpsmSurface = Boolean(
    document.querySelector('.client-portfolio-header, .client-portal-main, .tool-page-main, .portal-panel-drawer')
  );
  const cpsmPathPattern = /(client-portal|cpsm|calculator|project-estimator|documents|billable|timecard|sandbox)/i;
  const isCpsmSurface = hasCpsmSurface || cpsmPathPattern.test(window.location.pathname);

  if (!isCpsmSurface || existingNotes) return;

  if (!document.getElementById(sandboxNotesStyleId)) {
    const style = document.createElement('style');
    style.id = sandboxNotesStyleId;
    style.textContent = `
      .sandbox-notes-card {
        min-height: auto !important;
      }

      .sandbox-notes-card h2 {
        margin-bottom: 0.5rem !important;
      }

      .sandbox-notes-help {
        margin: 0 0 1rem !important;
        color: var(--muted, #5f6b7a) !important;
        font-size: 0.82rem !important;
        line-height: 1.45 !important;
      }

      .sandbox-notes-textarea {
        width: 100%;
        min-height: 170px;
        resize: vertical;
        padding: 0.95rem 1rem;
        border: 1.5px solid #8e99a8;
        border-radius: 0.95rem;
        background: rgba(255, 255, 255, 0.96);
        color: var(--text, #0b1f3a);
        font: inherit;
        font-size: 0.92rem;
        line-height: 1.5;
      }

      .sandbox-notes-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.7rem;
        margin-top: 0.85rem;
      }

      .sandbox-notes-save,
      .sandbox-notes-clear {
        min-height: 38px;
        padding: 0 0.95rem;
        border: 1px solid #1f6feb;
        border-radius: 999px;
        background: #1f6feb;
        color: #ffffff;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
      }

      .sandbox-notes-clear {
        border-color: #b0b8c4;
        background: #ffffff;
        color: #5f6b7a;
      }

      .sandbox-notes-status {
        color: var(--muted, #5f6b7a);
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .tool-page-main .sandbox-notes-card {
        width: min(760px, 100%);
        margin: 1.5rem auto 0;
      }
    `;
    document.head.appendChild(style);
  }

  const pageKey = window.location.pathname.split('/').pop() || 'dashboard';
  const storageKey = `cpsmSandboxNotes:${pageKey}`;
  const notesCard = document.createElement('section');
  const heading = document.createElement('h2');
  const helpText = document.createElement('p');
  const textarea = document.createElement('textarea');
  const actions = document.createElement('div');
  const saveButton = document.createElement('button');
  const clearButton = document.createElement('button');
  const status = document.createElement('span');

  notesCard.className = 'side-panel-card sandbox-notes-card';
  notesCard.dataset.sandboxNotes = 'true';
  notesCard.setAttribute('aria-label', 'Sandbox page notes');

  heading.textContent = 'Sandbox Page Notes';
  helpText.className = 'sandbox-notes-help';
  helpText.textContent = 'Document page notes, test results, open questions, and changes needed for this sandbox page.';

  textarea.className = 'sandbox-notes-textarea';
  textarea.value = localStorage.getItem(storageKey) || '';
  textarea.placeholder = 'Example: Validate workflow trigger, check layout on mobile, confirm Supabase field mapping...';
  textarea.setAttribute('aria-label', 'Sandbox page notes');

  actions.className = 'sandbox-notes-actions';
  saveButton.className = 'sandbox-notes-save';
  saveButton.type = 'button';
  saveButton.textContent = 'Save Notes';
  clearButton.className = 'sandbox-notes-clear';
  clearButton.type = 'button';
  clearButton.textContent = 'Clear';
  status.className = 'sandbox-notes-status';
  status.textContent = textarea.value ? 'Saved locally' : 'Ready';

  function saveNotes(message = 'Saved locally') {
    localStorage.setItem(storageKey, textarea.value);
    status.textContent = message;
  }

  saveButton.addEventListener('click', () => saveNotes());
  textarea.addEventListener('input', () => saveNotes('Autosaved'));
  clearButton.addEventListener('click', () => {
    textarea.value = '';
    localStorage.removeItem(storageKey);
    status.textContent = 'Cleared';
  });

  actions.append(saveButton, clearButton, status);
  notesCard.append(heading, helpText, textarea, actions);

  const sidePanel = document.querySelector('.client-portal-main .portal-side-panel');
  const toolPageCard = document.querySelector('.tool-page-main .tool-page-card');
  const mainSurface = document.querySelector('.client-portal-main .container, .tool-page-main .container, main');

  if (sidePanel) {
    sidePanel.appendChild(notesCard);
  } else if (toolPageCard) {
    toolPageCard.insertAdjacentElement('afterend', notesCard);
  } else if (mainSurface) {
    mainSurface.appendChild(notesCard);
  }
})();
