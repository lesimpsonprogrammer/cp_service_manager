-- Add Power BI as an essential Jaren CP skill for new and existing organizations.

alter table public.jaren_agent_settings
  alter column essential_skills set default array[
    'data-extraction', 'data-modeling', 'data-automation',
    'design-aesthetics', 'excel-workbooks', 'power-bi', 'sql'
  ]::text[];

update public.jaren_agent_settings
set essential_skills = array_append(essential_skills, 'power-bi'),
    updated_at = now()
where not ('power-bi' = any(essential_skills));
