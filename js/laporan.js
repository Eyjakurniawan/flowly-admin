// Laporan bantuan: baca, ubah status (baru / diproses / selesai), hapus.
//
// ALIRAN DATA (tabel support_reports, dijaga RLS "admin ... laporan"):
//   muat   -> db.from('support_reports').select()
//   status -> db.from('support_reports').update({status}).eq('id', id)
//   hapus  -> db.from('support_reports').delete().eq('id', id)
// Tampilan baru diperbarui SETELAH database menyatakan berhasil.

let semua = [];
let RF = "semua"; // filter status
let RT = "semua"; // filter jenis
let memuat = false;

// Bisa dibuka dari dashboard: laporan.html#baru
const dariHash = () => {
  const h = location.hash.slice(1);
  RF = h === "baru" || h === "diproses" || h === "selesai" ? h : "semua";
};

const hitung = (s) =>
  s === "semua" ? semua.length : semua.filter((r) => r.status === s).length;

function notif(text) {
  tampilPesan(text, true);
  document
    .getElementById("pesan")
    .scrollIntoView({ behavior: "smooth", block: "center" });
}

function kartu(r, i) {
  const [, tc] = tipeInfo(r.type),
    st = statusInfo(r.status);
  return `
  <article class="rp" data-id="${esc(r.id)}" style="--c:${st.c};--i:${i}">
    <div class="rph">
      <span class="av" style="--c:${avc(r.email)}" aria-hidden="true">${esc(String(r.email || "?")[0].toUpperCase())}</span>
      <div class="who"><b>${esc(r.email)}</b><span class="sub">${esc(fmtTanggal(r.created_at))}</span></div>
      <span class="chip t" style="--c:${tc}">${esc(r.type)}</span>
      <span class="chip" style="--c:${st.c}">${esc(st.label)}</span>
    </div>
    <div class="rpb"><small>Pesan</small>${esc(r.message)}</div>
    <div class="rpa">
      <div class="seg" role="group" aria-label="Ubah status">
        ${Object.keys(STATUS)
          .map(
            (s) =>
              `<button data-act="st" data-s="${s}" aria-pressed="${r.status === s}">${STATUS[s].label}</button>`,
          )
          .join("")}
      </div>
      <div class="acts"><button class="btn dng" data-act="hapus" aria-label="Hapus laporan">${IC(ICON.trash, 17)}Hapus</button></div>
    </div>
  </article>`;
}

function tampil() {
  const jenis = [...new Set(semua.map((r) => r.type).filter(Boolean))].sort();
  if (RT !== "semua" && !jenis.includes(RT)) RT = "semua";
  const rows = semua.filter(
    (r) =>
      (RF === "semua" || r.status === RF) && (RT === "semua" || r.type === RT),
  );

  document.getElementById("view").innerHTML = `
    <div class="ph"><div><h1 class="d">Laporan bantuan</h1><div class="sub">Baca laporan dari pengguna dan tandai statusnya: Baru, Diproses, atau Selesai.</div></div></div>
    <p id="pesan" class="msg"></p>
    <div class="fb">
      <div class="fl2">
        <div class="seg" role="group" aria-label="Filter status">
          ${["semua", "baru", "diproses", "selesai"].map((s) => `<button data-act="rf" data-f="${s}" aria-pressed="${RF === s}">${s === "semua" ? "Semua" : STATUS[s].label}<small>${hitung(s)}</small></button>`).join("")}
        </div>
        <select class="in" id="rt" aria-label="Filter jenis">
          <option value="semua">Semua jenis</option>
          ${jenis.map((t) => `<option value="${esc(t)}"${RT === t ? " selected" : ""}>${esc(t)}</option>`).join("")}
        </select>
      </div>
      <button class="btn" data-act="refresh" style="height:46px"><span style="display:inline-flex;${memuat ? "animation:spin .7s linear infinite" : ""}">${IC(ICON.refresh, 18)}</span>Muat ulang</button>
    </div>
    <div class="rps">${
      rows.length
        ? rows.map(kartu).join("")
        : `
      <div class="empty">${fl("ngantuk", 150)}<b class="d">${semua.length ? "Tidak ada laporan di filter ini" : "Belum ada laporan"}</b>
        <div class="sub">${semua.length ? "Ganti filter status atau jenis untuk melihat laporan lain." : "Laporan dari pengguna akan muncul di sini."}</div>
        ${semua.length ? '<button class="btn" data-act="reset" style="margin-top:12px">Reset filter</button>' : ""}
      </div>`
    }</div>`;
  setNavBadge(hitung("baru"));
}

async function muat(dengan_toast = false) {
  memuat = true;
  tampil();
  const { data, error } = await db
    .from("support_reports")
    .select("id, created_at, email, type, message, status")
    .order("created_at", { ascending: false });
  memuat = false;

  if (error) {
    tampil();
    return notif("Gagal memuat: " + error.message);
  }
  semua = data;
  tampil();
  if (dengan_toast) toast("Data dimuat ulang");
}

async function ubahStatus(id, status, btn) {
  const item = semua.find((r) => String(r.id) === String(id));
  if (!item || item.status === status) return;
  btn.disabled = true; // cegah klik ganda

  // .select('id') supaya ketahuan kalau RLS menolak (update 0 baris tanpa error).
  const { data, error } = await db
    .from("support_reports")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error || !data || data.length === 0) {
    btn.disabled = false;
    return notif(
      error
        ? "Gagal mengubah status: " + error.message
        : "Tidak ada baris yang berubah. Cek policy admin di database.",
    );
  }
  item.status = status;
  tampil();
  toast(
    "Status diubah menjadi " + STATUS[status].label,
    status === "selesai" ? "bangga" : "senang",
  );
}

function hapus(id) {
  const item = semua.find((r) => String(r.id) === String(id));
  if (!item) return;
  ask(
    "Hapus laporan?",
    `Laporan dari ${item.email} akan dihapus permanen dan tidak bisa dikembalikan.`,
    "Ya, hapus",
    async () => {
      const { data, error } = await db
        .from("support_reports")
        .delete()
        .eq("id", id)
        .select("id");
      if (error) return notif("Gagal menghapus: " + error.message);
      if (!data || data.length === 0)
        return notif(
          "Tidak ada baris yang terhapus. Cek policy admin di database.",
        );
      semua = semua.filter((r) => String(r.id) !== String(id));
      tampil();
      toast("Laporan dihapus", "bingung");
    },
  );
}

(async () => {
  const user = await requireAdmin();
  if (!user) return;
  dariHash();

  const view = document.getElementById("view");
  view.addEventListener("change", (e) => {
    if (e.target.id === "rt") {
      RT = e.target.value;
      tampil();
    }
  });
  view.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const a = b.dataset.act;
    if (a === "rf") {
      RF = b.dataset.f;
      return tampil();
    }
    if (a === "reset") {
      RF = "semua";
      RT = "semua";
      return tampil();
    }
    if (a === "refresh") {
      if (!memuat) muat(true);
      return;
    }
    const id = b.closest(".rp")?.dataset.id;
    if (a === "st") return ubahStatus(id, b.dataset.s, b);
    if (a === "hapus") return hapus(id);
  });
  addEventListener("hashchange", () => {
    dariHash();
    tampil();
  });

  await muat();
})();
