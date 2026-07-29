#!/usr/bin/env bash
# Database-level tests: schema guarantees, constraints and triggers.
#
# These prove the database rejects invalid data even if application code is
# wrong — the last line of defence (ARCHITECTURE.md 4).
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
URL="${DATABASE_URL:-postgresql://postgres@127.0.0.1:54322/rajguru_dev}"

pass=0; fail=0

ok()   { printf '  ok      %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf '  FAILED  %s\n' "$1"; fail=$((fail+1)); }

# Asserts a statement is REJECTED by the database.
rejects() {
  local desc="$1" sql="$2"
  if psql "$URL" -v ON_ERROR_STOP=1 -q -c "$sql" >/dev/null 2>&1; then
    bad "$desc (statement was accepted but should have been rejected)"
  else
    ok "$desc"
  fi
}

# Asserts a query returns exactly the expected single value.
equals() {
  local desc="$1" sql="$2" expected="$3" actual
  actual="$(psql "$URL" -tAc "$sql" 2>/dev/null)"
  if [[ "$actual" == "$expected" ]]; then ok "$desc"; else bad "$desc (got '$actual', expected '$expected')"; fi
}

echo "Schema guarantees"

# NFR-03: every business table has RLS.
equals "RLS enabled on every business table" \
  "select count(*) from pg_tables where schemaname='public' and rowsecurity=false" "0"

# NFR-01: no floating-point column may hold a quantity or dimension.
equals "no floating-point columns anywhere" \
  "select count(*) from information_schema.columns
    where table_schema='public' and data_type in ('real','double precision')" "0"

# INV-04 (forward guarantee): when stock_ledger arrives, lot_id must stay nullable.
equals "stock_ledger.lot_id nullable if the table exists" \
  "select coalesce((select is_nullable from information_schema.columns
     where table_schema='public' and table_name='stock_ledger' and column_name='lot_id'),'YES')" "YES"

echo
echo "Location hierarchy rules"
rejects "a facility cannot sit inside a stack" \
  "insert into location_nodes (company_id,parent_id,node_type,code,name)
   select c.id, s.id, 'facility','TEST-BAD1','Bad' from companies c, location_nodes s
    where s.node_type='stack' limit 1"

rejects "operational capacity cannot exceed approved capacity" \
  "insert into location_nodes (company_id,parent_id,node_type,code,name,approved_capacity_mt,operational_capacity_mt)
   select c.id,g.id,'bay','TEST-BAD2','Bad',100,500 from companies c, location_nodes g
    where g.node_type='godown' limit 1"

rejects "capacity cannot be negative" \
  "insert into location_nodes (company_id,parent_id,node_type,code,name,approved_capacity_mt)
   select c.id,g.id,'bay','TEST-BAD3','Bad',-5 from companies c, location_nodes g
    where g.node_type='godown' limit 1"

rejects "a location code cannot be duplicated within a company" \
  "insert into location_nodes (company_id,parent_id,node_type,code,name)
   select c.id,g.id,'bay',(select code from location_nodes where node_type='bay' limit 1),'Dup'
     from companies c, location_nodes g where g.node_type='godown' limit 1"

rejects "a location cannot be its own parent" \
  "update location_nodes set parent_id = id where node_type='godown'"

echo
echo "Commodity rules"
rejects "moisture above 100 percent is rejected" \
  "insert into commodities (code,name,standard_moisture_pct) values ('TEST-BAD4','Bad',150)"

rejects "a grade cannot use a variety of another commodity" \
  "insert into grades (commodity_id,variety_id,code,name)
   select c.id,v.id,'TESTX','X' from commodities c, varieties v
    where v.commodity_id <> c.id limit 1"

echo
echo "Audit trail is append-only (NFR-14)"
psql "$URL" -q -c "insert into audit_events (actor_label,action,entity_table)
                   values ('db-test','create','test')" >/dev/null 2>&1
rejects "audit events cannot be updated" "update audit_events set action='tamper' where actor_label='db-test'"
rejects "audit events cannot be deleted" "delete from audit_events where actor_label='db-test'"

echo
if [[ "$fail" -eq 0 ]]; then
  echo "Database tests passed: $pass assertions."
  exit 0
else
  echo "Database tests FAILED: $fail of $((pass+fail)) assertions."
  exit 1
fi
