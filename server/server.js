const express = require("express");

const app = express();
const PORT = 5000;

// ✅ BODY PARSER (THIS IS THE FIX)
app.use(express.json());

// Routes
const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("CampusMart API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
