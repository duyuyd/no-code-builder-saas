-- Enrich each DB-backed style variant with real grid, alignment, border and shadow settings.
update public.component_presets
set style_override=style_override||jsonb_build_object(
 'gridColumns',case variant_key when 'compact' then '1' when 'clean' then '2' when 'fashion' then '3' when 'commerce' then '4' when 'football' then '3' else '2' end,
 'textAlign',case when variant_key in ('orange','neon','football','pastel') then 'center' else 'left' end,
 'justifyContent',case when variant_key in ('football','neon') then 'center' when variant_key='fashion' then 'space-between' else 'start' end,
 'alignItems',case when variant_key in ('neon','football','orange') then 'center' else 'stretch' end,
 'widthPct',case when variant_key='compact' then '100' when variant_key='fashion' then '85' else '0' end,
 'borderWidth',case when variant_key in ('neon','rpg','premium','glass') then '2' else '0' end,
 'borderColor',case when variant_key='neon' then '#22d3ee' when variant_key='rpg' then '#fde68a' when variant_key='premium' then '#d6d3d1' else '#e2e8f0' end,
 'fontWeight',case when variant_key in ('neon','rpg','football') then 'bold' else 'normal' end,
 'shadow',case when variant_key='premium' then 'lg' when variant_key in ('glass','fashion','orange') then 'md' else 'none' end
);
