// Helper kecil yang dipakai semua halaman.

// Wajib dipakai untuk teks dari database sebelum dimasukkan ke innerHTML
// (isi laporan ditulis pengguna, jadi tidak boleh dipercaya).
function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtTanggal(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

// Menampilkan pesan di <p id="pesan"></p>.
function tampilPesan(text, isError = false) {
  const el = document.getElementById('pesan');
  if (!el) return;
  el.textContent = text;
  el.className = isError ? 'error' : 'ok';
}
