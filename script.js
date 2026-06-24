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
}

applyMomentumDataLogo();

function initClientTopNavigation() {
  if (!isCpsmWorkspacePage) return;

  document.querySelectorAll('.nav-links').forEach((navLinks) => {
    if (navLinks.querySelector('.client-resources-dropdown')) return;

    const settingsLink = Array.from(navLinks.querySelectorAll('a')).find((link) => link.getAttribute('href') === 'cpsm-settings.html');

    const resourcesDropdown = document.createElement('div');
    resourcesDropdown.className = 'client-resources-dropdown';
    resourcesDropdown.innerHTML = `
      <button class="client-resources-trigger" type="button" aria-haspopup="true" aria-expanded="false">Client Resources</button>
      <div class="client-resources-menu" role="menu" aria-label="Client Resources">
        <a href="blog.html" role="menuitem">Blog</a>
        <a href="free-tools.html" role="menuitem">Free Tools</a>
      </div>
    `;

    const contactLink = document.createElement('a');
    contactLink.href = 'contact.html';
    contactLink.textContent = 'Contact Us';
    contactLink.className = 'top-contact-link';

    if (settingsLink) {
      navLinks.insertBefore(resourcesDropdown, settingsLink);
      navLinks.insertBefore(contactLink, settingsLink);
    } else {
      navLinks.appendChild(resourcesDropdown);
      navLinks.appendChild(contactLink);
    }
  });
}

initClientTopNavigation();

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
    scope: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16"/><path d="M4 12h16"/><path d="M4 18.5h16"/><circle cx="8" cy="5.5" r="1.8"/><circle cx="15.5" cy="12" r="1.8"/><circle cx="10.5" cy="18.5" r="1.8"/></svg>',
    documents: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8.5L18 7v13.5H6V3.5Z"/><path d="M14.5 3.8V7h3.2"/><path d="M8.5 11h7"/><path d="M8.5 14.5h7"/><path d="M8.5 18h4.8"/></svg>',
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

const railIconStyleId = 'cpsm-rail-icon-style';
if (!document.getElementById(railIconStyleId)) {
  const style = document.createElement('style');
  style.id = railIconStyleId;
  style.textContent = '.dashboard-rail .rail-icon{width:22px;height:22px;flex:0 0 22px;display:inline-flex;align-items:center;justify-content:center}.dashboard-rail .rail-icon svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}';
  document.head.appendChild(style);
}
