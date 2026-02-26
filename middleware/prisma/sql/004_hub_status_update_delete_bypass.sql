-- Allow controlled DELETE on hub_status_update only when explicitly enabled
-- for hub teardown transactions.
--
-- Default behavior remains append-only for all callers:
--   - UPDATE always blocked
--   - DELETE blocked unless session sets:
--       SET LOCAL agentflow.allow_status_update_delete = 'on';

CREATE OR REPLACE FUNCTION prevent_status_update_mutation()
RETURNS TRIGGER AS $$
BEGIN
  -- Controlled bypass for hub delete transactions only.
  IF TG_OP = 'DELETE'
     AND current_setting('agentflow.allow_status_update_delete', true) = 'on' THEN
    RETURN OLD;
  END IF;

  RAISE EXCEPTION 'hub_status_update is append-only: % not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;
