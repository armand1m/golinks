-- migrate:up
ALTER TABLE public.links 
ALTER COLUMN url TYPE VARCHAR ( 2048 );

-- migrate:down

ALTER TABLE public.links
ALTER COLUMN url TYPE VARCHAR ( 255 );
