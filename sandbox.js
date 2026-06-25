const sandboxStorageKey = 'cpsmSandboxStateV1';

const initialSandboxState = {
  projects: [
    {
      client: 'Atlas Manufacturing Group',
      project: 'Paylocity Payroll Implementation',
      phase: 'Data Collection',
      status: 'In Review',
      owner: 'Project Manager',
    },
    {
      client: 'Brightline Services',
      project: 'Benefits Deduction Validation',
      phase: 'Configuration Review',
      status: 'Needs Correction',
      owner: 'Implementation Consultant',
    },
    {
      client: 'Northstar Logistics',
      project: 'Employee Census Readiness',
      phase: 'Pre-Go-Live',
      status: 'Approved',
      owner: 'Engineering Admin',
    },
    {
      client: 'Cedar HR Partners',
      project: 'Document Workflow Pilot',
      phase: 'Client Uploads',
      status: 'Missing Items',
      owner: 'Client',
    },
  ],
  documents: [
    { name: 'Employee Census File', client: 'Atlas Manufacturing Group', category: 'Payroll Data', status: 'In Review', owner: 'Project Manager' },
    { name: 'Payroll Calendar', client: 'Atlas Manufacturing Group', category: 'Payroll Setup', status: 'Approved', owner: 'Implementation Consultant' },
    { name: 'Benefits Plan Document', client: 'Brightline Services', category: 'Benefits', status: 'Needs Correction', owner: 'Client' },
    { name: 'Earnings Code Matrix', client: 'Northstar Logistics', category: 'Configuration', status: 'Approved', owner: 'Engineering Admin' },
    { name: 'Deduction Code Matrix', client: 'Brightline Services', category: 'Configuration', status: 'In Review', owner: 'Project Consultant' },
    { name: 'GL Mapping File', client: 'Cedar HR Partners', category: 'Accounting', status: 'Missing Items', owner: 'Client' },
  ],
  validations: [
    { label: 'Employee Records', score: 96 },
    { label: 'Payroll Setup Fields', score: 88 },
    { label: 'Benefits Deductions', score: 84 },
    { label: 'Document Completeness', score: 72 },
  ],
  logs: [
    { time: '08:15 AM', event: 'Sandbox initialized with mock implementation data.' },
    { time: '08:18 AM', event: 'Mock Paylocity-style connector set to Ready.' },
    { time: '08:21 AM', event: 'Document workflow tracker loaded sample files.' },
  ],
};

function getState() {
  const savedState = localStorage.getItem(sandboxStorageKey);
  if (!savedState) return structuredClone(initialSandboxState);

  try {
    return JSON.parse(savedState);
  } catch (error) {
    console.warn('Unable to parse saved sandbox state. Resetting sandbox.', error);
    return structuredClone(initialSandboxState);
  }
}

function saveState(state) {
  localStorage.setItem(sandboxStorageKey, JSON.stringify(state));
}

let sandboxState = getState();

const projectList = document.querySelector('#sandboxProjectList');
const documentRows = document.querySelector('#documentWorkflowRows');
const validationStack = document.querySelector('#validationStack');
const activityLog = document.querySelector('#activityLog');
const mockClientCount = document.querySelector('#mockClientCount');
const openWorkflowCount = document.querySelector('#openWorkflowCount');
const integrationJobCount = document.querySelector('#integrationJobCount');
const dataQualityScore = document.querySelector('#dataQualityScore');
const lastMockJob = document.querySelector('#lastMockJob');
const mockConnectionStatus = document.querySelector('#mockConnectionStatus');

function statusClass(status = '') {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus.includes('approved')) return 'status-approved';
  if (normalizedStatus.includes('correction')) return 'status-correction';
  if (normalizedStatus.includes('missing')) return 'status-missing';
  return 'status-in-review';
}

function currentTimeLabel() {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}

