#!/usr/bin/env bash
# Regenerates supabase/cpsm_schema_all_in_one.sql from supabase/migrations/.
#
# Needs psql, pg_dump and python3, plus any throwaway Postgres server you can
# create databases on (standard PG* env vars pick it), e.g.
#   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=pw postgres:16
#   PGHOST=localhost PGUSER=postgres PGPASSWORD=pw scripts/schema-all-in-one/build.sh
#
# It applies every migration in order to a scratch database, snapshots the
# catalog after each one (so every object is credited to the migration that
# introduced it), dumps the final schema, then drops the scratch database.
# It never connects to the live Supabase project.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
app="$(cd "$here/../.." && pwd)"
migrations="$app/supabase/migrations"
out="$app/supabase/cpsm_schema_all_in_one.sql"
db="cpsm_schema_build_$$"
work="$(mktemp -d)"
psql_db=(psql -X -q -v ON_ERROR_STOP=1 -d "$db")

cleanup() {
  dropdb --if-exists "$db" >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

createdb "$db"

# Just enough of Supabase for the migrations to apply: the API roles,
# auth.users / auth.uid(), and the realtime publication.
"${psql_db[@]}" >/dev/null <<'SQL'
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create function auth.uid() returns uuid language sql stable as
  $f$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;
set client_min_messages = error;
create publication supabase_realtime;
SQL

mkdir -p "$work/snapshots"
for file in $(cd "$migrations" && ls *.sql | sort); do
  echo "applying $file" >&2
  PGOPTIONS='-c client_min_messages=warning' "${psql_db[@]}" -f "$migrations/$file" >/dev/null
  "${psql_db[@]}" -A -t -F $'\x1f' -R $'\x1e' -f "$here/catalog.sql" > "$work/snapshots/$file"
done

pg_dump --schema-only --no-owner -n public -n private -d "$db" > "$work/schema.sql"

python3 "$here/generate.py" "$migrations" "$work/snapshots" "$work/schema.sql" "$here/catalog.sql" > "$out"
echo "wrote $out" >&2
