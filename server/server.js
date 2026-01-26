const express = require("express");
const connectDB = require("./config/db");

const app = express();
const PORT = 5000;

// Connect Database
connectDB();

// Middleware
app.use(express.json());

// Routes
const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.send("CampusMart API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
