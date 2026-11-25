# Flowly Admin (HTML + CSS + JS)

Web admin untuk Flowly. Memakai Supabase yang SAMA dengan aplikasi Flutter.
Tampilannya mengikuti desain `flowly_admin.html` (sidebar biru bergelombang,
maskot Floy, kartu ringkasan, mode terang/gelap otomatis).

## Menjalankan

1. Jalankan `database/admin_setup.sql` di Supabase -> SQL Editor.
2. Buat akun admin: Authentication -> Users -> Add user (Auto Confirm User),
   lalu jalankan `insert into public.admins ...` (lihat bagian 8 di file SQL).
3. Isi `SUPABASE_ANON_KEY` di `js/supabase.js` (nilainya sama dengan di
   `lib/utils/constants.dart` aplikasi Flutter).
4. Buka folder ini di VS Code, klik kanan `index.html` -> Open with Live Server.

## Struktur

- `index.html` login | `dashboard.html` ringkasan | `laporan.html` laporan bantuan | `kategori.html` kategori bawaan
- `css/style.css` semua gaya (diambil dari desain)
- `js/supabase.js` client | `js/auth.js` login/penjaga | `js/util.js` helper
- `js/ui.js` kerangka bersama: sidebar, bar atas, maskot Floy, toast, dialog konfirmasi
- `js/<halaman>.js` logika tiap halaman
- `database/admin_setup.sql` tabel admins, is_admin(), policy RLS, fungsi statistik

## Penting

- Jangan taruh service role / secret key di folder ini.
- Keamanan sebenarnya ada di RLS + is_admin() di database.
