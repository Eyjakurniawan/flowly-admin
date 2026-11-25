// Tampilan bersama: maskot Floy, ikon, kerangka (sidebar + bar atas), toast, dialog konfirmasi.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===== Floy (maskot) ===== */
function floy(m, w) {
  const E = "#0B1530",
    A = "#7DB8FF",
    FT = 'font-family="DM Sans,system-ui,sans-serif"',
    eye = (x, y) =>
      `<ellipse cx="${x}" cy="${y}" rx="5.5" ry="7" fill="${E}"/><circle cx="${x + 1.8}" cy="${y - 2.6}" r="1.8" fill="#fff"/>`,
    st = (d, x) =>
      `<path d="${d}" fill="none" stroke="${x || E}" stroke-width="2.8" stroke-linecap="round"/>`,
    op = `<path d="M91 154h18q-9 14-18 0z" fill="${E}"/>`,
    hd = (x, y) =>
      `<circle cx="${x}" cy="${y}" r="7" fill="#93C5FD" stroke="none"/>`,
    ar = (d) => `<path d="${d}"/>`,
    L0 = ar("M68 150C48 150 40 162 40 176") + hd(40, 178),
    R0 =
      `<g${w ? ' class="arm"' : ""}>` +
      ar("M132 150C158 146 167 126 166 102") +
      hd(166, 100) +
      "</g>",
    AR = {
      hore:
        ar("M68 150C44 146 36 124 38 102") +
        hd(38, 100) +
        ar("M132 150C156 146 164 124 162 102") +
        hd(162, 100),
      bingung: L0 + ar("M140 160C158 160 160 146 142 146") + hd(124, 148),
      lonceng:
        L0 +
        ar("M132 150C150 148 162 134 162 118") +
        hd(162, 116) +
        `<path d="M148 104q0-26 14-26t14 26z" fill="#F59E0B" stroke="#B45309" stroke-width="3"/><circle cx="162" cy="110" r="4" fill="#B45309" stroke="none"/>`,
      bendera:
        `<path d="M171 54V174" stroke="#C9D8F5" stroke-width="5"/><path d="M173 56h19l-6 8 6 8h-19z" fill="#F59E0B" stroke="none"/>` +
        L0 +
        ar("M132 150C152 150 166 140 170 126") +
        hd(171, 122),
      koin: "",
    },
    FR =
      m === "koin"
        ? `<circle cx="100" cy="182" r="16" fill="#F59E0B" stroke="#B45309" stroke-width="3"/><text x="100" y="188" text-anchor="middle" font-size="16" font-weight="800" fill="#92400E" ${FT}>Rp</text><g fill="none" stroke="#3B82F6" stroke-width="9" stroke-linecap="round"><path d="M66 150C44 162 58 188 82 184"/><path d="M134 150C156 162 142 188 118 184"/></g><circle cx="82" cy="184" r="6.5" fill="#93C5FD"/><circle cx="118" cy="184" r="6.5" fill="#93C5FD"/>`
        : "",
    F = {
      senang: eye(84, 136) + eye(116, 136) + st("M92 155q8 7 16 0"),
      hore:
        eye(84, 136) +
        eye(116, 136) +
        op +
        `<ellipse cx="100" cy="162" rx="4" ry="2.5" fill="#FF8FA3"/>`,
      bingung:
        eye(84, 136) +
        eye(116, 136) +
        st("M92 155q8 7 16 0") +
        `<text x="150" y="74" font-size="40" font-weight="800" fill="#4F9BFF" ${FT}>?</text>`,
      khawatir:
        eye(84, 139) +
        eye(116, 139) +
        st("M73 124l19 7M127 124l-19 7") +
        st("M88 161q3.5-4 7 0t7 0 7 0") +
        `<path d="M146 128q-5 8-5 11a5 5 0 0 0 10 0q0-3-5-11z" fill="#BFE0FF"/>`,
      ngantuk:
        st("M77 139h14M109 139h14") +
        `<ellipse cx="100" cy="159" rx="3.2" ry="2.6" fill="${E}"/><text x="138" y="68" font-size="22" font-weight="800" fill="${A}" ${FT}>z</text><text x="154" y="46" font-size="15" font-weight="800" fill="${A}" ${FT}>z</text>`,
      kaget:
        `<circle cx="84" cy="136" r="9" fill="#fff"/><circle cx="116" cy="136" r="9" fill="#fff"/><circle cx="84" cy="137" r="4.8" fill="${E}"/><circle cx="116" cy="137" r="4.8" fill="${E}"/><ellipse cx="100" cy="161" rx="3.8" ry="5.5" fill="${E}"/>` +
        st("M50 98l11 6M46 112h13M150 98l-11 6M154 112h-13", A),
      kedip: eye(84, 136) + st("M108 139q8-9 16 0") + op,
      bangga:
        st("M78 140q6-8 12 0M110 140q6-8 12 0") +
        op +
        st("M32 76v14M25 83h14M166 54v14M159 61h14", A),
    };
  return `<svg viewBox="0 0 200 200" role="img" aria-label="Floy"><g fill="none" stroke="#3B82F6" stroke-width="9" stroke-linecap="round">${m in AR ? AR[m] : L0 + R0}</g><path d="M100 38C100 38 52 98 52 138C52 168 72 190 100 190C128 190 148 168 148 138C148 98 100 38 100 38Z" fill="url(#flB)" stroke="#B4C8EA" stroke-opacity=".7" stroke-width="1.6"/><path d="M99 46C96 30 105 22 121 22" fill="none" stroke="#6BAEFF" stroke-width="5" stroke-linecap="round"/><ellipse cx="72" cy="112" rx="6" ry="14" transform="rotate(14 72 112)" fill="#fff" opacity=".3"/><circle cx="70" cy="150" r="7.5" fill="#C48CE0" opacity=".6"/><circle cx="130" cy="150" r="7.5" fill="#C48CE0" opacity=".6"/>${F[m] || F.senang}${FR}</svg>`;
}
const fl = (m, sz, extra = "") =>
  `<span class="fl ${extra}" style="width:${sz}px;height:${sz}px">${floy(m, extra.includes("fl-a"))}</span>`;

