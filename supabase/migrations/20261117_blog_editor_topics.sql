insert into public.platform_settings(key,value) values
('blog_topics','["How to create a website without coding","Step-by-step visual 3D game design","How to prototype an app with drag and drop"]'::jsonb)
on conflict(key) do nothing;