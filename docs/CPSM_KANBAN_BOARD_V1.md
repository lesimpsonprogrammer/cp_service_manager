# CPSM Kanban Board v1

## Branch

`feature/cpsm-kanban-board-v1`

## Source baseline

This branch starts from the locked customer-facing review copy:

`release/cpsm-build-1.2`

## Purpose

Make the client Project Board the first meaningful workspace clients see after logging in.

## Customer-facing direction

The Kanban board should feel like a professional project-management workspace, not an internal mockup. It should remain clean, neutral, readable, and aligned with the Vercel-inspired CPSM shell.

## Dashboard changes

- The Dashboard now opens with a Project Board heading.
- The greeting is secondary under the Project Board heading.
- A Kanban board appears before the current status update panel.
- The current status update panel remains available below the board.
- The board uses four columns: Intake, In Progress, Client Review, and Complete.
- Standard client view is read-only.
- Internal users can open an edit-enabled board view with `client-portal.html?internal=1`.
- Internal edit mode allows adding cards, editing card details, deleting cards, changing status columns, and moving cards between columns by drag and drop.
- Card placement and edits are saved in browser local storage for this front-end prototype.

## Files added

- `cpsm-kanban.css`
- `cpsm-kanban.js`

## Files updated

- `client-portal.html`

## Future production notes

When connected to Supabase, board cards should be stored as project tasks with:

- Project ID
- Client company ID
- Board column/status
- Card title
- Description
- Priority
- Owner / assignee
- Due date
- Sort order
- Audit timestamps

Production edit access should be controlled by authenticated internal-user roles, not by a URL parameter. The URL parameter is only for the front-end prototype.

No database changes were made in this version.
