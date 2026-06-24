(() => {
  const scopeKey = 'cpsmActiveClientScope';
  const defaultScope = {
    id: '100100',
    name: 'Momentum Data Client',
    status: 'Active',
    access: 'Internal support scope'
  };

  function readScope() {
    try {
      return { ...defaultScope, ...(JSON.parse(localStorage.getItem(scopeKey) || '{}')) };
    } catch (error) {
      return defaultScope;
    }
  }

  function saveScope(scope) {
    localStorage.setItem(scopeKey, JSON.stringify({ ...defaultScope, ...scope }));
  }

  function renderScope(scope = readScope()) {
    document.querySelectorAll('[data-scope-client-id]').forEach((element) => {
      element.textContent = scope.id;
    });

    document.querySelectorAll('[data-scope-client-name]').forEach((element) => {
      element.textContent = scope.name;
    });

    document.querySelectorAll('[data-scope-status]').forEach((element) => {
      element.textContent = scope.status;
    });

    document.querySelectorAll('[data-scope-access]').forEach((element) => {
      element.textContent = scope.access;
    });

    document.querySelectorAll('[data-scope-card]').forEach((card) => {
      card.classList.toggle('is-active', card.dataset.scopeId === scope.id);
    });
  }

  document.querySelectorAll('[data-select-scope]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const card = link.closest('[data-scope-card]');
      if (!card) return;

      const scope = {
        id: card.dataset.scopeId || defaultScope.id,
        name: card.dataset.scopeName || defaultScope.name,
        status: card.dataset.scopeStatus || defaultScope.status,
        access: card.dataset.scopeAccess || defaultScope.access
      };

      saveScope(scope);
      renderScope(scope);
    });
  });

  renderScope();
})();
