-- Expiration changes inventory and order state; only authenticated app flows may trigger it.
revoke all on function public.release_expired_inventory_reservations() from public, anon;
grant execute on function public.release_expired_inventory_reservations() to authenticated, service_role;
