// Rincian dari kartu ringkasan di Dashboard (detail.html#users, #wallets, #exp,
// #inc, #plans, #budgets). Hanya JUMLAH aktivitas; tanpa nominal uang.
//
// ALIRAN DATA:
//   Browser -> db.rpc('admin_stats')          -> angka total
//   Browser -> db.rpc('admin_user_overview')  -> jumlah per pengguna
//   Browser -> db.rpc('admin_category_usage') -> pemakaian kategori bawaan
//   Browser -> db.rpc('admin_tx_series')      -> jumlah transaksi per hari

let STAT = {};
let USERS = [];
let TX = [];
let KAT = { expense: [], income: [] };

const bars = (L) => {
  const tot = L.reduce((a, x) => a + x.v, 0) || 1,
    mx = Math.max(1, ...L.map((x) => x.v));
  return L.length
    ? L.map(
        (x) => `<div class="cb"><div class="row"><b><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${esc(x.c)};margin-right:8px"></i>${esc(x.k)}</b><span class="sub">${x.v} • ${Math.round((x.v / tot) * 100)}%</span></div><div class="bar"><i data-w="${(x.v / mx) * 100}" style="background:${esc(x.c)}"></i></div></div>`,
      ).join("")
    : '<div class="sub" style="padding:14px 0">Belum ada data.</div>';
};
const bx = (t, L) =>
  `<div class="card"><h2 class="d">${t}</h2><div style="margin-top:6px">${bars(L)}</div></div>`;

const ue = (u) =>
  `<span class="ue"><span class="uav" style="--c:${avc(u.email)}" aria-hidden="true">${esc(String(u.email || "?")[0].toUpperCase())}</span><b style="font-weight:600">${esc(u.email || "(tanpa email)")}</b></span>`;

const ut = (cols, heads, rows) =>
  `<div class="card lt"><div class="ur h" style="--cols:${cols}">${heads.map((x) => `<span>${x}</span>`).join("")}</div>${
    rows.length
      ? rows
          .map(
            (r) =>
              `<div class="ur" style="--cols:${cols}">${r.map((c, i) => (i ? `<span data-l="${heads[i]}">${c}</span>` : c)).join("")}</div>`,
          )
          .join("")
      : '<div class="sub" style="padding:18px 0">Belum ada data.</div>'
  }</div>`;

const fTgl = (iso) => {
  const d = new Date(iso);
  return d.getDate() + " " + MS[d.getMonth()] + " " + d.getFullYear();
};
const sum = (k) => USERS.reduce((a, u) => a + (Number(u[k]) || 0), 0);

const tiles3 = (k) => {
  const now = new Date();
  const t = (p) => seri(p, TX).t[k];
  return `<div class="tiles"><div><span class="sub">7 hari terakhir</span><b class="d">${t("Mingguan")}</b></div><div><span class="sub">${MF[now.getMonth()]}</span><b class="d">${t("Bulanan")}</b></div><div><span class="sub">Tahun ${now.getFullYear()}</span><b class="d">${t("Tahunan")}</b></div></div>`;
};

// Pemakaian kategori bawaan (sama seperti dashboard)
const katBars = (kind) =>
  KAT[kind]
    .filter((c) => c.used > 0)
    .sort((a, b) => b.used - a.used)
    .map((c) => ({ k: c.name, v: c.used, c: warnaValid(c.color) }));

const txBody = (kind, field, judulKol, judulBar) => {
  const tot = sum(field) || 1;
  return (
    bx(judulBar, katBars(kind)) +
    ut(
      "minmax(200px,2fr) 140px 100px",
      ["Pengguna", judulKol, "Porsi"],
      USERS.filter((u) => u[field])
        .sort((a, b) => b[field] - a[field])
        .map((u) => [ue(u), u[field] + " transaksi", Math.round((u[field] / tot) * 100) + "%"]),
    )
  );
};

const cnt = (field, judul) =>
  ut(
    "minmax(200px,2fr) 110px",
    ["Pengguna", judul],
    USERS.filter((u) => u[field])
      .sort((a, b) => b[field] - a[field])
      .map((u) => [ue(u), u[field]]),
  );

