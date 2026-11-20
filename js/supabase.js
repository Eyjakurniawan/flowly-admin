// Satu-satunya tempat konfigurasi Supabase untuk web admin.
// Pakai URL dan anon (publishable) key yang SAMA dengan aplikasi Flowly
// (lihat lib/utils/constants.dart).
//
// JANGAN PERNAH menaruh service role / secret key di sini:
// file ini bisa dibaca siapa saja yang membuka web-nya.
const SUPABASE_URL = 'https://ukxnjaajtquugnastdps.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fsBPtKF_NWsBCE4wy7Qelw_RLEFRTUj';

// "window.supabase" berasal dari library CDN (dimuat di tiap halaman).
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
