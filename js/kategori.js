// Kategori bawaan (user_id null): tambah, ubah nama/warna, hapus.
//
// ALIRAN DATA (dijaga RLS "admin kelola kategori bawaan"):
//   muat   -> select dari expense_categories / income_categories (user_id null)
//   jumlah pemakaian -> db.rpc('admin_category_usage') (hanya angka)
//   tambah -> insert {user_id: null, code, name, color}
//   ubah   -> update {name, color}.eq('id', id)
//   hapus  -> delete().eq('id', id)  (tombol mati kalau masih dipakai)

const TABEL = { expense: 'expense_categories', income: 'income_categories' };
const WARNA_DEFAULT = '#64748b';

function warnaValid(hex) {
  return /^#[0-9a-fA-F]{6}$/.test(hex || '') ? hex : WARNA_DEFAULT;
}

async function muat() {
  tampilPesan('Memuat...');
  const [exp, inc, pakai] = await Promise.all([
    db.from(TABEL.expense).select('id, code, name, color').is('user_id', null).order('name'),
    db.from(TABEL.income).select('id, code, name, color').is('user_id', null).order('name'),
    db.rpc('admin_category_usage'),
  ]);

  const err = exp.error || inc.error;
  if (err) return tampilPesan('Gagal memuat: ' + err.message, true);

  // Jumlah pemakaian bersifat tambahan; kalau gagal, tombol hapus tetap dikunci.
  const usageOk = !pakai.error;
  const usage = {};
  if (usageOk) pakai.data.forEach((u) => { usage[`${u.kind}:${u.category_id}`] = Number(u.total); });

  tampilPesan(usageOk ? '' : 'Jumlah pemakaian gagal dimuat (' + pakai.error.message + '). Tombol hapus dikunci.', !usageOk);
  render('expense', exp.data, usage, usageOk);
  render('income', inc.data, usage, usageOk);
}

function render(tipe, rows, usage, usageOk) {
  const tbody = document.getElementById('tbody-' + tipe);
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">Belum ada kategori bawaan.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map((c) => {
    const dipakai = usage[`${tipe}:${c.id}`] || 0;
    const bolehHapus = usageOk && dipakai === 0;
    return `
      <tr data-id="${esc(c.id)}" data-tipe="${tipe}">
        <td><input type="text" class="nama" value="${esc(c.name)}"></td>
        <td><input type="color" class="warna" value="${esc(warnaValid(c.color))}"></td>
        <td>${esc(c.code)}</td>
        <td>${usageOk ? dipakai + ' transaksi' : '?'}</td>
        <td>
          <button data-act="simpan">Simpan</button>
          <button data-act="hapus" ${bolehHapus ? '' : 'disabled'}>Hapus</button>
        </td>
      </tr>`;
  }).join('');
}

async function tambah(e) {
  e.preventDefault();
  const tipe = document.getElementById('tambah-tipe').value;
  const nama = document.getElementById('tambah-nama').value.trim();
  const warna = document.getElementById('tambah-warna').value.toUpperCase();
  if (!nama) return;

  const { error } = await db.from(TABEL[tipe]).insert({
    user_id: null,                      // null = kategori bawaan
    code: 'sys_' + Date.now(),
    name: nama,
    color: warna,
  });
  if (error) return tampilPesan('Gagal menambah: ' + error.message, true);

  document.getElementById('tambah-nama').value = '';
  await muat();
  tampilPesan('Kategori ditambahkan.');
}

async function simpan(tr) {
  const tipe = tr.dataset.tipe;
  const nama = tr.querySelector('.nama').value.trim();
  const warna = tr.querySelector('.warna').value.toUpperCase();
  if (!nama) return tampilPesan('Nama tidak boleh kosong.', true);

  const { data, error } = await db
    .from(TABEL[tipe])
    .update({ name: nama, color: warna })
    .eq('id', tr.dataset.id)
    .select('id');

  if (error) return tampilPesan('Gagal menyimpan: ' + error.message, true);
  if (!data || data.length === 0) {
    return tampilPesan('Tidak ada baris yang berubah. Cek policy admin di database.', true);
  }
  tampilPesan('Kategori disimpan.');
}

async function hapus(tr) {
  const tipe = tr.dataset.tipe;
  const nama = tr.querySelector('.nama').value;
  if (!confirm(`Hapus kategori "${nama}"? Tidak bisa dikembalikan.`)) return;

  const { data, error } = await db
    .from(TABEL[tipe])
    .delete()
    .eq('id', tr.dataset.id)
    .select('id');

  if (error) return tampilPesan('Gagal menghapus: ' + error.message, true);
  if (!data || data.length === 0) {
    return tampilPesan('Tidak ada baris yang terhapus. Cek policy admin di database.', true);
  }
  await muat();
  tampilPesan('Kategori dihapus.');
}

(async () => {
  const user = await requireAdmin();
  if (!user) return;

  document.getElementById('form-tambah').addEventListener('submit', tambah);
  ['expense', 'income'].forEach((tipe) => {
    document.getElementById('tbody-' + tipe).addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn || btn.disabled) return;
      const tr = btn.closest('tr');
      if (btn.dataset.act === 'simpan') simpan(tr);
      if (btn.dataset.act === 'hapus') hapus(tr);
    });
  });

  await muat();
})();
