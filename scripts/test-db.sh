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
echo "Party rules"
rejects "a party must have at least one type" \
  "insert into parties (code,legal_name) values ('TEST-P1','No Type Party')"

rejects "a malformed GSTIN is rejected" \
  "insert into parties (code,legal_name,gstin) values ('TEST-P2','Bad GSTIN','27AABCK1234M1Z')"

rejects "a malformed PAN is rejected" \
  "insert into parties (code,legal_name,pan) values ('TEST-P3','Bad PAN','AABCK1234')"

rejects "a malformed mobile number is rejected" \
  "insert into parties (code,legal_name,mobile) values ('TEST-P4','Bad Mobile','1234567890')"

rejects "a party cannot be its own broker" \
  "update parties set broker_party_id = id where code = (select code from parties limit 1)"

rejects "a duplicate GSTIN is rejected" \
  "insert into parties (code,legal_name,gstin)
   select 'TEST-P5','Dup GSTIN',gstin from parties where gstin is not null limit 1"

echo
echo "Vehicle rules"
rejects "a malformed registration number is rejected" \
  "insert into vehicles (registration_number) values ('NOTAREG')"

rejects "a negative vehicle capacity is rejected" \
  "insert into vehicles (registration_number,capacity_mt) values ('MH99ZZ9999',-1)"

echo
echo "Employee rules"
rejects "an employee cannot report to themselves" \
  "update employees set reporting_manager_id = id where code = (select code from employees limit 1)"

echo
echo "Reason code rules"
rejects "a duplicate reason code within a category is rejected" \
  "insert into reason_codes (category_id,code,name)
   select category_id,code,'Dup' from reason_codes limit 1"

echo
echo "Weighment rules"
equals "calculated net is a generated column, never writable" \
  "select is_generated from information_schema.columns
    where table_name='weighment_slips' and column_name='calculated_net_weight_kg'" "ALWAYS"

equals "net difference is generated too" \
  "select is_generated from information_schema.columns
    where table_name='weighment_slips' and column_name='net_difference_kg'" "ALWAYS"

rejects "a gross weight below tare is rejected" \
  "insert into weighment_slips (slip_no,weighment_date,direction,gross_weight_kg,tare_weight_kg)
   values ('TEST-W1',current_date,'inward',1000,2000)"

rejects "a zero gross weight is rejected" \
  "insert into weighment_slips (slip_no,weighment_date,direction,gross_weight_kg,tare_weight_kg)
   values ('TEST-W2',current_date,'inward',0,0)"

rejects "the calculated net cannot be written directly (DR-01)" \
  "insert into weighment_slips (slip_no,weighment_date,direction,gross_weight_kg,tare_weight_kg,calculated_net_weight_kg)
   values ('TEST-W3',current_date,'inward',2000,1000,9999)"

rejects "the entry user cannot also be the verifier (INV-24)" \
  "insert into weighment_slips (slip_no,weighment_date,direction,gross_weight_kg,tare_weight_kg,entry_user_id,verified_by_id,verified_at)
   select 'TEST-W4',current_date,'inward',2000,1000,u.id,u.id,now() from users u limit 1"

rejects "a duplicate slip number is rejected" \
  "insert into weighment_slips (slip_no,weighment_date,direction,gross_weight_kg,tare_weight_kg)
   select slip_no,current_date,'inward',2000,1000 from weighment_slips limit 1"

echo
echo "Access control rules"
equals "Super Administrator does NOT hold commercial override (DR-50)" \
  "select count(*) from role_permissions rp
     join roles r on r.id = rp.role_id
     join permissions p on p.id = rp.permission_id
    where r.code='SUPER_ADMIN' and p.module='governance' and p.action='override'" "0"

equals "Physical Verification Team cannot adjust stock (INV-13)" \
  "select count(*) from role_permissions rp
     join roles r on r.id = rp.role_id
     join permissions p on p.id = rp.permission_id
    where r.code='PV_TEAM' and p.module='stock' and p.action='adjust'" "0"

equals "Insurance Manager cannot adjust stock (INV-21)" \
  "select count(*) from role_permissions rp
     join roles r on r.id = rp.role_id
     join permissions p on p.id = rp.permission_id
    where r.code='INS_MANAGER' and p.action in ('adjust','create','transfer')" "0"

equals "Auditor holds no write permission anywhere" \
  "select count(*) from role_permissions rp
     join roles r on r.id = rp.role_id
     join permissions p on p.id = rp.permission_id
    where r.code='AUDITOR'
      and p.action::text not in ('view','view_audit','view_valuation','view_insurance','export','print')" "0"

equals "a facility-scoped permission reaches a stack inside it" \
  "select user_has_permission(
     (select id from users where code='EMP003'),'weighment','create',
     (select id from location_nodes where code='ALY-G1-A-S1'))" "t"

equals "a facility-scoped permission does not reach another facility" \
  "select user_has_permission(
     (select id from users where code='EMP003'),'weighment','create',
     (select id from location_nodes where code='MUR-G1'))" "f"

equals "an unscoped assignment applies everywhere" \
  "select user_has_permission(
     (select id from users where code='EMP001'),'stock','view',
     (select id from location_nodes where code='MUR-G1'))" "t"

rejects "the same role at the same scope cannot be assigned twice" \
  "insert into user_roles (user_id, role_id, location_node_id)
   select user_id, role_id, location_node_id from user_roles limit 1"

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
