const STORAGE_KEY = "caixa-pdv-v1";
const ADMIN_PASSWORD = "2580";
const CODE39_PATTERNS = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  "*": "nwnnwnwnn",
};
const PAYMENT_METHODS = ["Dinheiro", "Pix", "Débito", "Crédito"];

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const state = loadState();
let cart = [];
let lastReceiptSaleId = null;
let selectedSuggestionIndex = -1;
let audioContext = null;
let viewedSaleId = null;

const els = {
  navButtons: document.querySelectorAll(".nav-button"),
  views: document.querySelectorAll(".view"),
  pdvStoreTitle: document.querySelector("#pdv-store-title"),
  pdvClock: document.querySelector("#pdv-clock"),
  productForm: document.querySelector("#product-form"),
  productId: document.querySelector("#product-id"),
  productName: document.querySelector("#product-name"),
  productBarcode: document.querySelector("#product-barcode"),
  productCost: document.querySelector("#product-cost"),
  productPrice: document.querySelector("#product-price"),
  productStock: document.querySelector("#product-stock"),
  productMinStock: document.querySelector("#product-min-stock"),
  productFilter: document.querySelector("#product-filter"),
  productsBody: document.querySelector("#products-body"),
  cancelProductEdit: document.querySelector("#cancel-product-edit"),
  generateBarcodeLabels: document.querySelector("#generate-barcode-labels"),
  saleSearch: document.querySelector("#sale-search"),
  saleSuggestions: document.querySelector("#sale-suggestions"),
  freeCashBanner: document.querySelector("#free-cash-banner"),
  stockAlertPanel: document.querySelector("#stock-alert-panel"),
  stockAlertList: document.querySelector("#stock-alert-list"),
  saleQty: document.querySelector("#sale-qty"),
  addToCart: document.querySelector("#add-to-cart"),
  cartBody: document.querySelector("#cart-body"),
  cartItems: document.querySelector("#cart-items"),
  cartSubtotal: document.querySelector("#cart-subtotal"),
  saleDiscount: document.querySelector("#sale-discount"),
  paymentModal: document.querySelector("#payment-modal"),
  paymentForm: document.querySelector("#payment-form"),
  closePaymentModal: document.querySelector("#close-payment-modal"),
  cancelPayment: document.querySelector("#cancel-payment"),
  modalSaleTotal: document.querySelector("#modal-sale-total"),
  discountType: document.querySelector("#discount-type"),
  discountApplied: document.querySelector("#discount-applied"),
  paymentMethod: document.querySelector("#payment-method"),
  amountPaidField: document.querySelector("#amount-paid-field"),
  amountPaid: document.querySelector("#amount-paid"),
  cartTotal: document.querySelector("#cart-total"),
  saleChange: document.querySelector("#sale-change"),
  finishSale: document.querySelector("#finish-sale"),
  clearCart: document.querySelector("#clear-cart"),
  pdvStatus: document.querySelector("#pdv-status"),
  saleFilter: document.querySelector("#sale-filter"),
  salesBody: document.querySelector("#sales-body"),
  metricRevenue: document.querySelector("#metric-revenue"),
  metricCost: document.querySelector("#metric-cost"),
  metricProfit: document.querySelector("#metric-profit"),
  metricTicket: document.querySelector("#metric-ticket"),
  paymentSummary: document.querySelector("#payment-summary"),
  closeMonth: document.querySelector("#close-month"),
  closingsBody: document.querySelector("#closings-body"),
  storeForm: document.querySelector("#store-form"),
  storeName: document.querySelector("#store-name"),
  storeDoc: document.querySelector("#store-doc"),
  storeAddress: document.querySelector("#store-address"),
  storePhone: document.querySelector("#store-phone"),
  themeSelect: document.querySelector("#theme-select"),
  exportData: document.querySelector("#export-data"),
  importData: document.querySelector("#import-data"),
  clearData: document.querySelector("#clear-data"),
  saleViewModal: document.querySelector("#sale-view-modal"),
  closeSaleView: document.querySelector("#close-sale-view"),
  closeSaleViewBottom: document.querySelector("#close-sale-view-bottom"),
  saleViewDate: document.querySelector("#sale-view-date"),
  saleViewContent: document.querySelector("#sale-view-content"),
  printViewedSale: document.querySelector("#print-viewed-sale"),
  appModal: document.querySelector("#app-modal"),
  appModalForm: document.querySelector("#app-modal-form"),
  appModalTitle: document.querySelector("#app-modal-title"),
  appModalMessage: document.querySelector("#app-modal-message"),
  appModalInputField: document.querySelector("#app-modal-input-field"),
  appModalInputLabel: document.querySelector("#app-modal-input-label"),
  appModalInput: document.querySelector("#app-modal-input"),
  appModalCancel: document.querySelector("#app-modal-cancel"),
  appModalOk: document.querySelector("#app-modal-ok"),
};

bindEvents();
renderAll();
startClock();

