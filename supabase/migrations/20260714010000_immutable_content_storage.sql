drop policy if exists "admins can update blog thumbnails" on storage.objects;
drop policy if exists "admins can update mutable storage objects" on storage.objects;

create policy "admins can update mutable storage objects"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'zerosourcing'
    and public.current_user_is_admin()
    and name !~ '^content/(blog|portfolio)/'
  )
  with check (
    bucket_id = 'zerosourcing'
    and public.current_user_is_admin()
    and name !~ '^content/(blog|portfolio)/'
  );
