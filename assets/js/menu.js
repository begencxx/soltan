const i18n = {
  tm: {
    allCategory: "ÄHLISI",
    searchPlaceholder: "Gözleg...",
    addedToast: "Haryt sebede goşuldy",
    myCart: "Sebedim",
    emptyCart: "Sebediňiz boş",
    totalLabel: "Umumy:",
    orderBtn: "Sargyt et",
    nameLabel: "Adyňyz Familiýaňyz",
    namePlaceholder: "Adyňyzy we Familiýaňyzy ýazyň",
    phoneLabel: "Telefon nomeriňiz",
    addressLabel: "Adresiňiz",
    addressPlaceholder: "Adresiňizi ýazyň",
    noteLabel: "Bellik",
    notePlaceholder: "Bellik",
    cancelBtn: "Aýyr",
    submitBtn: "Sargyt ediň",
    addBtn: "Goşmak",
    noResults: "Haryt tapylmady",
    invalidPhone: "Haýysh, dogry telefon nomerini giriziň (+9936XXXXXXX ýa-da +9937XXXXXXX)"
  },
  ru: {
    allCategory: "ВСЕ",
    searchPlaceholder: "Поиск...",
    addedToast: "Товар добавлен в корзину",
    myCart: "Корзина",
    emptyCart: "Ваша корзина пуста",
    totalLabel: "Итого:",
    orderBtn: "Оформить заказ",
    nameLabel: "Ваше имя и фамилия",
    namePlaceholder: "Введите имя и фамилию",
    phoneLabel: "Номер телефона",
    addressLabel: "Ваш адрес",
    addressPlaceholder: "Введите адрес доставки",
    noteLabel: "Примечание",
    notePlaceholder: "Примечание к заказу",
    cancelBtn: "Отмена",
    submitBtn: "Отправить заказ",
    addBtn: "Добавить",
    noResults: "Ничего не найдено",
    invalidPhone: "Пожалуйста, введите корректный номер (+9936XXXXXXX или +9937XXXXXXX)"
  },
  en: {
    allCategory: "ALL",
    searchPlaceholder: "Search...",
    addedToast: "Item added to cart",
    myCart: "My Cart",
    emptyCart: "Your cart is empty",
    totalLabel: "Total:",
    orderBtn: "Place Order",
    nameLabel: "Full Name",
    namePlaceholder: "Enter your full name",
    phoneLabel: "Phone Number",
    addressLabel: "Address",
    addressPlaceholder: "Enter delivery address",
    noteLabel: "Note",
    notePlaceholder: "Order note",
    cancelBtn: "Cancel",
    submitBtn: "Submit Order",
    addBtn: "Add",
    noResults: "No items found",
    invalidPhone: "Please enter a valid phone number (+9936XXXXXXX or +9937XXXXXXX)"
  }
};

Object.assign(i18n.tm,{soldOut:"Tükenen",successTitle:"Sargydyňyz kabul edildi",successText:"Operatorymyz size tizara jaň eder.",closeBtn:"Bolýar",wait:"Biraz garaşyň we täzeden synanyşyň."});
Object.assign(i18n.ru,{soldOut:"Нет в наличии",successTitle:"Заказ принят",successText:"Наш оператор скоро свяжется с вами.",closeBtn:"Ок",wait:"Подождите немного и попробуйте снова."});
Object.assign(i18n.en,{soldOut:"Sold out",successTitle:"Order received",successText:"Our operator will call you shortly.",closeBtn:"OK",wait:"Please wait a moment and try again."});
let menuLoaded = false;
let currentLang = localStorage.getItem("lang") || ((navigator.language || "").startsWith("ru") ? "ru" : "tm");
let activeCategory = "ALL";
let searchQuery = "";
let cart = [];
let combinedMenuData = []; // Combined array of local menuData + Firebase products

let toastTimeout = null;

const langSelector = document.getElementById("langSelector");
const searchInput = document.getElementById("searchInput");
const categoriesNav = document.getElementById("categoriesNav");
const menuGrid = document.getElementById("menuGrid");
const toast = document.getElementById("toast");

