-- migrate:up

-- Add denormalized columns for fast reads
ALTER TABLE public.links
  ADD COLUMN usage_count BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN last_accessed_at TIMESTAMP WITHOUT TIME ZONE;

COMMENT ON COLUMN public.links.usage_count IS 'Denormalized count of total usage metrics for this link. Maintained by trigger on link_usage_metrics.';
COMMENT ON COLUMN public.links.last_accessed_at IS 'Denormalized timestamp of the most recent usage metric. Maintained by trigger on link_usage_metrics.';

-- Composite index for recentUsageMetrics computed column (link_id, accessed_at DESC)
CREATE INDEX link_usage_metrics_link_id_accessed_at_idx
  ON public.link_usage_metrics (link_id, accessed_at DESC);

-- Backfill existing data
UPDATE public.links l SET
  usage_count = COALESCE(stats.cnt, 0),
  last_accessed_at = stats.max_at
FROM (
  SELECT link_id, COUNT(*) AS cnt, MAX(accessed_at) AS max_at
  FROM public.link_usage_metrics
  GROUP BY link_id
) stats
WHERE stats.link_id = l.id;

-- Trigger function to keep usage_count and last_accessed_at in sync
CREATE OR REPLACE FUNCTION public.update_link_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.links
    SET usage_count = usage_count + 1,
        last_accessed_at = GREATEST(last_accessed_at, NEW.accessed_at)
    WHERE id = NEW.link_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.links
    SET usage_count = GREATEST(usage_count - 1, 0),
        last_accessed_at = (
          SELECT MAX(accessed_at)
          FROM public.link_usage_metrics
          WHERE link_id = OLD.link_id AND id != OLD.id
        )
    WHERE id = OLD.link_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_link_usage_stats
  AFTER INSERT OR DELETE ON public.link_usage_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_link_usage_stats();

-- migrate:down

DROP TRIGGER trg_update_link_usage_stats ON public.link_usage_metrics;
DROP FUNCTION public.update_link_usage_stats();
DROP INDEX public.link_usage_metrics_link_id_accessed_at_idx;
ALTER TABLE public.links DROP COLUMN usage_count;
ALTER TABLE public.links DROP COLUMN last_accessed_at;
