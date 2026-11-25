// Dashboard: angka ringkasan (lewat fungsi admin_stats), pemakaian kategori bawaan
// dan 4 laporan terbaru.
//
// ALIRAN DATA:
//   Browser -> db.rpc('admin_stats')            -> angka (fungsi SQL cek is_admin)
//   Browser -> db.rpc('admin_category_usage')   -> jumlah transaksi per kategori
//   Browser -> db.from('support_reports')       -> RLS "admin baca laporan"

function kartuStat(stat) {
  const baru = Number(stat.reports_new) || 0;
  return [
    ["users", stat.users, "Pengguna terdaftar", "var(--inc)"],
    ["wallet", stat.wallets, "Dompet aktif", "var(--water)"],
    ["down", stat.expenses, "Transaksi pengeluaran", "var(--acc)"],
    ["up", stat.incomes, "Transaksi pemasukan", "var(--inc)"],
    ["target", stat.planning, "Rencana tabungan", "var(--ok)"],
    [
      "msg",
      stat.reports_total,
      "Total laporan bantuan",
      "var(--mut)",
      "laporan.html",
    ],
    [
      "bell",
      stat.reports_new,
      "Laporan belum ditangani",
      baru ? "var(--acc)" : "var(--ok)",
      "laporan.html#baru",
    ],
  ];
}

function htmlHero(stat) {
  const exp = Number(stat.expenses) || 0,
    inc = Number(stat.incomes) || 0,
    tot = exp + inc;
  const pi = tot ? Math.round((inc / tot) * 100) : 0,
    pe = tot ? 100 - pi : 0;
  return `
  <div class="tank">
    <div class="tkL">
      <div class="lab"><i class="dot"></i>Seluruh pengguna Flowly</div>
      <div class="big d"><span data-count="${tot}">0</span></div>
      <div class="cap">transaksi tercatat dari semua pengguna</div>
    </div>
    <div class="tkR">
      <div class="tkr"><div><div class="lab">${IC(ICON.up, 16)}Pemasukan</div><div class="cap">${pi}% dari total transaksi</div></div><div class="n d"><span data-count="${inc}">0</span></div></div>
      <div class="tkr"><div><div class="lab">${IC(ICON.down, 16)}Pengeluaran</div><div class="cap">${pe}% dari total transaksi</div></div><div class="n d"><span data-count="${exp}">0</span></div></div>
    </div>
  </div>`;
}

function htmlKartu(stat) {
  return kartuStat(stat)
    .map(([i, v, l, c, href], k) => {
      const isi = `<span class="ic">${IC(ICON[i])}</span>${href ? `<span class="go">${IC(ICON.go, 18)}</span>` : ""}
      <div class="n d" data-count="${Number(v) || 0}">0</div><i class="u"></i><div class="l">${l}</div>`;
      return href
        ? `<a class="sc" href="${href}" style="--c:${c};--i:${k}" aria-label="${l}: ${Number(v) || 0}. Buka">${isi}</a>`
        : `<div class="sc" style="--c:${c};--i:${k}">${isi}</div>`;
    })
    .join("");
}

function htmlBarKategori(judul, daftar) {
  const mx = Math.max(1, ...daftar.map((c) => c.used));
  return `<div class="card"><div class="row"><h2 class="d">${judul}</h2></div><div style="margin-top:6px">
    ${
      daftar.length
        ? daftar
            .map(
              (c) => `
      <div class="cb"><div class="row"><b><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${esc(warnaValid(c.color))};margin-right:8px"></i>${esc(c.name)}</b><span class="sub">${c.used} transaksi</span></div>
      <div class="bar"><i data-w="${(c.used / mx) * 100}" style="background:${esc(warnaValid(c.color))}"></i></div></div>`,
            )
            .join("")
        : '<div class="sub" style="padding:14px 0">Belum ada transaksi di kategori bawaan.</div>'
    }
  </div></div>`;
}

