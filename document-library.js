document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("documentUploadForm");
  const fileInput = document.getElementById("documentFile");
  const selectedName = document.getElementById("selectedDocumentName");
  const userRole = document.getElementById("documentUserRole");
  const roleHelp = document.getElementById("documentRoleHelp");
  const clientSelect = document.getElementById("documentClient");
  const visibilitySelect = document.getElementById("documentVisibility");
  const statusSelect = document.getElementById("documentStatus");
  const searchInput = document.getElementById("documentSearch");
  const categoryFilter = document.getElementById("documentCategoryFilter");
  const statusFilter = document.getElementById("documentStatusFilter");
  const expirationFilter = document.getElementById("documentExpirationFilter");
  const table = document.getElementById("documentTable");
  const count = document.getElementById("documentCount");

  const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);

  const updateRoleMode = () => {
    const isClient = userRole.value === "client";
    clientSelect.value = "Current Client Account";
    clientSelect.disabled = isClient;

    if (isClient) {
      visibilitySelect.value = "Uploaded by Client";
      statusSelect.value = "Pending Review";
      roleHelp.textContent = "Client users can upload only to their own account. Client assignment is locked.";
    } else {
      roleHelp.textContent = "Internal users can select any client and control status, visibility, category, type, and expiration.";
    }
  };

  const formatFileType = (fileName, selectedType) => {
    const lowerName = fileName.toLowerCase();

    if (lowerName.endsWith(".pdf")) return "PDF";
    if (lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) return "Microsoft Word";
    if (lowerName.endsWith(".xls") || lowerName.endsWith(".xlsx")) return "Microsoft Excel";
    if (lowerName.endsWith(".gdoc")) return "Google Doc";
    if (lowerName.endsWith(".gsheet")) return "Google Sheet";

    return selectedType || "Other";
  };

  const pillClass = (status) => {
    const normalized = status.toLowerCase();
    if (normalized.includes("approved")) return "approved";
    if (normalized.includes("review")) return "review";
    if (normalized.includes("rejected")) return "rejected";
    if (normalized.includes("archived")) return "archived";
    return "uploaded";
  };

  const updateCount = () => {
    const visibleRows = Array.from(table.tBodies[0].rows).filter((row) => row.style.display !== "none").length;
    count.textContent = `${visibleRows} ${visibleRows === 1 ? "document" : "documents"}`;
  };

  const filterRows = () => {
    const searchValue = searchInput.value.trim().toLowerCase();
    const categoryValue = categoryFilter.value;
    const statusValue = statusFilter.value;
    const expirationValue = expirationFilter.value;
    const today = new Date();
    const soon = new Date();
    soon.setDate(today.getDate() + 30);

    Array.from(table.tBodies[0].rows).forEach((row) => {
      const rowText = row.textContent.toLowerCase();
      const rowCategory = row.dataset.category || "";
      const rowStatus = row.dataset.status || "";
      const rowExpiration = row.dataset.expiration || "";
      let expirationMatches = true;

      if (expirationValue === "none") {
        expirationMatches = !rowExpiration;
      }

      if (expirationValue === "expired") {
        expirationMatches = rowExpiration ? new Date(`${rowExpiration}T00:00:00`) < today : false;
      }

      if (expirationValue === "expiring") {
        if (!rowExpiration) {
          expirationMatches = false;
        } else {
          const expirationDate = new Date(`${rowExpiration}T00:00:00`);
          expirationMatches = expirationDate >= today && expirationDate <= soon;
        }
      }

      const matches =
        (!searchValue || rowText.includes(searchValue)) &&
        (categoryValue === "all" || rowCategory === categoryValue) &&
        (statusValue === "all" || rowStatus === statusValue) &&
        expirationMatches;

      row.style.display = matches ? "" : "none";
    });

    updateCount();
  };

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    selectedName.textContent = file ? file.name : "PDF, Google Docs/Sheets exports, Word, or Excel";
  });

  userRole.addEventListener("change", updateRoleMode);
  [searchInput, categoryFilter, statusFilter, expirationFilter].forEach((control) => {
    control.addEventListener("input", filterRows);
    control.addEventListener("change", filterRows);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const file = fileInput.files[0];
    const documentName = document.getElementById("documentName").value.trim();
    const client = clientSelect.value;
    const category = document.getElementById("documentCategory").value;
    const selectedType = document.getElementById("documentType").value;
    const expiration = document.getElementById("documentExpiration").value;
    const status = statusSelect.value;
    const visibility = visibilitySelect.value;
    const uploadedBy = userRole.value === "client" ? "Uploaded by Client" : "Uploaded by Internal";
    const type = formatFileType(file ? file.name : "", selectedType);

    const row = table.tBodies[0].insertRow(0);
    row.dataset.category = category;
    row.dataset.status = status;
    row.dataset.expiration = expiration;
    row.innerHTML = `
      <td><strong>${escapeHtml(documentName)}</strong><span>${escapeHtml(uploadedBy)}</span></td>
      <td>${escapeHtml(client)}</td>
      <td>${escapeHtml(category)}</td>
      <td>${escapeHtml(type)}</td>
      <td><span class="table-pill ${pillClass(status)}">${escapeHtml(status)}</span></td>
      <td>${escapeHtml(expiration || "No expiration")}</td>
      <td>${escapeHtml(visibility)}</td>
      <td><button class="table-action" type="button">View</button></td>
    `;

    form.reset();
    updateRoleMode();
    selectedName.textContent = "PDF, Google Docs/Sheets exports, Word, or Excel";
    filterRows();
  });

  updateRoleMode();
  updateCount();
});