function loadState() {
  const fallback = {
    products: [],
    sales: [],
    monthlyClosings: [],
    financeAdjustments: {},
    store: {
      name: "Minha Loja",
      doc: "",
      address: "",
      phone: "",
      theme: "default",
    },
  };

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored ? { ...fallback, ...stored, store: { ...fallback.store, ...(stored.store || {}) } } : fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  document.addEventListener("keydown", handleGlobalShortcuts);

  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  els.productForm.addEventListener("submit", saveProduct);
  els.cancelProductEdit.addEventListener("click", resetProductForm);
  els.productFilter.addEventListener("input", renderProducts);
  els.generateBarcodeLabels.addEventListener("click", generateBarcodeLabels);
  els.addToCart?.addEventListener("click", addCartItem);
  els.saleSearch.addEventListener("input", () => {
    selectedSuggestionIndex = -1;
    renderSaleSuggestions();
  });
  els.saleSearch.addEventListener("paste", () => {
    setTimeout(addPastedBarcodeToCart, 0);
  });
  els.saleSearch.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "Tab") {
      event.preventDefault();
      moveSaleSuggestion(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSaleSuggestion(-1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        selectSaleSuggestion(selectedSuggestionIndex);
        return;
      }
      addCartItem();
    }
  });
  els.saleSearch.addEventListener("blur", () => {
    setTimeout(() => hideSaleSuggestions(), 150);
  });
  els.saleSearch.addEventListener("focus", renderSaleSuggestions);
  els.saleSuggestions.addEventListener("mousedown", (event) => {
    const button = event.target.closest("[data-product-id]");
    if (!button) return;
    event.preventDefault();
    selectSaleSuggestionById(button.dataset.productId);
  });
  els.cartBody.addEventListener("change", (event) => {
    if (!event.target.matches(".cart-qty")) return;
    updateCartQty(event.target.dataset.productId, event.target.value);
  });
  els.cartBody.addEventListener("focusin", (event) => {
    if (event.target.matches(".cart-qty")) {
      event.target.select();
    }
  });
  els.cartBody.addEventListener("keydown", (event) => {
    if (event.target.matches(".cart-qty") && event.key === "Enter") {
      event.preventDefault();
      updateCartQty(event.target.dataset.productId, event.target.value);
      els.saleSearch.focus();
    }
  });
  els.saleDiscount.addEventListener("input", () => {
    syncAmountPaidToTotal();
    renderCart();
  });
  els.discountType.addEventListener("change", () => {
    syncAmountPaidToTotal();
    renderCart();
  });
  els.paymentMethod.addEventListener("change", () => {
    syncAmountPaidToTotal();
    renderPaymentModal();
  });
  els.amountPaid.addEventListener("input", renderPaymentModal);
  els.finishSale.addEventListener("click", openPaymentModal);
  els.paymentForm.addEventListener("submit", finishSale);
  els.closePaymentModal.addEventListener("click", closePaymentModal);
  els.cancelPayment.addEventListener("click", closePaymentModal);
  els.clearCart.addEventListener("click", clearCart);
  els.closeMonth.addEventListener("click", closeMonth);
  els.themeSelect.addEventListener("change", () => {
    state.store.theme = els.themeSelect.value;
    applyTheme(state.store.theme);
    saveState();
  });
  els.paymentSummary.addEventListener("click", (event) => {
    const button = event.target.closest("[data-payment-method]");
    if (!button) return;
    editPaymentValue(button.dataset.paymentMethod);
  });
  els.saleFilter.addEventListener("input", renderSales);
  els.storeForm.addEventListener("submit", saveStore);
  els.exportData.addEventListener("click", exportData);
  els.importData.addEventListener("change", importData);
  els.clearData.addEventListener("click", clearData);
  els.closeSaleView.addEventListener("click", closeSaleView);
  els.closeSaleViewBottom.addEventListener("click", closeSaleView);
  els.printViewedSale.addEventListener("click", () => {
    if (viewedSaleId) {
      printReceipt(viewedSaleId);
    }
  });
}

async function switchView(viewName) {
  const protectedViews = new Set(["financeiro", "config"]);
  if (protectedViews.has(viewName) && !(await requirePassword(`abrir ${viewName}`))) {
    return;
  }

  els.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  els.views.forEach((view) => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });
}

async function handleGlobalShortcuts(event) {
  if (!["F2", "F3", "F10"].includes(event.key)) return;

  event.preventDefault();

  if (event.key === "F2") {
    await startSale();
    return;
  }

  if (event.key === "F3") {
    clearCart();
    els.saleSearch.focus();
    return;
  }

  if (event.key === "F10") {
    if (els.paymentModal.open) {
      els.paymentForm.requestSubmit();
      return;
    }

    await openPaymentModal();
  }
}

async function startSale() {
  await switchView("pdv");
  closePaymentModal();
  els.saleSearch.focus();
  updatePdvStatus();
}

async function saveProduct(event) {
  event.preventDefault();

  const id = els.productId.value || createId();
  const barcode = els.productBarcode.value.trim();
  const duplicate = state.products.find((product) => product.barcode === barcode && product.id !== id);

  if (duplicate) {
    await showAlert("Já existe um produto com esse código de barras.");
    return;
  }

  const product = {
    id,
    name: els.productName.value.trim(),
    barcode,
    cost: toNumber(els.productCost.value),
    price: toNumber(els.productPrice.value),
    stock: Math.floor(toNumber(els.productStock.value)),
    minStock: Math.floor(toNumber(els.productMinStock.value)),
  };

  const index = state.products.findIndex((item) => item.id === id);
  if (index >= 0) {
    state.products[index] = product;
  } else {
    state.products.push(product);
  }

  saveState();
  resetProductForm();
  renderAll();
}

