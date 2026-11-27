-- ============================================================
-- Flowly Admin: fungsi tambahan untuk halaman Rincian + grafik
-- Jalankan di SQL Editor Supabase SETELAH admin_setup.sql. Aman diulang.
--
-- Sudah disesuaikan dengan skema asli (information_schema):
--   wallets(user_id, type, deleted_at)   planning(user_id, category, status)
--   budgets(user_id, category_id, start_month, end_month)
--   expenses/incomes(user_id, category_id, transaction_date)
-- "Anggaran aktif" = end_month kosong atau belum lewat bulan ini.
-- Semua fungsi hanya mengembalikan JUMLAH / label, tanpa nominal uang.
-- ============================================================

-- 0) Hapus versi lama (tipe kembalian berbeda tidak bisa di-replace) ----
drop function if exists public.admin_user_overview();
drop function if exists public.admin_tx_series();
drop function if exists public.admin_detail_items();

-- 1) admin_stats: tambah 'budgets' ----------------------------------
create or replace function public.admin_stats()
returns json
language plpgsql stable security definer set search_path = ''
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
    'budgets',       (select count(*) from public.budgets where end_month is null or end_month >= date_trunc('month', current_date)::date),
    'reports_total', (select count(*) from public.support_reports),
    'reports_new',   (select count(*) from public.support_reports where status = 'baru')
  );
end;
$$;

-- 2) Jumlah transaksi per hari (grafik) -----------------------------
create or replace function public.admin_tx_series()
returns table (kind text, day date, total bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select 'expense'::text, e.transaction_date, count(*) from public.expenses e group by 2
    union all
    select 'income'::text,  i.transaction_date, count(*) from public.incomes  i group by 2;
end;
$$;

-- 3) Ringkasan per pengguna ------------------------------------------
create or replace function public.admin_user_overview()
returns table (id uuid, email text, joined timestamptz,
               wallets bigint, incomes bigint, expenses bigint, plans bigint, budgets bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, u.created_at,
      (select count(*) from public.wallets  w where w.user_id = u.id and w.deleted_at is null),
      (select count(*) from public.incomes  i where i.user_id = u.id),
      (select count(*) from public.expenses e where e.user_id = u.id),
      (select count(*) from public.planning p where p.user_id = u.id),
      (select count(*) from public.budgets  b where b.user_id = u.id
         and (b.end_month is null or b.end_month >= date_trunc('month', current_date)::date))
    from auth.users u;
end;
$$;

-- 4) Rincian dompet (jenis), rencana (kategori+status), anggaran (kategori) ----
create or replace function public.admin_detail_items()
returns table (kind text, user_id uuid, label text, status text, color text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select 'wallet'::text, w.user_id, coalesce(w.type::text, 'lainnya'), null::text, null::text
      from public.wallets w where w.deleted_at is null
    union all
    select 'plan'::text, p.user_id, coalesce(p.category::text, p.name::text, 'Lainnya'), p.status::text, null::text
      from public.planning p
    union all
    select 'budget'::text, b.user_id, c.name::text, null::text, c.color::text
      from public.budgets b
      left join public.expense_categories c on c.id = b.category_id
      where b.end_month is null or b.end_month >= date_trunc('month', current_date)::date;
end;
$$;

-- 5) Hak eksekusi ------------------------------------------------------
revoke all on function public.admin_stats()         from public, anon;
revoke all on function public.admin_tx_series()     from public, anon;
revoke all on function public.admin_user_overview() from public, anon;
revoke all on function public.admin_detail_items()  from public, anon;
grant execute on function public.admin_stats()         to authenticated;
grant execute on function public.admin_tx_series()     to authenticated;
grant execute on function public.admin_user_overview() to authenticated;
grant execute on function public.admin_detail_items()  to authenticated;