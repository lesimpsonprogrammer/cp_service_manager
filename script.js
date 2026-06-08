const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const year = document.querySelector('#year');

if (year) {
  year.textContent = new Date().getFullYear();
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
const portalLogout = document.querySelector('#portalLogout');

if (clientLoginForm && clientLoginCard && clientDashboard) {
  clientLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(clientLoginForm);
    const clientName = String(formData.get('clientName') || 'Client').trim() || 'Client';
    const companyName = String(formData.get('companyName') || 'Client company').trim() || 'Client company';
    const projectName = String(formData.get('projectName') || 'Data extraction project').trim() || 'Data extraction project';

    clientWelcome.textContent = `Hi, ${clientName}, welcome to your project.`;
    portalClientCompany.textContent = companyName;
    portalProjectName.textContent = projectName;
    portalProjectDetails.textContent = 'Project scope, extraction details, validation notes, and next deliverables will appear here.';
    portalDueDate.textContent = 'To be confirmed';

    clientLoginCard.hidden = true;
    clientDashboard.hidden = false;
  });
}

if (portalLogout && clientLoginCard && clientDashboard) {
  portalLogout.addEventListener('click', () => {
    clientDashboard.hidden = true;
    clientLoginCard.hidden = false;
    if (clientLoginForm) {
      clientLoginForm.reset();
    }
  });
}
