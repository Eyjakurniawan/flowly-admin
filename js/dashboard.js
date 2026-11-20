// Dashboard: angka ringkasan (lewat fungsi admin_stats) + 5 laporan terbaru.
//
// ALIRAN DATA:
//   Browser -> db.rpc('admin_stats') -> fungsi SQL (cek is_admin) -> angka
//   Browser -> db.from('support_reports').select() -> RLS "admin baca laporan"

const LABEL_STAT = {
  users: 'Pengguna terdaftar',
  wallets: 'Dompet aktif',
  expenses: 'Transaksi pengeluaran',
  incomes: 'Transaksi pemasukan',
  planning: 'Rencana tabungan',
  reports_total: 'Total laporan bantuan',
  reports_new: 'Laporan belum ditangani',
};

(async () => {
  const user = await requireAdmin();
  if (!user) return;

  // 1) Angka ringkasan
  const { data: stat, error: errStat } = await db.rpc('admin_stats');
  if (errStat) {
    tampilPesan('Gagal memuat ringkasan: ' + errStat.message, true);
  } else {
    document.getElementById('tbody-stat').innerHTML = Object.keys(LABEL_STAT)
      .map((k) => `<tr><td>${esc(LABEL_STAT[k])}</td><td>${esc(stat[k])}</td></tr>`)
      .join('');
  }

  // 2) Laporan terbaru
  const { data: rows, error: errLap } = await db
    .from('support_reports')
    .select('id, created_at, email, type, message, status')
    .order('created_at', { ascending: false })
    .limit(5);

  const tbody = document.getElementById('tbody-laporan');
  if (errLap) {
    tampilPesan('Gagal memuat laporan: ' + errLap.message, true);
  } else if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">Belum ada laporan.</td></tr>';
  } else {
    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td>${esc(fmtTanggal(r.created_at))}</td>
        <td>${esc(r.email)}</td>
        <td>${esc(r.type)}</td>
        <td>${esc(String(r.message ?? '').slice(0, 80))}</td>
        <td>${esc(r.status)}</td>
      </tr>`).join('');
  }
})();
