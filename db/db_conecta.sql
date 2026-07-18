-- FILE: 01_schema_normalized.sql
-- ============================================================
-- 01_schema_normalized.sql
-- Marketplace rural y logística inteligente
-- PostgreSQL / Supabase
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ============================================================
-- ENUMS
-- ============================================================

create type public.actor_kind as enum ('PERSON', 'ORGANIZATION');
create type public.listing_type as enum ('OFFER', 'REQUEST');
create type public.listing_status as enum ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'SOLD_OUT', 'CANCELLED');
create type public.negotiation_mode as enum ('QUICK', 'CONVERSATIONAL');
create type public.negotiation_status as enum (
  'OPEN', 'OFFER_SUBMITTED', 'AUTO_ACCEPTED', 'NOT_ACCEPTED',
  'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'
);
create type public.proposal_status as enum ('ACTIVE', 'ACCEPTED', 'REJECTED', 'SUPERSEDED', 'EXPIRED');
create type public.quick_offer_status as enum ('AUTO_ACCEPTED', 'NOT_ACCEPTED', 'UNAVAILABLE', 'RATE_LIMITED');
create type public.order_status as enum (
  'RESERVED', 'PENDING_LOGISTICS', 'CONFIRMED', 'READY_FOR_PICKUP',
  'IN_TRANSIT', 'DELIVERED', 'OBSERVED', 'COMPLETED', 'CANCELLED', 'EXPIRED'
);
create type public.reservation_status as enum ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED', 'CANCELLED');
create type public.logistics_mode as enum ('BUYER_PICKUP', 'PRODUCER_DELIVERY', 'MARKETPLACE_FREIGHT');
create type public.message_type as enum ('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'PROPOSAL_REFERENCE');
create type public.attribute_data_type as enum ('TEXT', 'NUMBER', 'BOOLEAN', 'OPTION', 'DATE');
create type public.organization_member_status as enum ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');
create type public.vehicle_status as enum ('ACTIVE', 'INACTIVE', 'SUSPENDED');
create type public.shipment_status as enum (
  'DRAFT', 'OPEN_FOR_BIDS', 'TRANSPORTER_SELECTED', 'SCHEDULED',
  'PICKED_UP', 'IN_TRANSIT', 'DELAYED', 'DELIVERED', 'CANCELLED'
);
create type public.stop_type as enum ('PICKUP', 'DELIVERY', 'WAYPOINT');
create type public.bid_status as enum ('ACTIVE', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');
create type public.trip_status as enum ('SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'DELAYED', 'DELIVERED', 'CANCELLED');
create type public.evidence_type as enum ('PICKUP_PHOTO', 'DELIVERY_PHOTO', 'WEIGHT_TICKET', 'SIGNATURE', 'DOCUMENT', 'OTHER');
create type public.risk_event_status as enum ('DETECTED', 'UNCONFIRMED', 'CONFIRMED', 'ACTIVE', 'RESOLVED', 'DISCARDED', 'STALE');
create type public.source_type as enum ('OFFICIAL', 'NEWS', 'SOCIAL', 'USER_REPORT', 'MANUAL');
create type public.analysis_provider as enum ('OPENAI', 'RULE_ENGINE', 'MANUAL');
create type public.analysis_status as enum ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');
create type public.notification_status as enum ('UNREAD', 'READ', 'ARCHIVED');

-- ============================================================
-- COMMON FUNCTIONS
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- IDENTITY AND ROLES
-- ============================================================

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  preferred_language text not null default 'es',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'usuario'), '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create table public.app_roles (
  id smallserial primary key,
  code citext not null unique,
  name text not null,
  description text
);

create table public.user_roles (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role_id smallint not null references public.app_roles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

-- ============================================================
-- ORGANIZATIONS AND ACTORS
-- ============================================================

create table public.organization_types (
  id smallserial primary key,
  code citext not null unique,
  name text not null
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  organization_type_id smallint not null references public.organization_types(id),
  legal_name text not null,
  trade_name text,
  tax_identifier text,
  description text,
  created_by uuid not null references public.user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  member_title text,
  status public.organization_member_status not null default 'ACTIVE',
  is_owner boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.verification_statuses (
  id smallserial primary key,
  code citext not null unique,
  name text not null,
  rank smallint not null default 0
);

create table public.actors (
  id uuid primary key default gen_random_uuid(),
  kind public.actor_kind not null,
  user_id uuid unique references public.user_profiles(id) on delete cascade,
  organization_id uuid unique references public.organizations(id) on delete cascade,
  display_name text not null,
  verification_status_id smallint references public.verification_statuses(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_actor_exactly_one_owner check (
    (kind = 'PERSON' and user_id is not null and organization_id is null)
    or
    (kind = 'ORGANIZATION' and organization_id is not null and user_id is null)
  )
);

create trigger trg_actors_updated_at
before update on public.actors
for each row execute function public.set_updated_at();

create table public.actor_roles (
  actor_id uuid not null references public.actors(id) on delete cascade,
  role_id smallint not null references public.app_roles(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (actor_id, role_id)
);

-- ============================================================
-- LOCATIONS
-- ============================================================

create table public.administrative_area_types (
  id smallserial primary key,
  code citext not null unique,
  name text not null,
  level smallint not null unique
);

create table public.administrative_areas (
  id uuid primary key default gen_random_uuid(),
  area_type_id smallint not null references public.administrative_area_types(id),
  parent_id uuid references public.administrative_areas(id) on delete restrict,
  official_code text,
  name text not null,
  created_at timestamptz not null default now(),
  unique (parent_id, name)
);

create index idx_administrative_areas_parent on public.administrative_areas(parent_id);
create index idx_administrative_areas_code on public.administrative_areas(official_code);

create table public.location_points (
  id uuid primary key default gen_random_uuid(),
  administrative_area_id uuid references public.administrative_areas(id),
  label text not null,
  address_reference text,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  access_notes text,
  is_approximate boolean not null default true,
  created_at timestamptz not null default now(),
  constraint chk_latitude check (latitude between -90 and 90),
  constraint chk_longitude check (longitude between -180 and 180)
);

create index idx_location_points_area on public.location_points(administrative_area_id);
create index idx_location_points_coordinates on public.location_points(latitude, longitude);

create table public.actor_locations (
  actor_id uuid not null references public.actors(id) on delete cascade,
  location_point_id uuid not null references public.location_points(id) on delete cascade,
  label text not null,
  is_primary boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (actor_id, location_point_id)
);

-- ============================================================
-- CATALOGS
-- ============================================================

create table public.currencies (
  id smallserial primary key,
  code char(3) not null unique,
  name text not null,
  symbol text not null
);

create table public.units_of_measure (
  id smallserial primary key,
  code citext not null unique,
  name text not null,
  symbol text not null,
  dimension text not null
);

create table public.product_categories (
  id smallserial primary key,
  parent_id smallint references public.product_categories(id),
  code citext not null unique,
  name text not null
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id smallint not null references public.product_categories(id),
  code citext not null unique,
  name text not null,
  default_unit_id smallint not null references public.units_of_measure(id),
  description text,
  is_active boolean not null default true
);

create table public.product_varieties (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  code citext not null,
  name text not null,
  is_active boolean not null default true,
  unique (product_id, code)
);

create table public.product_attribute_definitions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  code citext not null,
  name text not null,
  data_type public.attribute_data_type not null,
  unit_id smallint references public.units_of_measure(id),
  is_required_for_offer boolean not null default false,
  is_required_for_request boolean not null default false,
  display_order smallint not null default 0,
  unique (product_id, code)
);

create table public.product_attribute_options (
  id uuid primary key default gen_random_uuid(),
  attribute_definition_id uuid not null references public.product_attribute_definitions(id) on delete cascade,
  code citext not null,
  label text not null,
  display_order smallint not null default 0,
  unique (attribute_definition_id, code)
);

-- ============================================================
-- MARKETPLACE LISTINGS
-- ============================================================

create table public.market_listings (
  id uuid primary key default gen_random_uuid(),
  listing_type public.listing_type not null,
  actor_id uuid not null references public.actors(id),
  product_id uuid not null references public.products(id),
  variety_id uuid references public.product_varieties(id),
  title text not null,
  description text,
  quantity numeric(18,4) not null,
  unit_id smallint not null references public.units_of_measure(id),
  location_point_id uuid not null references public.location_points(id),
  available_from date,
  deadline_at timestamptz,
  status public.listing_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_listing_quantity_positive check (quantity > 0)
);

create trigger trg_market_listings_updated_at
before update on public.market_listings
for each row execute function public.set_updated_at();

create index idx_market_listings_type_status on public.market_listings(listing_type, status);
create index idx_market_listings_product on public.market_listings(product_id, variety_id);
create index idx_market_listings_actor on public.market_listings(actor_id);
create index idx_market_listings_location on public.market_listings(location_point_id);

create table public.product_offers (
  listing_id uuid primary key references public.market_listings(id) on delete cascade,
  reserved_quantity numeric(18,4) not null default 0,
  minimum_order_quantity numeric(18,4),
  allow_partial_quantity boolean not null default true,
  created_at timestamptz not null default now(),
  constraint chk_offer_reserved_nonnegative check (reserved_quantity >= 0),
  constraint chk_offer_minimum_positive check (minimum_order_quantity is null or minimum_order_quantity > 0)
);

create table public.purchase_requests (
  listing_id uuid primary key references public.market_listings(id) on delete cascade,
  accepts_partial_offers boolean not null default true,
  accepts_multiple_suppliers boolean not null default true,
  requires_single_supplier boolean not null default false,
  delivery_deadline date,
  created_at timestamptz not null default now(),
  constraint chk_request_supplier_rule check (
    not (requires_single_supplier and accepts_multiple_suppliers)
  )
);

create table public.listing_attribute_values (
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  attribute_definition_id uuid not null references public.product_attribute_definitions(id) on delete cascade,
  value_text text,
  value_number numeric(18,6),
  value_boolean boolean,
  value_date date,
  option_id uuid references public.product_attribute_options(id),
  primary key (listing_id, attribute_definition_id),
  constraint chk_listing_attribute_single_value check (
    num_nonnulls(value_text, value_number, value_boolean, value_date, option_id) = 1
  )
);

create table public.offer_negotiation_policies (
  offer_listing_id uuid primary key references public.product_offers(listing_id) on delete cascade,
  currency_id smallint not null references public.currencies(id),
  quick_negotiation_enabled boolean not null default false,
  auto_accept_enabled boolean not null default false,
  conversational_window_hours integer not null default 24,
  max_quick_attempts integer not null default 3,
  attempt_window_minutes integer not null default 60,
  reservation_minutes integer not null default 15,
  updated_at timestamptz not null default now(),
  constraint chk_policy_positive_values check (
    conversational_window_hours > 0
    and max_quick_attempts > 0
    and attempt_window_minutes > 0
    and reservation_minutes > 0
  )
);

create trigger trg_offer_negotiation_policies_updated_at
before update on public.offer_negotiation_policies
for each row execute function public.set_updated_at();

-- Sensitive values are vertically separated from the public negotiation policy.
create table public.offer_private_pricing (
  offer_listing_id uuid primary key references public.offer_negotiation_policies(offer_listing_id) on delete cascade,
  hidden_floor_price numeric(18,4) not null,
  updated_at timestamptz not null default now(),
  constraint chk_private_floor_positive check (hidden_floor_price > 0)
);

create trigger trg_offer_private_pricing_updated_at
before update on public.offer_private_pricing
for each row execute function public.set_updated_at();

create table public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- NEGOTIATIONS
-- ============================================================

create table public.negotiations (
  id uuid primary key default gen_random_uuid(),
  buyer_actor_id uuid not null references public.actors(id),
  producer_actor_id uuid not null references public.actors(id),
  offer_listing_id uuid references public.product_offers(listing_id),
  request_listing_id uuid references public.purchase_requests(listing_id),
  mode public.negotiation_mode not null,
  status public.negotiation_status not null default 'OPEN',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_negotiation_has_context check (
    offer_listing_id is not null or request_listing_id is not null
  ),
  constraint chk_negotiation_different_actors check (
    buyer_actor_id <> producer_actor_id
  )
);

create trigger trg_negotiations_updated_at
before update on public.negotiations
for each row execute function public.set_updated_at();

create index idx_negotiations_buyer on public.negotiations(buyer_actor_id);
create index idx_negotiations_producer on public.negotiations(producer_actor_id);
create index idx_negotiations_status on public.negotiations(status);

create table public.negotiation_participants (
  negotiation_id uuid not null references public.negotiations(id) on delete cascade,
  actor_id uuid not null references public.actors(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (negotiation_id, actor_id)
);

create table public.quick_offer_attempts (
  id uuid primary key default gen_random_uuid(),
  offer_listing_id uuid not null references public.product_offers(listing_id) on delete cascade,
  buyer_actor_id uuid not null references public.actors(id),
  negotiation_id uuid references public.negotiations(id),
  quantity numeric(18,4) not null,
  unit_price numeric(18,4) not null,
  currency_id smallint not null references public.currencies(id),
  result public.quick_offer_status not null,
  created_at timestamptz not null default now(),
  constraint chk_quick_offer_values_positive check (quantity > 0 and unit_price > 0)
);

create index idx_quick_offer_attempt_limit
on public.quick_offer_attempts(offer_listing_id, buyer_actor_id, created_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references public.negotiations(id) on delete cascade,
  sender_actor_id uuid not null references public.actors(id),
  message_type public.message_type not null default 'TEXT',
  body text,
  created_at timestamptz not null default now(),
  constraint chk_message_body check (
    message_type <> 'TEXT' or body is not null
  )
);

create index idx_messages_negotiation_created
on public.messages(negotiation_id, created_at);

create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table public.commercial_proposals (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null references public.negotiations(id) on delete cascade,
  created_by_actor_id uuid not null references public.actors(id),
  supersedes_proposal_id uuid references public.commercial_proposals(id),
  quantity numeric(18,4) not null,
  unit_id smallint not null references public.units_of_measure(id),
  unit_price numeric(18,4) not null,
  currency_id smallint not null references public.currencies(id),
  delivery_date date,
  logistics_mode public.logistics_mode,
  status public.proposal_status not null default 'ACTIVE',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chk_proposal_values_positive check (quantity > 0 and unit_price > 0)
);

create index idx_proposals_negotiation on public.commercial_proposals(negotiation_id, created_at desc);

create table public.proposal_attribute_values (
  proposal_id uuid not null references public.commercial_proposals(id) on delete cascade,
  attribute_definition_id uuid not null references public.product_attribute_definitions(id) on delete cascade,
  value_text text,
  value_number numeric(18,6),
  value_boolean boolean,
  value_date date,
  option_id uuid references public.product_attribute_options(id),
  primary key (proposal_id, attribute_definition_id),
  constraint chk_proposal_attribute_single_value check (
    num_nonnulls(value_text, value_number, value_boolean, value_date, option_id) = 1
  )
);

-- ============================================================
-- ORDERS AND INVENTORY
-- ============================================================

create table public.commercial_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_actor_id uuid not null references public.actors(id),
  delivery_location_point_id uuid references public.location_points(id),
  currency_id smallint not null references public.currencies(id),
  status public.order_status not null default 'RESERVED',
  agreed_delivery_date date,
  reservation_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_commercial_orders_updated_at
before update on public.commercial_orders
for each row execute function public.set_updated_at();

create table public.order_negotiations (
  order_id uuid not null references public.commercial_orders(id) on delete cascade,
  negotiation_id uuid not null references public.negotiations(id) on delete restrict,
  primary key (order_id, negotiation_id),
  unique (negotiation_id)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commercial_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variety_id uuid references public.product_varieties(id),
  quantity numeric(18,4) not null,
  unit_id smallint not null references public.units_of_measure(id),
  agreed_unit_price numeric(18,4) not null,
  created_at timestamptz not null default now(),
  constraint chk_order_item_values_positive check (quantity > 0 and agreed_unit_price > 0)
);

create table public.order_supplier_allocations (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  producer_actor_id uuid not null references public.actors(id),
  source_offer_listing_id uuid references public.product_offers(listing_id),
  allocated_quantity numeric(18,4) not null,
  unit_price numeric(18,4) not null,
  created_at timestamptz not null default now(),
  constraint chk_allocation_values_positive check (
    allocated_quantity > 0 and unit_price > 0
  )
);

create index idx_allocations_producer on public.order_supplier_allocations(producer_actor_id);

create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  allocation_id uuid not null references public.order_supplier_allocations(id) on delete cascade,
  offer_listing_id uuid not null references public.product_offers(listing_id),
  quantity numeric(18,4) not null,
  status public.reservation_status not null default 'ACTIVE',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint chk_reservation_quantity_positive check (quantity > 0)
);

create index idx_inventory_reservations_offer_status
on public.inventory_reservations(offer_listing_id, status, expires_at);

-- ============================================================
-- VEHICLES AND LOGISTICS
-- ============================================================

create table public.vehicle_types (
  id smallserial primary key,
  code citext not null unique,
  name text not null
);

create table public.vehicle_body_types (
  id smallserial primary key,
  code citext not null unique,
  name text not null
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_actor_id uuid not null references public.actors(id),
  vehicle_type_id smallint not null references public.vehicle_types(id),
  body_type_id smallint references public.vehicle_body_types(id),
  plate text,
  capacity_kg numeric(18,2) not null,
  capacity_m3 numeric(18,3),
  covered boolean not null default false,
  refrigerated boolean not null default false,
  four_wheel_drive boolean not null default false,
  status public.vehicle_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_vehicle_capacity_positive check (
    capacity_kg > 0 and (capacity_m3 is null or capacity_m3 > 0)
  )
);

create trigger trg_vehicles_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

create table public.vehicle_document_types (
  id smallserial primary key,
  code citext not null unique,
  name text not null
);

create table public.vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  document_type_id smallint not null references public.vehicle_document_types(id),
  document_number text,
  issued_at date,
  expires_at date,
  storage_path text,
  verified_at timestamptz,
  unique (vehicle_id, document_type_id)
);

create table public.shipment_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commercial_orders(id) on delete cascade,
  requested_by_actor_id uuid not null references public.actors(id),
  logistics_mode public.logistics_mode not null,
  cargo_description text,
  total_weight_kg numeric(18,3),
  total_volume_m3 numeric(18,3),
  suggested_fare numeric(18,2),
  currency_id smallint references public.currencies(id),
  scheduled_pickup_at timestamptz,
  status public.shipment_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_shipment_metrics check (
    (total_weight_kg is null or total_weight_kg > 0)
    and
    (total_volume_m3 is null or total_volume_m3 > 0)
  )
);

create trigger trg_shipment_requests_updated_at
before update on public.shipment_requests
for each row execute function public.set_updated_at();

create table public.shipment_stops (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references public.shipment_requests(id) on delete cascade,
  sequence_number integer not null,
  stop_type public.stop_type not null,
  actor_id uuid references public.actors(id),
  location_point_id uuid not null references public.location_points(id),
  planned_at timestamptz,
  notes text,
  unique (shipment_request_id, sequence_number)
);

create table public.package_types (
  id smallserial primary key,
  code citext not null unique,
  name text not null
);

create table public.shipment_cargo_items (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references public.shipment_requests(id) on delete cascade,
  allocation_id uuid references public.order_supplier_allocations(id),
  package_type_id smallint references public.package_types(id),
  package_count integer,
  weight_kg numeric(18,3),
  volume_m3 numeric(18,3),
  notes text,
  constraint chk_cargo_metrics check (
    (package_count is null or package_count > 0)
    and
    (weight_kg is null or weight_kg > 0)
    and
    (volume_m3 is null or volume_m3 > 0)
  )
);

create table public.freight_bids (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references public.shipment_requests(id) on delete cascade,
  transporter_actor_id uuid not null references public.actors(id),
  vehicle_id uuid not null references public.vehicles(id),
  fare_amount numeric(18,2) not null,
  currency_id smallint not null references public.currencies(id),
  departure_at timestamptz,
  estimated_duration_minutes integer,
  conditions text,
  status public.bid_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  constraint chk_freight_bid_positive check (
    fare_amount > 0
    and
    (estimated_duration_minutes is null or estimated_duration_minutes > 0)
  )
);

create index idx_freight_bids_shipment on public.freight_bids(shipment_request_id, status);

create table public.shipment_assignments (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null unique references public.shipment_requests(id) on delete cascade,
  freight_bid_id uuid not null unique references public.freight_bids(id) on delete restrict,
  accepted_by_actor_id uuid not null references public.actors(id),
  accepted_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  shipment_assignment_id uuid not null unique references public.shipment_assignments(id) on delete cascade,
  status public.trip_status not null default 'SCHEDULED',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_trips_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

create table public.trip_status_history (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  status public.trip_status not null,
  changed_by_actor_id uuid references public.actors(id),
  notes text,
  created_at timestamptz not null default now()
);

create table public.trip_evidence (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  shipment_stop_id uuid references public.shipment_stops(id),
  evidence_type public.evidence_type not null,
  storage_path text,
  recorded_weight numeric(18,3),
  captured_at timestamptz not null default now(),
  captured_by_actor_id uuid references public.actors(id),
  notes text
);

-- ============================================================
-- PRICE INTELLIGENCE
-- ============================================================

create table public.price_sources (
  id smallserial primary key,
  code citext not null unique,
  name text not null,
  source_type public.source_type not null,
  base_reliability numeric(5,4) not null default 0.5000,
  website_url text,
  constraint chk_price_source_reliability check (base_reliability between 0 and 1)
);

create table public.market_price_observations (
  id uuid primary key default gen_random_uuid(),
  source_id smallint not null references public.price_sources(id),
  product_id uuid not null references public.products(id),
  variety_id uuid references public.product_varieties(id),
  administrative_area_id uuid references public.administrative_areas(id),
  market_name text,
  observed_on date not null,
  quantity_basis numeric(18,4) not null default 1,
  unit_id smallint not null references public.units_of_measure(id),
  currency_id smallint not null references public.currencies(id),
  price_low numeric(18,4),
  price_mid numeric(18,4) not null,
  price_high numeric(18,4),
  quality_label text,
  source_url text,
  created_at timestamptz not null default now(),
  constraint chk_market_prices_positive check (
    quantity_basis > 0
    and price_mid > 0
    and (price_low is null or price_low > 0)
    and (price_high is null or price_high > 0)
    and (price_low is null or price_low <= price_mid)
    and (price_high is null or price_mid <= price_high)
  )
);

create index idx_market_price_lookup
on public.market_price_observations(product_id, variety_id, administrative_area_id, observed_on desc);

create table public.listing_price_suggestions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  currency_id smallint not null references public.currencies(id),
  unit_id smallint not null references public.units_of_measure(id),
  price_low numeric(18,4) not null,
  price_mid numeric(18,4) not null,
  price_high numeric(18,4) not null,
  confidence numeric(5,2) not null,
  method_version text not null,
  explanation text,
  calculated_at timestamptz not null default now(),
  constraint chk_listing_price_range check (
    price_low > 0
    and price_low <= price_mid
    and price_mid <= price_high
    and confidence between 0 and 100
  )
);

create index idx_listing_price_suggestions_latest
on public.listing_price_suggestions(listing_id, calculated_at desc);

create table public.price_suggestion_observations (
  suggestion_id uuid not null references public.listing_price_suggestions(id) on delete cascade,
  observation_id uuid not null references public.market_price_observations(id) on delete restrict,
  weight numeric(8,6) not null,
  primary key (suggestion_id, observation_id),
  constraint chk_price_weight check (weight > 0 and weight <= 1)
);

create table public.freight_price_suggestions (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references public.shipment_requests(id) on delete cascade,
  currency_id smallint not null references public.currencies(id),
  fare_low numeric(18,2) not null,
  fare_mid numeric(18,2) not null,
  fare_high numeric(18,2) not null,
  confidence numeric(5,2) not null,
  method_version text not null,
  explanation text,
  calculated_at timestamptz not null default now(),
  constraint chk_freight_price_range check (
    fare_low > 0
    and fare_low <= fare_mid
    and fare_mid <= fare_high
    and confidence between 0 and 100
  )
);

-- ============================================================
-- RISK INTELLIGENCE
-- ============================================================

create table public.risk_sources (
  id smallserial primary key,
  code citext not null unique,
  name text not null,
  source_type public.source_type not null,
  base_reliability numeric(5,4) not null default 0.5000,
  website_url text,
  constraint chk_risk_source_reliability check (base_reliability between 0 and 1)
);

create table public.risk_event_types (
  id smallserial primary key,
  code citext not null unique,
  name text not null,
  default_weight numeric(6,3) not null,
  constraint chk_risk_type_weight check (default_weight > 0)
);

create table public.risk_events (
  id uuid primary key default gen_random_uuid(),
  event_type_id smallint not null references public.risk_event_types(id),
  title text not null,
  summary text,
  administrative_area_id uuid references public.administrative_areas(id),
  road_name text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  affected_radius_km numeric(10,3) not null default 10,
  severity smallint not null,
  source_confidence numeric(5,2) not null,
  status public.risk_event_status not null default 'DETECTED',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_risk_event_coordinates check (
    (latitude is null and longitude is null)
    or
    (latitude between -90 and 90 and longitude between -180 and 180)
  ),
  constraint chk_risk_event_values check (
    affected_radius_km > 0
    and severity between 1 and 5
    and source_confidence between 0 and 100
  )
);

create trigger trg_risk_events_updated_at
before update on public.risk_events
for each row execute function public.set_updated_at();

create index idx_risk_events_status_time
on public.risk_events(status, starts_at, ends_at);

create index idx_risk_events_coordinates
on public.risk_events(latitude, longitude);

create table public.risk_event_evidence (
  id uuid primary key default gen_random_uuid(),
  risk_event_id uuid not null references public.risk_events(id) on delete cascade,
  source_id smallint references public.risk_sources(id),
  reporter_actor_id uuid references public.actors(id),
  headline text,
  source_url text,
  published_at timestamptz,
  evidence_confidence numeric(5,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint chk_risk_evidence_origin check (
    source_id is not null or reporter_actor_id is not null
  ),
  constraint chk_evidence_confidence check (
    evidence_confidence between 0 and 100
  )
);

create table public.route_plans (
  id uuid primary key default gen_random_uuid(),
  shipment_request_id uuid not null references public.shipment_requests(id) on delete cascade,
  provider text not null,
  route_label text,
  encoded_polyline text,
  distance_km numeric(12,3) not null,
  duration_minutes integer not null,
  is_alternative boolean not null default false,
  calculated_at timestamptz not null default now(),
  constraint chk_route_values_positive check (
    distance_km > 0 and duration_minutes > 0
  )
);

create table public.route_risk_snapshots (
  id uuid primary key default gen_random_uuid(),
  route_plan_id uuid not null references public.route_plans(id) on delete cascade,
  risk_score numeric(5,2) not null,
  information_confidence numeric(5,2) not null,
  access_risk numeric(5,2) not null,
  social_risk numeric(5,2) not null,
  weather_risk numeric(5,2) not null,
  infrastructure_risk numeric(5,2) not null,
  operational_risk numeric(5,2) not null,
  estimated_delay_minutes integer not null default 0,
  extra_cost_low numeric(18,2),
  extra_cost_high numeric(18,2),
  currency_id smallint references public.currencies(id),
  explanation text not null,
  method_version text not null,
  calculated_at timestamptz not null default now(),
  constraint chk_risk_snapshot_scores check (
    risk_score between 0 and 100
    and information_confidence between 0 and 100
    and access_risk between 0 and 100
    and social_risk between 0 and 100
    and weather_risk between 0 and 100
    and infrastructure_risk between 0 and 100
    and operational_risk between 0 and 100
    and estimated_delay_minutes >= 0
    and (extra_cost_low is null or extra_cost_low >= 0)
    and (extra_cost_high is null or extra_cost_high >= 0)
    and (extra_cost_low is null or extra_cost_high is null or extra_cost_low <= extra_cost_high)
  )
);

create index idx_route_risk_snapshot_latest
on public.route_risk_snapshots(route_plan_id, calculated_at desc);

create table public.route_risk_snapshot_events (
  snapshot_id uuid not null references public.route_risk_snapshots(id) on delete cascade,
  risk_event_id uuid not null references public.risk_events(id) on delete restrict,
  distance_to_route_km numeric(12,3),
  impact_score numeric(5,2) not null,
  primary key (snapshot_id, risk_event_id),
  constraint chk_route_event_impact check (
    (distance_to_route_km is null or distance_to_route_km >= 0)
    and impact_score between 0 and 100
  )
);

-- ============================================================
-- AI / RULE ANALYSIS TRACEABILITY
-- ============================================================

create table public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  provider public.analysis_provider not null,
  model_name text,
  analysis_type text not null,
  input_hash text,
  status public.analysis_status not null default 'QUEUED',
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now()
);

create table public.analysis_run_risk_events (
  analysis_run_id uuid not null references public.analysis_runs(id) on delete cascade,
  risk_event_id uuid not null references public.risk_events(id) on delete cascade,
  primary key (analysis_run_id, risk_event_id)
);

create table public.analysis_run_price_suggestions (
  analysis_run_id uuid not null references public.analysis_runs(id) on delete cascade,
  price_suggestion_id uuid not null references public.listing_price_suggestions(id) on delete cascade,
  primary key (analysis_run_id, price_suggestion_id)
);

-- ============================================================
-- NOTIFICATIONS AND AUDIT
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  title text not null,
  body text not null,
  status public.notification_status not null default 'UNREAD',
  link_path text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index idx_notifications_user_status
on public.notifications(user_id, status, created_at desc);

create table public.audit_logs (
  id bigserial primary key,
  user_id uuid references public.user_profiles(id),
  actor_id uuid references public.actors(id),
  action text not null,
  entity_table text not null,
  entity_id text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SUPPORT VIEWS
-- ============================================================

create or replace view public.marketplace_listing_public as
select
  ml.id,
  ml.listing_type,
  ml.actor_id,
  a.display_name as actor_display_name,
  ml.product_id,
  p.name as product_name,
  ml.variety_id,
  pv.name as variety_name,
  ml.title,
  ml.description,
  ml.quantity,
  ml.unit_id,
  u.symbol as unit_symbol,
  ml.location_point_id,
  lp.label as location_label,
  lp.is_approximate,
  ml.available_from,
  ml.deadline_at,
  ml.status,
  ml.created_at,
  po.minimum_order_quantity,
  po.allow_partial_quantity,
  pr.accepts_partial_offers,
  pr.accepts_multiple_suppliers,
  onp.quick_negotiation_enabled
from public.market_listings ml
join public.actors a on a.id = ml.actor_id
join public.products p on p.id = ml.product_id
left join public.product_varieties pv on pv.id = ml.variety_id
join public.units_of_measure u on u.id = ml.unit_id
join public.location_points lp on lp.id = ml.location_point_id
left join public.product_offers po on po.listing_id = ml.id
left join public.purchase_requests pr on pr.listing_id = ml.id
left join public.offer_negotiation_policies onp on onp.offer_listing_id = ml.id;

-- hidden_floor_price is intentionally excluded from the public view.


-- FILE: 02_rls_policies.sql
-- ============================================================
-- 02_rls_policies.sql
-- Supabase Row Level Security
-- ============================================================

-- Helper: admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.app_roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and upper(r.code::text) = 'ADMIN'
  );
$$;

-- Helper: actor accessible by current user
create or replace function public.can_act_as(target_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.actors a
      where a.id = target_actor_id
        and a.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.actors a
      join public.organization_members om
        on om.organization_id = a.organization_id
      where a.id = target_actor_id
        and om.user_id = auth.uid()
        and om.status = 'ACTIVE'
    );
$$;

create or replace function public.can_access_order(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.commercial_orders co
      where co.id = target_order_id
        and public.can_act_as(co.buyer_actor_id)
    )
    or exists (
      select 1
      from public.order_items oi
      join public.order_supplier_allocations osa on osa.order_item_id = oi.id
      where oi.order_id = target_order_id
        and public.can_act_as(osa.producer_actor_id)
    );
$$;

create or replace function public.can_access_shipment(target_shipment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.shipment_requests sr
      where sr.id = target_shipment_id
        and (
          public.can_act_as(sr.requested_by_actor_id)
          or public.can_access_order(sr.order_id)
          or sr.status = 'OPEN_FOR_BIDS'
        )
    )
    or exists (
      select 1
      from public.freight_bids fb
      where fb.shipment_request_id = target_shipment_id
        and public.can_act_as(fb.transporter_actor_id)
    );
$$;

-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.actors enable row level security;
alter table public.actor_roles enable row level security;
alter table public.actor_locations enable row level security;
alter table public.location_points enable row level security;
alter table public.market_listings enable row level security;
alter table public.product_offers enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.listing_attribute_values enable row level security;
alter table public.offer_negotiation_policies enable row level security;
alter table public.offer_private_pricing enable row level security;
alter table public.listing_media enable row level security;
alter table public.negotiations enable row level security;
alter table public.negotiation_participants enable row level security;
alter table public.quick_offer_attempts enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.commercial_proposals enable row level security;
alter table public.proposal_attribute_values enable row level security;
alter table public.commercial_orders enable row level security;
alter table public.order_negotiations enable row level security;
alter table public.order_items enable row level security;
alter table public.order_supplier_allocations enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_documents enable row level security;
alter table public.shipment_requests enable row level security;
alter table public.shipment_stops enable row level security;
alter table public.shipment_cargo_items enable row level security;
alter table public.freight_bids enable row level security;
alter table public.shipment_assignments enable row level security;
alter table public.trips enable row level security;
alter table public.trip_status_history enable row level security;
alter table public.trip_evidence enable row level security;
alter table public.notifications enable row level security;

-- User profiles
create policy user_profiles_select
on public.user_profiles for select
to authenticated
using (true);

create policy user_profiles_update_self
on public.user_profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Organizations
create policy organizations_select
on public.organizations for select
to authenticated
using (true);

create policy organizations_insert
on public.organizations for insert
to authenticated
with check (created_by = auth.uid());

create policy organizations_update
on public.organizations for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = organizations.id
      and om.user_id = auth.uid()
      and om.status = 'ACTIVE'
      and om.is_owner
  )
);

