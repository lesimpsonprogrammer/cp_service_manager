(() => {
  const toggle = document.querySelector('#portalPanelToggle');
  const drawer = document.querySelector('#portalPanelMenu');
  const closeButton = document.querySelector('#portalPanelClose');
  const backdrop = document.querySelector('#portalPanelBackdrop');
  const menuLogout = document.querySelector('#portalMenuLogout');

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

  if (menuLogout) {
    menuLogout.addEventListener('click', () => {
      sessionStorage.removeItem('momentumDataClientPortalPreview');
      window.location.href = 'login.html';
    });
  }
})();
