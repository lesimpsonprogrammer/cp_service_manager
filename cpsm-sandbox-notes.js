const sandboxNotesSeed = `# CPSM Dashboard / Sandbox Review Notes

## Current Finding
The cpsm-sandbox.html page has a strong visual layout and should be treated as a design reference for the CPSM Home Dashboard. However, it does not currently include all of the live dashboard functionality that has been added elsewhere.

## What Looks Good
- The sandbox layout feels cleaner and more professional.
- The left-side navigation structure is stronger.
- The dashboard cards and command-center style are closer to the desired CPSM product direction.
- The sandbox page provides a better visual foundation for the CPSM Home/Dashboard experience.

## Current Issues
- The Edit Card feature is missing.
- The Add Card feature is missing.
- Kanban card management is not fully connected.
- The Log-in button has returned and should not show inside authenticated CPSM pages.
- The sandbox appears to be an older or separate prototype, not the current functional dashboard.

## Decision
Do not replace the live CPSM dashboard with the sandbox page as-is. Use cpsm-sandbox.html as the design shell and merge the current working dashboard features into that layout.

## Required Merge Direction
Preserve Add Card, Edit Card, Kanban Card Updates, Billable Hours Connection, Client / Project Data Fields, Dashboard Navigation, and Workflow / Project Status Cards.

## Login Button Rule
The CPSM dashboard should not display a Log-in button after the user is already inside the application.

## Visual Direction
The sandbox saved the visual direction, but the current dashboard files saved the functionality. Combine them carefully instead of overwriting one with the other.

Headers, for example in the Kanban Board, are too close to the subheaders and need more spacing.

Billable Hours should look light, crisp, neat, informative, and more structured with fewer oval containers.`;

const sandboxNotesKey = 'cpsmSandboxNotes';

function setSandboxNotesStatus(message) {
  const status = document.getElementById('sandboxNotesStatus');
  if (status) status.textContent = message;
}

function initSandboxNotes() {
  const textarea = document.getElementById('sandboxNotesText');
  const saveButton = document.getElementById('saveSandboxNotes');
  const resetButton = document.getElementById('resetSandboxNotes');

  if (!textarea) return;

  textarea.value = localStorage.getItem(sandboxNotesKey) || sandboxNotesSeed;

  saveButton?.addEventListener('click', () => {
    localStorage.setItem(sandboxNotesKey, textarea.value);
    setSandboxNotesStatus('Notes saved in this browser.');
  });

  resetButton?.addEventListener('click', () => {
    textarea.value = sandboxNotesSeed;
    localStorage.setItem(sandboxNotesKey, sandboxNotesSeed);
    setSandboxNotesStatus('Notes reset to the current decision record.');
  });

  textarea.addEventListener('input', () => {
    setSandboxNotesStatus('Unsaved changes.');
  });
}

document.addEventListener('DOMContentLoaded', initSandboxNotes);
