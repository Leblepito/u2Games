-- 060_secure_increment_coins.sql
-- increment_coins is SECURITY DEFINER. By default Postgres grants EXECUTE to
-- PUBLIC, which would let anyone holding the anon key mint RoosterCoin via
-- POST /rest/v1/rpc/increment_coins. Restrict execution to the service role —
-- the server battle route is the only legitimate caller.
REVOKE EXECUTE ON FUNCTION public.increment_coins(uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coins(uuid, int) TO service_role;
