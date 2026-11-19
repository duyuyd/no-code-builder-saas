-- Applied on 2026-11-18 and verified with has_function_privilege.
-- The form RPC functions require auth.uid() and only authenticated callers need EXECUTE.
revoke execute on function public.ensure_nuvora_form(uuid,text,jsonb) from anon;
revoke execute on function public.submit_nuvora_form(uuid,text,jsonb) from anon;
revoke execute on function public.list_nuvora_form_submissions(uuid,integer) from anon;
