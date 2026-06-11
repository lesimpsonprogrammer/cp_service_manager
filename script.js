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

if (clientLoginForm && clientLoginCard && clientDashboard) {
  clientLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(clientLoginForm);
    const clientName = String(formData.get('clientName') || 'Client').trim() || 'Client';
    const companyName = String(formData.get('companyName') || 'Client company').trim() || 'Client company';
    const projectName = String(formData.get('projectName') || 'Data extraction project').trim() || 'Data extraction project';
    const projectDetails = `${projectName} is currently in mapping and validation. Your Momentum Data team is preparing the next review package and tracking open items here.`;
    const dueDate = 'To be confirmed';

    if (clientWelcome) {
      clientWelcome.textContent = `Hi, ${clientName}, welcome to your project.`;
    }
    if (portalClientCompany) {
      portalClientCompany.textContent = companyName;
    }
    if (portalProjectName) {
      portalProjectName.textContent = projectName;
    }
    if (portalProjectDetails) {
      portalProjectDetails.textContent = projectDetails;
    }
    if (portalDueDate) {
      portalDueDate.textContent = dueDate;
    }
    if (portalTableCompany) {
      portalTableCompany.textContent = companyName;
    }
    if (portalTableProject) {
      portalTableProject.textContent = projectName;
    }
    if (portalTableDetails) {
      portalTableDetails.textContent = projectDetails;
    }
    if (portalTableDueDate) {
      portalTableDueDate.textContent = dueDate;
    }

    clientLoginCard.hidden = true;
    clientDashboard.hidden = false;
  });
}

if (portalLogout && clientLoginCard && clientDashboard) {
  portalLogout.addEventListener('click', () => {
    window.location.href = 'login.html';
    if (clientLoginForm) {
      clientLoginForm.reset();
    }
    if (portalMessageForm && messageConfirmation) {
      portalMessageForm.reset();
      messageConfirmation.hidden = true;
    }
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
    window.location.href = 'client-portal.html';
  });
}
