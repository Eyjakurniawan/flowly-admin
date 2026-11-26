// Kategori bawaan (user_id null): tambah, ubah nama/warna, hapus.
//
// ALIRAN DATA (dijaga RLS "admin kelola kategori bawaan"):
//   muat   -> select dari expense_categories / income_categories (user_id null)
//   pakai  -> db.rpc('admin_category_usage') (hanya angka)
//   tambah -> insert {user_id: null, code, name, color}
//   ubah   -> update {name, color}.eq('id', id)
//   hapus  -> delete().eq('id', id)  (tombol mati kalau masih dipakai)

const TABEL = { expense: "expense_categories", income: "income_categories" };
const JUDUL = { expense: "Pengeluaran", income: "Pemasukan" };

let DATA = { expense: [], income: [] };
let USAGE = {};
let usageOk = true;
let usageErr = "";
let ADD = { kind: "expense", color: null };
let ADDPAL = false;

const palHtml = (cur, act) =>
  `<div class="pal" role="group" aria-label="Pilih warna">${PAL.map((c) => {
    const on = c.toLowerCase() === String(cur).toLowerCase();
    return `<button type="button" data-act="${act}" data-c="${c}" style="background:${c}" aria-label="Warna ${c}" aria-pressed="${on}">${on ? CHK : ""}</button>`;
  }).join("")}</div>`;

const warnaBebas = () => {
  const dipakai = [...DATA.expense, ...DATA.income].map((c) =>
    String(c.color).toLowerCase(),
  );
  return (
    PAL.find((c) => !dipakai.includes(c.toLowerCase())) ||
    PAL[(DATA.expense.length + DATA.income.length) % PAL.length]
  );
};

function baris(tipe, c, i) {
  const dipakai = USAGE[`${tipe}:${c.id}`] || 0;
  const boleh = usageOk && dipakai === 0;
  const w = warnaValid(c.color);
  return `
  <div class="crow anim" data-id="${esc(c.id)}" data-tipe="${tipe}" data-n="${esc(c.name)}" data-oc="${esc(w)}" data-cur="${esc(w)}" style="animation-delay:${i * 35}ms">
    <input class="in cn" maxlength="30" value="${esc(c.name)}" aria-label="Nama kategori ${esc(c.name)}">
    <button class="swt" type="button" style="--c:${esc(w)}" data-act="pal" aria-label="Ubah warna ${esc(c.name)}"><i></i></button>
    <code>${esc(c.code)}</code>
    <span class="use${dipakai ? "" : " z"}">${usageOk ? dipakai + " transaksi" : "?"}</span>
    <div class="acts">
      <button class="btn pri" data-act="simpan" disabled>Simpan</button>
      <button class="btn dng" data-act="hapus" ${boleh ? "" : `disabled title="${usageOk ? "Dipakai transaksi, tidak bisa dihapus" : "Jumlah pemakaian gagal dimuat"}"`}>Hapus</button>
    </div>
  </div>`;
}

function tabel(tipe) {
  const L = DATA[tipe];
  return `<div class="card ct">
    <div class="crow h"><span>Nama</span><span>Warna</span><span>Kode</span><span>Dipakai</span><span>Aksi</span></div>
    ${L.length ? L.map((c, i) => baris(tipe, c, i)).join("") : `<div class="empty" style="border:0;margin:6px 0">${fl("kedip", 90)}<b>Belum ada kategori</b></div>`}
  </div>`;
}

function tampil(pesan = "") {
  if (!ADD.color) ADD.color = warnaBebas();
  const nama = document.getElementById("an")?.value || "";
  document.getElementById("view").innerHTML = `
    <div class="ph"><div><h1 class="d">Kategori bawaan</h1><div class="sub">Kategori di sini dipakai semua pengguna. Kategori yang sudah dipakai transaksi tidak bisa dihapus.</div></div></div>
    <p id="pesan" class="msg"></p>
    <div class="sec" style="margin-top:0"><h2 class="d">Tambah kategori</h2></div>
    <div class="card"><div class="addc" id="addc">
      <div class="seg" role="group" aria-label="Jenis kategori">
        ${Object.keys(JUDUL)
          .map(
            (k) =>
              `<button data-act="kind" data-k="${k}" aria-pressed="${ADD.kind === k}">${JUDUL[k]}</button>`,
          )
          .join("")}
      </div>
      <input class="in" id="an" maxlength="30" autocomplete="off" placeholder="Nama kategori" aria-label="Nama kategori baru" aria-describedby="aE" value="${esc(nama)}">
      <button class="swt" type="button" id="asw" style="--c:${ADD.color}" data-act="apal" aria-label="Pilih warna"><i></i></button>
      <button class="btn pri cta2" id="aok" data-act="tambah" style="height:54px;padding:0 24px;font-size:16px">${IC(ICON.plus, 18)}Tambah</button>
      ${ADDPAL ? palHtml(ADD.color, "apick") : ""}
    </div><div class="err" id="aE" role="alert"></div></div>
    ${Object.keys(JUDUL)
      .map(
        (k) => `
      <div class="sec"><h2 class="d">${JUDUL[k]}</h2><span class="sub">${DATA[k].length} kategori</span></div>${tabel(k)}`,
      )
      .join("")}`;
  if (pesan) tampilPesan(pesan, true);
}

