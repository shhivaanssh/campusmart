// Temporary in-memory data (will move to MongoDB later)
let products = [
  {
    id: 1,
    name: "Engineering Mathematics Book",
    price: 350,
    category: "Books",
  },
  {
    id: 2,
    name: "Used Laptop",
    price: 25000,
    category: "Electronics",
  },
];

// GET all products
const getAllProducts = (req, res) => {
  res.json(products);
};

// GET single product by ID
const getProductById = (req, res) => {
  const productId = parseInt(req.params.id);

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};

// CREATE new product
const createProduct = (req, res) => {
  const { name, price, category } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newProduct = {
    id: products.length + 1,
    name,
    price,
    category,
  };

  products.push(newProduct);

  res.status(201).json(newProduct);
};

// UPDATE product
const updateProduct = (req, res) => {
  const productId = parseInt(req.params.id);
  const { name, price, category } = req.body;

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  product.name = name || product.name;
  product.price = price || product.price;
  product.category = category || product.category;

  res.json(product);
};

// DELETE product
const deleteProduct = (req, res) => {
  const productId = parseInt(req.params.id);

  const productIndex = products.findIndex((p) => p.id === productId);

  if (productIndex === -1) {
    return res.status(404).json({ message: "Product not found" });
  }

  const deletedProduct = products.splice(productIndex, 1);

  res.json(deletedProduct[0]);
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
