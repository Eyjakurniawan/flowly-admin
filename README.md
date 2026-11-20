# Flowly Admin (HTML + CSS + JS)

Web admin untuk Flowly. Memakai Supabase yang SAMA dengan aplikasi Flutter.

## Menjalankan
1. Jalankan `database/admin_setup.sql` di Supabase -> SQL Editor.
2. Buat akun admin: Authentication -> Users -> Add user (Auto Confirm User),
   lalu jalankan `insert into public.admins ...` (lihat bagian 8 di file SQL).
3. Isi `SUPABASE_ANON_KEY` di `js/supabase.js` (nilainya sama dengan di
   `lib/utils/constants.dart` aplikasi Flutter).
4. Buka folder ini di VS Code, klik kanan `index.html` -> Open with Live Server.
   (Bisa juga klik dua kali `index.html`, tapi Live Server lebih stabil.)

## Struktur
- `index.html` login | `dashboard.html` ringkasan | `laporan.html` laporan bantuan | `kategori.html` kategori bawaan
- `js/supabase.js` client | `js/auth.js` login/penjaga | `js/util.js` helper | `js/<halaman>.js` logika halaman
- `database/admin_setup.sql` tabel admins, is_admin(), policy RLS, fungsi statistik

## Penting
- Jangan taruh service role / secret key di folder ini.
- Keamanan sebenarnya ada di RLS + is_admin() di database.