function resetProductForm() {
  els.productForm.reset();
  els.productId.value = "";
  els.productStock.value = "0";
  els.productMinStock.value = "3";
}

async function editProduct(id) {
  if (!(await requirePassword("editar este produto"))) return;

  const product = state.products.find((item) => item.id === id);
  if (!product) return;

  els.productId.value = product.id;
  els.productName.value = product.name;
  els.productBarcode.value = product.barcode;
  els.productCost.value = product.cost;
  els.productPrice.value = product.price;
  els.productStock.value = product.stock;
  els.productMinStock.value = product.minStock ?? 3;
  switchView("produtos");
}

async function deleteProduct(id) {
  if (!(await requirePassword("apagar este produto"))) return;

  const wasSold = state.sales.some((sale) => sale.items.some((item) => item.productId === id));
  if (wasSold) {
    await showAlert("Este produto já tem venda registrada. Edite o estoque ou o nome em vez de apagar.");
    return;
  }

  if (!(await showConfirm("Apagar este produto?"))) return;
  state.products = state.products.filter((product) => product.id !== id);
  saveState();
  renderAll();
}

function renderProducts() {
  const filter = normalize(els.productFilter.value);
  const products = state.products.filter((product) => {
    return normalize(product.name).includes(filter) || normalize(product.barcode).includes(filter);
  });

  els.productsBody.innerHTML = products.length
    ? products
        .map(
          (product) => `
            <tr>
              <td>${escapeHtml(product.name)}</td>
              <td>${escapeHtml(product.barcode)}</td>
              <td>${money.format(product.cost)}</td>
              <td>${money.format(product.price)}</td>
              <td class="${isLowStock(product) ? "low-stock" : ""}">${product.stock}</td>
              <td>${product.minStock ?? 3}</td>
              <td>
                <div class="button-row">
                  <button class="small-button" type="button" onclick="editProduct('${product.id}')">Editar</button>
                  <button class="small-button" type="button" onclick="printProductBarcode('${product.id}')">Etiqueta</button>
                  <button class="small-button" type="button" onclick="deleteProduct('${product.id}')">Apagar</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td class="empty-row" colspan="7">Nenhum produto cadastrado.</td></tr>`;
}

async function generateBarcodeLabels() {
  const productName = await showPrompt("Nome do produto para a etiqueta:", "", "Gerar código de barras");
  if (productName === null) return;

  const cleanName = productName.trim();
  if (!cleanName) {
    await showAlert("Informe o nome do produto.");
    return;
  }

  const quantityValue = await showPrompt("Quantidade de etiquetas:", "1", "Gerar código de barras", "number");
  if (quantityValue === null) return;

  const quantity = Math.max(1, Math.min(500, Math.floor(toNumber(quantityValue) || 1)));
  const code = createBarcodeNumber();

  printBarcodeLabels(cleanName, code, quantity);
}

async function printProductBarcode(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const quantityValue = await showPrompt("Quantidade de etiquetas:", "1", `Etiqueta - ${product.name}`, "number");
  if (quantityValue === null) return;

  const quantity = Math.max(1, Math.min(500, Math.floor(toNumber(quantityValue) || 1)));
  printBarcodeLabels(product.name, product.barcode, quantity);
}

function printBarcodeLabels(productName, code, quantity) {
  document.querySelector(".receipt-print")?.remove();
  document.querySelector(".label-print")?.remove();
  const labels = document.createElement("div");
  labels.className = "label-print";
  labels.innerHTML = Array.from({ length: quantity }, () => barcodeLabelHtml(productName, code)).join("");
  document.body.appendChild(labels);
  window.print();
  setTimeout(() => labels.remove(), 500);
}

function barcodeLabelHtml(productName, code) {
  const storeName = state.store.name || "Minha Loja";
  const phone = state.store.phone || "";

  return `
    <section class="barcode-label">
      <strong>${escapeHtml(productName)}</strong>
      <div class="barcode-bars">${renderCode39(code)}</div>
      <span>${escapeHtml(code)}</span>
      <small class="label-footer">
        <span>${escapeHtml(storeName)}</span>
        ${phone ? `<span>${escapeHtml(phone)}</span>` : ""}
      </small>
    </section>
  `;
}

function renderCode39(code) {
  const narrow = 3;
  const wide = 7;
  const height = 90;
  const quietZone = 16;
  let x = quietZone;
  const rects = [];

  `*${code}*`.split("").forEach((char) => {
    const pattern = CODE39_PATTERNS[char];
    if (!pattern) return;

    pattern.split("").forEach((widthCode, index) => {
      const width = widthCode === "w" ? wide : narrow;
      const isBar = index % 2 === 0;

      if (isBar) {
        rects.push(`<rect x="${x}" y="0" width="${width}" height="${height}" fill="#000"></rect>`);
      }

      x += width;
    });

    x += narrow;
  });

  const totalWidth = x + quietZone;
  return `
    <svg class="barcode-svg" viewBox="0 0 ${totalWidth} ${height}" preserveAspectRatio="none" role="img" aria-label="Código de barras ${escapeHtml(code)}">
      <rect x="0" y="0" width="${totalWidth}" height="${height}" fill="#fff"></rect>
      ${rects.join("")}
    </svg>
  `;
}

function createBarcodeNumber() {
  const existingCodes = new Set(state.products.map((product) => String(product.barcode)));

  for (let code = 1000; code <= 9999; code += 1) {
    const candidate = String(code);
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }

  return String(Math.floor(1000 + Math.random() * 9000));
}

function isLowStock(product) {
  const minStock = product.minStock ?? 3;
  return product.stock <= minStock;
}

function renderLowStockAlerts() {
  const lowStockProducts = state.products.filter(isLowStock);
  els.stockAlertPanel.classList.toggle("hidden", lowStockProducts.length === 0);

  if (!lowStockProducts.length) {
    els.stockAlertList.innerHTML = "";
    return;
  }

  els.stockAlertList.innerHTML = lowStockProducts
    .map(
      (product) => `
        <div class="stock-alert-item">
          <span>${escapeHtml(product.name)}</span>
          <strong>${product.stock} / mín. ${product.minStock ?? 3}</strong>
        </div>
      `,
    )
    .join("");
}

async function addCartItem() {
  const query = normalize(els.saleSearch.value);
  const qty = 1;

  if (!query) {
    await showAlert("Digite ou escaneie um produto.");
    return;
  }

  const product = state.products.find((item) => {
    return normalize(item.barcode) === query || normalize(item.name) === query || normalize(item.name).includes(query);
  });

  if (!product) {
    await showAlert("Produto não encontrado.");
    return;
  }

  const currentQty = cart.find((item) => item.productId === product.id)?.qty || 0;
  if (product.stock < currentQty + qty) {
    await showAlert(`Estoque insuficiente. Disponível: ${product.stock}`);
    return;
  }

  const item = cart.find((entry) => entry.productId === product.id);
  if (item) {
    item.qty += qty;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      barcode: product.barcode,
      cost: product.cost,
      price: product.price,
      qty,
    });
  }

  els.saleSearch.value = "";
  hideSaleSuggestions();
  if (els.saleQty) els.saleQty.value = "1";
  playBeep();
  renderCart();
}

