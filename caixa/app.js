const STORAGE_KEY = "caixa-pdv-v1";
const MASTER_PASSWORD = "1950";
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
let currentFinanceDayKey = getLocalDateKey(new Date());
let barcodeScanTimer = null;

const els = {
  navButtons: document.querySelectorAll(".nav-button"),
  views: document.querySelectorAll(".view"),
  pdvStoreTitle: document.querySelector("#pdv-store-title"),
  pdvClock: document.querySelector("#pdv-clock"),
  cashToggle: document.querySelector("#cash-toggle"),
  cashSessionInfo: document.querySelector("#cash-session-info"),
  dailyReportPdv: document.querySelector("#daily-report-pdv"),
  openWithdrawal: document.querySelector("#open-withdrawal"),
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
  showShortcuts: document.querySelector("#show-shortcuts"),
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
  confirmPayment: document.querySelector("#confirm-payment"),
  modalSaleTotal: document.querySelector("#modal-sale-total"),
  discountType: document.querySelector("#discount-type"),
  discountApplied: document.querySelector("#discount-applied"),
  paymentMethod: document.querySelector("#payment-method"),
  splitPayment: document.querySelector("#split-payment"),
  splitPaymentFields: document.querySelector("#split-payment-fields"),
  secondPaymentMethod: document.querySelector("#second-payment-method"),
  secondPaymentAmount: document.querySelector("#second-payment-amount"),
  primaryPaymentLine: document.querySelector("#primary-payment-line"),
  primaryPaymentAmount: document.querySelector("#primary-payment-amount"),
  amountPaidField: document.querySelector("#amount-paid-field"),
  amountPaid: document.querySelector("#amount-paid"),
  cartTotal: document.querySelector("#cart-total"),
  saleChange: document.querySelector("#sale-change"),
  finishSale: document.querySelector("#finish-sale"),
  clearCart: document.querySelector("#clear-cart"),
  pdvStatus: document.querySelector("#pdv-status"),
  saleFilter: document.querySelector("#sale-filter"),
  salesBody: document.querySelector("#sales-body"),
  serviceForm: document.querySelector("#service-form"),
  serviceId: document.querySelector("#service-id"),
  serviceAmount: document.querySelector("#service-amount"),
  serviceDescription: document.querySelector("#service-description"),
  serviceOs: document.querySelector("#service-os"),
  servicePaymentMethod: document.querySelector("#service-payment-method"),
  serviceSplitPayment: document.querySelector("#service-split-payment"),
  serviceSplitPaymentFields: document.querySelector("#service-split-payment-fields"),
  serviceSecondPaymentMethod: document.querySelector("#service-second-payment-method"),
  serviceSecondPaymentAmount: document.querySelector("#service-second-payment-amount"),
  servicePrimaryPaymentLine: document.querySelector("#service-primary-payment-line"),
  servicePrimaryPaymentAmount: document.querySelector("#service-primary-payment-amount"),
  saveServiceButton: document.querySelector("#save-service"),
  cancelServiceEdit: document.querySelector("#cancel-service-edit"),
  servicesBody: document.querySelector("#services-body"),
  cashMetricRevenue: document.querySelector("#cash-metric-revenue"),
  cashMetricCost: document.querySelector("#cash-metric-cost"),
  cashMetricProfit: document.querySelector("#cash-metric-profit"),
  cashMetricTicket: document.querySelector("#cash-metric-ticket"),
  dayMetricRevenue: document.querySelector("#day-metric-revenue"),
  dayMetricCost: document.querySelector("#day-metric-cost"),
  dayMetricProfit: document.querySelector("#day-metric-profit"),
  dayMetricTicket: document.querySelector("#day-metric-ticket"),
  monthMetricRevenue: document.querySelector("#month-metric-revenue"),
  monthMetricCost: document.querySelector("#month-metric-cost"),
  monthMetricProfit: document.querySelector("#month-metric-profit"),
  monthMetricTicket: document.querySelector("#month-metric-ticket"),
  cashPaymentSummary: document.querySelector("#cash-payment-summary"),
  dayPaymentSummary: document.querySelector("#day-payment-summary"),
  monthPaymentSummary: document.querySelector("#month-payment-summary"),
  dailyReport: document.querySelector("#daily-report"),
  withdrawalHistory: document.querySelector("#withdrawal-history"),
  closeMonth: document.querySelector("#close-month"),
  closingsBody: document.querySelector("#closings-body"),
  storeForm: document.querySelector("#store-form"),
  storeName: document.querySelector("#store-name"),
  storeDoc: document.querySelector("#store-doc"),
  storeAddress: document.querySelector("#store-address"),
  storePhone: document.querySelector("#store-phone"),
  themeSelect: document.querySelector("#theme-select"),
  adminPassword: document.querySelector("#admin-password"),
  exportData: document.querySelector("#export-data"),
  importData: document.querySelector("#import-data"),
  clearData: document.querySelector("#clear-data"),
  saleViewModal: document.querySelector("#sale-view-modal"),
  closeSaleView: document.querySelector("#close-sale-view"),
  closeSaleViewBottom: document.querySelector("#close-sale-view-bottom"),
  saleViewDate: document.querySelector("#sale-view-date"),
  saleViewContent: document.querySelector("#sale-view-content"),
  printViewedSale: document.querySelector("#print-viewed-sale"),
  withdrawalModal: document.querySelector("#withdrawal-modal"),
  withdrawalForm: document.querySelector("#withdrawal-form"),
  closeWithdrawalModal: document.querySelector("#close-withdrawal-modal"),
  cancelWithdrawal: document.querySelector("#cancel-withdrawal"),
  withdrawalAmount: document.querySelector("#withdrawal-amount"),
  withdrawalMethod: document.querySelector("#withdrawal-method"),
  withdrawalDescription: document.querySelector("#withdrawal-description"),
  withdrawalHistoryModal: document.querySelector("#withdrawal-history-modal"),
  withdrawalHistoryList: document.querySelector("#withdrawal-history-list"),
  closeWithdrawalHistory: document.querySelector("#close-withdrawal-history"),
  closeWithdrawalHistoryBottom: document.querySelector("#close-withdrawal-history-bottom"),
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

bindMoneyInputs();
bindEvents();
renderAll();
startClock();

function loadState() {
  const fallback = {
    products: [],
    sales: [],
    services: [],
    monthlyClosings: [],
    financeAdjustments: {},
    cashRegister: null,
    cashSessions: [],
    withdrawals: [],
    security: {
      password: "2580",
    },
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
    return stored
      ? {
          ...fallback,
          ...stored,
          store: { ...fallback.store, ...(stored.store || {}) },
          security: { ...fallback.security, ...(stored.security || {}) },
        }
      : fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindMoneyInputs() {
  [
    els.productCost,
    els.productPrice,
    els.secondPaymentAmount,
    els.amountPaid,
    els.serviceAmount,
    els.serviceSecondPaymentAmount,
    els.withdrawalAmount,
  ].forEach((input) => {
    if (!input) return;
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.addEventListener("input", () => formatMoneyInput(input));
    input.addEventListener("focus", () => input.select());
    formatMoneyInput(input);
  });
}

function formatMoneyInput(input) {
  const digits = String(input.value || "").replace(/\D/g, "");
  const amount = digits ? Number(digits) / 100 : 0;
  input.value = formatMoneyValue(amount);
}

function setMoneyInput(input, value) {
  if (!input) return;
  input.value = formatMoneyValue(value);
}

function formatMoneyValue(value) {
  const number = typeof value === "number" ? value : toNumber(value);
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
    scheduleBarcodeScanAdd();
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
  els.splitPayment.addEventListener("change", () => {
    syncAmountPaidToTotal();
    renderPaymentModal();
  });
  els.secondPaymentMethod.addEventListener("change", renderPaymentModal);
  els.secondPaymentAmount.addEventListener("input", renderPaymentModal);
  els.amountPaid.addEventListener("input", renderPaymentModal);
  els.cashToggle.addEventListener("click", toggleCashRegister);
  els.dailyReportPdv.addEventListener("click", printDailyReport);
  els.openWithdrawal.addEventListener("click", openWithdrawalModal);
  els.showShortcuts.addEventListener("click", showShortcuts);
  els.finishSale.addEventListener("click", openPaymentModal);
  els.paymentForm.addEventListener("submit", finishSale);
  els.closePaymentModal.addEventListener("click", closePaymentModal);
  els.cancelPayment.addEventListener("click", closePaymentModal);
  els.clearCart.addEventListener("click", clearCart);
  els.closeMonth.addEventListener("click", closeMonth);
  els.dailyReport.addEventListener("click", printDailyReport);
  els.withdrawalHistory.addEventListener("click", openWithdrawalHistory);
  els.themeSelect.addEventListener("change", () => {
    state.store.theme = els.themeSelect.value;
    applyTheme(state.store.theme);
    saveState();
  });
  els.monthPaymentSummary.addEventListener("click", (event) => {
    const button = event.target.closest("[data-payment-method]");
    if (!button) return;
    editPaymentValue(button.dataset.paymentMethod);
  });
  els.saleFilter.addEventListener("input", renderSales);
  els.serviceForm.addEventListener("submit", saveService);
  els.serviceAmount.addEventListener("input", renderServicePaymentFields);
  els.servicePaymentMethod.addEventListener("change", renderServicePaymentFields);
  els.serviceSplitPayment.addEventListener("change", renderServicePaymentFields);
  els.serviceSecondPaymentMethod.addEventListener("change", renderServicePaymentFields);
  els.serviceSecondPaymentAmount.addEventListener("input", renderServicePaymentFields);
  els.cancelServiceEdit.addEventListener("click", resetServiceForm);
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
  els.withdrawalForm.addEventListener("submit", saveWithdrawal);
  els.closeWithdrawalModal.addEventListener("click", closeWithdrawalModal);
  els.cancelWithdrawal.addEventListener("click", closeWithdrawalModal);
  els.closeWithdrawalHistory.addEventListener("click", closeWithdrawalHistory);
  els.closeWithdrawalHistoryBottom.addEventListener("click", closeWithdrawalHistory);
  els.withdrawalHistoryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-withdrawal-id]");
    if (!button) return;
    printWithdrawal(button.dataset.withdrawalId);
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
  if (!isCashRegisterOpen()) {
    await showAlert("Abra o caixa antes de iniciar vendas.");
    return;
  }
  closePaymentModal();
  els.saleSearch.focus();
  updatePdvStatus();
}

function isCashRegisterOpen() {
  return Boolean(state.cashRegister?.isOpen);
}

async function toggleCashRegister() {
  if (isCashRegisterOpen()) {
    await closeCashRegister();
    return;
  }

  await openCashRegister();
}

async function openCashRegister() {
  if (isCashRegisterOpen()) {
    await showAlert("O caixa ja esta aberto.");
    return;
  }

  const attendant = await showPrompt("Nome do atendente:", "", "Abrir caixa");
  if (attendant === null) return;

  const attendantName = attendant.trim();
  if (!attendantName) {
    await showAlert("Informe o nome do atendente.");
    return;
  }

  state.cashRegister = {
    id: createId(),
    attendant: attendantName,
    openedAt: new Date().toISOString(),
    isOpen: true,
  };

  saveState();
  renderAll();
  els.saleSearch.focus();
  await showAlert("Caixa aberto.");
}

async function closeCashRegister() {
  if (!isCashRegisterOpen()) {
    await showAlert("O caixa ja esta fechado.");
    return;
  }

  if (cart.length) {
    await showAlert("Finalize ou limpe a venda em andamento antes de fechar o caixa.");
    return;
  }

  if (!(await requirePassword("fechar o caixa"))) return;
  if (!(await showConfirm("Fechar o caixa agora? Novas vendas ficarao bloqueadas ate abrir novamente."))) return;

  const closedSession = {
    ...state.cashRegister,
    isOpen: false,
    closedAt: new Date().toISOString(),
  };
  const sessionSales = state.sales.filter((sale) => sale.cashSessionId === closedSession.id);
  const sessionServices = (state.services || []).filter((service) => service.cashSessionId === closedSession.id);
  const sessionWithdrawals = (state.withdrawals || []).filter((withdrawal) => withdrawal.cashSessionId === closedSession.id);

  state.cashSessions ||= [];
  state.cashSessions.unshift(closedSession);
  state.cashSessions = state.cashSessions.slice(0, 50);
  state.cashRegister = null;

  saveState();
  renderAll();
  printCashClosingReport(closedSession, sessionSales, sessionWithdrawals, sessionServices);
  await showAlert("Caixa fechado.");
}

function renderCashRegister() {
  const session = state.cashRegister;
  const open = isCashRegisterOpen();

  els.cashToggle.textContent = open ? "Fechar caixa" : "Abrir caixa";
  els.cashToggle.classList.toggle("primary-button", !open);
  els.cashToggle.classList.toggle("danger-button", open);
  els.saleSearch.disabled = !open;
  if (els.addToCart) els.addToCart.disabled = !open;
  els.finishSale.disabled = !open;
  els.openWithdrawal.disabled = !open;

  if (open) {
    els.cashSessionInfo.innerHTML = `
      <strong>Caixa aberto</strong>
      <span>Atendente: ${escapeHtml(session.attendant)}</span>
      <span>Abertura: ${formatDate(session.openedAt)}</span>
    `;
    return;
  }

  els.cashSessionInfo.innerHTML = `
    <strong>Caixa fechado</strong>
    <span>Abra o caixa para registrar vendas.</span>
  `;
}

function showShortcuts() {
  showAppModal({
    title: "Atalhos",
    message: "F2 - Iniciar venda\nF3 - Limpar venda\nF10 - Finalizar / confirmar",
    mode: "alert",
  });
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
  setMoneyInput(els.productCost, 0);
  setMoneyInput(els.productPrice, 0);
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
  setMoneyInput(els.productCost, product.cost);
  setMoneyInput(els.productPrice, product.price);
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
  if (!isCashRegisterOpen()) {
    await showAlert("Abra o caixa antes de vender.");
    return;
  }

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
    await showInsufficientStockAlert(product);
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
  if (!isCashRegisterOpen()) return;

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

function scheduleBarcodeScanAdd() {
  clearTimeout(barcodeScanTimer);

  barcodeScanTimer = setTimeout(() => {
    if (!isCashRegisterOpen()) return;

    const query = normalize(els.saleSearch.value);
    if (!query) return;

    const product = state.products.find((item) => normalize(item.barcode) === query);
    if (!product) return;

    els.saleSearch.value = product.barcode;
    addCartItem();
  }, 120);
}

function getSaleMatches() {
  if (!isCashRegisterOpen()) return [];

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

async function showInsufficientStockAlert(product) {
  const action = await showActionAlert(`Estoque insuficiente. Disponível: ${product.stock}`, "Editar");
  if (action !== "action") return;

  await editProduct(product.id);
  els.productStock.focus();
  els.productStock.select();
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
    await showInsufficientStockAlert(product);
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
  const isSplit = els.splitPayment.checked;
  const secondAmount = isSplit ? Math.min(totals.total, Math.max(0, toNumber(els.secondPaymentAmount.value))) : 0;
  const primaryAmount = totals.total - secondAmount;
  const payments = isSplit
    ? [
        { method: els.paymentMethod.value, amount: primaryAmount },
        { method: els.secondPaymentMethod.value, amount: secondAmount },
      ].filter((payment) => payment.amount > 0)
    : [{ method: els.paymentMethod.value, amount: totals.total }];
  const isCash = !isSplit && els.paymentMethod.value === "Dinheiro";
  const paid = isCash ? toNumber(els.amountPaid.value) : totals.total;

  return {
    ...totals,
    isSplit,
    primaryAmount,
    secondAmount,
    payments,
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
  if (!isCashRegisterOpen()) {
    if (els.pdvStatus) {
      els.pdvStatus.textContent = "Caixa fechado";
      els.pdvStatus.className = "status-pill status-closed";
    }
    els.freeCashBanner.textContent = "CAIXA FECHADO";
    els.freeCashBanner.classList.remove("hidden");
    return;
  }

  if (els.paymentModal.open) {
    if (els.pdvStatus) {
      els.pdvStatus.textContent = "Finalizando venda";
      els.pdvStatus.className = "status-pill status-finalizing";
    }
    els.freeCashBanner.classList.add("hidden");
    return;
  }

  if (cart.length) {
    if (els.pdvStatus) {
      els.pdvStatus.textContent = "Venda em andamento";
      els.pdvStatus.className = "status-pill status-active";
    }
    els.freeCashBanner.classList.add("hidden");
    return;
  }

  if (els.pdvStatus) {
    els.pdvStatus.textContent = "Caixa livre";
    els.pdvStatus.className = "status-pill";
  }
  els.freeCashBanner.textContent = "CAIXA LIVRE";
  els.freeCashBanner.classList.remove("hidden");
}

function clearCart() {
  cart = [];
  els.saleDiscount.value = "0";
  els.discountType.value = "value";
  els.paymentMethod.value = "Pix";
  els.splitPayment.checked = false;
  els.secondPaymentMethod.value = "Crédito";
  setMoneyInput(els.secondPaymentAmount, 0);
  setMoneyInput(els.amountPaid, 0);
  closePaymentModal();
  renderCart();
}

async function validateSaleReady() {
  if (!isCashRegisterOpen()) {
    await showAlert("Abra o caixa antes de registrar vendas.");
    return false;
  }

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
  els.confirmPayment.focus();
}

function closePaymentModal() {
  if (els.paymentModal.open) {
    els.paymentModal.close();
  }
  updatePdvStatus();
}

function renderPaymentModal() {
  const totals = paymentTotals();
  const isCash = !totals.isSplit && els.paymentMethod.value === "Dinheiro";

  els.modalSaleTotal.textContent = money.format(totals.total);
  els.discountApplied.textContent = money.format(totals.discount);
  els.splitPaymentFields.classList.toggle("hidden", !totals.isSplit);
  els.primaryPaymentLine.classList.toggle("hidden", !totals.isSplit);
  els.primaryPaymentAmount.textContent = money.format(totals.primaryAmount);
  els.amountPaidField.hidden = !isCash;
  els.amountPaidField.classList.toggle("hidden", !isCash);
  els.saleChange.textContent = money.format(totals.change);
}

function syncAmountPaidToTotal() {
  const totals = cartTotals();

  if (!els.splitPayment.checked && els.paymentMethod.value === "Dinheiro") {
    setMoneyInput(els.amountPaid, totals.total);
  }
}

async function finishSale(event) {
  event.preventDefault();
  if (!(await validateSaleReady())) return;

  const totals = paymentTotals();
  const isCash = !totals.isSplit && els.paymentMethod.value === "Dinheiro";

  if (isCash && totals.paid < totals.total) {
    await showAlert("O valor pago em dinheiro não pode ser menor que o total da venda.");
    els.amountPaid.focus();
    return;
  }

  if (totals.isSplit && toNumber(els.secondPaymentAmount.value) > totals.total) {
    await showAlert("O valor da segunda forma não pode ser maior que o total da venda.");
    els.secondPaymentAmount.focus();
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
    paymentMethod: totals.payments.map((payment) => payment.method).join(" + "),
    payments: totals.payments,
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
    cost: totals.cost,
    profit: totals.total - totals.cost,
    paid: totals.paid,
    change: totals.change,
    cashSessionId: state.cashRegister.id,
    attendant: state.cashRegister.attendant,
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

async function saveService(event) {
  event.preventDefault();

  const editingId = els.serviceId.value;
  if (!editingId && !isCashRegisterOpen()) {
    await showAlert("Abra o caixa antes de lançar serviço.");
    return;
  }

  const amount = Math.max(0, toNumber(els.serviceAmount.value));
  const description = els.serviceDescription.value.trim();

  if (amount <= 0) {
    await showAlert("Informe um valor de serviço maior que zero.");
    els.serviceAmount.focus();
    return;
  }

  if (!description) {
    await showAlert("Informe a descrição do serviço.");
    els.serviceDescription.focus();
    return;
  }

  const payments = servicePaymentTotals(amount);
  if (payments.isSplit && toNumber(els.serviceSecondPaymentAmount.value) > amount) {
    await showAlert("O valor da segunda forma não pode ser maior que o valor do serviço.");
    els.serviceSecondPaymentAmount.focus();
    return;
  }

  const service = {
    id: editingId || createId(),
    createdAt: new Date().toISOString(),
    amount,
    description,
    osNumber: els.serviceOs.value.trim(),
    paymentMethod: payments.payments.map((payment) => payment.method).join(" + "),
    payments: payments.payments,
    cashSessionId: state.cashRegister?.id || null,
    attendant: state.cashRegister?.attendant || "",
  };

  state.services ||= [];
  if (editingId) {
    const index = state.services.findIndex((entry) => entry.id === editingId);
    if (index >= 0) {
      service.createdAt = state.services[index].createdAt;
      service.cashSessionId = state.services[index].cashSessionId;
      service.attendant = state.services[index].attendant;
      state.services[index] = service;
    }
  } else {
    state.services.unshift(service);
  }

  saveState();
  resetServiceForm();
  renderServices();
  renderFinance();
  if (!editingId) {
    printServiceReceipt(service.id);
  } else {
    await showAlert("Serviço atualizado.");
  }
}

function servicePaymentTotals(total) {
  const isSplit = els.serviceSplitPayment.checked;
  const secondAmount = isSplit ? Math.min(total, Math.max(0, toNumber(els.serviceSecondPaymentAmount.value))) : 0;
  const primaryAmount = total - secondAmount;
  const payments = isSplit
    ? [
        { method: els.servicePaymentMethod.value, amount: primaryAmount },
        { method: els.serviceSecondPaymentMethod.value, amount: secondAmount },
      ].filter((payment) => payment.amount > 0)
    : [{ method: els.servicePaymentMethod.value, amount: total }];

  return { isSplit, primaryAmount, secondAmount, payments };
}

function renderServicePaymentFields() {
  const total = Math.max(0, toNumber(els.serviceAmount.value));
  const payments = servicePaymentTotals(total);
  els.serviceSplitPaymentFields.classList.toggle("hidden", !payments.isSplit);
  els.servicePrimaryPaymentLine.classList.toggle("hidden", !payments.isSplit);
  els.servicePrimaryPaymentAmount.textContent = money.format(payments.primaryAmount);
}

function resetServiceForm() {
  els.serviceForm.reset();
  els.serviceId.value = "";
  els.servicePaymentMethod.value = "Pix";
  els.serviceSecondPaymentMethod.value = "Crédito";
  setMoneyInput(els.serviceAmount, 0);
  setMoneyInput(els.serviceSecondPaymentAmount, 0);
  els.saveServiceButton.textContent = "Adicionar serviço";
  els.cancelServiceEdit.classList.add("hidden");
  renderServicePaymentFields();
}

async function editService(serviceId) {
  if (!(await requirePassword("editar este serviço"))) return;

  const service = (state.services || []).find((entry) => entry.id === serviceId);
  if (!service) return;

  const payments = getServicePayments(service);
  const firstPayment = payments[0] || { method: "Pix", amount: service.amount };
  const secondPayment = payments[1] || { method: "Crédito", amount: 0 };

  els.serviceId.value = service.id;
  setMoneyInput(els.serviceAmount, service.amount);
  els.serviceDescription.value = service.description;
  els.serviceOs.value = service.osNumber || "";
  els.servicePaymentMethod.value = firstPayment.method;
  els.serviceSplitPayment.checked = payments.length > 1;
  els.serviceSecondPaymentMethod.value = secondPayment.method;
  setMoneyInput(els.serviceSecondPaymentAmount, payments.length > 1 ? secondPayment.amount : 0);
  els.saveServiceButton.textContent = "Salvar serviço";
  els.cancelServiceEdit.classList.remove("hidden");
  renderServicePaymentFields();
  switchView("servicos");
  els.serviceAmount.focus();
}

function renderServices() {
  const services = state.services || [];
  els.servicesBody.innerHTML = services.length
    ? services
        .map(
          (service) => `
            <tr>
              <td>${formatDate(service.createdAt)}</td>
              <td>${escapeHtml(service.description)}<br><span class="muted">${escapeHtml(service.attendant || "")}</span></td>
              <td>${service.osNumber ? escapeHtml(service.osNumber) : "-"}</td>
              <td>${escapeHtml(service.paymentMethod)}</td>
              <td>${money.format(service.amount)}</td>
              <td>
                <div class="button-row">
                  <button class="small-button" type="button" onclick="editService('${service.id}')">Editar</button>
                  <button class="small-button" type="button" onclick="printServiceReceipt('${service.id}')">Imprimir</button>
                </div>
              </td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td class="empty-row" colspan="6">Nenhum serviço registrado.</td></tr>`;
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
  const payments = getSalePayments(sale);

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
      ${payments
        .map(
          (payment) => `
            <div class="summary-line"><span>${escapeHtml(payment.method)}</span><strong>${money.format(payment.amount)}</strong></div>
          `,
        )
        .join("")}
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

async function openWithdrawalModal() {
  if (!isCashRegisterOpen()) {
    await showAlert("Abra o caixa antes de registrar sangria.");
    return;
  }

  els.withdrawalForm.reset();
  setMoneyInput(els.withdrawalAmount, 0);
  els.withdrawalMethod.value = "Dinheiro";
  els.withdrawalModal.showModal();
  els.withdrawalAmount.focus();
  els.withdrawalAmount.select();
}

function closeWithdrawalModal() {
  if (els.withdrawalModal.open) {
    els.withdrawalModal.close();
  }
}

async function saveWithdrawal(event) {
  event.preventDefault();

  if (!isCashRegisterOpen()) {
    await showAlert("Abra o caixa antes de registrar sangria.");
    closeWithdrawalModal();
    return;
  }

  const amount = Math.max(0, toNumber(els.withdrawalAmount.value));
  const description = els.withdrawalDescription.value.trim();

  if (amount <= 0) {
    await showAlert("Informe um valor de sangria maior que zero.");
    els.withdrawalAmount.focus();
    return;
  }

  if (!description) {
    await showAlert("Informe a descrição da sangria.");
    els.withdrawalDescription.focus();
    return;
  }

  const withdrawal = {
    id: createId(),
    createdAt: new Date().toISOString(),
    amount,
    method: els.withdrawalMethod.value,
    description,
    attendant: state.cashRegister.attendant,
    cashSessionId: state.cashRegister.id,
  };

  state.withdrawals ||= [];
  state.withdrawals.unshift(withdrawal);
  saveState();
  closeWithdrawalModal();
  renderFinance();
  printWithdrawal(withdrawal.id);
}

function openWithdrawalHistory() {
  renderWithdrawalHistory();
  els.withdrawalHistoryModal.showModal();
}

function closeWithdrawalHistory() {
  if (els.withdrawalHistoryModal.open) {
    els.withdrawalHistoryModal.close();
  }
}

function renderWithdrawalHistory() {
  const withdrawals = state.withdrawals || [];
  els.withdrawalHistoryList.innerHTML = withdrawals.length
    ? withdrawals
        .map(
          (withdrawal) => `
            <div class="sale-view-item">
              <span>
                <strong>${formatDate(withdrawal.createdAt)} - ${escapeHtml(withdrawal.method)}</strong>
                <small>${escapeHtml(withdrawal.description)}</small>
                <small>${escapeHtml(withdrawal.attendant || "Sem operador")}</small>
              </span>
              <span class="withdrawal-history-value">
                <strong>${money.format(withdrawal.amount)}</strong>
                <button class="small-button" type="button" data-withdrawal-id="${withdrawal.id}">Reimprimir</button>
              </span>
            </div>
          `,
        )
        .join("")
    : `<div class="sale-view-item"><span class="muted">Nenhuma sangria registrada.</span></div>`;
}

function getSalePayments(sale) {
  if (Array.isArray(sale.payments) && sale.payments.length) {
    return sale.payments;
  }

  return [{ method: sale.paymentMethod, amount: sale.total }];
}

function getServicePayments(service) {
  if (Array.isArray(service.payments) && service.payments.length) {
    return service.payments;
  }

  return [{ method: service.paymentMethod, amount: service.amount }];
}

function renderFinance() {
  const cashFinance = getFinanceTotals(getCurrentCashSales(), false, getCurrentCashWithdrawals(), getCurrentCashServices());
  const dayFinance = getFinanceTotals(getTodaySales(), false, getTodayWithdrawals(), getTodayServices());
  const monthFinance = getFinanceTotals(getMonthSales(), true, getMonthWithdrawals(), getMonthServices());

  renderFinanceScope("cash", cashFinance, false);
  renderFinanceScope("day", dayFinance, false);
  renderFinanceScope("month", monthFinance, true);

  renderClosings();
}

function renderFinanceScope(scope, finance, editable) {
  els[`${scope}MetricRevenue`].textContent = money.format(finance.revenue);
  els[`${scope}MetricCost`].textContent = money.format(finance.cost);
  els[`${scope}MetricProfit`].textContent = money.format(finance.profit);
  els[`${scope}MetricTicket`].textContent = money.format(finance.ticket);

  els[`${scope}PaymentSummary`].innerHTML = paymentSummaryHtml(finance.byPayment, editable);
}

function paymentSummaryHtml(byPayment, editable = false) {
  const entries = Object.entries(byPayment);
  return entries.length
    ? entries
        .map(
          ([method, total]) => `
            <div class="payment-item">
              <span>${escapeHtml(method)}</span>
              ${
                editable
                  ? `<button class="payment-value" type="button" data-payment-method="${escapeHtml(method)}">${money.format(total)}</button>`
                  : `<strong class="payment-value readonly">${money.format(total)}</strong>`
              }
            </div>
          `,
        )
        .join("")
    : `<p class="muted">Sem vendas para resumir.</p>`;
}

function getFinanceTotals(sales = state.sales, includeAdjustments = true, withdrawals = [], services = []) {
  const finance = getSalesTotals(sales);
  applyServicesToFinance(finance, services);

  applyWithdrawalsToFinance(finance, withdrawals);

  if (!includeAdjustments) {
    return finance;
  }

  state.financeAdjustments ||= {};
  Object.entries(state.financeAdjustments).forEach(([method, adjustment]) => {
    finance.byPayment[method] = (finance.byPayment[method] || 0) + adjustment;
  });

  finance.revenue = Object.values(finance.byPayment).reduce((sum, total) => sum + total, 0);
  finance.profit = finance.revenue - finance.cost;
  finance.ticket = sales.length ? finance.revenue / sales.length : 0;

  return finance;
}

function applyServicesToFinance(finance, services) {
  services.forEach((service) => {
    getServicePayments(service).forEach((payment) => {
      finance.byPayment[payment.method] = (finance.byPayment[payment.method] || 0) + payment.amount;
    });
    finance.revenue += service.amount;
  });

  finance.salesCount = (finance.salesCount || 0) + services.length;
  finance.profit = finance.revenue - finance.cost;
  finance.ticket = finance.salesCount ? finance.revenue / finance.salesCount : 0;
}

function applyWithdrawalsToFinance(finance, withdrawals) {
  withdrawals.forEach((withdrawal) => {
    finance.byPayment[withdrawal.method] = (finance.byPayment[withdrawal.method] || 0) - withdrawal.amount;
  });

  finance.revenue = Object.values(finance.byPayment).reduce((sum, total) => sum + total, 0);
  finance.profit = finance.revenue - finance.cost;
}

function getSalesTotals(sales) {
  const byPayment = {};
  PAYMENT_METHODS.forEach((method) => {
    byPayment[method] = 0;
  });

  const totals = sales.reduce(
    (acc, sale) => {
      acc.revenue += sale.total;
      acc.cost += sale.cost;
      acc.items += sale.items.reduce((sum, item) => sum + item.qty, 0);
      getSalePayments(sale).forEach((payment) => {
        byPayment[payment.method] = (byPayment[payment.method] || 0) + payment.amount;
      });
      return acc;
    },
    { revenue: 0, cost: 0, items: 0 },
  );

  return {
    ...totals,
    salesCount: sales.length,
    profit: totals.revenue - totals.cost,
    ticket: sales.length ? totals.revenue / sales.length : 0,
    byPayment,
  };
}

function getTodaySales() {
  const today = new Date();
  return state.sales.filter((sale) => isSameLocalDay(sale.createdAt, today));
}

function getCurrentCashSales() {
  if (!isCashRegisterOpen()) return [];
  return state.sales.filter((sale) => sale.cashSessionId === state.cashRegister.id);
}

function getCurrentCashWithdrawals() {
  if (!isCashRegisterOpen()) return [];
  return (state.withdrawals || []).filter((withdrawal) => withdrawal.cashSessionId === state.cashRegister.id);
}

function getCurrentCashServices() {
  if (!isCashRegisterOpen()) return [];
  return (state.services || []).filter((service) => service.cashSessionId === state.cashRegister.id);
}

function getMonthSales() {
  const today = new Date();
  return state.sales.filter((sale) => isSameLocalMonth(sale.createdAt, today));
}

function getTodayWithdrawals() {
  const today = new Date();
  return (state.withdrawals || []).filter((withdrawal) => isSameLocalDay(withdrawal.createdAt, today));
}

function getTodayServices() {
  const today = new Date();
  return (state.services || []).filter((service) => isSameLocalDay(service.createdAt, today));
}

function getMonthWithdrawals() {
  const today = new Date();
  return (state.withdrawals || []).filter((withdrawal) => isSameLocalMonth(withdrawal.createdAt, today));
}

function getMonthServices() {
  const today = new Date();
  return (state.services || []).filter((service) => isSameLocalMonth(service.createdAt, today));
}

function getOperatorSalesSummary(sales) {
  const summary = sales.reduce((acc, sale) => {
    const operator = sale.attendant || "Sem operador";
    acc[operator] = (acc[operator] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(summary).sort(([firstName], [secondName]) => firstName.localeCompare(secondName, "pt-BR"));
}

function isSameLocalDay(value, date) {
  const candidate = new Date(value);
  return (
    candidate.getFullYear() === date.getFullYear() &&
    candidate.getMonth() === date.getMonth() &&
    candidate.getDate() === date.getDate()
  );
}

function isSameLocalMonth(value, date) {
  const candidate = new Date(value);
  return candidate.getFullYear() === date.getFullYear() && candidate.getMonth() === date.getMonth();
}

function getLocalDateKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function printDailyReport() {
  document.querySelector(".label-print")?.remove();
  document.querySelector(".receipt-print")?.remove();

  const report = document.createElement("div");
  report.className = "receipt-print";
  report.innerHTML = dailyReportHtml();
  document.body.appendChild(report);
  window.print();
  setTimeout(() => report.remove(), 500);
}

function printCashClosingReport(session, sales, withdrawals, services = []) {
  document.querySelector(".label-print")?.remove();
  document.querySelector(".receipt-print")?.remove();

  const report = document.createElement("div");
  report.className = "receipt-print";
  report.innerHTML = cashClosingReportHtml(session, sales, withdrawals, services);
  document.body.appendChild(report);
  window.print();
  setTimeout(() => report.remove(), 500);
}

function cashClosingReportHtml(session, sales, withdrawals, services = []) {
  const totals = getFinanceTotals(sales, false, withdrawals, services);
  const store = state.store;
  const line = "-".repeat(23);
  const items = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.qty, 0), 0);
  const withdrawalTotal = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  return `
    <div style="text-align:center">
      <strong>${escapeHtml(store.name || "Minha Loja")}</strong><br>
      ${store.doc ? `${escapeHtml(store.doc)}<br>` : ""}
      <strong>RELATORIO DO CAIXA</strong>
    </div>
    <div>${line}</div>
    <div>Operador: ${escapeHtml(session.attendant || "Sem operador")}</div>
    <div>Abertura: ${formatDate(session.openedAt)}</div>
    <div>Fechamento: ${formatDate(session.closedAt)}</div>
    <div>${line}</div>
    <div>Vendas: ${sales.length}</div>
    <div>Serviços: ${services.length}</div>
    <div>Itens vendidos: ${items}</div>
    <div>Sangrias: ${withdrawals.length}</div>
    <div>Total sangria: ${money.format(withdrawalTotal)}</div>
    <div>${line}</div>
    <div>Faturamento: ${money.format(totals.revenue)}</div>
    <div>${line}</div>
    ${Object.entries(totals.byPayment)
      .map(([method, total]) => `<div>${escapeHtml(method)}: ${money.format(total)}</div>`)
      .join("")}
    <div>${line}</div>
    <div style="text-align:center">Fechamento de caixa</div>
  `;
}

function dailyReportHtml() {
  const sales = getTodaySales();
  const services = getTodayServices();
  const withdrawals = getTodayWithdrawals();
  const totals = getFinanceTotals(sales, false, withdrawals, services);
  const operatorSummary = getOperatorSalesSummary(sales);
  const store = state.store;
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date());
  const line = "-".repeat(23);
  const currentSession = state.cashRegister;

  return `
    <div style="text-align:center">
      <strong>${escapeHtml(store.name || "Minha Loja")}</strong><br>
      ${store.doc ? `${escapeHtml(store.doc)}<br>` : ""}
      <strong>RELATORIO DO DIA</strong><br>
      <span>${date}</span>
    </div>
    <div>${line}</div>
    <div>Emitido: ${formatDate(new Date().toISOString())}</div>
    <div>Status: ${isCashRegisterOpen() ? "Caixa aberto" : "Caixa fechado"}</div>
    ${
      currentSession
        ? `<div>Atendente: ${escapeHtml(currentSession.attendant)}</div><div>Abertura: ${formatDate(currentSession.openedAt)}</div>`
        : ""
    }
    <div>${line}</div>
    <div>Vendas: ${sales.length}</div>
    <div>Serviços: ${services.length}</div>
    <div>Itens vendidos: ${totals.items}</div>
    <div>Faturamento: ${money.format(totals.revenue)}</div>
    <div>${line}</div>
    ${Object.entries(totals.byPayment)
      .map(([method, total]) => `<div>${escapeHtml(method)}: ${money.format(total)}</div>`)
      .join("")}
    <div>${line}</div>
    <div>Sangrias: ${withdrawals.length}</div>
    ${withdrawals.length ? `<div>Total sangria: ${money.format(withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0))}</div>` : ""}
    <div>${line}</div>
    ${
      operatorSummary.length
        ? operatorSummary
            .map(
              ([operator, count]) => `
                <div>Operador: ${escapeHtml(operator)}</div>
                <div>Quantidade de vendas: ${count}</div>
              `,
            )
            .join(`<div>${line}</div>`)
        : "<div>Nenhuma venda registrada hoje.</div>"
    }
  `;
}

function getPaymentBaseTotal(method) {
  const salesTotal = getMonthSales()
    .reduce(
      (sum, sale) =>
        sum + getSalePayments(sale).filter((payment) => payment.method === method).reduce((total, payment) => total + payment.amount, 0),
      0,
    );
  const servicesTotal = getMonthServices()
    .reduce(
      (sum, service) =>
        sum + getServicePayments(service).filter((payment) => payment.method === method).reduce((total, payment) => total + payment.amount, 0),
      0,
    );
  return salesTotal + servicesTotal;
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
  const newPassword = els.adminPassword.value.trim();

  state.store = {
    name: els.storeName.value.trim(),
    doc: els.storeDoc.value.trim(),
    address: els.storeAddress.value.trim(),
    phone: els.storePhone.value.trim(),
    theme: els.themeSelect.value,
  };

  state.security ||= {};
  if (newPassword) {
    state.security.password = newPassword;
  }

  applyTheme(state.store.theme);
  saveState();
  els.adminPassword.value = "";
  await showAlert("Configuração salva.");
}

function renderStore() {
  els.storeName.value = state.store.name || "";
  els.storeDoc.value = state.store.doc || "";
  els.storeAddress.value = state.store.address || "";
  els.storePhone.value = state.store.phone || "";
  els.themeSelect.value = state.store.theme || "default";
  els.adminPassword.value = "";
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

function printWithdrawal(withdrawalId) {
  const withdrawal = (state.withdrawals || []).find((entry) => entry.id === withdrawalId);
  if (!withdrawal) return;

  document.querySelector(".label-print")?.remove();
  document.querySelector(".receipt-print")?.remove();
  const receipt = document.createElement("div");
  receipt.className = "receipt-print";
  receipt.innerHTML = withdrawalReceiptHtml(withdrawal);
  document.body.appendChild(receipt);
  window.print();
  setTimeout(() => receipt.remove(), 500);
}

function printServiceReceipt(serviceId) {
  const service = (state.services || []).find((entry) => entry.id === serviceId);
  if (!service) return;

  document.querySelector(".label-print")?.remove();
  document.querySelector(".receipt-print")?.remove();
  const receipt = document.createElement("div");
  receipt.className = "receipt-print";
  receipt.innerHTML = serviceReceiptHtml(service);
  document.body.appendChild(receipt);
  window.print();
  setTimeout(() => receipt.remove(), 500);
}

function receiptHtml(sale) {
  const store = state.store;
  const line = "-".repeat(23);
  const payments = getSalePayments(sale);
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
    ${sale.attendant ? `<div>Atendente: ${escapeHtml(sale.attendant)}</div>` : ""}
    <div>${line}</div>
    ${items}
    <div>${line}</div>
    <div>Subtotal: ${money.format(sale.subtotal)}</div>
    <div>Desconto: ${money.format(sale.discount)}</div>
    <div><strong>Total: ${money.format(sale.total)}</strong></div>
    <div>Pagamento: ${escapeHtml(sale.paymentMethod)}</div>
    ${payments.map((payment) => `<div>${escapeHtml(payment.method)}: ${money.format(payment.amount)}</div>`).join("")}
    <div>Recebido: ${money.format(sale.paid)}</div>
    <div>Troco: ${money.format(sale.change)}</div>
    <div>${line}</div>
    <div style="text-align:center">Obrigado pela preferência</div>
  `;
}

function serviceReceiptHtml(service) {
  const store = state.store;
  const line = "-".repeat(23);
  const payments = getServicePayments(service);

  return `
    <div style="text-align:center">
      <strong>${escapeHtml(store.name || "Minha Loja")}</strong><br>
      ${store.doc ? `${escapeHtml(store.doc)}<br>` : ""}
      ${store.address ? `${escapeHtml(store.address)}<br>` : ""}
      ${store.phone ? `${escapeHtml(store.phone)}<br>` : ""}
      <strong>COMPROVANTE DE SERVICO</strong>
    </div>
    <div>${line}</div>
    <div>Servico: ${service.id.slice(0, 8)}</div>
    <div>Data: ${formatDate(service.createdAt)}</div>
    <div>Atendente: ${escapeHtml(service.attendant || "Sem operador")}</div>
    ${service.osNumber ? `<div>OS: ${escapeHtml(service.osNumber)}</div>` : ""}
    <div>${line}</div>
    <div>${escapeHtml(service.description)}</div>
    <div><strong>Total: ${money.format(service.amount)}</strong></div>
    <div>Pagamento: ${escapeHtml(service.paymentMethod)}</div>
    ${payments.map((payment) => `<div>${escapeHtml(payment.method)}: ${money.format(payment.amount)}</div>`).join("")}
    <div>${line}</div>
    <div style="text-align:center">Obrigado pela preferência</div>
  `;
}

function withdrawalReceiptHtml(withdrawal) {
  const store = state.store;
  const line = "-".repeat(23);

  return `
    <div style="text-align:center">
      <strong>${escapeHtml(store.name || "Minha Loja")}</strong><br>
      <strong>COMPROVANTE DE SANGRIA</strong>
    </div>
    <div>${line}</div>
    <div>Sangria: ${withdrawal.id.slice(0, 8)}</div>
    <div>Data: ${formatDate(withdrawal.createdAt)}</div>
    <div>Operador: ${escapeHtml(withdrawal.attendant || "Sem operador")}</div>
    <div>${line}</div>
    <div>Tipo: ${escapeHtml(withdrawal.method)}</div>
    <div><strong>Valor: ${money.format(withdrawal.amount)}</strong></div>
    <div>Motivo: ${escapeHtml(withdrawal.description)}</div>
    <div>${line}</div>
    <div style="text-align:center">Assinatura</div>
    <br>
    <div>${line}</div>
  `;
}

function exportData() {
  downloadBackup(buildBackup(), `backup-caixa-pdv-${new Date().toISOString().slice(0, 10)}.json`);
}

function buildBackup(extra = {}) {
  return {
    ...state,
    ...extra,
    backupVersion: 3,
    exportedAt: new Date().toISOString(),
    selectedTheme: state.store.theme || "default",
    currentFinance: getFinanceTotals(getMonthSales(), true, getMonthWithdrawals(), getMonthServices()),
    monthlyClosings: state.monthlyClosings || [],
    financeAdjustments: state.financeAdjustments || {},
    cashRegister: state.cashRegister || null,
    cashSessions: state.cashSessions || [],
    withdrawals: state.withdrawals || [],
    services: state.services || [],
  };
}

function downloadBackup(backup, filename) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
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
      const backupState = imported.fullState && typeof imported.fullState === "object" ? imported.fullState : imported;

      if (!Array.isArray(backupState.products) || !Array.isArray(backupState.sales)) {
        throw new Error("Formato inválido");
      }

      Object.keys(state).forEach((key) => {
        delete state[key];
      });

      Object.assign(state, {
        products: Array.isArray(backupState.products) ? backupState.products : [],
        sales: Array.isArray(backupState.sales) ? backupState.sales : [],
        services: Array.isArray(backupState.services) ? backupState.services : [],
        monthlyClosings: Array.isArray(backupState.monthlyClosings) ? backupState.monthlyClosings : [],
        financeAdjustments: backupState.financeAdjustments || {},
        cashRegister: backupState.cashRegister || null,
        cashSessions: Array.isArray(backupState.cashSessions) ? backupState.cashSessions : [],
        withdrawals: Array.isArray(backupState.withdrawals) ? backupState.withdrawals : [],
        store: {
          name: "Minha Loja",
          doc: "",
          address: "",
          phone: "",
          theme: "default",
          ...(backupState.store || {}),
        },
        security: {
          password: "2580",
          ...(backupState.security || {}),
        },
      });

      Object.entries(backupState).forEach(([key, value]) => {
        if (!(key in state) && !["backupVersion", "exportedAt", "selectedTheme", "currentFinance", "fullState", "lastMonthlyClosing"].includes(key)) {
          state[key] = value;
        }
      });

      cart = [];
      lastReceiptSaleId = null;
      viewedSaleId = null;
      currentFinanceDayKey = getLocalDateKey(new Date());
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
  state.services = [];
  state.monthlyClosings = [];
  state.financeAdjustments = {};
  state.cashRegister = null;
  state.cashSessions = [];
  state.withdrawals = [];
  state.security = { password: "2580" };
  state.store = { name: "Minha Loja", doc: "", address: "", phone: "" };
  cart = [];
  renderAll();
}

async function closeMonth() {
  if (!(await requirePassword("fechar o caixa do mês"))) return;

  const monthSales = getMonthSales();
  const monthWithdrawals = getMonthWithdrawals();
  const monthServices = getMonthServices();
  const finance = getFinanceTotals(monthSales, true, monthWithdrawals, monthServices);

  if (!monthSales.length && !monthServices.length && !monthWithdrawals.length && finance.revenue <= 0) {
    await showAlert("Não existem valores para fechar.");
    return;
  }

  if (!(await showConfirm("Fechar o caixa do mês? O financeiro e a lista de vendas atuais serão limpos."))) return;

  const closing = {
    id: createId(),
    closedAt: new Date().toISOString(),
    salesCount: monthSales.length,
    revenue: finance.revenue,
    cost: finance.cost,
    profit: finance.profit,
    byPayment: finance.byPayment,
    financeAdjustments: { ...(state.financeAdjustments || {}) },
    withdrawals: monthWithdrawals,
    services: monthServices,
    sales: monthSales,
  };

  state.monthlyClosings ||= [];
  state.monthlyClosings.unshift(closing);
  state.monthlyClosings = state.monthlyClosings.slice(0, 3);

  downloadBackup(
    buildBackup({ monthlyClosings: state.monthlyClosings, lastMonthlyClosing: closing }),
    `backup-fechamento-mes-${new Date().toISOString().slice(0, 10)}.json`,
  );

  if (isCashRegisterOpen()) {
    state.cashSessions ||= [];
    state.cashSessions.unshift({
      ...state.cashRegister,
      isOpen: false,
      closedAt: new Date().toISOString(),
      closedByMonthClosing: true,
    });
    state.cashSessions = state.cashSessions.slice(0, 50);
    state.cashRegister = null;
  }

  state.sales = [];
  state.services = [];
  state.financeAdjustments = {};
  state.withdrawals = [];
  saveState();
  renderAll();
  await showAlert("Caixa do mês fechado.");
}

function renderAll() {
  normalizeProducts();
  renderCashRegister();
  renderProducts();
  renderLowStockAlerts();
  renderSaleSuggestions();
  renderCart();
  renderSales();
  renderServices();
  renderFinance();
  renderStore();
}

function startClock() {
  const updateClock = () => {
    const now = new Date();
    els.pdvClock.textContent = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(now);

    const dayKey = getLocalDateKey(now);
    if (dayKey !== currentFinanceDayKey) {
      currentFinanceDayKey = dayKey;
      renderAll();
    }
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
  const text = String(value ?? "").trim();
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  const number = Number(normalized);
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

function showActionAlert(message, actionLabel, title = "Aviso") {
  return showAppModal({ title, message, mode: "action", cancelLabel: actionLabel, cancelValue: "action" });
}

function showConfirm(message, title = "Confirmação") {
  return showAppModal({ title, message, mode: "confirm" });
}

function showPrompt(message, defaultValue = "", title = "Informe o valor", inputType = "text") {
  return showAppModal({ title, message, mode: "prompt", defaultValue, inputType });
}

function showAppModal({ title, message, mode, defaultValue = "", inputType = "text", okLabel, cancelLabel, cancelValue = false }) {
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

    const onCancel = () => finish(mode === "alert" ? true : cancelValue);
    const onDialogCancel = (event) => {
      event.preventDefault();
      finish(mode === "alert" ? true : mode === "prompt" ? null : false);
    };

    els.appModalTitle.textContent = title;
    els.appModalMessage.textContent = message;
    els.appModalInputField.classList.toggle("hidden", mode !== "prompt");
    els.appModalCancel.classList.toggle("hidden", mode === "alert");
    els.appModalCancel.textContent = cancelLabel || "Cancelar";
    els.appModalOk.textContent = okLabel || (mode === "confirm" ? "Confirmar" : "OK");
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
  const configuredPassword = state.security?.password || "2580";
  if (password === MASTER_PASSWORD || password === configuredPassword) {
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
window.editService = editService;
window.printServiceReceipt = printServiceReceipt;