/* ===== ikon ===== */
const IC = (d, s = 22) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
  users:
    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.2 2.4 3.6 5.2"/>',
  wallet:
    '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
  down: '<path d="M7 17L17 7M17 7H9M17 7v8"/>',
  up: '<path d="M17 7L7 17M7 17h8M7 17V9"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l6-6"/>',
  msg: '<path d="M4 5h16v11H9l-5 4z"/>',
  bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4"/>',
  refresh:
    '<path d="M20 11a8 8 0 0 0-14-4M4 5v4h4M4 13a8 8 0 0 0 14 4M20 19v-4h-4"/>',
  trash:
    '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  go: '<path d="M9 6l6 6-6 6"/>',
};
const CHK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ===== konstanta & helper tampilan ===== */
const PAL = [
  "#1E3A8A",
  "#2563EB",
  "#0284C7",
  "#16A34A",
  "#15803D",
  "#D97706",
  "#DC2626",
  "#BE185D",
  "#7C3AED",
  "#7C3510",
  "#64748B",
];
const MF = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const HR = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Status di database huruf kecil (baru / diproses / selesai).
const STATUS = {
  baru: { label: "Baru", c: "var(--acc)" },
  diproses: { label: "Diproses", c: "var(--warn)" },
  selesai: { label: "Selesai", c: "var(--ok)" },
};
const statusInfo = (s) => STATUS[s] || { label: s || "-", c: "var(--mut)" };

// Jenis laporan: isi kolom type bebas, jadi dikenali dari katanya.
function tipeInfo(t) {
  const x = String(t || "").toLowerCase();
  if (x.includes("bug") || x.includes("salah") || x.includes("error"))
    return ["kaget", "var(--acc)"];
  if (x.includes("saldo")) return ["bingung", "var(--warn)"];
  if (x.includes("saran") || x.includes("fitur"))
    return ["kedip", "var(--inc)"];
  return ["senang", "var(--mut)"];
}

const avc = (e) => {
  let k = 0;
  for (const ch of String(e || "?")) k = (k * 31 + ch.charCodeAt(0)) >>> 0;
  return PAL[k % PAL.length];
};
const warnaValid = (hex) =>
  /^#[0-9a-fA-F]{6}$/.test(hex || "") ? hex : "#64748B";
const slug = (n) =>
  String(n)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Hitung naik untuk angka besar.
function cu(el, to) {
  if (RM || to < 2) {
    el.textContent = to;
    return;
  }
  const t0 = performance.now();
  (function s(t) {
    const k = Math.min(1, (t - t0) / 900),
      e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(to * e);
    if (k < 1) requestAnimationFrame(s);
  })(t0);
}
const animasiAngka = () =>
  $$("[data-count]").forEach((e) => cu(e, +e.dataset.count));
const animasiBar = () =>
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      $$(".bar i[data-w]").forEach((b) => (b.style.width = b.dataset.w + "%")),
    ),
  );

/* ===== toast & dialog konfirmasi ===== */
let tT = null;
function toast(m, mood = "senang") {
  const t = $("#toast");
  if (!t) return;
  t.innerHTML = `<span class="fl" style="width:30px;height:30px">${floy(mood)}</span><span></span>`;
  t.lastChild.textContent = m;
  t.classList.add("on");
  clearTimeout(tT);
  tT = setTimeout(() => t.classList.remove("on"), 2600);
}

