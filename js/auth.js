// Login, logout, dan penjaga halaman admin.
// Keamanan SEBENARNYA ada di RLS + is_admin() di database;
// pengecekan di sini hanya supaya non-admin tidak melihat halaman kosong.

async function login(email, password) {
  const { error } = await db.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("invalid login credentials")) {
      return { ok: false, message: "Email atau kata sandi salah." };
    }
    return { ok: false, message: error.message };
  }

  // Berhasil login belum tentu admin: tanya database.
  const { data: isAdmin, error: err2 } = await db.rpc("is_admin");
  if (err2 || isAdmin !== true) {
    await db.auth.signOut();
    return { ok: false, message: "Akun ini bukan admin." };
  }
  return { ok: true };
}

// Panggil di awal tiap halaman admin. Mengembalikan user, atau null
// (dan langsung mengarahkan ke halaman login).
async function requireAdmin() {
  const { data } = await db.auth.getSession();
  const session = data.session;
  if (!session) {
    location.href = "index.html";
    return null;
  }
  const { data: isAdmin, error } = await db.rpc("is_admin");
  if (error || isAdmin !== true) {
    await db.auth.signOut();
    location.href = "index.html";
    return null;
  }
  const emailEl = document.getElementById("meEm");
  if (emailEl) emailEl.textContent = session.user.email;
  const avEl = document.getElementById("meAv");
  if (avEl) avEl.textContent = (session.user.email || "A")[0].toUpperCase();
  document.body.classList.remove("gate");

  // Angka merah "laporan baru" di menu.
  db.from("support_reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "baru")
    .then(({ count }) => {
      if (typeof setNavBadge === "function") setNavBadge(count || 0);
    });
  return session.user;
}

async function logout() {
  await db.auth.signOut();
  location.href = "index.html";
}