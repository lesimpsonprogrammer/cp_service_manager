# Working notes

- Migrations live in `app/supabase/migrations/` and are **not** auto-applied
  by CI — merging a PR does not touch the live database. Whenever a change
  adds or modifies a migration file, always paste the full SQL directly in
  the chat reply (not just a pointer to the file path) so it can be copied
  straight into the Supabase SQL editor.
- **Master to-do list** (shared across every conversation and agent):
  https://claude.ai/artifact/PUxpiazUheaBcXkSfZRha9. Tasks are documents in
  the `todos` collection of that artifact's database (read and write them
  with the ArtifactData tool). Fields: `title`, `detail`, `area`, `owner`
  (`You` | `Claude` | `Other agent`), `priority` (`high` | `med` | `low`),
  `status` (`todo` | `doing` | `blocked` | `done`), optional `link`,
  `linkLabel`, `session` (this conversation's `session_...` id) and
  `sessionTitle`, plus `createdAt`, `updatedAt`, `updatedBy`.
  - At the start of a task, check the list for items in the same area.
  - When you finish an item, set its `status` to `done`.
  - When a conversation ends waiting on the user (a SQL to run, a dashboard
    click, a yes/no), add or update one item for it with `owner: "You"`.