-- Actors
create policy actors_select
on public.actors for select
to authenticated
using (true);

create policy actors_insert_person
on public.actors for insert
to authenticated
with check (
  public.is_admin()
  or (kind = 'PERSON' and user_id = auth.uid())
  or (
    kind = 'ORGANIZATION'
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id = organization_id
        and om.user_id = auth.uid()
        and om.status = 'ACTIVE'
        and om.is_owner
    )
  )
);

create policy actors_update
on public.actors for update
to authenticated
using (public.can_act_as(id))
with check (public.can_act_as(id));

-- Locations
create policy location_points_select
on public.location_points for select
to authenticated
using (true);

create policy location_points_insert
on public.location_points for insert
to authenticated
with check (true);

-- Listings
create policy listings_select_active_or_owned
on public.market_listings for select
to authenticated
using (
  status = 'ACTIVE'
  or public.can_act_as(actor_id)
  or public.is_admin()
);

create policy listings_insert
on public.market_listings for insert
to authenticated
with check (public.can_act_as(actor_id));

create policy listings_update
on public.market_listings for update
to authenticated
using (public.can_act_as(actor_id))
with check (public.can_act_as(actor_id));

create policy listings_delete
on public.market_listings for delete
to authenticated
using (public.can_act_as(actor_id) or public.is_admin());

