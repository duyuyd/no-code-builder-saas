-- Additive, owner-scoped Auto-Database. Existing pages.ui_tree is never replaced.
-- Dedicated private schema: one physical, RLS-enabled PostgreSQL table per form.
create schema if not exists private_forms;
revoke all on schema private_forms from public, anon, authenticated;

create table if not exists public.nuvora_forms (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.projects(id) on delete cascade,
 page_id uuid not null references public.pages(id) on delete cascade,
 node_id text not null check (length(node_id) between 1 and 100),
 fields jsonb not null check (jsonb_typeof(fields)='array'),
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(project_id,node_id),
 unique(page_id,node_id)
);
create index if not exists nuvora_forms_page_idx on public.nuvora_forms(page_id);
alter table public.nuvora_forms enable row level security;
grant select on public.nuvora_forms to authenticated;
drop policy if exists nuvora_forms_owner_read on public.nuvora_forms;
create policy nuvora_forms_owner_read on public.nuvora_forms for select to authenticated
using (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));

create or replace function public.ensure_nuvora_form(p_page_id uuid,p_node_id text,p_fields jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_uid uuid:=auth.uid();
 v_project uuid;
 v_form uuid;
 v_table text;
 v_field jsonb;
 v_name text;
 v_kind text;
 v_sql_type text;
 v_seen text[]:=array[]::text[];
begin
 if v_uid is null then raise exception 'Sign in required'; end if;
 select p.project_id into v_project from public.pages p join public.projects pr on pr.id=p.project_id
 where p.id=p_page_id and pr.owner_id=v_uid and pr.archived_at is null;
 if v_project is null then raise exception 'Page not owned'; end if;
 if p_node_id is null or length(p_node_id)>100 or p_node_id !~ '^[A-Za-z0-9_-]+$' then
  raise exception 'Invalid form node identifier';
 end if;
 if p_fields is null or jsonb_typeof(p_fields)<>'array' or jsonb_array_length(p_fields) not between 1 and 16 then
  raise exception 'Form needs 1-16 input fields';
 end if;
 for v_field in select value from jsonb_array_elements(p_fields) loop
  v_name:=v_field->>'name';v_kind:=v_field->>'kind';
  if v_name is null or v_name !~ '^[a-z][a-z0-9_]{0,39}$' or v_name=any(v_seen) or
    v_name in ('id','submitted_by','created_at') then raise exception 'Invalid or duplicate form field'; end if;
  if v_kind not in ('text','email','number','checkbox') or v_kind is null then raise exception 'Unsupported form field type'; end if;
  v_seen:=array_append(v_seen,v_name);
 end loop;
 select id into v_form from public.nuvora_forms
 where project_id=v_project and node_id=p_node_id for update;
 if v_form is null then
  if (select count(*) from public.nuvora_forms where project_id=v_project)>=25 then raise exception 'Project form limit exceeded'; end if;
  insert into public.nuvora_forms(project_id,page_id,node_id,fields)
   values(v_project,p_page_id,p_node_id,p_fields) returning id into v_form;
 else
  update public.nuvora_forms set fields=p_fields,is_active=true,updated_at=now()
  where id=v_form and page_id=p_page_id;
  if not found then raise exception 'Form belongs to another page'; end if;
 end if;
 v_table:='f_'||replace(v_form::text,'-','');
 execute format('create table if not exists private_forms.%I (
   id uuid primary key default gen_random_uuid(),
   submitted_by uuid not null references auth.users(id),
   created_at timestamptz not null default now()
  )',v_table);
 execute format('alter table private_forms.%I enable row level security',v_table);
 for v_field in select value from jsonb_array_elements(p_fields) loop
  v_name:=v_field->>'name';v_kind:=v_field->>'kind';
  v_sql_type:=case v_kind when 'number' then 'numeric' when 'checkbox' then 'boolean' else 'text' end;
  execute format('alter table private_forms.%I add column if not exists %I %s',v_table,v_name,v_sql_type);
 end loop;
 execute format('create index if not exists %I on private_forms.%I (submitted_by,created_at desc)', v_table||'_user_time',v_table);
 return v_form;
end;
$$;
revoke all on function public.ensure_nuvora_form(uuid,text,jsonb) from public;
grant execute on function public.ensure_nuvora_form(uuid,text,jsonb) to authenticated;

create or replace function public.submit_nuvora_form(p_project_id uuid,p_node_id text,p_values jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 v_uid uuid:=auth.uid();
 v_form public.nuvora_forms%rowtype;
 v_table text;
 v_field jsonb;
 v_name text;
 v_kind text;
 v_entry record;
 v_columns text:='';
 v_definitions text:='';
 v_newid uuid:=gen_random_uuid();
 v_count integer;
begin
 if v_uid is null then raise exception 'Sign in to submit this form'; end if;
 if p_values is null or jsonb_typeof(p_values)<>'object' or length(p_values::text)>12000 then
  raise exception 'Invalid form submission';
 end if;
 select * into v_form from public.nuvora_forms where project_id=p_project_id and node_id=p_node_id and is_active=true;
 if not found then raise exception 'Form not found'; end if;
 if not exists (
   select 1 from public.projects pr where pr.id=p_project_id and
   (pr.owner_id=v_uid or exists(select 1 from public.published_pages pp join public.pages pg
     on pg.project_id=pp.project_id and pg.path=pp.path where pg.id=v_form.page_id and pp.is_live=true))
 ) then raise exception 'Form not published'; end if;
 for v_entry in select key,value from jsonb_each(p_values) loop
  if not exists (select 1 from jsonb_array_elements(v_form.fields) f where f->>'name'=v_entry.key) or
    jsonb_typeof(v_entry.value) not in ('string','number','boolean','null') or length(v_entry.value::text)>2500
  then raise exception 'Unexpected or oversized form value'; end if;
 end loop;
 for v_field in select value from jsonb_array_elements(v_form.fields) loop
  v_name:=v_field->>'name';v_kind:=v_field->>'kind';
  if v_kind='email' and p_values ? v_name and coalesce(p_values->>v_name,'')<>'' and
   p_values->>v_name !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  then raise exception 'Invalid email'; end if;
  if v_columns<>'' then v_columns:=v_columns||',';v_definitions:=v_definitions||','; end if;
  v_columns:=v_columns||format('%I',v_name);
  v_definitions:=v_definitions||format('%I %s',v_name,
     case v_kind when 'number' then 'numeric' when 'checkbox' then 'boolean' else 'text' end);
 end loop;
 v_table:='f_'||replace(v_form.id::text,'-','');
 execute format('select count(*) from private_forms.%I where submitted_by=$1 and created_at > now()-interval ''1 minute''',v_table)
  into v_count using v_uid;
 if v_count>=5 then raise exception 'Submission rate limit exceeded'; end if;
 execute format('insert into private_forms.%I (id,submitted_by,%s) select $3,$2,%s from jsonb_to_record($1) as x (%s)',
  v_table,v_columns,v_columns,v_definitions) using p_values,v_uid,v_newid;
 return v_newid;
end;
$$;
revoke all on function public.submit_nuvora_form(uuid,text,jsonb) from public;
grant execute on function public.submit_nuvora_form(uuid,text,jsonb) to authenticated;

create or replace function public.list_nuvora_form_submissions(p_form_id uuid,p_limit integer default 50)
returns setof jsonb language plpgsql security definer set search_path='' as $$
declare v_table text;v_project uuid;
begin
 select project_id into v_project from public.nuvora_forms where id=p_form_id;
 if v_project is null or not exists(select 1 from public.projects where id=v_project and owner_id=auth.uid()) then
  raise exception 'Not form owner';
 end if;
 v_table:='f_'||replace(p_form_id::text,'-','');
 return query execute format('select to_jsonb(t) from private_forms.%I t order by created_at desc limit $1',v_table)
 using greatest(1,least(coalesce(p_limit,50),100));
end;
$$;
revoke all on function public.list_nuvora_form_submissions(uuid,integer) from public;
grant execute on function public.list_nuvora_form_submissions(uuid,integer) to authenticated;