function htmlLaporan(rows) {
  if (!rows.length) {
    return `<div class="card lt"><div class="empty" style="border:0">${fl("ngantuk", 110)}<b class="d">Belum ada laporan</b><div class="sub">Laporan dari pengguna akan muncul di sini.</div></div></div>`;
  }
  return `<div class="card lt">
    <div class="lr h"><span>Tanggal</span><span>Email</span><span>Jenis</span><span>Pesan</span><span>Status</span></div>
    ${rows
      .map((r) => {
        const [, tc] = tipeInfo(r.type),
          st = statusInfo(r.status);
        return `<div class="lr">
        <span class="m">${esc(fmtTanggal(r.created_at))}</span>
        <b style="font-weight:600">${esc(r.email)}</b>
        <span><span class="chip t" style="--c:${tc}">${esc(r.type)}</span></span>
        <span>${esc(String(r.message ?? "").slice(0, 90))}</span>
        <span class="chip" style="--c:${st.c}">${esc(st.label)}</span>
      </div>`;
      })
      .join("")}
  </div>`;
}

(async () => {
  const user = await requireAdmin();
  if (!user) return;

  const view = document.getElementById("view");
  view.innerHTML = `
    <div class="ph"><div><h1 class="d">Dashboard</h1><div class="sub">Ringkasan aktivitas Flowly dan laporan bantuan terbaru dari pengguna.</div></div></div>
    <p id="pesan" class="msg"></p>
    <div class="skel"></div>`;

  const [st, lap, exp, inc, pakai] = await Promise.all([
    db.rpc("admin_stats"),
    db
      .from("support_reports")
      .select("id, created_at, email, type, message, status")
      .order("created_at", { ascending: false })
      .limit(4),
    db.from("expense_categories").select("id, name, color").is("user_id", null),
    db.from("income_categories").select("id, name, color").is("user_id", null),
    db.rpc("admin_category_usage"),
  ]);

  const stat = st.data || {};
  const usage = {};
  if (!pakai.error)
    pakai.data.forEach((u) => {
      usage[`${u.kind}:${u.category_id}`] = Number(u.total);
    });
  const pakaiKat = (kind, res) =>
    (res.data || [])
      .map((c) => ({ ...c, used: usage[`${kind}:${c.id}`] || 0 }))
      .filter((c) => c.used > 0)
      .sort((a, b) => b.used - a.used);

  view.innerHTML = `
    <div class="ph"><div><h1 class="d">Dashboard</h1><div class="sub">Ringkasan aktivitas Flowly dan laporan bantuan terbaru dari pengguna.</div></div></div>
    <p id="pesan" class="msg"></p>
    ${st.error ? "" : htmlHero(stat)}
    ${st.error ? "" : `<div class="sec" style="margin-top:22px"><h2 class="d">Ringkasan</h2></div><div class="stats">${htmlKartu(stat)}</div>`}
    <div class="sec"><h2 class="d">Kategori bawaan paling dipakai</h2></div>
    <div class="g2">${htmlBarKategori("Pengeluaran per kategori", pakaiKat("expense", exp))}${htmlBarKategori("Pemasukan per kategori", pakaiKat("income", inc))}</div>
    <div class="sec"><h2 class="d">Laporan bantuan terbaru</h2><a class="lnk" href="laporan.html" style="display:inline-flex;align-items:center;text-decoration:none">Lihat semua →</a></div>
    ${lap.error ? "" : htmlLaporan(lap.data)}`;

  const galat = [];
  if (st.error) galat.push("ringkasan (" + st.error.message + ")");
  if (lap.error) galat.push("laporan (" + lap.error.message + ")");
  if (exp.error || inc.error || pakai.error) galat.push("pemakaian kategori");
  if (galat.length)
    tampilPesan("Gagal memuat: " + galat.join(", ") + ".", true);

  animasiAngka();
  animasiBar();
})();