-- Product offers subtype
create policy product_offers_select
on public.product_offers for select
to authenticated
using (
  exists (
    select 1 from public.market_listings ml
    where ml.id = product_offers.listing_id
      and (ml.status = 'ACTIVE' or public.can_act_as(ml.actor_id) or public.is_admin())
  )
);

create policy product_offers_manage
on public.product_offers for all
to authenticated
using (
  exists (
    select 1 from public.market_listings ml
    where ml.id = product_offers.listing_id
      and public.can_act_as(ml.actor_id)
  )
)
with check (
  exists (
    select 1 from public.market_listings ml
    where ml.id = product_offers.listing_id
      and public.can_act_as(ml.actor_id)
  )
);

-- Purchase requests subtype
create policy purchase_requests_select
on public.purchase_requests for select
to authenticated
using (
  exists (
    select 1 from public.market_listings ml
    where ml.id = purchase_requests.listing_id
      and (ml.status = 'ACTIVE' or public.can_act_as(ml.actor_id) or public.is_admin())
  )
);

create policy purchase_requests_manage
on public.purchase_requests for all
to authenticated
using (
  exists (
    select 1 from public.market_listings ml
    where ml.id = purchase_requests.listing_id
      and public.can_act_as(ml.actor_id)
  )
)
with check (
  exists (
    select 1 from public.market_listings ml
    where ml.id = purchase_requests.listing_id
      and public.can_act_as(ml.actor_id)
  )
);

