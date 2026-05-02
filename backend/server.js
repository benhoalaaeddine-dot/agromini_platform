const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const databasePath = path.join(__dirname, "database.json");

function readDatabase() {
  const data = fs.readFileSync(databasePath, "utf8");
  return JSON.parse(data);
}

function writeDatabase(data) {
  fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  res.send("AgroMini Backend is running ✅");
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    res.json({ success: true, message: "Login successful" });
  } else {
    res
      .status(401)
      .json({ success: false, message: "Wrong username or password" });
  }
});

app.get("/api/products", (req, res) => {
  const database = readDatabase();
  res.json(database.products);
});

app.post("/api/products", (req, res) => {
  const database = readDatabase();

  const newProduct = {
    id: Date.now(),
    name: req.body.name,
    price: Number(req.body.price),
    quantity: Number(req.body.quantity),
    category: req.body.category,
  };

  database.products.push(newProduct);
  writeDatabase(database);

  res.json(newProduct);
});

app.delete("/api/products/:id", (req, res) => {
  const database = readDatabase();
  const productId = Number(req.params.id);

  database.products = database.products.filter(
    (product) => product.id !== productId,
  );
  writeDatabase(database);

  res.json({ success: true, message: "Product deleted" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// Update product
app.put("/api/products/:id", (req, res) => {
  const database = readDatabase();
  const productId = Number(req.params.id);

  const productIndex = database.products.findIndex(
    (product) => product.id === productId,
  );

  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  database.products[productIndex] = {
    id: productId,
    name: req.body.name,
    price: Number(req.body.price),
    quantity: Number(req.body.quantity),
    category: req.body.category,
  };

  writeDatabase(database);

  res.json({
    success: true,
    product: database.products[productIndex],
  });
});
// Delete product
app.delete("/api/products/:id", (req, res) => {
  const database = readDatabase();
  const productId = Number(req.params.id);

  database.products = database.products.filter(
    (product) => product.id !== productId,
  );

  writeDatabase(database);

  res.json({
    success: true,
    message: "Product deleted",
  });
});
