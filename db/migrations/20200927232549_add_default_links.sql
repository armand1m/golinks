-- migrate:up
set local jwt.claims.permissions to '["create:golinks", "read:golinks"]';

-- add insert statements for default links
-- INSERT INTO public.links (id, alias, url, created_at) VALUES ('8f31a121-31af-4e2c-a3be-08bb9274723b', 'github', 'https://github.com/armand1m',	'2020-07-28 11:39:06.892521');

-- add insert statements for link usage metrics if needed
-- INSERT INTO public.link_usage_metrics (id, link_id, accessed_at) VALUES ('6eb89582-04f8-41ea-9284-bc07c8456304', '8f31a121-31af-4e2c-a3be-08bb9274723b', '2020-08-30 09:24:03.869824');
-- INSERT INTO public.link_usage_metrics (id, link_id, accessed_at) VALUES ('15891bc1-b807-48b8-ba95-6b809df3ca4e', '8f31a121-31af-4e2c-a3be-08bb9274723b', '2020-08-30 21:24:49.138064');
-- INSERT INTO public.link_usage_metrics (id, link_id, accessed_at) VALUES ('996c6cc5-3c00-4ce3-9c90-a0d319f07a2f', '8f31a121-31af-4e2c-a3be-08bb9274723b', '2020-08-31 15:38:30.985529');

-- migrate:down
set local jwt.claims.permissions to '["delete:golinks", "read:golinks"]';

DELETE FROM public.links;
DELETE FROM public.link_usage_metrics;