-- Public negotiation settings can be read for active offers.
create policy negotiation_policy_select
on public.offer_negotiation_policies for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.market_listings ml
    where ml.id = offer_negotiation_policies.offer_listing_id
      and (ml.status = 'ACTIVE' or public.can_act_as(ml.actor_id))
  )
);

create policy negotiation_policy_manage
on public.offer_negotiation_policies for all
to authenticated
using (
  exists (
    select 1
    from public.market_listings ml
    where ml.id = offer_negotiation_policies.offer_listing_id
      and public.can_act_as(ml.actor_id)
  )
)
with check (
  exists (
    select 1
    from public.market_listings ml
    where ml.id = offer_negotiation_policies.offer_listing_id
      and public.can_act_as(ml.actor_id)
  )
);

-- The hidden floor is only readable and writable by the owner or administrator.
create policy private_pricing_owner_select
on public.offer_private_pricing for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.market_listings ml
    where ml.id = offer_private_pricing.offer_listing_id
      and public.can_act_as(ml.actor_id)
  )
);

create policy private_pricing_owner_manage
on public.offer_private_pricing for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.market_listings ml
    where ml.id = offer_private_pricing.offer_listing_id
      and public.can_act_as(ml.actor_id)
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.market_listings ml
    where ml.id = offer_private_pricing.offer_listing_id
      and public.can_act_as(ml.actor_id)
  )
);