const cartFab = document.getElementById("cartFab");
const cartBadge = document.getElementById("cartBadge");
const cartOverlay = document.getElementById("cartOverlay");
const cartModal = document.getElementById("cartModal");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartBody = document.getElementById("cartBody");
const cartTotalPrice = document.getElementById("cartTotalPrice");

const openCheckoutModalBtn = document.getElementById("openCheckoutModalBtn");
const checkoutOverlay = document.getElementById("checkoutOverlay");
const closeCheckoutBtn = document.getElementById("closeCheckoutBtn");
const orderForm = document.getElementById("orderForm");
const dialogTotal = document.getElementById("dialogTotal");
const dialogItemsBox = document.getElementById("dialogItemsBox");

function sanitizeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").trim();
function restoreCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    cart = saved.map((x) => { const it = combinedMenuData.find((i) => i.id === x.id); return it && !it.soldOut ? { ...it, qty: x.qty } : null; }).filter(Boolean);
  } catch (e) { cart = []; }
  menuLoaded = true;
}
function showSuccess(id) {
  document.getElementById("successNum").textContent = "#" + id.slice(0, 5).toUpperCase();
  document.getElementById("successOverlay").classList.add("active");
}

function init() {
  if (langSelector) langSelector.value = currentLang;
  setupEventListeners();
  renderCategories();
  
  // Set initial combined data from menuData if available
  if (typeof menuData !== "undefined" && Array.isArray(menuData)) {
    combinedMenuData = [...menuData]; restoreCart();
  }
  
  renderMenu();
  updateCartUI();
  updateLanguageUI();
  
  // Connect to Firebase for dynamic real-time products
  initFirebaseListener();
}

function setupEventListeners() {
  if (langSelector) {
    langSelector.addEventListener("change", (e) => {
      currentLang = e.target.value; localStorage.setItem("lang", currentLang);
      updateLanguageUI();
      renderCategories();
      renderMenu();
      updateCartUI();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = norm(e.target.value);
      renderMenu();
    });
  }

  if (cartFab) cartFab.addEventListener("click", openCart);
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

  if (openCheckoutModalBtn) {
    openCheckoutModalBtn.addEventListener("click", () => {
      if (cart.length === 0) return;
      closeCart();
      openCheckout();
    });
  }

  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener("click", closeCheckout);
  if (orderForm) orderForm.addEventListener("submit", handleOrderSubmit);

  // Delegated events for menu grid
  if (menuGrid) {
    menuGrid.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".add-btn");
      if (addBtn) {
        const itemId = addBtn.dataset.id;
        const item = combinedMenuData.find((i) => i.id === itemId);
        if (item) addToCart(item);
      }
    });
  }

  // Delegated events for cart controls
  if (cartBody) {
    cartBody.addEventListener("click", (e) => {
      const btn = e.target.closest(".qty-btn");
      if (!btn) return;
      const itemId = btn.dataset.id;
      if (btn.classList.contains("btn-minus")) changeQty(itemId, -1);
      if (btn.classList.contains("btn-plus")) changeQty(itemId, 1);
    });
  }
}

async function initFirebaseListener() {
  if (typeof db === "undefined") return;
  const map = (id, d) => {
    let t = d.title;
    if (!t || typeof t === "string") { const n = d.name || t || ""; t = { tm: n, ru: n, en: n }; }
    return { id, category: d.category || "ALL", title: t, price: parseFloat(d.price) || 0, currency: d.currency || "TMT", image: d.image || "", description: d.description || "", soldOut: !!d.soldOut };
  };
  try {
    let items;
    const c = JSON.parse(localStorage.getItem("menuCache") || "null");
    if (c && Date.now() - c.t < 120000) items = c.items;
    else {
      const snap = await db.collection("products").get();
      items = snap.docs.map((d) => map(d.id, d.data()));
      localStorage.setItem("menuCache", JSON.stringify({ t: Date.now(), items }));
    }
    if (items.length) { combinedMenuData = items; restoreCart(); renderCategories(); renderMenu(); updateCartUI(); }
  } catch (e) { console.error("Menu load error:", e); }
}