let cfFn = null;
function ask(title, msg, ok, fn, danger = true, mood = "bingung") {
  $("#cfF").innerHTML = floy(mood);
  $("#cfT").textContent = title;
  $("#cfM").textContent = msg;
  const b = $("#cfY");
  b.textContent = ok;
  b.style.background = danger ? "var(--err)" : "";
  b.style.borderColor = danger ? "var(--err)" : "";
  b.style.color = danger ? "#fff" : "";
  cfFn = fn;
  $("#cf").classList.add("on");
  $("#cfN").focus();
}
const askX = () => {
  $("#cf").classList.remove("on");
  cfFn = null;
};

/* ===== kerangka halaman admin ===== */
const NAV = [
  ["dashboard", "dashboard.html", "Dashboard", ICON.grid],
  ["laporan", "laporan.html", "Laporan bantuan", ICON.msg],
  ["kategori", "kategori.html", "Kategori bawaan", ICON.tag],
];

function setNavBadge(n) {
  const b = $("#nbR");
  if (!b) return;
  b.hidden = !n;
  b.textContent = n;
}

const openSide = () => {
  $("#side").classList.add("open");
  $("#scrim").classList.add("on");
};
const closeSide = () => {
  $("#side").classList.remove("open");
  $("#scrim").classList.remove("on");
};

function dateUI() {
  const n = new Date(),
    el = $("#dtp");
  if (el)
    el.textContent =
      HR[n.getDay()] +
      ", " +
      n.getDate() +
      " " +
      MF[n.getMonth()] +
      " " +
      n.getFullYear();
}

function buildShell() {
  const page = document.body.dataset.page;
  const main = $("#view");
  document.body.insertAdjacentHTML(
    "afterbegin",
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="flB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7DB8FF"/><stop offset="1" stop-color="#2563EB"/></linearGradient></defs></svg>',
  );
  if (!main || !page) return; // halaman login tidak memakai kerangka

  const shell = document.createElement("div");
  shell.className = "shell";
  shell.id = "shell";
  shell.innerHTML = `
    <aside class="side" id="side" aria-label="Navigasi admin">
      <div class="brandrow"><span class="brand">Flowly</span><span class="tag">Admin</span></div>
      <nav class="nav" id="nav">
        ${NAV.map(([k, href, label, ic]) => `<a href="${href}" data-k="${k}"${k === page ? ' class="on" aria-current="page"' : ""}>${IC(ic)}${label}${k === "laporan" ? '<span class="nb" id="nbR" hidden>0</span>' : ""}</a>`).join("")}
      </nav>
      <div class="sidebot">
        <div class="me"><span class="av" id="meAv">A</span><div style="min-width:0"><small>Masuk sebagai</small><b id="meEm">-</b></div></div>
        <button class="outb" id="logout">Keluar</button>
      </div>
    </aside>
    <div class="scrim" id="scrim"></div>
    <div class="main">
      <header class="top">
        <div class="tl">
          <button class="ib burger" id="burger" aria-label="Buka menu">${IC('<path d="M4 7h16M4 12h16M4 17h10"/>')}</button>
          <span class="pill dt d" id="dtp"></span>
        </div>
      </header>
      <div id="slot"></div>
      <div class="foot">Flowly Admin</div>
    </div>`;
  main.parentNode.insertBefore(shell, main);
  $("#slot", shell).replaceWith(main);

  document.body.classList.add("gate"); // disembunyikan sampai requireAdmin() lolos
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="cfo" id="cf" role="alertdialog" aria-modal="true" aria-labelledby="cfT" aria-describedby="cfM">
      <div class="cfb"><span class="fl" id="cfF" style="width:110px;height:110px"></span>
        <h2 class="d" id="cfT" style="font-size:22px;margin:4px 0 6px"></h2>
        <div class="sub" id="cfM" style="font-size:15px;line-height:1.5;margin-bottom:18px"></div>
        <div class="grid2"><button class="btn" id="cfN">Batal</button><button class="btn acc" id="cfY"></button></div>
      </div>
    </div>
    <div class="toast" id="toast" role="status"></div>`,
  );

  $("#cfN").onclick = askX;
  $("#cf").onclick = (e) => {
    if (e.target.id === "cf") askX();
  };
  $("#cfY").onclick = () => {
    const f = cfFn;
    askX();
    if (f) f();
  };
  $("#burger").onclick = openSide;
  $("#scrim").onclick = closeSide;
  $$("#nav a").forEach((a) => a.addEventListener("click", closeSide));
  $("#logout").onclick = () =>
    ask(
      "Yakin mau keluar?",
      "Kamu perlu masuk lagi untuk membuka Flowly Admin.",
      "Ya, keluar",
      logout,
      false,
      "kedip",
    );
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if ($("#cf").classList.contains("on")) askX();
    else closeSide();
  });
  dateUI();
  setInterval(dateUI, 60000);
}
buildShell();
