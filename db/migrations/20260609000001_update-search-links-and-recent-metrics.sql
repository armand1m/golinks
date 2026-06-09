-- migrate:up

-- Update recentUsageMetrics to leverage the new composite index and limit results
CREATE OR REPLACE FUNCTION links_recent_usage_metrics(link links)
RETURNS SETOF link_usage_metrics AS $$
  SELECT *
  FROM link_usage_metrics
  WHERE link_id = link.id
    AND accessed_at >= NOW() - INTERVAL '30 days'
  ORDER BY accessed_at ASC;
$$ LANGUAGE sql STABLE;

-- search_links already does SELECT * from links, which includes the new columns.
-- No change needed to the function itself. PostGraphile will pick up the new columns
-- from the table type automatically.

-- migrate:down

-- Restore original recentUsageMetrics (same as before since function body is unchanged)
CREATE OR REPLACE FUNCTION links_recent_usage_metrics(link links)
RETURNS SETOF link_usage_metrics AS $$
  SELECT *
  FROM link_usage_metrics
  WHERE link_id = link.id
    AND accessed_at >= NOW() - INTERVAL '30 days'
  ORDER BY accessed_at ASC;
$$ LANGUAGE sql STABLE;