-- Negotiations
create policy negotiations_select_participant
on public.negotiations for select
to authenticated
using (
  public.can_act_as(buyer_actor_id)
  or public.can_act_as(producer_actor_id)
  or public.is_admin()
);

create policy negotiations_insert
on public.negotiations for insert
to authenticated
with check (
  public.can_act_as(buyer_actor_id)
  or public.can_act_as(producer_actor_id)
);

create policy negotiations_update_participant
on public.negotiations for update
to authenticated
using (
  public.can_act_as(buyer_actor_id)
  or public.can_act_as(producer_actor_id)
  or public.is_admin()
);

-- Messages
create policy messages_select_participant
on public.messages for select
to authenticated
using (
  exists (
    select 1
    from public.negotiations n
    where n.id = messages.negotiation_id
      and (
        public.can_act_as(n.buyer_actor_id)
        or public.can_act_as(n.producer_actor_id)
        or public.is_admin()
      )
  )
);

create policy messages_insert_participant
on public.messages for insert
to authenticated
with check (
  public.can_act_as(sender_actor_id)
  and exists (
    select 1
    from public.negotiations n
    where n.id = messages.negotiation_id
      and (
        n.buyer_actor_id = messages.sender_actor_id
        or n.producer_actor_id = messages.sender_actor_id
      )
  )
);

-- Proposals
create policy proposals_select_participant
on public.commercial_proposals for select
to authenticated
using (
  exists (
    select 1
    from public.negotiations n
    where n.id = commercial_proposals.negotiation_id
      and (
        public.can_act_as(n.buyer_actor_id)
        or public.can_act_as(n.producer_actor_id)
        or public.is_admin()
      )
  )
);

create policy proposals_insert_participant
on public.commercial_proposals for insert
to authenticated
with check (
  public.can_act_as(created_by_actor_id)
  and exists (
    select 1
    from public.negotiations n
    where n.id = commercial_proposals.negotiation_id
      and (
        n.buyer_actor_id = commercial_proposals.created_by_actor_id
        or n.producer_actor_id = commercial_proposals.created_by_actor_id
      )
  )
);

-- Orders
create policy orders_select_participant
on public.commercial_orders for select
to authenticated
using (
  public.can_act_as(buyer_actor_id)
  or exists (
    select 1
    from public.order_items oi
    join public.order_supplier_allocations osa on osa.order_item_id = oi.id
    where oi.order_id = commercial_orders.id
      and public.can_act_as(osa.producer_actor_id)
  )
  or public.is_admin()
);

-- Vehicles
create policy vehicles_select
on public.vehicles for select
to authenticated
using (status = 'ACTIVE' or public.can_act_as(owner_actor_id) or public.is_admin());

create policy vehicles_manage
on public.vehicles for all
to authenticated
using (public.can_act_as(owner_actor_id) or public.is_admin())
with check (public.can_act_as(owner_actor_id) or public.is_admin());

-- Shipments
create policy shipments_select_participant
on public.shipment_requests for select
to authenticated
using (
  public.can_act_as(requested_by_actor_id)
  or exists (
    select 1
    from public.commercial_orders co
    where co.id = shipment_requests.order_id
      and public.can_act_as(co.buyer_actor_id)
  )
  or status = 'OPEN_FOR_BIDS'
  or public.is_admin()
);

create policy shipments_insert
on public.shipment_requests for insert
to authenticated
with check (public.can_act_as(requested_by_actor_id));

-- Freight bids
create policy freight_bids_select
on public.freight_bids for select
to authenticated
using (
  public.can_act_as(transporter_actor_id)
  or exists (
    select 1
    from public.shipment_requests sr
    where sr.id = freight_bids.shipment_request_id
      and public.can_act_as(sr.requested_by_actor_id)
  )
  or public.is_admin()
);

create policy freight_bids_insert
on public.freight_bids for insert
to authenticated
with check (
  public.can_act_as(transporter_actor_id)
  and exists (
    select 1 from public.vehicles v
    where v.id = freight_bids.vehicle_id
      and public.can_act_as(v.owner_actor_id)
  )
);

-- Notifications
create policy notifications_self
on public.notifications for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy notifications_update_self
on public.notifications for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- Catalog/reference tables remain readable through default grants.


-- ============================================================
-- SUPPORTING TABLE POLICIES
-- ============================================================

create policy user_roles_select_self
on public.user_roles for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy organization_members_select
on public.organization_members for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.organization_members mine
    where mine.organization_id = organization_members.organization_id
      and mine.user_id = auth.uid()
      and mine.status = 'ACTIVE'
  )
);

create policy organization_members_manage
on public.organization_members for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.organization_members owner_member
    where owner_member.organization_id = organization_members.organization_id
      and owner_member.user_id = auth.uid()
      and owner_member.status = 'ACTIVE'
      and owner_member.is_owner
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.organization_members owner_member
    where owner_member.organization_id = organization_members.organization_id
      and owner_member.user_id = auth.uid()
      and owner_member.status = 'ACTIVE'
      and owner_member.is_owner
  )
);

create policy actor_roles_select
on public.actor_roles for select
to authenticated
using (true);

create policy actor_roles_manage
on public.actor_roles for all
to authenticated
using (public.can_act_as(actor_id))
with check (public.can_act_as(actor_id));

create policy actor_locations_select
on public.actor_locations for select
to authenticated
using (is_public or public.can_act_as(actor_id) or public.is_admin());

create policy actor_locations_manage
on public.actor_locations for all
to authenticated
using (public.can_act_as(actor_id))
with check (public.can_act_as(actor_id));

create policy listing_attributes_select
on public.listing_attribute_values for select
to authenticated
using (
  exists (
    select 1 from public.market_listings ml
    where ml.id = listing_attribute_values.listing_id
      and (ml.status = 'ACTIVE' or public.can_act_as(ml.actor_id) or public.is_admin())
  )
);

create policy listing_attributes_manage
on public.listing_attribute_values for all
to authenticated
using (
  exists (
    select 1 from public.market_listings ml
    where ml.id = listing_attribute_values.listing_id
      and public.can_act_as(ml.actor_id)
  )
)
with check (
  exists (
    select 1 from public.market_listings ml
    where ml.id = listing_attribute_values.listing_id
      and public.can_act_as(ml.actor_id)
  )
);

create policy listing_media_select
on public.listing_media for select
to authenticated
using (
  exists (
    select 1 from public.market_listings ml
    where ml.id = listing_media.listing_id
      and (ml.status = 'ACTIVE' or public.can_act_as(ml.actor_id) or public.is_admin())
  )
);

create policy listing_media_manage
on public.listing_media for all
to authenticated
using (
  exists (
    select 1 from public.market_listings ml
    where ml.id = listing_media.listing_id
      and public.can_act_as(ml.actor_id)
  )
)
with check (
  exists (
    select 1 from public.market_listings ml
    where ml.id = listing_media.listing_id
      and public.can_act_as(ml.actor_id)
  )
);

create policy negotiation_participants_select
on public.negotiation_participants for select
to authenticated
using (
  exists (
    select 1 from public.negotiations n
    where n.id = negotiation_participants.negotiation_id
      and (
        public.can_act_as(n.buyer_actor_id)
        or public.can_act_as(n.producer_actor_id)
        or public.is_admin()
      )
  )
);

create policy quick_offer_attempts_select
on public.quick_offer_attempts for select
to authenticated
using (
  public.can_act_as(buyer_actor_id)
  or exists (
    select 1
    from public.market_listings ml
    where ml.id = quick_offer_attempts.offer_listing_id
      and public.can_act_as(ml.actor_id)
  )
  or public.is_admin()
);

create policy message_attachments_select
on public.message_attachments for select
to authenticated
using (
  exists (
    select 1
    from public.messages m
    join public.negotiations n on n.id = m.negotiation_id
    where m.id = message_attachments.message_id
      and (
        public.can_act_as(n.buyer_actor_id)
        or public.can_act_as(n.producer_actor_id)
        or public.is_admin()
      )
  )
);

create policy proposal_attributes_select
on public.proposal_attribute_values for select
to authenticated
using (
  exists (
    select 1
    from public.commercial_proposals cp
    join public.negotiations n on n.id = cp.negotiation_id
    where cp.id = proposal_attribute_values.proposal_id
      and (
        public.can_act_as(n.buyer_actor_id)
        or public.can_act_as(n.producer_actor_id)
        or public.is_admin()
      )
  )
);

create policy order_negotiations_select
on public.order_negotiations for select
to authenticated
using (public.can_access_order(order_id));

create policy order_items_select
on public.order_items for select
to authenticated
using (public.can_access_order(order_id));

create policy allocations_select
on public.order_supplier_allocations for select
to authenticated
using (
  exists (
    select 1 from public.order_items oi
    where oi.id = order_supplier_allocations.order_item_id
      and public.can_access_order(oi.order_id)
  )
);

create policy reservations_select
on public.inventory_reservations for select
to authenticated
using (
  exists (
    select 1
    from public.order_supplier_allocations osa
    join public.order_items oi on oi.id = osa.order_item_id
    where osa.id = inventory_reservations.allocation_id
      and public.can_access_order(oi.order_id)
  )
);

