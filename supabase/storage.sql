-- ============================================================
-- Storage bucket "media" - a coller dans Supabase (SQL Editor)
-- ============================================================
-- Cree le bucket public "media" et les policies associees.
-- Autorise : images, audio.
-- Lecture : publique (URL publique directe).
-- Ecriture : utilisateurs authentifies (admin Supabase Auth)
--            OU service role (bypass RLS, utilise par l'API serveur).
-- Idempotent : peut etre re-execute sans erreur.
-- ============================================================

-- 1. Creer le bucket public "media"
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

-- 2. Policies RLS sur storage.objects (le schema storage a deja RLS active)

drop policy if exists "media_public_read"   on storage.objects;
drop policy if exists "media_auth_insert"   on storage.objects;
drop policy if exists "media_auth_update"   on storage.objects;
drop policy if exists "media_auth_delete"   on storage.objects;

-- Lecture publique (tout le monde peut telecharger une URL publique)
create policy "media_public_read"
  on storage.objects for select
  using (bucket_id = 'media');

-- Upload : reserve aux utilisateurs authentifies
-- Contrainte : uniquement images et audio
create policy "media_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (
      (storage.foldername(name))[1] = 'images'
      or (storage.foldername(name))[1] = 'audio'
    )
  );

-- Update (replace, metadata) : utilisateurs authentifies
create policy "media_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

-- Suppression : utilisateurs authentifies
create policy "media_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');

-- ============================================================
-- Verification rapide
-- ============================================================
-- select id, name, public from storage.buckets where id = 'media';
-- select policyname, cmd from pg_policies where tablename = 'objects' and schemaname = 'storage';
