-- 0002_organisation_and_locations.sql
-- Organisation masters and the location hierarchy.
--
-- The hierarchy is one self-referencing tree (ADR: DECISION_LOG #6) so the
-- structure stays flexible and location precision is derivable from node type.
--
-- Company -> Facility -> Plot -> Godown/Building/Open Yard -> Section/Floor
--         -> Bay/Zone -> Stack/Bin/Heap        (blueprint 9)
--
-- INV-05: stock may be validly posted at ANY node, not only leaves.
--
-- ROLLBACK: drop table location_nodes; drop table companies;

begin;

-- ---------------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------------
create table companies (
  id            uuid primary key default gen_random_uuid(),
  code          text        not null unique,
  name          text        not null,
  legal_name    text,
  gstin         text,
  pan           text,
  address       text,
  is_active     boolean     not null default true,
  effective_from date       not null default current_date,
  effective_to  date,
  notes         text,
  created_at    timestamptz not null default now(),
  created_by    uuid        references users(id),
  updated_at    timestamptz not null default now(),
  updated_by    uuid        references users(id),

  constraint companies_code_not_blank check (length(trim(code)) > 0),
  constraint companies_name_not_blank check (length(trim(name)) > 0),
  constraint companies_effective_range check (effective_to is null or effective_to >= effective_from)
);

create trigger companies_set_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Location nodes — the hierarchy
-- ---------------------------------------------------------------------------
create table location_nodes (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references companies(id) on delete restrict,
  parent_id         uuid references location_nodes(id) on delete restrict,
  node_type         location_node_type not null,

  code              text not null,
  name              text not null,
  description       text,

  -- Land / building identity
  plot_number       text,
  survey_number     text,
  address           text,

  -- Dimensions. numeric, never floating point (NFR-01).
  length_m          numeric(12,3),
  width_m           numeric(12,3),
  height_m          numeric(12,3),
  area_sqm          numeric(14,3),
  volume_cbm        numeric(14,3),

  -- Capacity, in tonnes.
  approved_capacity_mt    numeric(18,3),
  operational_capacity_mt numeric(18,3),

  -- Operational attributes
  storage_method        text,
  fumigation_suitable   boolean not null default true,
  commodity_restrictions text,
  fire_protection       text,
  insurance_location_ref text,
  operational_status    text not null default 'operational',
  responsible_employee  text,

  is_active     boolean     not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  created_by    uuid        references users(id),
  updated_at    timestamptz not null default now(),
  updated_by    uuid        references users(id),

  constraint location_nodes_code_not_blank check (length(trim(code)) > 0),
  constraint location_nodes_name_not_blank check (length(trim(name)) > 0),
  constraint location_nodes_not_own_parent check (parent_id is null or parent_id <> id),

  -- Dimensions and capacities are never negative.
  constraint location_nodes_dimensions_non_negative check (
    coalesce(length_m, 0) >= 0 and coalesce(width_m, 0) >= 0 and
    coalesce(height_m, 0) >= 0 and coalesce(area_sqm, 0) >= 0 and
    coalesce(volume_cbm, 0) >= 0
  ),
  constraint location_nodes_capacity_non_negative check (
    coalesce(approved_capacity_mt, 0) >= 0 and coalesce(operational_capacity_mt, 0) >= 0
  ),
  -- Operational capacity cannot exceed approved capacity where both are stated.
  constraint location_nodes_operational_within_approved check (
    approved_capacity_mt is null
    or operational_capacity_mt is null
    or operational_capacity_mt <= approved_capacity_mt
  ),

  -- Codes are unique within a company.
  constraint location_nodes_code_unique_per_company unique (company_id, code)
);

create index location_nodes_parent_idx   on location_nodes (parent_id);
create index location_nodes_company_idx  on location_nodes (company_id);
create index location_nodes_type_idx     on location_nodes (node_type);
create index location_nodes_active_idx   on location_nodes (is_active);
create index location_nodes_name_trgm    on location_nodes using gin (name gin_trgm_ops);

create trigger location_nodes_set_updated_at
  before update on location_nodes
  for each row execute function set_updated_at();

comment on table location_nodes is
  'Self-referencing storage hierarchy. Stock may be posted at any node (INV-05).';

-- ---------------------------------------------------------------------------
-- Hierarchy integrity
-- ---------------------------------------------------------------------------

-- Which node types may sit under which. A facility cannot be inside a stack.
-- parent_type is nullable: null means "may be a root node". That rules out a
-- composite primary key, so uniqueness uses NULLS NOT DISTINCT (PostgreSQL 15+)
-- to still reject a duplicated root rule.
create table location_node_type_rules (
  child_type  location_node_type not null,
  parent_type location_node_type,          -- null = may be a root
  constraint location_node_type_rules_unique
    unique nulls not distinct (child_type, parent_type)
);

insert into location_node_type_rules (child_type, parent_type) values
  ('facility',        null),
  ('facility',        'company'),
  ('plot',            'facility'),
  ('godown',          'facility'),
  ('godown',          'plot'),
  ('building',        'facility'),
  ('building',        'plot'),
  ('open_yard',       'facility'),
  ('open_yard',       'plot'),
  ('floor',           'godown'),
  ('floor',           'building'),
  ('section',         'godown'),
  ('section',         'building'),
  ('section',         'floor'),
  ('section',         'open_yard'),
  ('bay',             'godown'),
  ('bay',             'building'),
  ('bay',             'floor'),
  ('bay',             'section'),
  ('bay',             'open_yard'),
  ('zone',            'godown'),
  ('zone',            'open_yard'),
  ('zone',            'section'),
  ('stack',           'godown'),
  ('stack',           'open_yard'),
  ('stack',           'bay'),
  ('stack',           'zone'),
  ('stack',           'section'),
  ('bin',             'godown'),
  ('bin',             'bay'),
  ('bin',             'zone'),
  ('bin',             'section'),
  ('heap',            'open_yard'),
  ('heap',            'plot'),
  ('heap',            'zone'),
  ('heap',            'bay'),
  ('loading_point',   'facility'),
  ('loading_point',   'plot'),
  ('loading_point',   'godown'),
  ('unloading_point', 'facility'),
  ('unloading_point', 'plot'),
  ('unloading_point', 'godown'),
  ('gate',            'facility'),
  ('weighbridge',     'facility'),
  ('restricted_area', 'facility'),
  ('restricted_area', 'godown'),
  ('fumigation_zone', 'facility'),
  ('fumigation_zone', 'godown'),
  ('fumigation_zone', 'open_yard'),
  ('fire_safety_zone','facility'),
  ('fire_safety_zone','godown');

-- Enforces the placement rules above and prevents cycles.
create or replace function location_nodes_validate()
returns trigger
language plpgsql
as $$
declare
  v_parent_type location_node_type;
  v_allowed     boolean;
  v_cursor      uuid;
  v_depth       int := 0;
begin
  if new.parent_id is null then
    select exists (
      select 1 from location_node_type_rules
      where child_type = new.node_type and parent_type is null
    ) into v_allowed;

    if not v_allowed then
      raise exception 'A % must have a parent', new.node_type;
    end if;
  else
    select node_type into v_parent_type from location_nodes where id = new.parent_id;

    if v_parent_type is null then
      raise exception 'Parent location % does not exist', new.parent_id;
    end if;

    select exists (
      select 1 from location_node_type_rules
      where child_type = new.node_type and parent_type = v_parent_type
    ) into v_allowed;

    if not v_allowed then
      raise exception 'A % cannot be placed inside a %', new.node_type, v_parent_type;
    end if;

    -- Walk up the tree; a cycle would otherwise loop forever.
    v_cursor := new.parent_id;
    while v_cursor is not null loop
      v_depth := v_depth + 1;
      if v_cursor = new.id then
        raise exception 'This change would create a cycle in the location hierarchy';
      end if;
      if v_depth > 50 then
        raise exception 'Location hierarchy is unexpectedly deep; aborting to avoid a cycle';
      end if;
      select parent_id into v_cursor from location_nodes where id = v_cursor;
    end loop;
  end if;

  return new;
end;
$$;

create trigger location_nodes_validate_trg
  before insert or update of parent_id, node_type on location_nodes
  for each row execute function location_nodes_validate();

-- ---------------------------------------------------------------------------
-- Full path, for display and search
-- ---------------------------------------------------------------------------
create or replace function location_node_path(p_id uuid)
returns text
language sql
stable
as $$
  with recursive up as (
    select id, parent_id, name, 0 as depth
    from location_nodes where id = p_id
    union all
    select n.id, n.parent_id, n.name, up.depth + 1
    from location_nodes n join up on n.id = up.parent_id
  )
  select string_agg(name, ' / ' order by depth desc) from up;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- NFR-03: RLS is enabled on every business table at creation.
-- Policies are permissive for the service role only; no client role holds any
-- grant. Scope-based policies arrive with the roles module (Phase 3 completion).
-- ---------------------------------------------------------------------------
alter table companies                enable row level security;
alter table location_nodes           enable row level security;
alter table location_node_type_rules enable row level security;
alter table users                    enable row level security;
alter table audit_events             enable row level security;

revoke all on companies, location_nodes, location_node_type_rules,
              users, audit_events from public;

commit;
