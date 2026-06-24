document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("scopeClientForm");
  const userRole = document.getElementById("scopeUserRole");
  const roleHelp = document.getElementById("scopeRoleHelp");
  const clientSelect = document.getElementById("scopeClient");
  const searchInput = document.getElementById("scopeSearch");
  const serviceFilter = document.getElementById("scopeServiceFilter");
  const statusFilter = document.getElementById("scopeStatusFilter");
  const table = document.getElementById("scopeTable");
  const count = document.getElementById("scopeCount");

  const updateRoleMode = () => {
    const isClient = userRole.value === "client";
    clientSelect.value = "Current Client Account";
    clientSelect.disabled = isClient;
    roleHelp.textContent = isClient
      ? "Client users can scope only against their own account. Client assignment is locked."
      : "Internal users can select any client and build a scope record directly against that account.";
  };

  const pillClass = (status) => {
    const normalized = status.toLowerCase();
    if (normalized.includes("approved") || normalized.includes("completed")) return "approved";
    if (normalized.includes("review") || normalized.includes("progress")) return "review";
    return "uploaded";
  };

  const updateCount = () => {
    const visibleRows = Array.from(table.tBodies[0].rows).filter((row) => row.style.display !== "none").length;
    count.textContent = `${visibleRows} ${visibleRows === 1 ? "scope" : "scopes"}`;
  };

  const filterRows = () => {
    const searchValue = searchInput.value.trim().toLowerCase();
    const serviceValue = serviceFilter.value;
    const statusValue = statusFilter.value;

    Array.from(table.tBodies[0].rows).forEach((row) => {
      const rowText = row.textContent.toLowerCase();
      const rowService = row.dataset.service || "";
      const rowStatus = row.dataset.status || "";
      const matches =
        (!searchValue || rowText.includes(searchValue)) &&
        (serviceValue === "all" || rowService === serviceValue) &&
        (statusValue === "all" || rowStatus === statusValue);

      row.style.display = matches ? "" : "none";
    });

    updateCount();
  };

  userRole.addEventListener("change", updateRoleMode);
  [searchInput, serviceFilter, statusFilter].forEach((control) => {
    control.addEventListener("input", filterRows);
    control.addEventListener("change", filterRows);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const scopeName = document.getElementById("scopeName").value.trim();
    const client = clientSelect.value;
    const serviceType = document.getElementById("scopeServiceType").value;
    const scopeCategory = document.getElementById("scopeCategory").value;
    const priority = document.getElementById("scopePriority").value;
    const status = document.getElementById("scopeStatus").value;
    const target = document.getElementById("scopeEnd").value;

    const row = table.tBodies[0].insertRow(0);
    row.dataset.service = serviceType;
    row.dataset.status = status;
    row.innerHTML = `
      <td><strong>${scopeName}</strong><span>${scopeCategory}</span></td>
      <td>${client}</td>
      <td>${serviceType}</td>
      <td>${priority}</td>
      <td><span class="table-pill ${pillClass(status)}">${status}</span></td>
      <td>${target || "To be confirmed"}</td>
      <td><button class="table-action" type="button">View</button></td>
    `;

    form.reset();
    updateRoleMode();
    filterRows();
  });

  updateRoleMode();
  updateCount();
});