async function addPastedBarcodeToCart() {
  const query = normalize(els.saleSearch.value);
  if (!query) return;

  const product = state.products.find((item) => normalize(item.barcode) === query);
  if (!product) {
    renderSaleSuggestions();
    return;
  }

  els.saleSearch.value = product.barcode;
  addCartItem();
}

function getSaleMatches() {
  const query = normalize(els.saleSearch.value);
  if (!query) return [];

  return state.products.filter((product) => normalize(product.name).includes(query) || normalize(product.barcode).includes(query));
}

function renderSaleSuggestions() {
  const query = normalize(els.saleSearch.value);
  const matches = getSaleMatches();

  els.saleSearch.classList.toggle("invalid-search", Boolean(query) && matches.length === 0);

  if (!query || matches.length === 0) {
    els.saleSuggestions.classList.remove("open");
    els.saleSuggestions.innerHTML = "";
    selectedSuggestionIndex = -1;
    return;
  }

  if (selectedSuggestionIndex >= matches.length) {
    selectedSuggestionIndex = matches.length - 1;
  }

  els.saleSuggestions.innerHTML = matches
    .map(
      (product, index) => `
        <button
          class="suggestion-item ${index === selectedSuggestionIndex ? "active" : ""}"
          data-product-id="${product.id}"
          type="button"
          role="option"
          aria-selected="${index === selectedSuggestionIndex}"
        >
          <span>
            <strong>${escapeHtml(product.name)}</strong>
            <small>${escapeHtml(product.barcode)}</small>
          </span>
          <span>${money.format(product.price)}</span>
        </button>
      `,
    )
    .join("");
  els.saleSuggestions.classList.add("open");
  els.saleSuggestions.querySelector(".suggestion-item.active")?.scrollIntoView({
    block: "nearest",
  });
}

function hideSaleSuggestions() {
  selectedSuggestionIndex = -1;
  els.saleSuggestions.classList.remove("open");
  els.saleSuggestions.innerHTML = "";
  els.saleSearch.classList.remove("invalid-search");
}

function moveSaleSuggestion(direction) {
  const matches = getSaleMatches();
  if (!matches.length) {
    renderSaleSuggestions();
    return;
  }

  selectedSuggestionIndex += direction;
  if (selectedSuggestionIndex >= matches.length) selectedSuggestionIndex = 0;
  if (selectedSuggestionIndex < 0) selectedSuggestionIndex = matches.length - 1;
  renderSaleSuggestions();
}

function selectSaleSuggestion(index) {
  const product = getSaleMatches()[index];
  if (!product) return;
  selectSaleSuggestionById(product.id);
}

function selectSaleSuggestionById(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  els.saleSearch.value = product.barcode;
  hideSaleSuggestions();
  addCartItem();
}

async function removeCartItem(productId) {
  if (!(await requirePassword("remover este item"))) return;

  cart = cart.filter((item) => item.productId !== productId);
  renderCart();
}

async function updateCartQty(productId, value) {
  const item = cart.find((entry) => entry.productId === productId);
  const product = state.products.find((entry) => entry.id === productId);
  if (!item || !product) return;

  const qty = Math.max(1, Math.floor(toNumber(value) || 1));
  if (qty > product.stock) {
    await showAlert(`Estoque insuficiente. Disponível: ${product.stock}`);
    item.qty = product.stock;
  } else {
    item.qty = qty;
  }

  renderCart();
}

function cartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cost = cart.reduce((sum, item) => sum + item.cost * item.qty, 0);
  const discountValue = Math.max(0, toNumber(els.saleDiscount.value));
  const discount =
    els.discountType.value === "percent"
      ? Math.min(subtotal, subtotal * (Math.min(discountValue, 100) / 100))
      : Math.min(discountValue, subtotal);
  const total = subtotal - discount;
  return {
    subtotal,
    cost,
    discount,
    total,
    items: cart.reduce((sum, item) => sum + item.qty, 0),
  };
}

function paymentTotals() {
  const totals = cartTotals();
  const isCash = els.paymentMethod.value === "Dinheiro";
  const paid = isCash ? toNumber(els.amountPaid.value) : totals.total;

  return {
    ...totals,
    paid,
    change: isCash ? Math.max(0, paid - totals.total) : 0,
  };
}

function renderCart() {
  const totals = cartTotals();
  els.cartBody.innerHTML = cart.length
    ? cart
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.name)}<br><span class="muted">${escapeHtml(item.barcode)}</span></td>
              <td>
                <input
                  class="cart-qty"
                  data-product-id="${item.productId}"
                  type="number"
                  min="1"
                  step="1"
                  value="${item.qty}"
                  aria-label="Quantidade de ${escapeHtml(item.name)}"
                >
              </td>
              <td>${money.format(item.price)}</td>
              <td>${money.format(item.price * item.qty)}</td>
              <td><button class="small-button" type="button" onclick="removeCartItem('${item.productId}')">Remover</button></td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td class="empty-row" colspan="5">Carrinho vazio.</td></tr>`;

  els.cartItems.textContent = String(totals.items);
  els.cartSubtotal.textContent = money.format(totals.subtotal);
  els.cartTotal.textContent = money.format(totals.total);
  updatePdvStatus();
  renderPaymentModal();
}

function updatePdvStatus() {
  if (els.paymentModal.open) {
    els.pdvStatus.textContent = "Finalizando venda";
    els.pdvStatus.className = "status-pill status-finalizing";
    els.freeCashBanner.classList.add("hidden");
    return;
  }

  if (cart.length) {
    els.pdvStatus.textContent = "Venda em andamento";
    els.pdvStatus.className = "status-pill status-active";
    els.freeCashBanner.classList.add("hidden");
    return;
  }

  els.pdvStatus.textContent = "Caixa livre";
  els.pdvStatus.className = "status-pill";
  els.freeCashBanner.classList.remove("hidden");
}

function clearCart() {
  cart = [];
  els.saleDiscount.value = "0";
  els.discountType.value = "value";
  els.amountPaid.value = "0";
  closePaymentModal();
  renderCart();
}

async function validateSaleReady() {
  if (!cart.length) {
    await showAlert("Adicione produtos ao carrinho.");
    return false;
  }

  const totals = cartTotals();
  if (totals.total <= 0) {
    await showAlert("Total inválido.");
    return false;
  }

  for (const item of cart) {
    const product = state.products.find((entry) => entry.id === item.productId);
    if (!product || product.stock < item.qty) {
      await showAlert(`Estoque insuficiente para ${item.name}.`);
      return false;
    }
  }

  return true;
}

async function openPaymentModal() {
  if (!(await validateSaleReady())) return;

  syncAmountPaidToTotal();
  renderPaymentModal();
  els.paymentModal.showModal();
  updatePdvStatus();
  els.paymentMethod.focus();
}

function closePaymentModal() {
  if (els.paymentModal.open) {
    els.paymentModal.close();
  }
  updatePdvStatus();
}

function renderPaymentModal() {
  const totals = paymentTotals();
  const isCash = els.paymentMethod.value === "Dinheiro";

  els.modalSaleTotal.textContent = money.format(totals.total);
  els.discountApplied.textContent = money.format(totals.discount);
  els.amountPaidField.hidden = !isCash;
  els.amountPaidField.classList.toggle("hidden", !isCash);
  els.saleChange.textContent = money.format(totals.change);
}

function syncAmountPaidToTotal() {
  const totals = cartTotals();

  if (els.paymentMethod.value === "Dinheiro") {
    els.amountPaid.value = totals.total.toFixed(2);
  }
}

async function finishSale(event) {
  event.preventDefault();
  if (!(await validateSaleReady())) return;

  const totals = paymentTotals();
  const isCash = els.paymentMethod.value === "Dinheiro";

  if (isCash && totals.paid < totals.total) {
    await showAlert("O valor pago em dinheiro não pode ser menor que o total da venda.");
    els.amountPaid.focus();
    return;
  }

  for (const item of cart) {
    const product = state.products.find((entry) => entry.id === item.productId);
    product.stock -= item.qty;
  }

  const sale = {
    id: createId(),
    createdAt: new Date().toISOString(),
    items: cart.map((item) => ({ ...item })),
    paymentMethod: els.paymentMethod.value,
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
    cost: totals.cost,
    profit: totals.total - totals.cost,
    paid: totals.paid,
    change: totals.change,
  };

  state.sales.unshift(sale);
  lastReceiptSaleId = sale.id;
  saveState();
  closePaymentModal();
  clearCart();
  renderAll();
  printReceipt(sale.id);
}

function renderSales() {
  const filter = normalize(els.saleFilter.value);
  const sales = state.sales.filter((sale) => sale.id.slice(0, 8).includes(filter) || normalize(sale.id).includes(filter));

  els.salesBody.innerHTML = sales.length
    ? sales
        .map(
          (sale) => `
            <tr>
              <td>${formatDate(sale.createdAt)}<br><span class="muted">${sale.id.slice(0, 8)}</span></td>
              <td>${sale.items.reduce((sum, item) => sum + item.qty, 0)}</td>
              <td>${escapeHtml(sale.paymentMethod)}</td>
              <td>${money.format(sale.total)}</td>
              <td>${money.format(sale.profit)}</td>
              <td>
                <div class="button-row">
                  <button class="small-button" type="button" onclick="viewSale('${sale.id}')">Visualizar</button>
                  <button class="small-button" type="button" onclick="printReceipt('${sale.id}')">Imprimir</button>
                  <button class="small-button" type="button" onclick="deleteSale('${sale.id}')">Excluir</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td class="empty-row" colspan="6">Nenhuma venda registrada.</td></tr>`;
}

async function deleteSale(saleId) {
  if (!(await requirePassword("excluir esta venda"))) return;

  const sale = state.sales.find((entry) => entry.id === saleId);
  if (!sale) return;

  if (!(await showConfirm("Excluir esta venda? Os produtos vendidos voltarão para o estoque."))) return;

  sale.items.forEach((item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    if (product) {
      product.stock += item.qty;
    }
  });

  state.sales = state.sales.filter((entry) => entry.id !== saleId);
  saveState();
  renderAll();
}

function viewSale(saleId) {
  const sale = state.sales.find((entry) => entry.id === saleId);
  if (!sale) return;

  viewedSaleId = sale.id;
  els.saleViewDate.textContent = formatDate(sale.createdAt);
  els.printViewedSale.classList.remove("hidden");
  els.saleViewContent.innerHTML = `
    <div class="sale-view-list">
      ${sale.items
        .map(
          (item) => `
            <div class="sale-view-item">
              <span>
                <strong>${escapeHtml(item.name)}</strong>
                <small>${item.qty} x ${money.format(item.price)}</small>
              </span>
              <strong>${money.format(item.qty * item.price)}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
    <div class="sale-view-totals">
      <div class="summary-line"><span>Subtotal</span><strong>${money.format(sale.subtotal)}</strong></div>
      <div class="summary-line"><span>Desconto</span><strong>${money.format(sale.discount)}</strong></div>
      <div class="summary-line"><span>Pagamento</span><strong>${escapeHtml(sale.paymentMethod)}</strong></div>
      <div class="summary-line"><span>Recebido</span><strong>${money.format(sale.paid)}</strong></div>
      <div class="summary-line"><span>Troco</span><strong>${money.format(sale.change)}</strong></div>
      <div class="payment-total"><span>Total</span><strong>${money.format(sale.total)}</strong></div>
    </div>
  `;
  els.saleViewModal.showModal();
}

function closeSaleView() {
  viewedSaleId = null;
  if (els.saleViewModal.open) {
    els.saleViewModal.close();
  }
}

function renderFinance() {
  const finance = getFinanceTotals();

  els.metricRevenue.textContent = money.format(finance.revenue);
  els.metricCost.textContent = money.format(finance.cost);
  els.metricProfit.textContent = money.format(finance.profit);
  els.metricTicket.textContent = money.format(finance.ticket);

  const entries = Object.entries(finance.byPayment);
  els.paymentSummary.innerHTML = entries.length
    ? entries
        .map(
          ([method, total]) => `
            <div class="payment-item">
              <span>${escapeHtml(method)}</span>
              <button class="payment-value" type="button" data-payment-method="${escapeHtml(method)}">${money.format(total)}</button>
            </div>
          `,
        )
        .join("")
    : `<p class="muted">Sem vendas para resumir.</p>`;

  renderClosings();
}

function getFinanceTotals() {
  const cost = state.sales.reduce((sum, sale) => sum + sale.cost, 0);
  const byPayment = state.sales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
    return acc;
  }, {});

  state.financeAdjustments ||= {};
  PAYMENT_METHODS.forEach((method) => {
    byPayment[method] ||= 0;
  });

  Object.entries(state.financeAdjustments).forEach(([method, adjustment]) => {
    byPayment[method] = (byPayment[method] || 0) + adjustment;
  });

  const revenue = Object.values(byPayment).reduce((sum, total) => sum + total, 0);
  const profit = revenue - cost;
  const ticket = state.sales.length ? revenue / state.sales.length : 0;

  return { revenue, cost, profit, ticket, byPayment };
}

