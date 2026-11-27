// Helper kecil yang dipakai semua halaman.

// Wajib dipakai untuk teks dari database sebelum dimasukkan ke innerHTML
// (isi laporan ditulis pengguna, jadi tidak boleh dipercaya).
function esc(text) {
  return String(text ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

function fmtTanggal(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Pesan di <p id="pesan" class="msg">. Dipakai untuk pesan error;
// pesan sukses memakai toast() dari ui.js.
function tampilPesan(text, isError = false) {
  const el = document.getElementById("pesan");
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + (isError ? "is-error" : "is-ok");
}

// Kelompokkan data harian dari admin_tx_series menjadi Mingguan (Sen-Min minggu ini) / Bulanan / Tahunan (Jan-Des).
// tx: [{kind:'income'|'expense', day:'YYYY-MM-DD', total}]
function seri(p, tx) {
  const now = new Date(),
    y = now.getFullYear(),
    m = now.getMonth(),
    h0 = new Date(y, m, now.getDate());
  let l, idx;
  if (p === "Mingguan") {
    // Minggu ini, mulai Senin sampai Minggu.
    l = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const senin = new Date(h0);
    senin.setDate(senin.getDate() - ((h0.getDay() + 6) % 7));
    idx = (d) => {
      const n = Math.round((d - senin) / 864e5);
      return n >= 0 && n < 7 ? n : -1;
    };
  } else if (p === "Bulanan") {
    const nw = Math.ceil(new Date(y, m + 1, 0).getDate() / 7);
    l = Array.from({ length: nw }, (_, i) => "Minggu " + (i + 1));
    idx = (d) =>
      d.getFullYear() === y && d.getMonth() === m
        ? Math.min(nw - 1, Math.floor((d.getDate() - 1) / 7))
        : -1;
  } else {
    l = MS.slice();
    idx = (d) => (d.getFullYear() === y ? d.getMonth() : -1);
  }
  const r = { l, i: Array(l.length).fill(0), e: Array(l.length).fill(0), t: { i: 0, e: 0 } };
  tx.forEach((row) => {
    const [yy, mm, dd] = String(row.day).split("-").map(Number);
    const d = new Date(yy, mm - 1, dd);
    const n = Math.round((h0 - d) / 864e5);
    const x = idx(d, n);
    if (x < 0) return;
    const k = row.kind === "income" ? "i" : "e";
    r[k][x] += Number(row.total) || 0;
    r.t[k] += Number(row.total) || 0;
  });
  return r;
}