const DET = {
  users: {
    t: "Pengguna terdaftar", l: "Total akun", ic: "users", c: "var(--inc)",
    n: () => STAT.users,
    d: "Akun yang sudah mendaftar di Flowly dan seberapa aktif mereka. Yang tampil hanya jumlah aktivitas, tanpa nominal uang.",
    tiles: () => "",
    body: () => {
      const ms = [];
      USERS.slice()
        .sort((a, b) => new Date(a.joined) - new Date(b.joined))
        .reverse()
        .forEach((u) => {
          const x = new Date(u.joined),
            k = MF[x.getMonth()] + " " + x.getFullYear(),
            f = ms.find((z) => z.k === k);
          f ? f.v++ : ms.push({ k, v: 1, c: "#2563EB" });
        });
      return (
        bx("Pendaftar per bulan", ms) +
        ut(
          "minmax(200px,2fr) 120px repeat(4,minmax(64px,.6fr))",
          ["Pengguna", "Bergabung", "Dompet", "Transaksi", "Rencana", "Anggaran"],
          USERS.slice()
            .sort((a, b) => new Date(b.joined) - new Date(a.joined))
            .map((u) => [ue(u), fTgl(u.joined), u.wallets, Number(u.incomes) + Number(u.expenses), u.plans, u.budgets]),
        )
      );
    },
  },
  wallets: {
    t: "Dompet aktif", l: "Total dompet", ic: "wallet", c: "var(--water)",
    n: () => STAT.wallets,
    d: "Dompet yang dibuat pengguna. Saldo tidak ditampilkan di sini.",
    tiles: () => "",
    body: () => cnt("wallets", "Dompet"),
  },
  exp: {
    t: "Transaksi pengeluaran", l: "Total transaksi pengeluaran", ic: "down", c: "var(--acc)",
    n: () => STAT.expenses,
    d: "Jumlah transaksi pengeluaran dari semua pengguna. Nominal rupiah dan isi catatan tidak ditampilkan.",
    tiles: () => tiles3("e"),
    body: () => txBody("expense", "expenses", "Pengeluaran", "Pengeluaran per kategori"),
  },
  inc: {
    t: "Transaksi pemasukan", l: "Total transaksi pemasukan", ic: "up", c: "var(--inc)",
    n: () => STAT.incomes,
    d: "Jumlah transaksi pemasukan dari semua pengguna. Nominal rupiah dan isi catatan tidak ditampilkan.",
    tiles: () => tiles3("i"),
    body: () => txBody("income", "incomes", "Pemasukan", "Pemasukan per kategori"),
  },
  plans: {
    t: "Rencana tabungan", l: "Total rencana", ic: "target", c: "var(--ok)",
    n: () => STAT.planning,
    d: "Target tabungan yang dibuat pengguna. Nominal target tidak ditampilkan.",
    tiles: () => "",
    body: () => cnt("plans", "Rencana"),
  },
  budgets: {
    t: "Anggaran aktif", l: "Total anggaran", ic: "pie", c: "var(--warn)",
    n: () => STAT.budgets,
    d: "Batas pengeluaran yang dipasang pengguna. Nominal batas tidak ditampilkan.",
    tiles: () => "",
    body: () => cnt("budgets", "Anggaran"),
  },
};

function tampil() {
  const key = location.hash.slice(1);
  const D = DET[key] || DET.users;
  document.getElementById("view").innerHTML = `
    <div class="ph"><div class="dh"><a class="ib back" href="dashboard.html" aria-label="Kembali ke Dashboard">${IC(ICON.back)}</a><div><h1 class="d">${D.t}</h1><div class="sub" style="margin-top:2px">Rincian dari ringkasan Dashboard</div></div></div></div>
    <p id="pesan" class="msg"></p>
    <div class="card dhero" style="--c:${D.c}"><div class="dh"><span class="ic2">${IC(ICON[D.ic], 26)}</span><div><div class="sub">${D.l}</div><div class="n d" data-count="${Number(D.n()) || 0}">0</div></div></div><p class="sub" style="margin-top:12px;max-width:640px;font-size:14.5px">${D.d}</p>${D.tiles()}</div>
    ${D.body()}`;
  animasiAngka();
  animasiBar();
}

(async () => {
  const user = await requireAdmin();
  if (!user) return;

  document.getElementById("view").innerHTML = '<div class="skel"></div>';

  const [st, ov, pakai, ser, exp, inc] = await Promise.all([
    db.rpc("admin_stats"),
    db.rpc("admin_user_overview"),
    db.rpc("admin_category_usage"),
    db.rpc("admin_tx_series"),
    db.from("expense_categories").select("id, name, color").is("user_id", null),
    db.from("income_categories").select("id, name, color").is("user_id", null),
  ]);

  STAT = st.data || {};
  USERS = ov.data || [];
  TX = ser.data || [];
  const usage = {};
  (pakai.data || []).forEach((u) => (usage[`${u.kind}:${u.category_id}`] = Number(u.total)));
  const pakaiKat = (kind, res) =>
    (res.data || []).map((c) => ({ ...c, used: usage[`${kind}:${c.id}`] || 0 }));
  KAT = { expense: pakaiKat("expense", exp), income: pakaiKat("income", inc) };

  tampil();

  const galat = [];
  if (st.error) galat.push("ringkasan (" + st.error.message + ")");
  if (ov.error) galat.push("daftar pengguna (" + ov.error.message + ")");
  if (ser.error) galat.push("grafik (" + ser.error.message + ")");
  if (pakai.error) galat.push("pemakaian kategori");
  if (galat.length) tampilPesan("Gagal memuat: " + galat.join(", ") + ".", true);

  addEventListener("hashchange", tampil);
})();