const API_URL = "http://localhost:3000/api";

let allProducts = [];

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("login-message");

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("isLoggedIn", "true");
      window.location.href = "dashboard.html";
    } else {
      message.textContent = "Wrong username or password";
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

function checkAuth() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (!isLoggedIn && window.location.pathname.includes("dashboard.html")) {
    window.location.href = "login.html";
  }
}

async function addProduct(event) {
  event.preventDefault();

  const editingProductId = document.getElementById("editingProductId").value;

  const product = {
    name: document.getElementById("productName").value.trim(),
    price: Number(document.getElementById("productPrice").value),
    quantity: Number(document.getElementById("productQuantity").value),
    category: document.getElementById("productCategory").value.trim(),
  };
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
}

async function loadProducts() {
  checkAuth();

  const productsList = document.getElementById("products-list");
  if (!productsList) return;

  try {
    const response = await fetch(`${API_URL}/products`);
    const products = await response.json();

    allProducts = products;

    renderProducts(products);
    updateStats(products);
  } catch (error) {
    productsList.innerHTML = `
      <tr>
        <td colspan="5">Backend is not running</td>
      </tr>
    `;
  }
}

function renderProducts(products) {
  const productsList = document.getElementById("products-list");
  productsList.innerHTML = "";

  if (products.length === 0) {
    productsList.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">No products found</td>
      </tr>
    `;
    return;
  }

  products.forEach((product) => {
    productsList.innerHTML += `
      <tr>
        <td><strong>${product.name}</strong></td>
        <td>${product.price} DA</td>
        <td>${product.quantity} kg</td>
        <td>${product.category}</td>
        <td>
          <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
          <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function editProduct(id) {
  const product = allProducts.find((product) => product.id === id);
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
  const editingProductId = document.getElementById("editingProductId");
  const submitProductBtn = document.getElementById("submitProductBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const form = document.querySelector(".product-form-modern");

  if (!editingProductId || !submitProductBtn || !cancelEditBtn) return;

  editingProductId.value = "";
  submitProductBtn.textContent = "+ Add Product";
  cancelEditBtn.style.display = "none";

  if (form) form.reset();
}

function searchProducts() {
  const searchValue = document
    .getElementById("searchInput")
    .value.toLowerCase();

  const filteredProducts = allProducts.filter((product) => {
    return (
      product.name.toLowerCase().includes(searchValue) ||
      product.category.toLowerCase().includes(searchValue)
    );
  });

  renderProducts(filteredProducts);
}

function updateStats(products) {
  const totalProducts = document.getElementById("totalProducts");
  const totalStock = document.getElementById("totalStock");
  const totalValue = document.getElementById("totalValue");
  const totalCategories = document.getElementById("totalCategories");

  if (!totalProducts) return;

  const stock = products.reduce((sum, product) => {
    return sum + Number(product.quantity);
  }, 0);

  const value = products.reduce((sum, product) => {
    return sum + Number(product.price) * Number(product.quantity);
  }, 0);

  const categories = new Set(
    products.map((product) => product.category.toLowerCase()),
  );

  totalProducts.textContent = products.length;
  totalStock.textContent = stock;
  totalValue.textContent = value;
  totalCategories.textContent = categories.size;
}

async function deleteProduct(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this product?",
  );

  if (!confirmDelete) return;

  await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
  });

  showToast("Product deleted successfully 🗑️", "danger");
  loadProducts();
}

const cursorGlow = document.querySelector(".cursor-glow");

document.addEventListener("mousemove", function (event) {
  if (cursorGlow) {
    cursorGlow.style.left = event.clientX + "px";
    cursorGlow.style.top = event.clientY + "px";
  }
});
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}
document.addEventListener("DOMContentLoaded", loadProducts);
