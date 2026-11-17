-- Growth configuration; no customer records or existing settings are removed.
insert into public.platform_settings(key,value) values
('landing_content', '{
"eyebrow":"VISUAL SOFTWARE CREATION · WEB · APP · GAME",
"headline":"Build the internet. Shape the next dimension.",
"subtitle":"Design websites, mobile experiences and playable 3D worlds from one visual workspace. Go from prompt to editable canvas, animation and export.",
"primaryCta":"Start free",
"secondaryCta":"Explore the builder",
"aiPlaceholder":"Build a website for my coffee shop with a menu, gallery and contact section",
"features":[
{"dimension":"02","title":"Visual web & apps","detail":"Nested drag-and-drop canvas, responsive preview, version history and export."},
{"dimension":"03","title":"3D worlds","detail":"Real-time WebGL scenes, interactive objects, materials and lighting."},
{"dimension":"04","title":"Timeline animation","detail":"Set keyframes and play smooth movement right in the editor."},
{"dimension":"05","title":"AI-assisted logic","detail":"Generate reviewable layouts and approved NPC behavior graphs."},
{"dimension":"06","title":"Spatial XR","detail":"Open scenes in supported immersive AR and VR browsers."},
{"dimension":"∞","title":"Build & collaborate","detail":"Create with teammates and prepare downloadable project code."}
],
"pricing":[
{"code":"free","name":"Free","price":"$0","period":"/month","summary":"Start creating and previewing.","features":["Visual editing","Project storage","Web preview"],"cta":"Start free","href":"/login?mode=register"},
{"code":"pro","name":"Pro","price":"Contact us","period":"","summary":"Unlock more capabilities after approval.","features":["Advanced builder tools","Upgrade request review","Project exports"],"cta":"Buy now · Request access","href":"/upgrade?plan=pro"},
{"code":"enterprise","name":"Enterprise","price":"Custom","period":"","summary":"Explore team and business requirements.","features":["Team workflows","Organization support","Custom onboarding"],"cta":"Contact sales","href":"/upgrade?plan=agency"}
],
"footerNote":"Design, test and publish on your terms. Some AI, native builds and XR functions require provider configuration or compatible devices."
}'::jsonb)
on conflict(key) do update set value=excluded.value;
-- Brand title remains editable by Admin and is not hardcoded in the application.
update public.platform_settings set value='"NuvoraCraft"'::jsonb where key='site_title';
