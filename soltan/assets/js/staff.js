const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const STATUS = { pending: "Täze", preparing: "Taýýarlanýar", delivering: "Ýolda", done: "Tamamlandy", cancelled: "Ýatyryldy" };
const ACTIVE = ["pending", "preparing", "delivering"];
let tagList = [], imageFile = null, imageUrl = "", products = {}, orders = [], tab = "active", unsubs = [], firstLoad = true;
const nameOf = (p) => p.name || (p.title && (typeof p.title === "string" ? p.title : p.title.tm || p.title.ru || p.title.en)) || "?";

$("productCategory").innerHTML = categoryOrder.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");

// ---------- Auth ----------
auth.onAuthStateChanged((u) => {
  $("loginBox").style.display = u ? "none" : "flex";
  $("app").style.display = u ? "block" : "none";
  unsubs.forEach((f) => f()); unsubs = [];
  if (u) start();
});
$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault(); $("loginErr").textContent = "";
  try { await auth.signInWithEmailAndPassword($("loginEmail").value.trim(), $("loginPass").value); }
  catch (err) { $("loginErr").textContent = "Email ýa-da parol nädogry"; }
});
$("btnLogout").onclick = () => auth.signOut();

function beep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator();
    o.connect(c.destination); o.frequency.value = 880; o.start();
    setTimeout(() => { o.stop(); c.close(); }, 500);
  } catch (e) {}
}

function start() {
  unsubs.push(db.collection("products").onSnapshot((s) => {
    products = {}; s.forEach((d) => (products[d.id] = { id: d.id, ...d.data() }));
    $("btnSeed").style.display = s.empty ? "inline-block" : "none";
    renderProducts(); renderOrders();
  }, (e) => console.error(e)));
  unsubs.push(db.collection("orders").orderBy("createdAt", "desc").limit(150).onSnapshot((s) => {
    if (!firstLoad) s.docChanges().forEach((c) => { if (c.type === "added" && c.doc.data().status === "pending") beep(); });
    firstLoad = false;
    orders = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderOrders();
  }, (e) => console.error(e)));
}

