(() => {
  const menuItems = [
    { page: 'dashboard', label: 'Dashboard', href: 'client-portal.html', description: 'Open workspace' },
    { page: 'onboarding', label: 'Client Onboarding', href: 'cpsm-client-onboarding.html', description: 'Initiate clients and agreement packets' },
    { page: 'portfolio', label: 'Portfolio', href: 'cpsm-portfolio.html', description: 'Review client portfolio' },
    { page: 'requests', label: 'Requests', href: 'cpsm-requests.html', description: 'Track service requests' },
    { page: 'documents', label: 'Documents', href: 'cpsm-documents.html', description: 'Access shared files' },
    { page: 'messages', label: 'Messages', href: 'cpsm-messages.html', description: 'View communications' },
    { page: 'agreements', label: 'Agreements', href: 'cpsm-agreements.html', description: 'Review initiated contracts' },
    { page: 'settings', label: 'Settings', href: 'cpsm-settings.html', description: 'Configure CPSM' },
  ];

  const body = document.body;
  const currentPage = body.dataset.cpsmPage || getPageFromPath();

  function getPageFromPath() {
    const fileName = window.location.pathname.split('/').pop() || 'client-portal.html';
    const matchedItem = menuItems.find((item) => item.href === fileName);
    return matchedItem?.page || 'dashboard';
  }

  function isCurrent(item) {
    return item.page === currentPage;
  }

  function menuLinksForHeader() {
    return menuItems
      .map((item) => `<a href="${item.href}"${isCurrent(item) ? ' aria-current="page"' : ''}>${item.label}</a>`)
      .join('');
  }

  function menuLinksForDrawer() {
    return menuItems
      .map((item) => `
          <a href="${item.href}"${isCurrent(item) ? ' aria-current="page"' : ''}>
            <strong>${item.label}</strong>
            <span>${item.description}</span>
          </a>`)
      .join('');
  }

  function logoMarkup() {
    return `
      <a aria-label="CPSM dashboard" class="brand cpsm-brand cpsm-brand-logo-link" href="client-portal.html">
        <img class="cpsm-logo cpsm-header-logo" src="assets/cpsm-logo-horizontal.svg?v=20260622" alt="Client Portfolio Service Manager logo" />
      </a>`;
  }

  function injectHeader() {
    if (document.querySelector('.cpsm-header')) return;

    const header = document.createElement('header');
    header.className = 'site-header client-portfolio-header cpsm-header';
    header.id = 'top';
    header.innerHTML = `
      <nav aria-label="CPSM navigation" class="nav container">
        <button class="portal-panel-toggle header-panel-toggle" id="portalPanelToggle" type="button" aria-label="Open CPSM menu" aria-controls="portalPanelMenu" aria-expanded="false">
          <span class="portal-panel-toggle-icon" aria-hidden="true"><span></span><span></span><span></span></span>
          <span class="portal-panel-toggle-label">CPSM Menu</span>
        </button>

        ${logoMarkup()}

        <button aria-expanded="false" aria-label="Open menu" class="nav-toggle"><span></span><span></span><span></span></button>

        <div class="nav-links cpsm-nav-links">
          ${menuLinksForHeader()}
          <a class="mobile-client-login" href="login.html">Log out</a>
        </div>

        <div class="nav-actions nav-contact">
          <a class="nav-client-login" href="login.html">Log out</a>
        </div>
      </nav>`;

    body.insertBefore(header, body.firstChild);
  }

  function injectDrawer() {
    if (!document.querySelector('#portalPanelBackdrop')) {
      const backdrop = document.createElement('div');
      backdrop.className = 'portal-panel-backdrop';
      backdrop.id = 'portalPanelBackdrop';
      backdrop.hidden = true;
      body.appendChild(backdrop);
    }

    if (document.querySelector('#portalPanelMenu')) return;

    const drawer = document.createElement('aside');
    drawer.className = 'portal-panel-drawer';
    drawer.id = 'portalPanelMenu';
    drawer.setAttribute('aria-label', 'CPSM menu');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.hidden = true;
    drawer.innerHTML = `
      <div class="portal-panel-drawer-header">
        <div><p class="tile-kicker">CPSM</p><h2>Portal Menu</h2></div>
        <button class="portal-panel-close" id="portalPanelClose" type="button" aria-label="Close portal menu">×</button>
      </div>
      <div class="portal-panel-sections">
        <section class="side-panel-card tools-card">
          <h2>Workspace</h2>
          <div class="tool-link-list">
            ${menuLinksForDrawer()}
          </div>
        </section>
        <section class="side-panel-card portal-contact-tile">
          <h2>Account access</h2>
          <p>Replies within one business day.</p>
          <button class="btn secondary full" id="portalMenuLogout" type="button">Log out</button>
        </section>
      </div>`;

    body.appendChild(drawer);
  }

  function syncCurrentLinks() {
    document.querySelectorAll('.cpsm-nav-links a, .tool-link-list a').forEach((link) => {
      const matchedItem = menuItems.find((item) => link.getAttribute('href') === item.href);
      if (matchedItem && isCurrent(matchedItem)) {
        link.setAttribute('aria-current', 'page');
      } else if (matchedItem) {
        link.removeAttribute('aria-current');
      }
    });
  }

  function clearClientSessionAndLogout() {
    sessionStorage.removeItem('cpsmClientPortalPreview');
    sessionStorage.removeItem('momentumDataClientPortalPreview');
    window.location.href = 'login.html';
  }

  function initializeDrawerControls() {
    const toggle = document.querySelector('#portalPanelToggle');
    const drawer = document.querySelector('#portalPanelMenu');
    const closeButton = document.querySelector('#portalPanelClose');
    const backdrop = document.querySelector('#portalPanelBackdrop');

    if (!toggle || !drawer || !backdrop) return;

    function openMenu() {
      drawer.hidden = false;
      backdrop.hidden = false;
      drawer.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      drawer.hidden = true;
      backdrop.hidden = true;
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', openMenu);
    closeButton?.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);

    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !drawer.hidden) {
        closeMenu();
      }
    });
  }

  function initializeLogout() {
    document.querySelectorAll('#portalMenuLogout, #portalLogout').forEach((button) => {
      button.addEventListener('click', clearClientSessionAndLogout);
    });
  }

  const shouldInjectPortalMenu = body.classList.contains('cpsm-app') || body.classList.contains('cpsm-module-page');

  if (shouldInjectPortalMenu) {
    injectHeader();
    injectDrawer();
    syncCurrentLinks();
    initializeDrawerControls();
    initializeLogout();
  }
})();
