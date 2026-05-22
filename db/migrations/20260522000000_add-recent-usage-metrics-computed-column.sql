-- migrate:up
CREATE OR REPLACE FUNCTION links_recent_usage_metrics(link links)
RETURNS SETOF link_usage_metrics AS $$
  SELECT *
  FROM link_usage_metrics
  WHERE link_id = link.id
    AND accessed_at >= NOW() - INTERVAL '30 days'
  ORDER BY accessed_at ASC;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION links_recent_usage_metrics(links) IS 'Fetches usage metrics for this link from the last 30 days.';

-- migrate:down
DROP FUNCTION IF EXISTS links_recent_usage_metrics(links);
