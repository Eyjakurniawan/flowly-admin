-- ============================================================
-- Flowly Admin: setup database (jalankan SEKALI di SQL Editor Supabase)
-- Aman dijalankan ulang.
-- ============================================================

-- 1) Daftar admin -------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
-- RLS aktif tanpa policy = tidak bisa dibaca langsung dari client.
-- Pengecekan hanya lewat fungsi is_admin() di bawah.
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 2) Kolom tambahan untuk laporan bantuan ---------------------------
alter table public.support_reports add column if not exists created_at timestamptz default now();
alter table public.support_reports add column if not exists status     text        default 'baru';
alter table public.support_reports add column if not exists balasan    text;

-- 3) Policy admin: laporan bantuan ---------------------------------
drop policy if exists "admin baca laporan"  on public.support_reports;
drop policy if exists "admin ubah laporan"  on public.support_reports;
drop policy if exists "admin hapus laporan" on public.support_reports;

create policy "admin baca laporan"  on public.support_reports
  for select to authenticated using (public.is_admin());
create policy "admin ubah laporan"  on public.support_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin hapus laporan" on public.support_reports
  for delete to authenticated using (public.is_admin());

-- 4) Policy admin: kategori bawaan (user_id null) ------------------
drop policy if exists "admin kelola kategori bawaan" on public.expense_categories;
drop policy if exists "admin kelola kategori bawaan" on public.income_categories;

create policy "admin kelola kategori bawaan" on public.expense_categories
  for all to authenticated
  using (public.is_admin() and user_id is null)
  with check (public.is_admin() and user_id is null);

create policy "admin kelola kategori bawaan" on public.income_categories
  for all to authenticated
  using (public.is_admin() and user_id is null)
  with check (public.is_admin() and user_id is null);

-- 5) Fungsi statistik: admin hanya menerima ANGKA, bukan isi transaksi ----
create or replace function public.admin_stats()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return json_build_object(
    'users',         (select count(*) from auth.users),
    'wallets',       (select count(*) from public.wallets where deleted_at is null),
    'expenses',      (select count(*) from public.expenses),
    'incomes',       (select count(*) from public.incomes),
    'planning',      (select count(*) from public.planning),
    'reports_total', (select count(*) from public.support_reports),
    'reports_new',   (select count(*) from public.support_reports where status = 'baru')
  );
end;
$$;

-- 6) Jumlah pemakaian tiap kategori (agar admin tahu mana yang aman dihapus) ----
create or replace function public.admin_category_usage()
returns table (kind text, category_id text, total bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select 'expense'::text, e.category_id::text, count(*)
      from public.expenses e where e.category_id is not null group by e.category_id
    union all
    select 'income'::text, i.category_id::text, count(*)
      from public.incomes i where i.category_id is not null group by i.category_id;
end;
$$;

-- 7) Hak eksekusi: hanya user yang sudah login --------------------
revoke all on function public.is_admin()                from public, anon;
revoke all on function public.admin_stats()             from public, anon;
revoke all on function public.admin_category_usage()    from public, anon;
grant execute on function public.is_admin()             to authenticated;
grant execute on function public.admin_stats()          to authenticated;
grant execute on function public.admin_category_usage() to authenticated;

-- 8) DAFTARKAN AKUN ADMIN (ganti emailnya, jalankan manual setelah akun dibuat) ----
-- Buat dulu akunnya: Supabase -> Authentication -> Users -> Add user
-- (centang "Auto Confirm User"), lalu jalankan:
--
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'admin@contoh.com'
-- on conflict do nothing;