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
const cookieBanner = document.querySelector("#cookieBanner");
const acceptCookies = document.querySelector("#acceptCookies");
const declineCookies = document.querySelector("#declineCookies");

if (cookieBanner) {
  const cookieChoice = localStorage.getItem("momentumCookieChoice");

  if (!cookieChoice) {
    cookieBanner.classList.add("show");
  }

  acceptCookies?.addEventListener("click", () => {
    localStorage.setItem("momentumCookieChoice", "accepted");
    cookieBanner.classList.remove("show");
  });

  declineCookies?.addEventListener("click", () => {
    localStorage.setItem("momentumCookieChoice", "declined");
    cookieBanner.classList.remove("show");
  });
}

// Client portal demo login behavior
const clientLoginForm = document.querySelector('#clientLoginForm');
const welcomeMessage = document.querySelector('#welcomeMessage');
const companyCell = document.querySelector('#companyCell');
const logoutBtn = document.querySelector('#logoutBtn');

if (clientLoginForm) {
  clientLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(clientLoginForm);
    const clientName = String(formData.get('clientName') || '').trim();
    const clientCompany = String(formData.get('clientCompany') || '').trim();

    if (!clientName || !clientCompany) return;

    sessionStorage.setItem('clientName', clientName);
    sessionStorage.setItem('clientCompany', clientCompany);
    window.location.href = 'client.html';
  });
}

if (welcomeMessage) {
  const clientName = sessionStorage.getItem('clientName');
  const clientCompany = sessionStorage.getItem('clientCompany');

  if (!clientName) {
    window.location.href = 'login.html';
  } else {
    welcomeMessage.textContent = `Hi, ${clientName}, welcome to your project.`;

    if (companyCell && clientCompany) {
      companyCell.textContent = clientCompany;
    }
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('clientName');
    sessionStorage.removeItem('clientCompany');
    window.location.href = 'login.html';
  });
}