// ---------- Orders ----------
function orderHtml(o) {
  const c = o.customer || {}, items = o.items || [];
  const expected = items.reduce((sum, i) => sum + (products[i.id] ? Number(products[i.id].price) * i.qty : NaN), 0);
  const bad = !isNaN(expected) && Math.abs(expected - Number(o.totalPrice)) > 0.01;
  const t = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString() : "";
  const ph = esc(c.phone || "");
  return `<div class="order-card">
    <div class="order-top"><span class="badge">#${esc(o.id.slice(0, 5).toUpperCase())}</span><span class="price-total">${Number(o.totalPrice || 0).toFixed(2)} TMT</span></div>
    <div class="order-time">${esc(t)}</div>
    ${bad ? `<div class="warn">⚠ Baha gabat gelenok (bolmaly: ${expected.toFixed(2)} TMT)</div>` : ""}
    <div class="cust-details">
      <div><strong>Müşderi:</strong> ${esc(c.name || "-")}</div>
      <div><strong>Tel:</strong> <a href="tel:${ph}">${ph || "-"}</a></div>
      <div><strong>Adres:</strong> ${esc(c.address || "-")}</div>
      ${c.note && c.note !== "Ýok" ? `<div><strong>Bellik:</strong> ${esc(c.note)}</div>` : ""}
    </div>
    <div class="items-title">Sargyt edilenler</div>
    ${items.map((i) => `<div class="item-line"><span>${esc(i.title)} (x${esc(i.qty)})</span><span>${(Number(i.price) * Number(i.qty)).toFixed(2)} TMT</span></div>`).join("")}
    <select class="status-select" data-id="${esc(o.id)}">${Object.keys(STATUS).map((k) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${STATUS[k]}</option>`).join("")}</select>
  </div>`;
}
function renderOrders() {
  const list = orders.filter((o) => (tab === "active") === ACTIVE.includes(o.status));
  $("statusCounter").textContent = "Aktiw: " + orders.filter((o) => ACTIVE.includes(o.status)).length;
  $("ordersContainer").innerHTML = list.length ? list.map(orderHtml).join("") : '<div class="empty-msg">Sargyt ýok</div>';
}
$("ordersContainer").addEventListener("change", (e) => {
  const s = e.target.closest(".status-select");
  if (s) db.collection("orders").doc(s.dataset.id).update({ status: s.value }).catch((err) => alert(err.message));
});
document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
  tab = b.dataset.tab;
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === b));
  renderOrders();
}));

// ---------- Products ----------
function renderProducts() {
  const list = Object.values(products).sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));
  $("staffProductsContainer").innerHTML = list.map((p) => `<div class="staff-product-item">
    <div class="staff-product-info">
      ${p.image ? `<img class="staff-product-img" src="${esc(p.image)}" alt="">` : '<div class="staff-product-placeholder">No img</div>'}
      <div><div class="staff-product-title">${esc(nameOf(p))}${p.soldOut ? " (tükenen)" : ""}</div>
      <div class="staff-product-meta">${esc(p.category || "")} - ${(parseFloat(p.price) || 0).toFixed(2)} TMT</div></div>
    </div>
    <div class="staff-product-actions">
      <button class="btn-edit-item" data-act="sold" data-id="${esc(p.id)}">${p.soldOut ? "Bar" : "Tükendi"}</button>
      <button class="btn-edit-item" data-act="edit" data-id="${esc(p.id)}">Düzediş</button>
      <button class="btn-delete-item" data-act="del" data-id="${esc(p.id)}">Poz</button>
    </div></div>`).join("");
}
$("staffProductsContainer").addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const id = b.dataset.id, ref = db.collection("products").doc(id);
  try {
    if (b.dataset.act === "edit") openModal(id);
    else if (b.dataset.act === "sold") await ref.update({ soldOut: !products[id].soldOut });
    else if (b.dataset.act === "del" && confirm("Hakykatdan pozmalymy?")) await ref.delete();
  } catch (err) { alert(err.message); }
});
$("btnSeed").onclick = async () => {
  if (!confirm(menuData.length + " haryt ýüklensinmi?")) return;
  const batch = db.batch();
  menuData.forEach((m) => batch.set(db.collection("products").doc(m.id), { name: m.title.tm, title: m.title, category: m.category, price: m.price, currency: m.currency || "TMT", image: m.image || "", description: "", ingredients: [], soldOut: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() }));
  try { await batch.commit(); } catch (e) { alert(e.message); }
};

// ---------- Modal ----------
function renderTags() {
  $("ingredientsTagsContainer").innerHTML = tagList.map((t, i) => `<span class="tag">${esc(t)}<span class="tag-remove" data-i="${i}">&times;</span></span>`).join("");
}
$("ingredientsTagsContainer").addEventListener("click", (e) => {
  const r = e.target.closest(".tag-remove"); if (r) { tagList.splice(+r.dataset.i, 1); renderTags(); }
});
$("btnAddTag").onclick = () => {
  const v = $("productIngredientInput").value.trim();
  if (v && !tagList.includes(v)) { tagList.push(v); $("productIngredientInput").value = ""; renderTags(); }
};
function setFile(f) {
  if (!f || !f.type.startsWith("image/")) return;
  imageFile = f;
  $("dropZonePreviews").innerHTML = `<img class="preview-img" src="${URL.createObjectURL(f)}" alt="">`;
}
const dz = $("dropZone");
dz.addEventListener("click", () => $("productImageInput").click());
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("dragover"); });
dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
dz.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("dragover"); setFile(e.dataTransfer.files[0]); });
$("productImageInput").addEventListener("change", (e) => setFile(e.target.files[0]));

function openModal(id) {
  $("productForm").reset(); tagList = []; imageFile = null; imageUrl = ""; $("dropZonePreviews").innerHTML = "";
  const p = id ? products[id] : null;
  $("editProductId").value = id || "";
  $("modalTitle").textContent = p ? "HARYDY DÜZETMEK" : "TÄZE HARYT GOŞMAK";
  if (p) {
    const t = (p.title && typeof p.title === "object") ? p.title : {};
    $("productName").value = t.tm || nameOf(p); $("productNameRu").value = t.ru || ""; $("productNameEn").value = t.en || "";
    $("productCategory").value = p.category || categoryOrder[0]; $("productPrice").value = p.price || "";
    $("productDesc").value = p.description || ""; tagList = [...(p.ingredients || [])]; imageUrl = p.image || "";
    if (imageUrl) $("dropZonePreviews").innerHTML = `<img class="preview-img" src="${esc(imageUrl)}" alt="">`;
  }
  renderTags(); $("productModal").classList.add("active");
}
function closeModal() { $("productModal").classList.remove("active"); }
$("btnOpenAddModal").onclick = () => openModal();
$("btnCancelModal").onclick = closeModal;

function compress(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 800 / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = img.width * k; c.height = img.height * k;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => (b ? res(b) : rej(new Error("Surat ýalňyşlygy"))), "image/jpeg", 0.82);
    };
    img.onerror = () => rej(new Error("Surat açylmady"));
    img.src = URL.createObjectURL(file);
  });
}

$("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("btnSaveModal"); btn.disabled = true; btn.textContent = "Ýükleniýär...";
  try {
    const tm = $("productName").value.trim();
    let image = imageUrl;
    if (imageFile) {
      const ref = storage.ref("products/" + Date.now() + ".jpg");
      await ref.put(await compress(imageFile), { contentType: "image/jpeg" });
      image = await ref.getDownloadURL();
    }
    const data = {
      name: tm, title: { tm, ru: $("productNameRu").value.trim() || tm, en: $("productNameEn").value.trim() || tm },
      category: $("productCategory").value, price: parseFloat($("productPrice").value) || 0,
      description: $("productDesc").value.trim(), ingredients: tagList, image,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    const id = $("editProductId").value;
    if (id) await db.collection("products").doc(id).update(data);
    else await db.collection("products").add({ ...data, soldOut: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    closeModal();
  } catch (err) { alert("Ýalňyşlyk: " + err.message); }
  finally { btn.disabled = false; btn.textContent = "Ýatda sakla"; }
});
