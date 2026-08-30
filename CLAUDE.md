# Working notes

- Migrations live in `app/supabase/migrations/` and are **not** auto-applied
  by CI — merging a PR does not touch the live database. Whenever a change
  adds or modifies a migration file, always paste the full SQL directly in
  the chat reply (not just a pointer to the file path) so it can be copied
  straight into the Supabase SQL editor.