function updateLanguageUI() {
  const t = i18n[currentLang];
  document.documentElement.lang = currentLang === "tm" ? "tk" : currentLang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const key = el.getAttribute("data-i18n-ph");
    if (t[key]) el.placeholder = t[key];
  });
}

function renderCategories() {
  if (!categoriesNav) return;
  categoriesNav.innerHTML = "";

  const allPill = document.createElement("button");
  allPill.className = `cat-pill ${activeCategory === "ALL" ? "active" : ""}`;
  allPill.textContent = i18n[currentLang].allCategory;
  allPill.addEventListener("click", () => {
    activeCategory = "ALL";
    renderCategories();
    renderMenu();
  });
  categoriesNav.appendChild(allPill);

  if (typeof categoryTranslations !== "undefined") {
    const categories = (typeof categoryOrder !== "undefined" ? categoryOrder : Object.keys(categoryTranslations)).filter((k) => k in categoryTranslations);
    categories.forEach((catKey) => {
      const pill = document.createElement("button");
      pill.className = `cat-pill ${activeCategory === catKey ? "active" : ""}`;
      pill.textContent = categoryTranslations[catKey][currentLang] || catKey;
      pill.addEventListener("click", () => {
        activeCategory = catKey;
        renderCategories();
        renderMenu();
      });
      categoriesNav.appendChild(pill);
    });
  }
}