create policy vehicle_documents_select
on public.vehicle_documents for select
to authenticated
using (
  exists (
    select 1 from public.vehicles v
    where v.id = vehicle_documents.vehicle_id
      and (v.status = 'ACTIVE' or public.can_act_as(v.owner_actor_id) or public.is_admin())
  )
);

create policy vehicle_documents_manage
on public.vehicle_documents for all
to authenticated
using (
  exists (
    select 1 from public.vehicles v
    where v.id = vehicle_documents.vehicle_id
      and (public.can_act_as(v.owner_actor_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.vehicles v
    where v.id = vehicle_documents.vehicle_id
      and (public.can_act_as(v.owner_actor_id) or public.is_admin())
  )
);

create policy shipment_stops_select
on public.shipment_stops for select
to authenticated
using (public.can_access_shipment(shipment_request_id));

create policy shipment_cargo_select
on public.shipment_cargo_items for select
to authenticated
using (public.can_access_shipment(shipment_request_id));

create policy shipment_assignments_select
on public.shipment_assignments for select
to authenticated
using (public.can_access_shipment(shipment_request_id));

create policy trips_select
on public.trips for select
to authenticated
using (
  exists (
    select 1
    from public.shipment_assignments sa
    where sa.id = trips.shipment_assignment_id
      and public.can_access_shipment(sa.shipment_request_id)
  )
);

create policy trip_history_select
on public.trip_status_history for select
to authenticated
using (
  exists (
    select 1
    from public.trips t
    join public.shipment_assignments sa on sa.id = t.shipment_assignment_id
    where t.id = trip_status_history.trip_id
      and public.can_access_shipment(sa.shipment_request_id)
  )
);

create policy trip_evidence_select
on public.trip_evidence for select
to authenticated
using (
  exists (
    select 1
    from public.trips t
    join public.shipment_assignments sa on sa.id = t.shipment_assignment_id
    where t.id = trip_evidence.trip_id
      and public.can_access_shipment(sa.shipment_request_id)
  )
);


-- FILE: 03_quick_offer_rpc.sql
-- ============================================================
-- 03_quick_offer_rpc.sql
-- Transacción segura para negociación rápida
-- ============================================================

create or replace function public.submit_quick_offer(
  p_offer_listing_id uuid,
  p_buyer_actor_id uuid,
  p_quantity numeric,
  p_unit_price numeric,
  p_currency_code char(3)
)
returns table (
  result public.quick_offer_status,
  order_id uuid,
  negotiation_id uuid,
  attempts_remaining integer,
  reservation_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.market_listings%rowtype;
  v_offer public.product_offers%rowtype;
  v_policy public.offer_negotiation_policies%rowtype;
  v_private public.offer_private_pricing%rowtype;
  v_currency_id smallint;
  v_attempts integer;
  v_available numeric;
  v_negotiation_id uuid;
  v_order_id uuid;
  v_order_item_id uuid;
  v_allocation_id uuid;
  v_expiration timestamptz;
begin
  if not public.can_act_as(p_buyer_actor_id) then
    raise exception 'Actor not accessible by current user';
  end if;

  if p_quantity <= 0 or p_unit_price <= 0 then
    raise exception 'Quantity and unit price must be positive';
  end if;

  select *
  into v_listing
  from public.market_listings
  where id = p_offer_listing_id
  for update;

  if not found
     or v_listing.listing_type <> 'OFFER'
     or v_listing.status <> 'ACTIVE' then
    return query
    select 'UNAVAILABLE'::public.quick_offer_status, null::uuid, null::uuid, 0, null::timestamptz;
    return;
  end if;

  select *
  into v_offer
  from public.product_offers
  where listing_id = p_offer_listing_id
  for update;

  select *
  into v_policy
  from public.offer_negotiation_policies
  where offer_listing_id = p_offer_listing_id
  for update;

  if not found
     or not v_policy.quick_negotiation_enabled
     or not v_policy.auto_accept_enabled then
    return query
    select 'UNAVAILABLE'::public.quick_offer_status, null::uuid, null::uuid, 0, null::timestamptz;
    return;
  end if;

  select *
  into v_private
  from public.offer_private_pricing
  where offer_listing_id = p_offer_listing_id
  for update;

  if not found then
    return query
    select 'UNAVAILABLE'::public.quick_offer_status, null::uuid, null::uuid, 0, null::timestamptz;
    return;
  end if;

  select id
  into v_currency_id
  from public.currencies
  where code = p_currency_code;

  if v_currency_id is null or v_currency_id <> v_policy.currency_id then
    raise exception 'Currency not supported by this offer';
  end if;

  select count(*)
  into v_attempts
  from public.quick_offer_attempts
  where offer_listing_id = p_offer_listing_id
    and buyer_actor_id = p_buyer_actor_id
    and created_at >= now() - make_interval(mins => v_policy.attempt_window_minutes);

  if v_attempts >= v_policy.max_quick_attempts then
    insert into public.quick_offer_attempts (
      offer_listing_id,
      buyer_actor_id,
      quantity,
      unit_price,
      currency_id,
      result
    ) values (
      p_offer_listing_id,
      p_buyer_actor_id,
      p_quantity,
      p_unit_price,
      v_currency_id,
      'RATE_LIMITED'
    );

    return query
    select
      'RATE_LIMITED'::public.quick_offer_status,
      null::uuid,
      null::uuid,
      0,
      null::timestamptz;
    return;
  end if;

  v_available := v_listing.quantity - v_offer.reserved_quantity;

  if p_quantity > v_available
     or (v_offer.minimum_order_quantity is not null and p_quantity < v_offer.minimum_order_quantity) then
    insert into public.quick_offer_attempts (
      offer_listing_id,
      buyer_actor_id,
      quantity,
      unit_price,
      currency_id,
      result
    ) values (
      p_offer_listing_id,
      p_buyer_actor_id,
      p_quantity,
      p_unit_price,
      v_currency_id,
      'UNAVAILABLE'
    );

    return query
    select
      'UNAVAILABLE'::public.quick_offer_status,
      null::uuid,
      null::uuid,
      greatest(v_policy.max_quick_attempts - v_attempts - 1, 0),
      null::timestamptz;
    return;
  end if;

  if p_unit_price < v_private.hidden_floor_price then
    insert into public.quick_offer_attempts (
      offer_listing_id,
      buyer_actor_id,
      quantity,
      unit_price,
      currency_id,
      result
    ) values (
      p_offer_listing_id,
      p_buyer_actor_id,
      p_quantity,
      p_unit_price,
      v_currency_id,
      'NOT_ACCEPTED'
    );

    return query
    select
      'NOT_ACCEPTED'::public.quick_offer_status,
      null::uuid,
      null::uuid,
      greatest(v_policy.max_quick_attempts - v_attempts - 1, 0),
      null::timestamptz;
    return;
  end if;

  v_expiration := now() + make_interval(mins => v_policy.reservation_minutes);

  insert into public.negotiations (
    buyer_actor_id,
    producer_actor_id,
    offer_listing_id,
    mode,
    status,
    expires_at
  ) values (
    p_buyer_actor_id,
    v_listing.actor_id,
    p_offer_listing_id,
    'QUICK',
    'AUTO_ACCEPTED',
    v_expiration
  )
  returning id into v_negotiation_id;

  insert into public.negotiation_participants (negotiation_id, actor_id)
  values
    (v_negotiation_id, p_buyer_actor_id),
    (v_negotiation_id, v_listing.actor_id);

  insert into public.commercial_orders (
    buyer_actor_id,
    currency_id,
    status,
    reservation_expires_at
  ) values (
    p_buyer_actor_id,
    v_currency_id,
    'RESERVED',
    v_expiration
  )
  returning id into v_order_id;

  insert into public.order_negotiations (order_id, negotiation_id)
  values (v_order_id, v_negotiation_id);

  insert into public.order_items (
    order_id,
    product_id,
    variety_id,
    quantity,
    unit_id,
    agreed_unit_price
  ) values (
    v_order_id,
    v_listing.product_id,
    v_listing.variety_id,
    p_quantity,
    v_listing.unit_id,
    p_unit_price
  )
  returning id into v_order_item_id;

  insert into public.order_supplier_allocations (
    order_item_id,
    producer_actor_id,
    source_offer_listing_id,
    allocated_quantity,
    unit_price
  ) values (
    v_order_item_id,
    v_listing.actor_id,
    p_offer_listing_id,
    p_quantity,
    p_unit_price
  )
  returning id into v_allocation_id;

  insert into public.inventory_reservations (
    allocation_id,
    offer_listing_id,
    quantity,
    status,
    expires_at
  ) values (
    v_allocation_id,
    p_offer_listing_id,
    p_quantity,
    'ACTIVE',
    v_expiration
  );

  update public.product_offers
  set reserved_quantity = reserved_quantity + p_quantity
  where listing_id = p_offer_listing_id;

  insert into public.quick_offer_attempts (
    offer_listing_id,
    buyer_actor_id,
    negotiation_id,
    quantity,
    unit_price,
    currency_id,
    result
  ) values (
    p_offer_listing_id,
    p_buyer_actor_id,
    v_negotiation_id,
    p_quantity,
    p_unit_price,
    v_currency_id,
    'AUTO_ACCEPTED'
  );

  return query
  select
    'AUTO_ACCEPTED'::public.quick_offer_status,
    v_order_id,
    v_negotiation_id,
    greatest(v_policy.max_quick_attempts - v_attempts - 1, 0),
    v_expiration;
end;
$$;

revoke all on function public.submit_quick_offer(uuid, uuid, numeric, numeric, char(3)) from public;
grant execute on function public.submit_quick_offer(uuid, uuid, numeric, numeric, char(3)) to authenticated;

-- Release expired reservations.
create or replace function public.release_expired_inventory_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.inventory_reservations
    set status = 'EXPIRED'
    where status = 'ACTIVE'
      and expires_at <= now()
    returning offer_listing_id, quantity
  ),
  aggregated as (
    select offer_listing_id, sum(quantity) as quantity
    from expired
    group by offer_listing_id
  )
  update public.product_offers po
  set reserved_quantity = greatest(po.reserved_quantity - a.quantity, 0)
  from aggregated a
  where po.listing_id = a.offer_listing_id;

  get diagnostics v_count = row_count;

  update public.commercial_orders
  set status = 'EXPIRED'
  where status = 'RESERVED'
    and reservation_expires_at <= now();

  return v_count;
end;
$$;


-- FILE: 04_seed_catalogs.sql
-- ============================================================
-- 04_seed_catalogs.sql
-- Catálogos base
-- ============================================================

insert into public.app_roles (code, name, description) values
  ('PRODUCER', 'Productor', 'Publica y negocia productos'),
  ('BUYER', 'Comprador', 'Publica requerimientos y compra productos'),
  ('TRANSPORTER', 'Transportista', 'Ofrece servicios de transporte'),
  ('ADMIN', 'Administrador', 'Administra la plataforma')
on conflict (code) do nothing;

insert into public.organization_types (code, name) values
  ('ASSOCIATION', 'Asociación'),
  ('COMMUNITY', 'Comunidad'),
  ('COOPERATIVE', 'Cooperativa'),
  ('COMPANY', 'Empresa'),
  ('PUBLIC_ENTITY', 'Entidad pública')
on conflict (code) do nothing;

insert into public.verification_statuses (code, name, rank) values
  ('UNVERIFIED', 'No verificado', 0),
  ('IDENTITY_VERIFIED', 'Identidad verificada', 1),
  ('ORGANIZATION_VERIFIED', 'Organización verificada', 2),
  ('TECHNICALLY_VERIFIED', 'Verificación técnica', 3)
on conflict (code) do nothing;

insert into public.administrative_area_types (code, name, level) values
  ('COUNTRY', 'País', 1),
  ('REGION', 'Región', 2),
  ('PROVINCE', 'Provincia', 3),
  ('DISTRICT', 'Distrito', 4),
  ('COMMUNITY', 'Comunidad o centro poblado', 5)
on conflict (code) do nothing;

insert into public.currencies (code, name, symbol) values
  ('PEN', 'Sol peruano', 'S/'),
  ('USD', 'Dólar estadounidense', '$')
on conflict (code) do nothing;

insert into public.units_of_measure (code, name, symbol, dimension) values
  ('KG', 'Kilogramo', 'kg', 'MASS'),
  ('TON', 'Tonelada', 't', 'MASS'),
  ('QUINTAL', 'Quintal', 'qq', 'MASS'),
  ('SACK', 'Saco', 'saco', 'COUNT'),
  ('UNIT', 'Unidad', 'u', 'COUNT'),
  ('LITER', 'Litro', 'L', 'VOLUME'),
  ('METER', 'Metro', 'm', 'LENGTH'),
  ('MICRON', 'Micra', 'µm', 'LENGTH')
on conflict (code) do nothing;

insert into public.product_categories (code, name) values
  ('AGRICULTURE', 'Agricultura'),
  ('LIVESTOCK', 'Ganadería'),
  ('FIBER', 'Fibras'),
  ('AQUACULTURE', 'Acuicultura'),
  ('HANDICRAFT', 'Artesanía')
on conflict (code) do nothing;

insert into public.products (category_id, code, name, default_unit_id, description)
select pc.id, 'POTATO', 'Papa', u.id, 'Papa para consumo o transformación'
from public.product_categories pc
join public.units_of_measure u on u.code = 'KG'
where pc.code = 'AGRICULTURE'
on conflict (code) do nothing;

insert into public.products (category_id, code, name, default_unit_id, description)
select pc.id, 'ALPACA_FIBER', 'Fibra de alpaca', u.id, 'Fibra de alpaca clasificada o sin clasificar'
from public.product_categories pc
join public.units_of_measure u on u.code = 'KG'
where pc.code = 'FIBER'
on conflict (code) do nothing;

insert into public.products (category_id, code, name, default_unit_id, description)
select pc.id, 'QUINOA', 'Quinua', u.id, 'Quinua en grano'
from public.product_categories pc
join public.units_of_measure u on u.code = 'KG'
where pc.code = 'AGRICULTURE'
on conflict (code) do nothing;

insert into public.products (category_id, code, name, default_unit_id, description)
select pc.id, 'ONION', 'Cebolla', u.id, 'Cebolla para mercado'
from public.product_categories pc
join public.units_of_measure u on u.code = 'KG'
where pc.code = 'AGRICULTURE'
on conflict (code) do nothing;

insert into public.products (category_id, code, name, default_unit_id, description)
select pc.id, 'TROUT', 'Trucha', u.id, 'Trucha fresca o procesada'
from public.product_categories pc
join public.units_of_measure u on u.code = 'KG'
where pc.code = 'AQUACULTURE'
on conflict (code) do nothing;

insert into public.product_varieties (product_id, code, name)
select p.id, 'CANCHAN', 'Canchán'
from public.products p where p.code = 'POTATO'
on conflict (product_id, code) do nothing;

insert into public.product_varieties (product_id, code, name)
select p.id, 'IMILLA_NEGRA', 'Imilla negra'
from public.products p where p.code = 'POTATO'
on conflict (product_id, code) do nothing;

insert into public.product_varieties (product_id, code, name)
select p.id, 'WHITE', 'Blanca'
from public.products p where p.code = 'QUINOA'
on conflict (product_id, code) do nothing;

insert into public.product_attribute_definitions (
  product_id, code, name, data_type, is_required_for_offer, is_required_for_request, display_order
)
select p.id, 'CALIBER', 'Calibre', 'OPTION', true, true, 1
from public.products p where p.code = 'POTATO'
on conflict (product_id, code) do nothing;

insert into public.product_attribute_definitions (
  product_id, code, name, data_type, is_required_for_offer, is_required_for_request, display_order
)
select p.id, 'DAMAGE_PERCENT', 'Porcentaje de daño', 'NUMBER', false, true, 2
from public.products p where p.code = 'POTATO'
on conflict (product_id, code) do nothing;

insert into public.product_attribute_definitions (
  product_id, code, name, data_type, is_required_for_offer, is_required_for_request, display_order
)
select p.id, 'COLOR', 'Color', 'OPTION', true, true, 1
from public.products p where p.code = 'ALPACA_FIBER'
on conflict (product_id, code) do nothing;

insert into public.product_attribute_definitions (
  product_id, code, name, data_type, unit_id, is_required_for_offer, is_required_for_request, display_order
)
select p.id, 'FINENESS', 'Finura', 'NUMBER', u.id, false, false, 2
from public.products p
join public.units_of_measure u on u.code = 'MICRON'
where p.code = 'ALPACA_FIBER'
on conflict (product_id, code) do nothing;

insert into public.product_attribute_options (attribute_definition_id, code, label, display_order)
select d.id, 'SMALL', 'Pequeño', 1
from public.product_attribute_definitions d
join public.products p on p.id = d.product_id
where p.code = 'POTATO' and d.code = 'CALIBER'
on conflict (attribute_definition_id, code) do nothing;

insert into public.product_attribute_options (attribute_definition_id, code, label, display_order)
select d.id, 'MEDIUM', 'Mediano', 2
from public.product_attribute_definitions d
join public.products p on p.id = d.product_id
where p.code = 'POTATO' and d.code = 'CALIBER'
on conflict (attribute_definition_id, code) do nothing;

insert into public.product_attribute_options (attribute_definition_id, code, label, display_order)
select d.id, 'LARGE', 'Grande', 3
from public.product_attribute_definitions d
join public.products p on p.id = d.product_id
where p.code = 'POTATO' and d.code = 'CALIBER'
on conflict (attribute_definition_id, code) do nothing;

insert into public.vehicle_types (code, name) values
  ('MOTOCARGO', 'Motocarga'),
  ('PICKUP', 'Pickup'),
  ('VAN', 'Minivan o furgón'),
  ('LIGHT_TRUCK', 'Camión ligero'),
  ('MEDIUM_TRUCK', 'Camión mediano'),
  ('HEAVY_TRUCK', 'Camión pesado'),
  ('REFRIGERATED_TRUCK', 'Camión refrigerado')
on conflict (code) do nothing;

insert into public.vehicle_body_types (code, name) values
  ('OPEN', 'Plataforma abierta'),
  ('COVERED', 'Carrocería cubierta'),
  ('BOX', 'Furgón cerrado'),
  ('REFRIGERATED', 'Refrigerado'),
  ('TOLVA', 'Tolva')
on conflict (code) do nothing;

insert into public.vehicle_document_types (code, name) values
  ('SOAT', 'SOAT'),
  ('TECHNICAL_INSPECTION', 'Inspección técnica'),
  ('VEHICLE_CARD', 'Tarjeta de propiedad'),
  ('CARGO_AUTHORIZATION', 'Autorización de transporte de carga')
on conflict (code) do nothing;

insert into public.package_types (code, name) values
  ('SACK', 'Saco'),
  ('BALE', 'Fardo'),
  ('BOX', 'Caja'),
  ('PALLET', 'Pallet'),
  ('BULK', 'A granel')
on conflict (code) do nothing;

insert into public.price_sources (code, name, source_type, base_reliability) values
  ('MANUAL_DEMO', 'Datos demostrativos', 'MANUAL', 0.50),
  ('OFFICIAL_MARKET', 'Mercado oficial', 'OFFICIAL', 0.90),
  ('PLATFORM_HISTORY', 'Historial de la plataforma', 'MANUAL', 0.80)
on conflict (code) do nothing;

insert into public.risk_sources (code, name, source_type, base_reliability) values
  ('OFFICIAL_ROADS', 'Alertas oficiales de vías', 'OFFICIAL', 0.95),
  ('OFFICIAL_WEATHER', 'Alertas meteorológicas oficiales', 'OFFICIAL', 0.95),
  ('REGIONAL_NEWS', 'Noticias regionales', 'NEWS', 0.70),
  ('VERIFIED_USER', 'Usuario verificado', 'USER_REPORT', 0.75),
  ('SOCIAL_SIGNAL', 'Señal de red social', 'SOCIAL', 0.35),
  ('MANUAL_DEMO', 'Evento de demostración', 'MANUAL', 0.60)
on conflict (code) do nothing;

insert into public.risk_event_types (code, name, default_weight) values
  ('ROAD_BLOCK', 'Bloqueo de vía', 1.50),
  ('PROTEST', 'Protesta o huelga', 1.20),
  ('ACCIDENT', 'Accidente', 0.90),
  ('HEAVY_RAIN', 'Lluvia intensa', 1.00),
  ('SNOW', 'Nevada', 1.20),
  ('LANDSLIDE', 'Derrumbe o huaico', 1.50),
  ('ROAD_DAMAGE', 'Daño de infraestructura', 1.30),
  ('FUEL_SHORTAGE', 'Escasez de combustible', 0.80),
  ('ACCESS_DIFFICULTY', 'Acceso rural difícil', 0.70)
on conflict (code) do nothing;


-- FILE: 05_integrity_triggers.sql
-- ============================================================
-- 05_integrity_triggers.sql
-- Cross-table integrity rules that CHECK constraints cannot cover
-- ============================================================

create or replace function public.validate_listing_product_variety()
returns trigger
language plpgsql
as $$
begin
  if new.variety_id is not null and not exists (
    select 1
    from public.product_varieties pv
    where pv.id = new.variety_id
      and pv.product_id = new.product_id
  ) then
    raise exception 'Selected variety does not belong to selected product';
  end if;

  return new;
end;
$$;

create trigger trg_validate_listing_product_variety
before insert or update of product_id, variety_id
on public.market_listings
for each row execute function public.validate_listing_product_variety();

create or replace function public.validate_listing_subtype()
returns trigger
language plpgsql
as $$
declare
  v_type public.listing_type;
begin
  select listing_type into v_type
  from public.market_listings
  where id = new.listing_id;

  if tg_table_name = 'product_offers' and v_type <> 'OFFER' then
    raise exception 'product_offers requires an OFFER listing';
  end if;

  if tg_table_name = 'purchase_requests' and v_type <> 'REQUEST' then
    raise exception 'purchase_requests requires a REQUEST listing';
  end if;

  return new;
end;
$$;

create trigger trg_validate_product_offer_subtype
before insert or update on public.product_offers
for each row execute function public.validate_listing_subtype();

create trigger trg_validate_purchase_request_subtype
before insert or update on public.purchase_requests
for each row execute function public.validate_listing_subtype();

create or replace function public.validate_offer_reserved_quantity()
returns trigger
language plpgsql
as $$
declare
  v_total numeric;
begin
  select quantity into v_total
  from public.market_listings
  where id = new.listing_id;

  if new.reserved_quantity < 0 or new.reserved_quantity > v_total then
    raise exception 'Reserved quantity must be between zero and listing quantity';
  end if;

  return new;
end;
$$;

create trigger trg_validate_offer_reserved_quantity
before insert or update of reserved_quantity
on public.product_offers
for each row execute function public.validate_offer_reserved_quantity();

create or replace function public.validate_listing_attribute()
returns trigger
language plpgsql
as $$
declare
  v_listing_product uuid;
  v_definition_product uuid;
  v_option_definition uuid;
begin
  select product_id into v_listing_product
  from public.market_listings
  where id = new.listing_id;

  select product_id into v_definition_product
  from public.product_attribute_definitions
  where id = new.attribute_definition_id;

  if v_listing_product <> v_definition_product then
    raise exception 'Attribute definition does not belong to listing product';
  end if;

  if new.option_id is not null then
    select attribute_definition_id into v_option_definition
    from public.product_attribute_options
    where id = new.option_id;

    if v_option_definition <> new.attribute_definition_id then
      raise exception 'Option does not belong to attribute definition';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_validate_listing_attribute
before insert or update
on public.listing_attribute_values
for each row execute function public.validate_listing_attribute();

create or replace function public.validate_proposal_attribute()
returns trigger
language plpgsql
as $$
declare
  v_product_id uuid;
  v_definition_product uuid;
  v_option_definition uuid;
begin
  select ml.product_id
  into v_product_id
  from public.commercial_proposals cp
  join public.negotiations n on n.id = cp.negotiation_id
  left join public.market_listings ml
    on ml.id = coalesce(n.offer_listing_id, n.request_listing_id)
  where cp.id = new.proposal_id;

  select product_id into v_definition_product
  from public.product_attribute_definitions
  where id = new.attribute_definition_id;

  if v_product_id is null or v_product_id <> v_definition_product then
    raise exception 'Attribute definition does not belong to proposal product';
  end if;

  if new.option_id is not null then
    select attribute_definition_id into v_option_definition
    from public.product_attribute_options
    where id = new.option_id;

    if v_option_definition <> new.attribute_definition_id then
      raise exception 'Option does not belong to attribute definition';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_validate_proposal_attribute
before insert or update
on public.proposal_attribute_values
for each row execute function public.validate_proposal_attribute();

create or replace function public.validate_order_allocation_total()
returns trigger
language plpgsql
as $$
declare
  v_item_quantity numeric;
  v_allocated_quantity numeric;
begin
  select quantity into v_item_quantity
  from public.order_items
  where id = new.order_item_id;

  select coalesce(sum(allocated_quantity), 0)
  into v_allocated_quantity
  from public.order_supplier_allocations
  where order_item_id = new.order_item_id
    and id <> coalesce(new.id, gen_random_uuid());

  if v_allocated_quantity + new.allocated_quantity > v_item_quantity then
    raise exception 'Supplier allocations exceed order item quantity';
  end if;

  return new;
end;
$$;

create trigger trg_validate_order_allocation_total
before insert or update of allocated_quantity, order_item_id
on public.order_supplier_allocations
for each row execute function public.validate_order_allocation_total();

create or replace function public.validate_freight_bid_vehicle()
returns trigger
language plpgsql
as $$
declare
  v_vehicle_owner uuid;
  v_vehicle_status public.vehicle_status;
  v_shipment_status public.shipment_status;
begin
  select owner_actor_id, status
  into v_vehicle_owner, v_vehicle_status
  from public.vehicles
  where id = new.vehicle_id;

  if v_vehicle_owner <> new.transporter_actor_id then
    raise exception 'Vehicle does not belong to transporter actor';
  end if;

  if v_vehicle_status <> 'ACTIVE' then
    raise exception 'Vehicle is not active';
  end if;

  select status into v_shipment_status
  from public.shipment_requests
  where id = new.shipment_request_id;

  if v_shipment_status <> 'OPEN_FOR_BIDS' then
    raise exception 'Shipment is not open for bids';
  end if;

  return new;
end;
$$;

create trigger trg_validate_freight_bid_vehicle
before insert or update
on public.freight_bids
for each row execute function public.validate_freight_bid_vehicle();

create or replace function public.validate_shipment_assignment()
returns trigger
language plpgsql
as $$
declare
  v_bid_shipment uuid;
  v_bid_status public.bid_status;
begin
  select shipment_request_id, status
  into v_bid_shipment, v_bid_status
  from public.freight_bids
  where id = new.freight_bid_id
  for update;

  if v_bid_shipment <> new.shipment_request_id then
    raise exception 'Freight bid belongs to a different shipment';
  end if;

  if v_bid_status <> 'ACTIVE' then
    raise exception 'Freight bid is no longer active';
  end if;

  update public.freight_bids
  set status = case when id = new.freight_bid_id then 'ACCEPTED' else 'REJECTED' end
  where shipment_request_id = new.shipment_request_id
    and status = 'ACTIVE';

  update public.shipment_requests
  set status = 'TRANSPORTER_SELECTED'
  where id = new.shipment_request_id;

  return new;
end;
$$;

create trigger trg_validate_shipment_assignment
before insert
on public.shipment_assignments
for each row execute function public.validate_shipment_assignment();

create or replace function public.validate_shipment_ready_for_bids()
returns trigger
language plpgsql
as $$
declare
  v_pickups integer;
  v_deliveries integer;
begin
  if new.status = 'OPEN_FOR_BIDS' and old.status is distinct from new.status then
    select count(*) filter (where stop_type = 'PICKUP'),
           count(*) filter (where stop_type = 'DELIVERY')
    into v_pickups, v_deliveries
    from public.shipment_stops
    where shipment_request_id = new.id;

    if v_pickups < 1 or v_deliveries < 1 then
      raise exception 'Shipment requires at least one pickup and one delivery stop';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_validate_shipment_ready_for_bids
before update of status
on public.shipment_requests
for each row execute function public.validate_shipment_ready_for_bids();
