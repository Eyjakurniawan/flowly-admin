// Dashboard: angka ringkasan (lewat fungsi admin_stats), grafik transaksi
// dan 4 laporan terbaru.
//
// ALIRAN DATA:
//   Browser -> db.rpc('admin_stats')            -> angka (fungsi SQL cek is_admin)
//   Browser -> db.rpc('admin_tx_series')        -> jumlah transaksi per hari (grafik)
//   Browser -> db.from('support_reports')       -> RLS "admin baca laporan"

function kartuStat(stat) {
  const baru = Number(stat.reports_new) || 0;
  return [
    ["users", stat.users, "Pengguna terdaftar", "var(--inc)", "detail.html#users"],
    ["wallet", stat.wallets, "Dompet aktif", "var(--water)", "detail.html#wallets"],
    ["down", stat.expenses, "Transaksi pengeluaran", "var(--acc)", "detail.html#exp"],
    ["up", stat.incomes, "Transaksi pemasukan", "var(--inc)", "detail.html#inc"],
    ["target", stat.planning, "Rencana tabungan", "var(--ok)", "detail.html#plans"],
    ["pie", stat.budgets, "Anggaran aktif", "var(--warn)", "detail.html#budgets"],
    ["msg", stat.reports_total, "Total laporan bantuan", "var(--mut)", "laporan.html"],
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

/* ===== grafik transaksi: Mingguan / Bulanan / Tahunan ===== */
let CP = "Mingguan";
let TX = []; // hasil db.rpc("admin_tx_series"): [{kind, day:"YYYY-MM-DD", total}]

function htmlGrafik() {
  return `<div class="card"><div class="row" style="flex-wrap:wrap"><h2 class="d">Transaksi semua pengguna</h2>
    <div class="seg" role="group" aria-label="Periode grafik">${["Mingguan", "Bulanan", "Tahunan"]
      .map((p) => `<button data-act="cf" data-p="${p}" aria-pressed="${CP === p}">${p}</button>`)
      .join("")}</div></div>
    <div class="sub" id="ro" style="margin:10px 0 2px;min-height:20px" aria-live="polite">Geser di grafik untuk melihat detail</div>
    <svg id="chart" viewBox="0 0 340 180" role="img" aria-label="Grafik jumlah transaksi semua pengguna"></svg>
    <div class="lg"><span><i style="background:var(--inc)"></i>Pemasukan</span><span><i style="background:var(--acc)"></i>Pengeluaran</span></div>
    <div class="cfs" id="cfs"></div></div>`;
}

function gambarGrafik() {
  const svg = $("#chart");
  if (!svg) return;
  const d = seri(CP, TX),
    // Lebar mengikuti kartu (grafik tampil penuh), tinggi dibatasi supaya tidak menjulang.
    W = Math.max(300, Math.round(svg.getBoundingClientRect().width)),
    H = W > 700 ? 170 : W > 480 ? 160 : 150,
    L = 10,
    B = 22,
    n = d.l.length,
    mx = Math.max(...d.i, ...d.e, 1) + 1;
  const X = (i) => L + ((W - 2 * L) * i) / (n - 1),
    Y = (v) => H - B - ((H - B - 16) * v) / mx;
  const sm = (a) => {
    let p = `M${X(0)} ${Y(a[0])}`;
    for (let i = 1; i < n; i++) {
      const c = (X(i - 1) + X(i)) / 2;
      p += `C${c} ${Y(a[i - 1])} ${c} ${Y(a[i])} ${X(i)} ${Y(a[i])}`;
    }
    return p;
  };
  const now = new Date();
  const pl = {
    Mingguan: "Minggu ini",
    Bulanan: MF[now.getMonth()] + " " + now.getFullYear(),
    Tahunan: "Tahun " + now.getFullYear(),
  }[CP];
  $("#cfs").innerHTML = `<div class="sub" style="grid-column:1/-1">${pl}</div><div><span class="sub">Pemasukan</span><b class="d" style="color:var(--inc)">${d.t.i}</b></div><div><span class="sub">Pengeluaran</span><b class="d" style="color:var(--acc)">${d.t.e}</b></div><div><span class="sub">Total</span><b class="d">${d.t.i + d.t.e}</b></div>`;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.height = H + "px"; // tinggi pasti, tidak ikut lebar kartu
  svg.innerHTML =
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--inc)" stop-opacity=".35"/><stop offset="1" stop-color="var(--inc)" stop-opacity="0"/></linearGradient></defs>` +
    `<path d="M${L} ${H - B}H${W - L}" stroke="var(--line)"/>` +
    `<path d="${sm(d.i)}L${X(n - 1)} ${H - B}L${X(0)} ${H - B}Z" fill="url(#g)"/>` +
    `<path class="ln" d="${sm(d.i)}" fill="none" stroke="var(--inc)" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path class="ln" d="${sm(d.e)}" fill="none" stroke="var(--acc)" stroke-width="2.4" stroke-linecap="round"/>` +
    `<line id="gl" y1="8" y2="${H - B}" stroke="var(--mut)" stroke-dasharray="3 4" opacity="0"/>` +
    `<circle id="c1" r="4" fill="var(--inc)" stroke="var(--card)" stroke-width="2.5" opacity="0"/>` +
    `<circle id="c2" r="4" fill="var(--acc)" stroke="var(--card)" stroke-width="2.5" opacity="0"/>` +
    d.l
      .map((t, i) =>
        n > 12 && i % 2
          ? ""
          : `<text x="${X(i)}" y="${H - 7}" font-size="9.5" text-anchor="${i == 0 ? "start" : i == n - 1 ? "end" : "middle"}" fill="var(--mut)">${t}</text>`,
      )
      .join("");

  const ro = $("#ro");
  if (![...d.i, ...d.e].some((v) => v > 0)) {
    ro.textContent = "Belum ada transaksi di periode ini.";
    svg.onpointermove = svg.onpointerdown = svg.onpointerleave = null;
    return;
  }
  ro.textContent = "Geser di grafik untuk melihat detail";
  if (!RM)
    $$("#chart .ln").forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      requestAnimationFrame(() => {
        p.style.transition = "stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)";
        p.style.strokeDashoffset = 0;
      });
    });
  const show = (i) => {
    $("#gl").setAttribute("x1", X(i));
    $("#gl").setAttribute("x2", X(i));
    $("#c1").setAttribute("cx", X(i));
    $("#c1").setAttribute("cy", Y(d.i[i]));
    $("#c2").setAttribute("cx", X(i));
    $("#c2").setAttribute("cy", Y(d.e[i]));
    ["#gl", "#c1", "#c2"].forEach((q) => $(q).setAttribute("opacity", 1));
    ro.innerHTML = `<b style="color:var(--ink)">${d.l[i]}</b> • Pemasukan ${d.i[i]} • Pengeluaran ${d.e[i]}`;
  };
  const mv = (e) => {
    const r = svg.getBoundingClientRect(),
      x = ((e.clientX - r.left) / r.width) * W;
    show(Math.max(0, Math.min(n - 1, Math.round((x - L) / ((W - 2 * L) / (n - 1))))));
  };
  svg.onpointermove = svg.onpointerdown = mv;
  svg.onpointerleave = () => {
    ["#gl", "#c1", "#c2"].forEach((q) => $(q).setAttribute("opacity", 0));
    ro.textContent = "Geser di grafik untuk melihat detail";
  };
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

  const [st, lap, seriRes] = await Promise.all([
    db.rpc("admin_stats"),
    db
      .from("support_reports")
      .select("id, created_at, email, type, message, status")
      .order("created_at", { ascending: false })
      .limit(4),
    db.rpc("admin_tx_series"),
  ]);
  TX = seriRes.error ? [] : seriRes.data || [];

  const stat = st.data || {};
  view.innerHTML = `
    <div class="ph"><div><h1 class="d">Dashboard</h1><div class="sub">Ringkasan aktivitas Flowly dan laporan bantuan terbaru dari pengguna.</div></div></div>
    <p id="pesan" class="msg"></p>
    ${st.error ? "" : htmlHero(stat)}
    ${st.error ? "" : `<div class="sec" style="margin-top:22px"><h2 class="d">Ringkasan</h2><span class="sub">Ketuk kartu untuk melihat rincian</span></div><div class="stats">${htmlKartu(stat)}</div>`}
    <div class="sec"><h2 class="d">Aktivitas</h2></div>
    ${htmlGrafik()}
    <div class="sec"><h2 class="d">Laporan bantuan terbaru</h2><a class="lnk" href="laporan.html" style="display:inline-flex;align-items:center;text-decoration:none">Lihat semua →</a></div>
    ${lap.error ? "" : htmlLaporan(lap.data)}`;

  const galat = [];
  if (st.error) galat.push("ringkasan (" + st.error.message + ")");
  if (lap.error) galat.push("laporan (" + lap.error.message + ")");
  if (seriRes.error) galat.push("grafik (" + seriRes.error.message + ")");
  if (galat.length)
    tampilPesan("Gagal memuat: " + galat.join(", ") + ".", true);

  view.addEventListener("click", (e) => {
    const b = e.target.closest('[data-act="cf"]');
    if (!b) return;
    CP = b.dataset.p;
    $$('[data-act="cf"]').forEach((x) => x.setAttribute("aria-pressed", x === b));
    gambarGrafik();
  });

  animasiAngka();
  animasiBar();
  gambarGrafik();
  let rz = 0,
    lebar = $("#chart")?.getBoundingClientRect().width;
  addEventListener("resize", () => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(() => {
      const w = $("#chart")?.getBoundingClientRect().width;
      if (w !== lebar) {
        lebar = w;
        gambarGrafik();
      }
    });
  });
})();