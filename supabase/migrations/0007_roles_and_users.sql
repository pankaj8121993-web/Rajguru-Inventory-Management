-- 0007_roles_and_users.sql
-- Roles, permissions, scopes and user assignments (blueprint §5).
--
-- This defines *authorisation structure*. It does not implement authentication
-- — login, sessions and MFA arrive when Supabase Auth is provisioned, and the
-- administrator will create the real user accounts then. The matrix has to
-- exist first so every module can be written against it.
--
-- DR-48: roles are many-to-many with users and scoped.
-- DR-49: a user may hold both maker and approver roles but never approve their
--        own transaction (INV-24).
-- DR-50: override authority is a permission in its own right, never implied by
--        administrative access.
--
-- ROLLBACK: drop table user_roles, role_permissions, permissions, roles;
--           drop type permission_action, ownership_type;

begin;

-- ---------------------------------------------------------------------------
-- Structural enums
-- ---------------------------------------------------------------------------

-- Blueprint §5.2. Structural: these appear in authorisation logic, so adding
-- one is a code change, not a configuration change.
create type permission_action as enum (
  'view', 'create', 'edit_draft', 'submit', 'verify', 'approve', 'reject',
  'reverse', 'adjust', 'override', 'export', 'print', 'upload', 'download',
  'allocate', 'reclassify', 'transfer', 'close', 'reopen',
  'manage_master', 'manage_user', 'view_valuation', 'view_insurance',
  'edit_insurance', 'view_audit'
);

create type ownership_type as enum (
  'own', 'stored', 'government', 'pledged', 'under_processing'
);

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
create table roles (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  -- System roles ship with the platform and cannot be deleted, only deactivated.
  is_system   boolean not null default true,
  -- Roles that may hold override authority at all (DR-50). Holding the role
  -- still does not grant an override — the permission must be granted too.
  may_override boolean not null default false,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint roles_code_not_blank check (length(trim(code)) > 0)
);

create trigger roles_set_updated_at
  before update on roles for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Permissions
--
-- A permission is an action on a module. "approve weighment" and "approve
-- adjustment" are different permissions, so approval limits can differ.
-- ---------------------------------------------------------------------------
create table permissions (
  id          uuid primary key default gen_random_uuid(),
  module      text not null,
  action      permission_action not null,
  name        text not null,
  description text,
  -- Actions the blueprint treats as controlled: they require maker-checker and
  -- appear in the approval matrix.
  is_controlled boolean not null default false,
  created_at  timestamptz not null default now(),

  constraint permissions_module_not_blank check (length(trim(module)) > 0),
  constraint permissions_unique unique (module, action)
);

create index permissions_module_idx on permissions (module);

-- ---------------------------------------------------------------------------
-- Role to permission
-- ---------------------------------------------------------------------------
create table role_permissions (
  role_id       uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  -- Whether this grant is bounded by the assignment's scope, or applies
  -- everywhere the role is held.
  is_scoped     boolean not null default true,
  created_at    timestamptz not null default now(),
  created_by    uuid references users(id),
  primary key (role_id, permission_id)
);

create index role_permissions_permission_idx on role_permissions (permission_id);

-- ---------------------------------------------------------------------------
-- User to role, with scope
--
-- The same user may hold the same role at several scopes, and different roles
-- at the same scope. Blueprint §5.1's own example:
--
--   Ramesh | Warehouse Supervisor | Aliyabad Godown 1
--   Ramesh | Fumigation Approver  | Aliyabad Facility
--   Ramesh | Stock Viewer         | All facilities
-- ---------------------------------------------------------------------------
create table user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  role_id     uuid not null references roles(id) on delete restrict,

  -- Scope. A null dimension means "unrestricted on that dimension".
  company_id       uuid references companies(id) on delete restrict,
  location_node_id uuid references location_nodes(id) on delete restrict,
  commodity_id     uuid references commodities(id) on delete restrict,
  owner_type       ownership_type,
  department       text,

  -- Approval limits (DR-40). Null means no limit from this assignment.
  value_limit      numeric(18,2),
  quantity_limit_kg numeric(18,3),

  effective_from date not null default current_date,
  effective_to   date,

  is_active   boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now(),
  created_by  uuid references users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references users(id),

  constraint user_roles_effective_range check (
    effective_to is null or effective_to >= effective_from
  ),
  constraint user_roles_value_limit_non_negative check (
    value_limit is null or value_limit >= 0
  ),
  constraint user_roles_quantity_limit_non_negative check (
    quantity_limit_kg is null or quantity_limit_kg >= 0
  ),
  -- The same role at the same scope twice is a data error, not two grants.
  constraint user_roles_unique_assignment unique nulls not distinct
    (user_id, role_id, company_id, location_node_id, commodity_id, owner_type)
);

create index user_roles_user_idx     on user_roles (user_id);
create index user_roles_role_idx     on user_roles (role_id);
create index user_roles_location_idx on user_roles (location_node_id);
create index user_roles_active_idx   on user_roles (is_active);

create trigger user_roles_set_updated_at
  before update on user_roles for each row execute function set_updated_at();

comment on table user_roles is
  'Scoped role assignments. A user may hold the same role at several scopes (blueprint §5.1).';

-- ---------------------------------------------------------------------------
-- Effective permissions
--
-- The union of a user's granted permissions, each constrained to the scope of
-- the assignment that granted it. This is the function every module will ask.
-- ---------------------------------------------------------------------------
create or replace function user_effective_permissions(p_user_id uuid)
returns table (
  module           text,
  action           permission_action,
  is_controlled    boolean,
  company_id       uuid,
  location_node_id uuid,
  commodity_id     uuid,
  owner_type       ownership_type,
  value_limit      numeric,
  quantity_limit_kg numeric
)
language sql
stable
as $$
  select p.module, p.action, p.is_controlled,
         ur.company_id, ur.location_node_id, ur.commodity_id, ur.owner_type,
         ur.value_limit, ur.quantity_limit_kg
    from user_roles ur
    join roles r             on r.id = ur.role_id
    join role_permissions rp on rp.role_id = r.id
    join permissions p       on p.id = rp.permission_id
   where ur.user_id = p_user_id
     and ur.is_active
     and r.is_active
     and ur.effective_from <= current_date
     and (ur.effective_to is null or ur.effective_to >= current_date);
$$;

/**
 * Whether a user holds a permission, optionally at a location.
 *
 * A grant with a null location applies everywhere. A grant with a location
 * applies to that node and everything beneath it, so a permission on a facility
 * reaches its godowns, bays and stacks.
 */
create or replace function user_has_permission(
  p_user_id  uuid,
  p_module   text,
  p_action   permission_action,
  p_location_node_id uuid default null
)
returns boolean
language sql
stable
as $$
  with granted as (
    select ep.location_node_id
      from user_effective_permissions(p_user_id) ep
     where ep.module = p_module and ep.action = p_action
  ),
  ancestors as (
    -- The chain from the requested node up to the root.
    with recursive up as (
      select id, parent_id from location_nodes where id = p_location_node_id
      union all
      select n.id, n.parent_id from location_nodes n join up on n.id = up.parent_id
    )
    select id from up
  )
  select exists (
    select 1 from granted g
     where g.location_node_id is null
        or p_location_node_id is null
        or g.location_node_id in (select id from ancestors)
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (NFR-03)
-- ---------------------------------------------------------------------------
alter table roles            enable row level security;
alter table permissions      enable row level security;
alter table role_permissions enable row level security;
alter table user_roles       enable row level security;

revoke all on roles, permissions, role_permissions, user_roles from public;

commit;