async function muat() {
  const [exp, inc, pakai] = await Promise.all([
    db
      .from(TABEL.expense)
      .select("id, code, name, color")
      .is("user_id", null)
      .order("name"),
    db
      .from(TABEL.income)
      .select("id, code, name, color")
      .is("user_id", null)
      .order("name"),
    db.rpc("admin_category_usage"),
  ]);
  const err = exp.error || inc.error;
  if (err) return tampil("Gagal memuat: " + err.message);

  // Jumlah pemakaian bersifat tambahan; kalau gagal, tombol hapus tetap dikunci.
  usageOk = !pakai.error;
  USAGE = {};
  if (usageOk)
    pakai.data.forEach((u) => {
      USAGE[`${u.kind}:${u.category_id}`] = Number(u.total);
    });
  DATA = { expense: exp.data, income: inc.data };
  tampil(
    usageOk
      ? ""
      : "Jumlah pemakaian gagal dimuat (" +
          pakai.error.message +
          "). Tombol hapus dikunci.",
  );
}

function dirty(row) {
  const nama = row.querySelector(".cn").value.trim();
  const tipe = row.dataset.tipe;
  const kembar = DATA[tipe].some(
    (c) =>
      String(c.id) !== row.dataset.id &&
      c.name.toLowerCase() === nama.toLowerCase(),
  );
  row.querySelector('[data-act="simpan"]').disabled =
    !nama ||
    kembar ||
    (nama === row.dataset.n && row.dataset.cur === row.dataset.oc);
  row.querySelector(".cn").classList.toggle("bad", kembar);
}

async function tambah() {
  const tipe = ADD.kind;
  const nama = document
    .getElementById("an")
    .value.replace(/[<>&"']/g, "")
    .trim();
  const er = !nama
    ? "Nama kategori wajib diisi."
    : DATA[tipe].some((c) => c.name.toLowerCase() === nama.toLowerCase())
      ? "Kategori itu sudah ada di daftar " + JUDUL[tipe].toLowerCase() + "."
      : "";
  document.getElementById("aE").textContent = er;
  document.getElementById("an").classList.toggle("bad", !!er);
  if (er) return document.getElementById("an").focus();

  const { error } = await db.from(TABEL[tipe]).insert({
    user_id: null, // null = kategori bawaan
    code: "sys_" + Date.now(),
    name: nama,
    color: ADD.color.toUpperCase(),
  });
  if (error) return tampilPesan("Gagal menambah: " + error.message, true);

  document.getElementById("an").value = "";
  ADD.color = null;
  ADDPAL = false;
  await muat();
  toast("Kategori ditambahkan", "hore");
}

async function simpan(row) {
  const tipe = row.dataset.tipe;
  const nama = row.querySelector(".cn").value.trim();
  const warna = row.dataset.cur.toUpperCase();
  if (!nama) return tampilPesan("Nama tidak boleh kosong.", true);

  const { data, error } = await db
    .from(TABEL[tipe])
    .update({ name: nama, color: warna })
    .eq("id", row.dataset.id)
    .select("id");
  if (error) return tampilPesan("Gagal menyimpan: " + error.message, true);
  if (!data || data.length === 0)
    return tampilPesan(
      "Tidak ada baris yang berubah. Cek policy admin di database.",
      true,
    );

  const c = DATA[tipe].find((x) => String(x.id) === row.dataset.id);
  if (c) {
    c.name = nama;
    c.color = warna;
  }
  tampil();
  toast("Kategori diperbarui");
}

function hapus(row) {
  const tipe = row.dataset.tipe;
  const nama = row.querySelector(".cn").value;
  ask(
    "Hapus kategori?",
    `"${nama}" akan dihapus dari daftar kategori bawaan semua pengguna dan tidak bisa dikembalikan.`,
    "Ya, hapus",
    async () => {
      const { data, error } = await db
        .from(TABEL[tipe])
        .delete()
        .eq("id", row.dataset.id)
        .select("id");
      if (error) return tampilPesan("Gagal menghapus: " + error.message, true);
      if (!data || data.length === 0)
        return tampilPesan(
          "Tidak ada baris yang terhapus. Cek policy admin di database.",
          true,
        );
      await muat();
      toast("Kategori dihapus", "bingung");
    },
  );
}

(async () => {
  const user = await requireAdmin();
  if (!user) return;

  const view = document.getElementById("view");
  view.addEventListener("input", (e) => {
    const row = e.target.closest(".crow");
    if (row && e.target.classList.contains("cn")) return dirty(row);
    if (e.target.id === "an") {
      document.getElementById("aE").textContent = "";
      e.target.classList.remove("bad");
    }
  });
  view.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "an") tambah();
  });
  view.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const a = b.dataset.act,
      row = b.closest(".crow");
    if (a === "pal") {
      const ada = row.querySelector(".pal");
      $$(".crow .pal").forEach((x) => x.remove());
      if (!ada)
        row.insertAdjacentHTML("beforeend", palHtml(row.dataset.cur, "pick"));
      return;
    }
    if (a === "pick") {
      row.dataset.cur = b.dataset.c;
      row.querySelector(".swt").style.setProperty("--c", b.dataset.c);
      row.querySelector(".pal").remove();
      return dirty(row);
    }
    if (a === "simpan") return simpan(row);
    if (a === "hapus") return hapus(row);
    if (a === "kind") {
      ADD.kind = b.dataset.k;
      $$("#addc .seg button").forEach((x) =>
        x.setAttribute("aria-pressed", x === b),
      );
      return;
    }
    if (a === "apal") {
      ADDPAL = !ADDPAL;
      return tampil();
    }
    if (a === "apick") {
      ADD.color = b.dataset.c;
      ADDPAL = false;
      return tampil();
    }
    if (a === "tambah") return tambah();
  });

  await muat();
})();