function addLog(event) {
  sandboxState.logs.unshift({ time: currentTimeLabel(), event });
  sandboxState.logs = sandboxState.logs.slice(0, 18);
  saveState(sandboxState);
  renderSandbox();
}

function calculateDataQuality() {
  const scores = sandboxState.validations.map((item) => item.score);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average);
}

function renderMetrics() {
  if (mockClientCount) mockClientCount.textContent = String(sandboxState.projects.length);

  const openItems = sandboxState.documents.filter((document) => document.status !== 'Approved').length +
    sandboxState.projects.filter((project) => project.status !== 'Approved').length;

  if (openWorkflowCount) openWorkflowCount.textContent = String(openItems);
  if (integrationJobCount) integrationJobCount.textContent = String(Math.max(6, sandboxState.logs.length));
  if (dataQualityScore) dataQualityScore.textContent = `${calculateDataQuality()}%`;
}

function renderProjects() {
  if (!projectList) return;

  projectList.innerHTML = sandboxState.projects.map((project) => `
    <article class="project-card">
      <div>
        <h3>${project.client}</h3>
        <p><strong>${project.project}</strong> · ${project.phase} · Owner: ${project.owner}</p>
      </div>
      <span class="status-pill ${statusClass(project.status)}">${project.status}</span>
    </article>
  `).join('');
}

function renderDocuments() {
  if (!documentRows) return;

  documentRows.innerHTML = sandboxState.documents.map((document) => `
    <tr>
      <td>${document.name}</td>
      <td>${document.client}</td>
      <td>${document.category}</td>
      <td><span class="status-pill ${statusClass(document.status)}">${document.status}</span></td>
      <td>${document.owner}</td>
    </tr>
  `).join('');
}

function renderValidations() {
  if (!validationStack) return;

  validationStack.innerHTML = sandboxState.validations.map((item) => `
    <div class="validation-item">
      <span>${item.label}<strong>${item.score}%</strong></span>
      <div class="validation-bar" aria-hidden="true"><strong style="width: ${item.score}%"></strong></div>
    </div>
  `).join('');
}

function renderLog() {
  if (!activityLog) return;

  activityLog.innerHTML = sandboxState.logs.map((log) => `
    <div class="log-entry"><strong>${log.time}</strong><span>${log.event}</span></div>
  `).join('');
}

function renderSandbox() {
  renderMetrics();
  renderProjects();
  renderDocuments();
  renderValidations();
  renderLog();
}

const resetButton = document.querySelector('#resetSandboxData');
if (resetButton) {
  resetButton.addEventListener('click', () => {
    sandboxState = structuredClone(initialSandboxState);
    saveState(sandboxState);
    renderSandbox();
  });
}

const correctionButton = document.querySelector('#addCorrectionItem');
if (correctionButton) {
  correctionButton.addEventListener('click', () => {
    sandboxState.documents.unshift({
      name: 'New Payroll Setup Correction',
      client: 'Atlas Manufacturing Group',
      category: 'Payroll Setup',
      status: 'Needs Correction',
      owner: 'Client',
    });

    addLog('Correction request simulated for payroll setup document.');
  });
}

const runImportButton = document.querySelector('#runMockImport');
if (runImportButton) {
  runImportButton.addEventListener('click', () => {
    if (mockConnectionStatus) mockConnectionStatus.textContent = 'Connected';
    if (lastMockJob) lastMockJob.textContent = 'Completed now';

    sandboxState.validations = sandboxState.validations.map((item) => ({
      ...item,
      score: Math.min(99, item.score + Math.floor(Math.random() * 5) + 1),
    }));

    addLog('Mock Paylocity-style import completed: employee, department, pay group, and document status fields processed.');
  });
}

const clearLogButton = document.querySelector('#clearActivityLog');
if (clearLogButton) {
  clearLogButton.addEventListener('click', () => {
    sandboxState.logs = [{ time: currentTimeLabel(), event: 'Activity log cleared for sandbox review.' }];
    saveState(sandboxState);
    renderSandbox();
  });
}

renderSandbox();
