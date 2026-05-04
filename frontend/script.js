const API_URL = "https://agromini-platform.onrender.com/api";

let allProducts = [];

/* =========================
   HELPERS
========================= */
function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}

function checkAuth() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (!isLoggedIn && window.location.pathname.includes("dashboard.html")) {
    window.location.href = "login.html";
  }
}

/* =========================
   AUTH
========================= */
async function login() {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const message = document.getElementById("login-message");

  if (!usernameInput || !passwordInput || !message) return;

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    message.textContent = "Please enter username and password";
    message.style.color = "red";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      localStorage.setItem("isLoggedIn", "true");
      window.location.href = "dashboard.html";
    } else {
      message.textContent = data.message || "Wrong username or password";
      message.style.color = "red";
    }
  } catch (error) {
    message.textContent = "Backend is not running";
    message.style.color = "red";
  }
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}

/* =========================
   PRODUCTS
========================= */
async function addProduct(event) {
  event.preventDefault();

  const editingProductId =
    document.getElementById("editingProductId")?.value || "";
  const name = document.getElementById("productName")?.value.trim();
  const price = Number(document.getElementById("productPrice")?.value);
  const quantity = Number(document.getElementById("productQuantity")?.value);
  const category = document.getElementById("productCategory")?.value.trim();

  if (!name || !category || price <= 0 || quantity < 0) {
    showToast("Please fill all fields correctly", "danger");
    return;
  }

  const product = { name, price, quantity, category };

  try {
    if (editingProductId) {
      await fetch(`${API_URL}/products/${editingProductId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });

      showToast("Product updated successfully ✅");
      cancelEdit();
    } else {
      await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });

      showToast("Product added successfully 🌱");
    }

    event.target.reset();
    loadProducts();
  } catch (error) {
    showToast("Failed to save product", "danger");
  }
}

async function loadProducts() {
  checkAuth();

  const productsList = document.getElementById("products-list");
  if (!productsList) return;

  try {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();

    allProducts = Array.isArray(products) ? products : [];

    renderProducts(allProducts);
    updateStats(allProducts);
  } catch (error) {
    productsList.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">Backend is not running</td>
      </tr>
    `;
  }
}

function renderProducts(products) {
  const productsList = document.getElementById("products-list");
  if (!productsList) return;

  productsList.innerHTML = "";

  if (products.length === 0) {
    productsList.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">
          No products yet. Start by adding your first product.
        </td>
      </tr>
    `;
    return;
  }

  products.forEach((product) => {
    const isLowStock = Number(product.quantity) < 10;

    productsList.innerHTML += `
      <tr class="${isLowStock ? "low-stock-row" : ""}">
        <td><strong>${product.name}</strong></td>
        <td>${formatNumber(product.price)} DA</td>
        <td>${formatNumber(product.quantity)} kg</td>
        <td>${product.category}</td>
        <td>
          <span class="${isLowStock ? "status-low" : "status-good"}">
            ${isLowStock ? "Low Stock" : "Available"}
          </span>
        </td>
        <td>
          <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
          <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function editProduct(id) {
  const product = allProducts.find((item) => item.id === id);
  if (!product) return;

  document.getElementById("editingProductId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productQuantity").value = product.quantity;
  document.getElementById("productCategory").value = product.category;

  document.getElementById("submitProductBtn").textContent = "Update Product";
  document.getElementById("cancelEditBtn").style.display = "block";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function cancelEdit() {
  const form = document.querySelector(".product-form-modern");
  const editingProductId = document.getElementById("editingProductId");
  const submitProductBtn = document.getElementById("submitProductBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (form) form.reset();
  if (editingProductId) editingProductId.value = "";
  if (submitProductBtn) submitProductBtn.textContent = "+ Add Product";
  if (cancelEditBtn) cancelEditBtn.style.display = "none";
}

function searchProducts() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  const value = searchInput.value.toLowerCase().trim();

  const filteredProducts = allProducts.filter((product) => {
    return (
      product.name.toLowerCase().includes(value) ||
      product.category.toLowerCase().includes(value)
    );
  });

  renderProducts(filteredProducts);
}

function updateStats(products) {
  const totalProducts = document.getElementById("totalProducts");
  const totalStock = document.getElementById("totalStock");
  const totalValue = document.getElementById("totalValue");
  const totalCategories = document.getElementById("totalCategories");
  const lowStockCount = document.getElementById("lowStockCount");

  if (!totalProducts || !totalStock || !totalValue || !totalCategories) return;

  const stock = products.reduce(
    (sum, product) => sum + Number(product.quantity),
    0,
  );
  const value = products.reduce(
    (sum, product) => sum + Number(product.price) * Number(product.quantity),
    0,
  );
  const categories = new Set(
    products.map((product) => product.category.toLowerCase()),
  );
  const lowStock = products.filter((product) => Number(product.quantity) < 10);

  totalProducts.textContent = formatNumber(products.length);
  totalStock.textContent = formatNumber(stock);
  totalValue.textContent = formatNumber(value);
  totalCategories.textContent = formatNumber(categories.size);

  if (lowStockCount) {
    lowStockCount.textContent = formatNumber(lowStock.length);
  }
}

async function deleteProduct(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this product?",
  );
  if (!confirmDelete) return;

  try {
    await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
    });

    showToast("Product deleted successfully 🗑️", "danger");
    loadProducts();
  } catch (error) {
    showToast("Failed to delete product", "danger");
  }
}

/* =========================
   CURSOR GLOW
========================= */
const cursorGlow = document.querySelector(".cursor-glow");

document.addEventListener("mousemove", function (event) {
  if (cursorGlow) {
    cursorGlow.style.left = event.clientX + "px";
    cursorGlow.style.top = event.clientY + "px";
  }
});

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("dashboard.html")) {
    loadProducts();
  }
});