function getPaymentBaseTotal(method) {
  return state.sales
    .filter((sale) => sale.paymentMethod === method)
    .reduce((sum, sale) => sum + sale.total, 0);
}

async function editPaymentValue(method) {
  state.financeAdjustments ||= {};
  const baseTotal = getPaymentBaseTotal(method);
  const currentTotal = baseTotal + (state.financeAdjustments[method] || 0);
  const value = await showPrompt(`Novo valor para ${method}:`, currentTotal.toFixed(2));

  if (value === null) return;

  const newTotal = Math.max(0, toNumber(value));
  const adjustment = newTotal - baseTotal;

  if (Math.abs(adjustment) < 0.005) {
    delete state.financeAdjustments[method];
  } else {
    state.financeAdjustments[method] = adjustment;
  }

  saveState();
  renderFinance();
}

function renderClosings() {
  const closings = state.monthlyClosings || [];
  els.closingsBody.innerHTML = closings.length
    ? closings
        .map(
          (closing) => `
            <tr>
              <td>${formatDate(closing.closedAt)}</td>
              <td>${closing.salesCount}</td>
              <td>${money.format(closing.revenue)}</td>
              <td>${money.format(closing.cost)}</td>
              <td>${money.format(closing.profit)}</td>
              <td><button class="small-button" type="button" onclick="viewClosing('${closing.id}')">Visualizar</button></td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td class="empty-row" colspan="6">Nenhum fechamento registrado.</td></tr>`;
}

function viewClosing(closingId) {
  const closing = (state.monthlyClosings || []).find((entry) => entry.id === closingId);
  if (!closing) return;
  const sales = closing.sales || [];
  const byPayment = closing.byPayment || {};

  viewedSaleId = null;
  els.saleViewDate.textContent = `Fechado em ${formatDate(closing.closedAt)}`;
  els.printViewedSale.classList.add("hidden");
  els.saleViewContent.innerHTML = `
    <div class="sale-view-totals">
      <div class="summary-line"><span>Vendas</span><strong>${closing.salesCount}</strong></div>
      <div class="summary-line"><span>Faturamento</span><strong>${money.format(closing.revenue)}</strong></div>
      <div class="summary-line"><span>Custo vendido</span><strong>${money.format(closing.cost)}</strong></div>
      <div class="payment-total"><span>Lucro bruto</span><strong>${money.format(closing.profit)}</strong></div>
    </div>
    <div class="sale-view-list">
      ${Object.entries(byPayment).length
        ? Object.entries(byPayment)
            .map(
              ([method, total]) => `
                <div class="sale-view-item">
                  <span><strong>${escapeHtml(method)}</strong></span>
                  <strong>${money.format(total)}</strong>
                </div>
              `,
            )
            .join("")
        : `<div class="sale-view-item"><span class="muted">Sem resumo por pagamento.</span></div>`}
    </div>
    <div class="sale-view-list">
      ${sales
        .map(
          (sale) => `
            <div class="sale-view-item">
              <span>
                <strong>${formatDate(sale.createdAt)}</strong>
                <small>${sale.items.reduce((sum, item) => sum + item.qty, 0)} itens - ${escapeHtml(sale.paymentMethod)}</small>
              </span>
              <strong>${money.format(sale.total)}</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
  els.saleViewModal.showModal();
}

async function saveStore(event) {
  event.preventDefault();
  state.store = {
    name: els.storeName.value.trim(),
    doc: els.storeDoc.value.trim(),
    address: els.storeAddress.value.trim(),
    phone: els.storePhone.value.trim(),
    theme: els.themeSelect.value,
  };
  applyTheme(state.store.theme);
  saveState();
  await showAlert("Configuração salva.");
}

function renderStore() {
  els.storeName.value = state.store.name || "";
  els.storeDoc.value = state.store.doc || "";
  els.storeAddress.value = state.store.address || "";
  els.storePhone.value = state.store.phone || "";
  els.themeSelect.value = state.store.theme || "default";
  applyTheme(els.themeSelect.value);
  els.pdvStoreTitle.textContent = (state.store.name || "Minha Loja").toUpperCase();
}

function applyTheme(theme) {
  document.body.dataset.theme = theme === "default" ? "" : theme;
}

function printReceipt(saleId = lastReceiptSaleId) {
  const sale = state.sales.find((entry) => entry.id === saleId);
  if (!sale) return;

  document.querySelector(".label-print")?.remove();
  document.querySelector(".receipt-print")?.remove();
  const receipt = document.createElement("div");
  receipt.className = "receipt-print";
  receipt.innerHTML = receiptHtml(sale);
  document.body.appendChild(receipt);
  window.print();
  setTimeout(() => receipt.remove(), 500);
}

function receiptHtml(sale) {
  const store = state.store;
  const line = "-".repeat(32);
  const items = sale.items
    .map((item) => {
      const name = escapeHtml(item.name).slice(0, 28);
      return `
        <div>${name}</div>
        <div>${item.qty} x ${money.format(item.price)} = ${money.format(item.qty * item.price)}</div>
      `;
    })
    .join("");

  return `
    <div style="text-align:center">
      <strong>${escapeHtml(store.name || "Minha Loja")}</strong><br>
      ${store.doc ? `${escapeHtml(store.doc)}<br>` : ""}
      ${store.address ? `${escapeHtml(store.address)}<br>` : ""}
      ${store.phone ? `${escapeHtml(store.phone)}<br>` : ""}
    </div>
    <div>${line}</div>
    <div>Venda: ${sale.id.slice(0, 8)}</div>
    <div>Data: ${formatDate(sale.createdAt)}</div>
    <div>${line}</div>
    ${items}
    <div>${line}</div>
    <div>Subtotal: ${money.format(sale.subtotal)}</div>
    <div>Desconto: ${money.format(sale.discount)}</div>
    <div><strong>Total: ${money.format(sale.total)}</strong></div>
    <div>Pagamento: ${escapeHtml(sale.paymentMethod)}</div>
    <div>Recebido: ${money.format(sale.paid)}</div>
    <div>Troco: ${money.format(sale.change)}</div>
    <div>${line}</div>
    <div style="text-align:center">Obrigado pela preferência</div>
  `;
}

function exportData() {
  const backup = {
    ...state,
    exportedAt: new Date().toISOString(),
    selectedTheme: state.store.theme || "default",
    currentFinance: getFinanceTotals(),
    monthlyClosings: state.monthlyClosings || [],
    financeAdjustments: state.financeAdjustments || {},
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `backup-caixa-pdv-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.products) || !Array.isArray(imported.sales)) {
        throw new Error("Formato inválido");
      }
      state.products = imported.products;
      state.sales = imported.sales;
      state.monthlyClosings = Array.isArray(imported.monthlyClosings) ? imported.monthlyClosings : [];
      state.financeAdjustments = imported.financeAdjustments || {};
      state.store = imported.store || state.store;
      saveState();
      renderAll();
      await showAlert("Backup importado.");
    } catch {
      await showAlert("Arquivo de backup inválido.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

async function clearData() {
  if (!(await requirePassword("apagar todos os dados"))) return;

  if (!(await showConfirm("Apagar todos os produtos, vendas e configurações?"))) return;
  localStorage.removeItem(STORAGE_KEY);
  state.products = [];
  state.sales = [];
  state.monthlyClosings = [];
  state.financeAdjustments = {};
  state.store = { name: "Minha Loja", doc: "", address: "", phone: "" };
  cart = [];
  renderAll();
}

async function closeMonth() {
  if (!(await requirePassword("fechar o caixa do mês"))) return;

  const finance = getFinanceTotals();

  if (!state.sales.length && finance.revenue <= 0) {
    await showAlert("Não existem valores para fechar.");
    return;
  }

  if (!(await showConfirm("Fechar o caixa do mês? O financeiro e a lista de vendas atuais serão limpos."))) return;

  state.monthlyClosings ||= [];
  state.monthlyClosings.unshift({
    id: createId(),
    closedAt: new Date().toISOString(),
    salesCount: state.sales.length,
    revenue: finance.revenue,
    cost: finance.cost,
    profit: finance.profit,
    byPayment: finance.byPayment,
    financeAdjustments: { ...(state.financeAdjustments || {}) },
    sales: state.sales,
  });
  state.monthlyClosings = state.monthlyClosings.slice(0, 3);

  state.sales = [];
  state.financeAdjustments = {};
  saveState();
  renderAll();
  await showAlert("Caixa do mês fechado.");
}

function renderAll() {
  normalizeProducts();
  renderProducts();
  renderLowStockAlerts();
  renderSaleSuggestions();
  renderCart();
  renderSales();
  renderFinance();
  renderStore();
}

function startClock() {
  const updateClock = () => {
    els.pdvClock.textContent = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
  };

  updateClock();
  setInterval(updateClock, 1000);
}

function normalizeProducts() {
  state.products.forEach((product) => {
    product.minStock ??= 3;
  });
}

function toNumber(value) {
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function normalize(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showAlert(message, title = "Aviso") {
  return showAppModal({ title, message, mode: "alert" });
}

function showConfirm(message, title = "Confirmação") {
  return showAppModal({ title, message, mode: "confirm" });
}

function showPrompt(message, defaultValue = "", title = "Informe o valor", inputType = "text") {
  return showAppModal({ title, message, mode: "prompt", defaultValue, inputType });
}

function showAppModal({ title, message, mode, defaultValue = "", inputType = "text" }) {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      els.appModalForm.removeEventListener("submit", onSubmit);
      els.appModalCancel.removeEventListener("click", onCancel);
      els.appModal.removeEventListener("cancel", onDialogCancel);
      els.appModal.close();
      resolve(value);
    };

    const onSubmit = (event) => {
      event.preventDefault();
      finish(mode === "prompt" ? els.appModalInput.value : true);
    };

    const onCancel = () => finish(mode === "alert" ? true : false);
    const onDialogCancel = (event) => {
      event.preventDefault();
      finish(mode === "alert" ? true : mode === "prompt" ? null : false);
    };

    els.appModalTitle.textContent = title;
    els.appModalMessage.textContent = message;
    els.appModalInputField.classList.toggle("hidden", mode !== "prompt");
    els.appModalCancel.classList.toggle("hidden", mode === "alert");
    els.appModalOk.textContent = mode === "confirm" ? "Confirmar" : "OK";
    els.appModalInput.value = defaultValue;
    els.appModalInput.type = inputType;

    els.appModalForm.addEventListener("submit", onSubmit);
    els.appModalCancel.addEventListener("click", onCancel);
    els.appModal.addEventListener("cancel", onDialogCancel);
    els.appModal.showModal();

    if (mode === "prompt") {
      els.appModalInput.focus();
      els.appModalInput.select();
    } else {
      els.appModalOk.focus();
    }
  });
}

async function requirePassword(action) {
  const password = await showPrompt(`Digite a senha para ${action}:`, "", "Senha", "password");
  if (password === ADMIN_PASSWORD) {
    return true;
  }

  if (password !== null) {
    await showAlert("Senha incorreta.");
  }
  return false;
}

function playBeep() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.09);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.09);
  } catch {
    // Browsers can block audio before user interaction.
  }
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.removeCartItem = removeCartItem;
window.printReceipt = printReceipt;
window.viewSale = viewSale;
window.viewClosing = viewClosing;
window.deleteSale = deleteSale;
window.printProductBarcode = printProductBarcode;




