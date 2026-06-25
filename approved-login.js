(() => {
  const relationshipSelect = document.querySelector('#businessRelationship');
  const idLabel = document.querySelector('#cpsmIdLabel');
  const idInput = document.querySelector('#clientId');
  const idNote = document.querySelector('#cpsmIdNote');

  if (!relationshipSelect || !idLabel || !idInput || !idNote) return;

  const clientRoles = new Set(['Client Company', 'Client Contact']);
  const requestDateKey = 'cpsmIdRequestDate';

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function updateIdField() {
    const selectedRelationship = relationshipSelect.value;
    const isClientAccess = clientRoles.has(selectedRelationship);

    if (isClientAccess) {
      idLabel.textContent = 'Client ID';
      idInput.placeholder = 'Enter your Client ID';
      idInput.setAttribute('aria-label', 'Client ID');
      idNote.hidden = true;
      return;
    }

    idLabel.textContent = 'CPSM ID';
    idInput.placeholder = 'Enter your CPSM ID';
    idInput.setAttribute('aria-label', 'CPSM ID');

    const lastRequestDate = localStorage.getItem(requestDateKey);
    const shouldShowDailyNote = lastRequestDate !== todayKey();
    idNote.hidden = !shouldShowDailyNote;

    if (shouldShowDailyNote) {
      localStorage.setItem(requestDateKey, todayKey());
    }
  }

  relationshipSelect.addEventListener('change', updateIdField);
  updateIdField();
})();
