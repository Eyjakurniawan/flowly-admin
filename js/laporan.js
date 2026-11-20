// Laporan bantuan: baca, ubah status/balasan, hapus.
//
// ALIRAN DATA (tabel support_reports, dijaga RLS "admin ... laporan"):
//   muat   -> db.from('support_reports').select()
//   simpan -> db.from('support_reports').update({status, balasan}).eq('id', id)
//   hapus  -> db.from('support_reports').delete().eq('id', id)

const STATUS = ['baru', 'diproses', 'selesai'];
let semuaLaporan = [];

async function muat() {
  tampilPesan('Memuat...');
  const { data, error } = await db
    .from('support_reports')
    .select('id, created_at, email, type, message, status, balasan')
    .order('created_at', { ascending: false });

  if (error) return tampilPesan('Gagal memuat: ' + error.message, true);
  semuaLaporan = data;
  tampilPesan('');
  tampil();
}

function tampil() {
  const filter = document.getElementById('filter-status').value;
  const rows = semuaLaporan.filter((r) => !filter || r.status === filter);
  const tbody = document.getElementById('tbody');

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">Tidak ada laporan.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((r) => `
    <tr data-id="${esc(r.id)}">
      <td>${esc(fmtTanggal(r.created_at))}</td>
      <td>${esc(r.email)}</td>
      <td>${esc(r.type)}</td>
      <td>${esc(r.message)}</td>
      <td>
        <select class="status">
          ${STATUS.map((s) => `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><textarea class="balasan" rows="2">${esc(r.balasan)}</textarea></td>
      <td>
        <button data-act="simpan">Simpan</button>
        <button data-act="hapus">Hapus</button>
      </td>
    </tr>`).join('');
}

async function simpan(tr) {
  const id = tr.dataset.id;
  const status = tr.querySelector('.status').value;
  const balasan = tr.querySelector('.balasan').value.trim() || null;

  // .select('id') supaya ketahuan kalau RLS menolak (update 0 baris tanpa error).
  const { data, error } = await db
    .from('support_reports')
    .update({ status, balasan })
    .eq('id', id)
    .select('id');

  if (error) return tampilPesan('Gagal menyimpan: ' + error.message, true);
  if (!data || data.length === 0) {
    return tampilPesan('Tidak ada baris yang berubah. Cek policy admin di database.', true);
  }
  const item = semuaLaporan.find((r) => String(r.id) === String(id));
  if (item) { item.status = status; item.balasan = balasan; }
  tampilPesan('Laporan disimpan.');
}

async function hapus(tr) {
  if (!confirm('Hapus laporan ini? Tidak bisa dikembalikan.')) return;
  const id = tr.dataset.id;

  const { data, error } = await db
    .from('support_reports')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) return tampilPesan('Gagal menghapus: ' + error.message, true);
  if (!data || data.length === 0) {
    return tampilPesan('Tidak ada baris yang terhapus. Cek policy admin di database.', true);
  }
  semuaLaporan = semuaLaporan.filter((r) => String(r.id) !== String(id));
  tampil();
  tampilPesan('Laporan dihapus.');
}

(async () => {
  const user = await requireAdmin();
  if (!user) return;

  document.getElementById('filter-status').addEventListener('change', tampil);
  document.getElementById('btn-muat').addEventListener('click', muat);
  document.getElementById('tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const tr = btn.closest('tr');
    if (btn.dataset.act === 'simpan') simpan(tr);
    if (btn.dataset.act === 'hapus') hapus(tr);
  });

  await muat();
})();
