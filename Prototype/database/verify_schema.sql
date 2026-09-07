-- ========================================================================
-- Schema and Seed Verification Queries
-- ========================================================================

select 'locations' as table_name, count(*) as count from locations
union all
select 'route_status' as table_name, count(*) as count from route_status
union all
select 'parking' as table_name, count(*) as count from parking
union all
select 'facilities' as table_name, count(*) as count from facilities
union all
select 'food' as table_name, count(*) as count from food
union all
select 'admin_users' as table_name, count(*) as count from admin_users;
