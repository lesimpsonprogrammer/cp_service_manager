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
