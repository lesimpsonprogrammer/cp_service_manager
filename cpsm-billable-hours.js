const taskHistory = {
  'payroll-file-review': {
    label: 'Payroll File Review',
    taskAverage: 1.25,
    clientAverage: 1.4,
    projectAverage: 1.3,
    userAverage: 1.15,
    priorWtdHours: 3.25,
  },
  'benefits-audit-review': {
    label: 'Benefits Audit Review',
    taskAverage: 2.5,
    clientAverage: 2.75,
    projectAverage: 2.25,
    userAverage: 2.4,
    priorWtdHours: 3.75,
  },
  'client-review-prep': {
    label: 'Client Review Prep',
    taskAverage: 3,
    clientAverage: 2.65,
    projectAverage: 2.8,
    userAverage: 2.5,
    priorWtdHours: 4,
  },
  'workflow-configuration': {
    label: 'Workflow Configuration',
    taskAverage: 3.5,
    clientAverage: 3.25,
    projectAverage: 3.75,
    userAverage: 3.1,
    priorWtdHours: 5.5,
  },
};

const estimateWeights = {
  taskAverage: 0.5,
  clientAverage: 0.25,
  projectAverage: 0.15,
  userAverage: 0.1,
};

const formatHours = (value) => `${Number(value).toFixed(2)} hrs`;
const formatTableHours = (value) => Number(value).toFixed(2);

function getWeightedAverage(task) {
  return (
    task.taskAverage * estimateWeights.taskAverage +
    task.clientAverage * estimateWeights.clientAverage +
    task.projectAverage * estimateWeights.projectAverage +
    task.userAverage * estimateWeights.userAverage
  );
}

function setBackendStatus(message, state = 'neutral') {
  const status = document.getElementById('backendSyncStatus');
  if (!status) return;

  status.classList.remove('connected', 'protected', 'offline');
  if (state) status.classList.add(state);
  status.innerHTML = `<strong>Backend:</strong> ${message}`;
}

async function checkSupabaseConnection() {
  const getClient = window.getCpsmSupabaseClient;
  const client = typeof getClient === 'function' ? getClient() : null;

  if (!client) {
    setBackendStatus('Supabase client not loaded yet. Running in local prototype mode.', 'offline');
    return;
  }

  try {
    const { data: sessionData } = await client.auth.getSession();
    const hasSession = Boolean(sessionData?.session);
    const { error } = await client.from('timecard_entries').select('id').limit(1);

    if (!error) {
      setBackendStatus('Connected to Supabase. Timecard table is reachable.', 'connected');
      return;
    }

    if (error.code === '42501' || error.message?.toLowerCase().includes('permission')) {
      setBackendStatus(
        hasSession
          ? 'Connected to Supabase. Timecard access is protected by security policies.'
          : 'Connected to Supabase. Sign-in and RLS policies are needed before live timecard reads/writes.',
        'protected'
      );
      return;
    }

    setBackendStatus(`Supabase responded, but timecard data is not available yet: ${error.message}`, 'protected');
  } catch (error) {
    setBackendStatus(`Unable to reach Supabase from this page: ${error.message}`, 'offline');
  }
}

function toTwelveHourLabel(timeValue, period) {
  const [hourValue, minute] = timeValue.split(':').map(Number);
  let displayHour = hourValue % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

function toMinutes(timeValue, period) {
  const [hourValue, minute] = timeValue.split(':').map(Number);
  let hour = hourValue % 12;
  if (period === 'PM') hour += 12;
  return hour * 60 + minute;
}

function calculateActualHours() {
  const timeIn = document.getElementById('timeIn');
  const timeOut = document.getElementById('timeOut');
  const timeInPeriod = document.getElementById('timeInPeriod');
  const timeOutPeriod = document.getElementById('timeOutPeriod');

  if (!timeIn?.value || !timeOut?.value) return 0;

  const startMinutes = toMinutes(timeIn.value, timeInPeriod.value);
  let endMinutes = toMinutes(timeOut.value, timeOutPeriod.value);

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return (endMinutes - startMinutes) / 60;
}

function updateSmartEstimate() {
  const taskSelect = document.getElementById('taskSelect');
  const expectedUnits = document.getElementById('expectedUnits');
  const selectedTask = taskHistory[taskSelect.value];
  const expectedCount = Math.max(Number(expectedUnits.value) || 1, 1);
  const weightedAverage = getWeightedAverage(selectedTask);
  const systemEstimate = weightedAverage * expectedCount;
  const actualEntryHours = calculateActualHours();
  const actualWtdHours = selectedTask.priorWtdHours + actualEntryHours;
  const variance = actualWtdHours - systemEstimate;
  const timeIn = document.getElementById('timeIn');
  const timeOut = document.getElementById('timeOut');
  const timeInPeriod = document.getElementById('timeInPeriod');
  const timeOutPeriod = document.getElementById('timeOutPeriod');

  document.getElementById('historicalAverage').textContent = formatHours(weightedAverage);
  document.getElementById('systemEstimate').textContent = formatHours(systemEstimate);
  document.getElementById('actualEntryHours').textContent = formatHours(actualEntryHours);
  document.getElementById('actualWtdHours').textContent = formatHours(actualWtdHours);
  document.getElementById('stackEstimatedWtd').textContent = formatHours(systemEstimate);
  document.getElementById('stackActualWtd').textContent = formatHours(actualWtdHours);
  document.getElementById('stackCurrentTask').textContent = selectedTask.label;
  document.getElementById('tableCurrentTask').textContent = selectedTask.label;
  document.getElementById('stackCurrentHours').textContent = formatHours(actualEntryHours);
  document.getElementById('tableCurrentHours').textContent = formatTableHours(actualEntryHours);
  document.getElementById('tableEstimateSource').textContent = 'Weighted Historical Avg.';

  const varianceElement = document.getElementById('estimateVariance');
  varianceElement.textContent = `${variance > 0 ? '+' : ''}${variance.toFixed(2)} hrs`;
  varianceElement.classList.remove('positive', 'negative', 'on-track');
  if (Math.abs(variance) < 0.1) {
    varianceElement.classList.add('on-track');
  } else if (variance > 0) {
    varianceElement.classList.add('positive');
  } else {
    varianceElement.classList.add('negative');
  }

  document.getElementById('stackCurrentTime').textContent = `${toTwelveHourLabel(timeIn.value, timeInPeriod.value)} – ${toTwelveHourLabel(timeOut.value, timeOutPeriod.value)}`;
}

function initializeBillableHours() {
  const controls = ['taskSelect', 'expectedUnits', 'timeIn', 'timeInPeriod', 'timeOut', 'timeOutPeriod'];
  controls.forEach((controlId) => {
    const control = document.getElementById(controlId);
    if (control) {
      control.addEventListener('input', updateSmartEstimate);
      control.addEventListener('change', updateSmartEstimate);
    }
  });

  const recalculateButton = document.getElementById('recalculateEstimate');
  if (recalculateButton) recalculateButton.addEventListener('click', updateSmartEstimate);

  const saveButton = document.getElementById('saveDraftEntry');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      updateSmartEstimate();
      saveButton.textContent = 'Draft Entry Updated';
      window.setTimeout(() => {
        saveButton.textContent = 'Save Draft Entry';
      }, 1600);
    });
  }

  updateSmartEstimate();
  checkSupabaseConnection();
}

document.addEventListener('DOMContentLoaded', initializeBillableHours);