function renderMenu() {
  if (!menuGrid) return;

  if (!Array.isArray(combinedMenuData) || combinedMenuData.length === 0) {
    menuGrid.innerHTML = `<div class="empty-state">${sanitizeHTML(i18n[currentLang].noResults)}</div>`;
    return;
  }

  const filtered = combinedMenuData.filter((item) => {
    const matchCat = activeCategory === "ALL" || item.category === activeCategory;
    const matchSearch = norm(Object.values(item.title).join(" ")).includes(searchQuery);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    menuGrid.innerHTML = `<div class="empty-state">${sanitizeHTML(i18n[currentLang].noResults)}</div>`;
    return;
  }

  const cardsHtml = filtered.map((item) => {
    const itemTitle = sanitizeHTML(item.title[currentLang] || item.title.tm || "Haryt");
    const catDisplay = sanitizeHTML(
      (typeof categoryTranslations !== "undefined" && categoryTranslations[item.category])
        ? categoryTranslations[item.category][currentLang]
        : item.category
    );

    return `
      <div class="food-card">
        <div class="card-media">
          <img src="${sanitizeHTML(item.image) || 'assets/images/soltanlogo.jpg'}" alt="${itemTitle}" class="card-img" loading="lazy" onerror="this.onerror=null;this.src='assets/images/soltanlogo.jpg'">
        </div>
        <div class="card-body">
          <h3 class="card-title">${itemTitle}</h3>
          <span class="card-tag">${catDisplay}</span>
          ${item.description ? `<p class="card-desc">${sanitizeHTML(item.description)}</p>` : ""}
          <div class="card-bottom">
            <span class="price-tag">${item.price.toFixed(2)} ${item.currency || 'TMT'}</span>
            <button class="add-btn" data-id="${sanitizeHTML(item.id)}" ${item.soldOut ? "disabled" : ""}>${item.soldOut ? i18n[currentLang].soldOut : i18n[currentLang].addBtn}</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  menuGrid.innerHTML = cardsHtml;
}

function addToCart(item) {
  const existing = cart.find((i) => i.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  updateCartUI();
  showToast();
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (menuLoaded) localStorage.setItem("cart", JSON.stringify(cart.map((i) => ({ id: i.id, qty: i.qty }))));
  if (cartBadge) cartBadge.textContent = totalCount;
  if (cartTotalPrice) cartTotalPrice.textContent = `${totalPrice.toFixed(2)} TMT`;

  if (!cartBody) return;

  if (cart.length === 0) {
    cartBody.innerHTML = `<p class="empty-cart-msg">${sanitizeHTML(i18n[currentLang].emptyCart)}</p>`;
    return;
  }

  const itemsHtml = cart.map((item) => {
    const itemTitle = sanitizeHTML(item.title[currentLang] || item.title.tm || "Haryt");
    return `
      <div class="cart-item">
        <div>
          <div class="cart-item-title">${itemTitle}</div>
          <div class="cart-item-price">${(item.price * item.qty).toFixed(2)} TMT</div>
        </div>
        <div class="cart-item-ctrls">
          <button class="qty-btn btn-minus" aria-label="-" data-id="${item.id}">-</button>
          <span>${item.qty}</span>
          <button class="qty-btn btn-plus" aria-label="+" data-id="${item.id}">+</button>
        </div>
      </div>
    `;
  }).join("");

  cartBody.innerHTML = itemsHtml;
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((i) => i.id !== id);
  }
  updateCartUI();
}

function openCart() {
  if (cartOverlay) cartOverlay.classList.add("open");
  if (cartModal) cartModal.classList.add("open");
}

function closeCart() {
  if (cartOverlay) cartOverlay.classList.remove("open");
  if (cartModal) cartModal.classList.remove("open");
}

function openCheckout() {
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (dialogTotal) dialogTotal.textContent = `${i18n[currentLang].totalLabel} ${totalPrice.toFixed(2)} TMT`;

  if (dialogItemsBox) {
    dialogItemsBox.innerHTML = cart
      .map((item) => {
        const title = sanitizeHTML(item.title[currentLang] || item.title.tm || "Haryt");
        return `<div>• ${title} (x${item.qty}) - ${(item.price * item.qty).toFixed(2)} TMT</div>`;
      })
      .join("");
  }

  if (checkoutOverlay) checkoutOverlay.classList.add("active");
}

function closeCheckout() {
  if (checkoutOverlay) checkoutOverlay.classList.remove("active");
}

async function handleOrderSubmit(e) {
  e.preventDefault();

  const hp = document.getElementById("website");
  if (hp && hp.value) return;
  if (Date.now() - (+localStorage.getItem("lastOrder") || 0) < 30000) { alert(i18n[currentLang].wait); return; }
  const submitBtn = orderForm.querySelector('.btn-submit');
  const phoneInput = document.getElementById("custPhone");
  const phone = phoneInput ? phoneInput.value.trim() : "";

  // Validate TM Phone Numbers (+9936XXXXXXX / +9937XXXXXXX)
  const phoneRegex = /^\+993[67]\d{7}$/;
  if (!phoneRegex.test(phone)) {
    alert(i18n[currentLang].invalidPhone);
    if (phoneInput) phoneInput.focus();
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "...";
  }

  const name = document.getElementById("custName") ? document.getElementById("custName").value.trim() : "";
  const address = document.getElementById("custAddress") ? document.getElementById("custAddress").value.trim() : "";
  const note = document.getElementById("orderNote") ? (document.getElementById("orderNote").value.trim() || "Ýok") : "Ýok";

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const payload = {
    status: "pending",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    totalPrice: totalPrice,
    customer: { name, phone, address, note },
    items: cart.map((i) => ({
      id: i.id,
      title: i.title[currentLang] || i.title.tm || "Haryt",
      price: i.price,
      qty: i.qty
    }))
  };

  try {
    const ref = await db.collection("orders").add(payload);
    localStorage.setItem("lastOrder", Date.now());
    cart = [];
    updateCartUI();
    if (orderForm) orderForm.reset();
    if (phoneInput) phoneInput.value = "+993";
    closeCheckout();
    showSuccess(ref.id);
  } catch (err) {
    console.error("Order submission error:", err);
    alert("Ýalňyşlyk ýüze çykdy. Täzeden synanyşyň.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = i18n[currentLang].submitBtn;
    }
  }
}

function showToast() {
  if (!toast) return;
  toast.classList.add("show");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeCart(); closeCheckout(); const o = document.getElementById("successOverlay"); if (o) o.classList.remove("active"); }
});
document.addEventListener("DOMContentLoaded", () => {
  const p = document.getElementById("custPhone");
  if (p) p.addEventListener("input", () => { if (!p.value.startsWith("+993")) p.value = "+993"; });
  const b = document.getElementById("closeSuccessBtn");
  if (b) b.addEventListener("click", () => document.getElementById("successOverlay").classList.remove("active"));
});
