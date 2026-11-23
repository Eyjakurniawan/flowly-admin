// Laporan bantuan: baca, tandai selesai, hapus.
//
// ALIRAN DATA (tabel support_reports, dijaga RLS "admin ... laporan"):
//   muat    -> db.from('support_reports').select()
//   selesai -> db.from('support_reports').update({status: 'selesai'}).eq('id', id)
//   hapus   -> db.from('support_reports').delete().eq('id', id)
// Tampilan baru diperbarui SETELAH database menyatakan berhasil.

let semuaLaporan = [];

// Pesan biasa; kalau error, gulir ke pesannya supaya pasti terlihat.
function notif(text, isError = false) {
  tampilPesan(text, isError);
  if (isError) document.getElementById('pesan').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function muat() {
  tampilPesan('Memuat...');
  const { data, error } = await db
    .from('support_reports')
    .select('id, created_at, email, type, message, status')
    .order('created_at', { ascending: false });

  if (error) return notif('Gagal memuat: ' + error.message, true);
  semuaLaporan = data;
  tampilPesan('');
  tampil();
}

function tampil() {
  const filter = document.getElementById('filter-status').value;
  const rows = semuaLaporan.filter((r) => !filter || r.status === filter);
  const tbody = document.getElementById('tbody');

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">Tidak ada laporan.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((r) => {
    const selesai = r.status === 'selesai';
    return `
    <tr data-id="${esc(r.id)}" class="${selesai ? 'is-selesai' : ''}">
      <td>${esc(fmtTanggal(r.created_at))}</td>
      <td>${esc(r.email)}</td>
      <td>${esc(r.type)}</td>
      <td>${esc(r.message)}</td>
      <td><span class="badge badge-${esc(r.status)}">${esc(r.status)}</span></td>
      <td>
        <button data-act="selesai" ${selesai ? 'disabled' : ''}>${selesai ? '&#10003; Selesai' : 'Selesai'}</button>
        <button data-act="hapus">Hapus</button>
      </td>
    </tr>`;
  }).join('');
}

// Dialog konfirmasi hapus. Mengembalikan Promise<boolean>.
function konfirmasiHapus(laporan) {
  const dlg = document.getElementById('dlg-hapus');
  if (!dlg || typeof dlg.showModal !== 'function') {
    return Promise.resolve(confirm('Hapus laporan ini? Tidak bisa dikembalikan.'));
  }
  document.getElementById('dlg-email').textContent = laporan ? laporan.email : '';
  return new Promise((resolve) => {
    dlg.returnValue = '';
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'hapus'), { once: true });
    dlg.showModal();
  });
}

async function selesai(tr, btn) {
  const id = tr.dataset.id;
  btn.disabled = true; // cegah klik ganda

  // .select('id') supaya ketahuan kalau RLS menolak (update 0 baris tanpa error).
  const { data, error } = await db
    .from('support_reports')
    .update({ status: 'selesai' })
    .eq('id', id)
    .select('id');

  if (error || !data || data.length === 0) {
    btn.disabled = false;
    return notif(
      error ? 'Gagal menandai selesai: ' + error.message
            : 'Tidak ada baris yang berubah. Cek policy admin di database.',
      true
    );
  }

  const item = semuaLaporan.find((r) => String(r.id) === String(id));
  if (item) item.status = 'selesai';
  tampil();
  tampilPesan('Laporan ditandai selesai.');
}

async function hapus(tr) {
  const id = tr.dataset.id;
  const item = semuaLaporan.find((r) => String(r.id) === String(id));
  if (!(await konfirmasiHapus(item))) return;

  const { data, error } = await db
    .from('support_reports')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) return notif('Gagal menghapus: ' + error.message, true);
  if (!data || data.length === 0) {
    return notif('Tidak ada baris yang terhapus. Cek policy admin di database.', true);
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
    if (!btn || btn.disabled) return;
    const tr = btn.closest('tr');
    if (btn.dataset.act === 'selesai') selesai(tr, btn);
    if (btn.dataset.act === 'hapus') hapus(tr);
  });

  await muat();
})();